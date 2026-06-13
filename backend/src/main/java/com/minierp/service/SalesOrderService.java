package com.minierp.service;

import com.minierp.entity.*;
import com.minierp.enums.*;
import com.minierp.service.StockLedgerService;
import com.minierp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class SalesOrderService {

    private final SalesOrderRepository soRepository;
    private final ProductRepository productRepository;
    private final PurchaseOrderRepository poRepository;
    private final ManufacturingOrderRepository moRepository;
    private final VendorRepository vendorRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final StockLedgerService stockLedgerService;

    private static final AtomicLong soCounter = new AtomicLong(1);
    private static final AtomicLong poCounter = new AtomicLong(1);
    private static final AtomicLong moCounter = new AtomicLong(1);

    public List<SalesOrder> getAll() {
        return soRepository.findAll();
    }

    public SalesOrder getById(Long id) {
        return soRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sales Order not found: " + id));
    }

    @Transactional
    public SalesOrder create(SalesOrder so) {
        so.setRef(generateSoRef());
        so.setStatus(SalesOrderStatus.DRAFT);
        SalesOrder saved = soRepository.save(so);
        auditLogService.log("SALES", "SalesOrder", saved.getId(), saved.getRef(),
                "CREATED", "status", null, "DRAFT", "Sales Order created");
        return saved;
    }

    @Transactional
    public SalesOrder confirm(Long id) {
        SalesOrder so = getById(id);
        if (so.getStatus() != SalesOrderStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT orders can be confirmed");
        }

        // Reserve stock for each line
        for (SalesOrderLine line : so.getLines()) {
            Product product = line.getProduct();
            double currentReserved = product.getReservedQty();
            product.setReservedQty(currentReserved + line.getOrderedQty());
            productRepository.save(product);

            // Procurement automation: if stock insufficient and procureOnDemand=true
            double free = product.getFreeToUseQty();
            if (free < 0 && product.isProcureOnDemand() && product.getProcurementMethod() != null) {
                double shortfall = -free;
                triggerProcurement(product, shortfall, so.getId(), so.getRef());
            }
        }

        so.setStatus(SalesOrderStatus.CONFIRMED);
        SalesOrder saved = soRepository.save(so);

        auditLogService.log("SALES", "SalesOrder", saved.getId(), saved.getRef(),
                "CONFIRMED", "status", "DRAFT", "CONFIRMED", "Sales Order confirmed");
        notificationService.sendOrderUpdate("SO", saved.getRef(), "DRAFT", "CONFIRMED");
        notificationService.sendDashboardRefresh();

        return saved;
    }

    @Transactional
    public SalesOrder deliver(Long id, Map<Long, Double> lineDeliveries) {
        SalesOrder so = getById(id);
        if (so.getStatus() != SalesOrderStatus.CONFIRMED && so.getStatus() != SalesOrderStatus.PARTIALLY_DELIVERED) {
            throw new RuntimeException("Cannot deliver order in status: " + so.getStatus());
        }

        boolean allDelivered = true;
        for (SalesOrderLine line : so.getLines()) {
            Double deliverQty = lineDeliveries.getOrDefault(line.getId(), 0.0);
            if (deliverQty > 0) {
                double newDelivered = line.getDeliveredQty() + deliverQty;
                line.setDeliveredQty(newDelivered);

                // Reduce onHand stock
                Product product = line.getProduct();
                double oldOnHand = product.getOnHandQty();
                product.setOnHandQty(oldOnHand - deliverQty);
                product.setReservedQty(Math.max(0, product.getReservedQty() - deliverQty));
                productRepository.save(product);

                notificationService.sendStockUpdate(product.getId(), product.getName(),
                        oldOnHand, product.getOnHandQty(), "Delivered via " + so.getRef());
                stockLedgerService.recordStockOut(product, deliverQty, oldOnHand, "SO", so.getId(), so.getRef(), "Stock delivered via " + so.getRef());
            }
            if (line.getDeliveredQty() < line.getOrderedQty()) {
                allDelivered = false;
            }
        }

        SalesOrderStatus newStatus = allDelivered ?
                SalesOrderStatus.FULLY_DELIVERED : SalesOrderStatus.PARTIALLY_DELIVERED;
        String oldStatus = so.getStatus().name();
        so.setStatus(newStatus);

        SalesOrder saved = soRepository.save(so);
        auditLogService.log("SALES", "SalesOrder", saved.getId(), saved.getRef(),
                "DELIVERED", "status", oldStatus, newStatus.name(), "Delivery processed");
        notificationService.sendOrderUpdate("SO", saved.getRef(), oldStatus, newStatus.name());

        return saved;
    }

    @Transactional
    public SalesOrder cancel(Long id) {
        SalesOrder so = getById(id);
        if (so.getStatus() == SalesOrderStatus.FULLY_DELIVERED) {
            throw new RuntimeException("Cannot cancel a fully delivered order");
        }

        // Release reserved stock
        for (SalesOrderLine line : so.getLines()) {
            Product product = line.getProduct();
            double toRelease = line.getOrderedQty() - line.getDeliveredQty();
            product.setReservedQty(Math.max(0, product.getReservedQty() - toRelease));
            productRepository.save(product);
        }

        so.setStatus(SalesOrderStatus.CANCELLED);
        SalesOrder saved = soRepository.save(so);
        auditLogService.log("SALES", "SalesOrder", saved.getId(), saved.getRef(),
                "CANCELLED", "status", so.getStatus().name(), "CANCELLED", "Order cancelled");
        return saved;
    }

    private void triggerProcurement(Product product, double shortfall, Long soId, String soRef) {
        if (product.getProcurementMethod() == ProcurementMethod.PURCHASE) {
            // Auto-create PO
            PurchaseOrder po = PurchaseOrder.builder()
                    .ref(generatePoRef())
                    .vendor(product.getVendor())
                    .vendorAddress(product.getVendor() != null ? product.getVendor().getAddress() : "")
                    .status(PurchaseOrderStatus.DRAFT)
                    .triggeredBySoId(soId)
                    .notes("Auto-created for " + soRef + " (shortage: " + shortfall + " units)")
                    .build();

            PurchaseOrderLine pol = PurchaseOrderLine.builder()
                    .purchaseOrder(po)
                    .product(product)
                    .orderedQty(shortfall)
                    .costPrice(product.getCostPrice())
                    .build();
            po.getLines().add(pol);

            PurchaseOrder savedPo = poRepository.save(po);
            auditLogService.log("PURCHASE", "PurchaseOrder", savedPo.getId(), savedPo.getRef(),
                    "AUTO_CREATED", null, null, null,
                    "Auto-created PO for shortage of " + shortfall + " " + product.getName() + " (triggered by " + soRef + ")");
            notificationService.sendProcurementTrigger(
                    "PO " + savedPo.getRef() + " auto-created for " + product.getName(),
                    Map.of("poRef", savedPo.getRef(), "soRef", soRef, "qty", shortfall)
            );

        } else if (product.getProcurementMethod() == ProcurementMethod.MANUFACTURING) {
            // Auto-create MO
            ManufacturingOrder mo = ManufacturingOrder.builder()
                    .ref(generateMoRef())
                    .finishedProduct(product)
                    .quantity(shortfall)
                    .status(ManufacturingOrderStatus.DRAFT)
                    .triggeredBySoId(soId)
                    .notes("Auto-created for " + soRef + " (shortage: " + shortfall + " units)")
                    .build();

            // Pull components from BoM
            for (BomComponent bc : product.getBomComponents()) {
                MOComponent comp = MOComponent.builder()
                        .manufacturingOrder(mo)
                        .product(bc.getComponentProduct())
                        .toConsumeQty(bc.getQuantity() * shortfall)
                        .availability(bc.getComponentProduct().getFreeToUseQty() >= bc.getQuantity() * shortfall
                                ? ComponentAvailability.AVAILABLE : ComponentAvailability.NOT_AVAILABLE)
                        .build();
                mo.getComponents().add(comp);
            }

            // Pull work orders from BoM operations
            for (BomOperation op : product.getBomOperations()) {
                MOWorkOrder wo = MOWorkOrder.builder()
                        .manufacturingOrder(mo)
                        .operation(op.getOperation())
                        .workCenter(op.getWorkCenter())
                        .expectedDurationMinutes(op.getExpectedDurationMinutes())
                        .status(WorkOrderStatus.PENDING)
                        .build();
                mo.getWorkOrders().add(wo);
            }

            ManufacturingOrder savedMo = moRepository.save(mo);
            auditLogService.log("MANUFACTURING", "ManufacturingOrder", savedMo.getId(), savedMo.getRef(),
                    "AUTO_CREATED", null, null, null,
                    "Auto-created MO for shortage of " + shortfall + " " + product.getName() + " (triggered by " + soRef + ")");
            notificationService.sendProcurementTrigger(
                    "MO " + savedMo.getRef() + " auto-created for " + product.getName(),
                    Map.of("moRef", savedMo.getRef(), "soRef", soRef, "qty", shortfall)
            );
        }
    }

    private String generateSoRef() {
        return String.format("SO-%06d", soCounter.getAndIncrement());
    }
    private String generatePoRef() {
        return String.format("PO-%06d", poCounter.getAndIncrement());
    }
    private String generateMoRef() {
        return String.format("MO-%06d", moCounter.getAndIncrement());
    }
}
