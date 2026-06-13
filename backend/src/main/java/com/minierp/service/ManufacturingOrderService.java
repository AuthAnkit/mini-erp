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
public class ManufacturingOrderService {

    private final ManufacturingOrderRepository moRepository;
    private final ProductRepository productRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final StockLedgerService stockLedgerService;

    private static final AtomicLong moCounter = new AtomicLong(100);

    public List<ManufacturingOrder> getAll() {
        return moRepository.findAll();
    }

    public ManufacturingOrder getById(Long id) {
        return moRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Manufacturing Order not found: " + id));
    }

    @Transactional
    public ManufacturingOrder create(ManufacturingOrder mo) {
        mo.setRef(generateRef());
        mo.setStatus(ManufacturingOrderStatus.DRAFT);

        // Auto-load BoM components if not provided
        if (mo.getComponents().isEmpty() && !mo.getFinishedProduct().getBomComponents().isEmpty()) {
            Product fp = productRepository.findById(mo.getFinishedProduct().getId()).orElseThrow();
            for (BomComponent bc : fp.getBomComponents()) {
                MOComponent comp = MOComponent.builder()
                        .manufacturingOrder(mo)
                        .product(bc.getComponentProduct())
                        .toConsumeQty(bc.getQuantity() * mo.getQuantity())
                        .build();
                mo.getComponents().add(comp);
            }
            // Auto-load work orders
            for (BomOperation op : fp.getBomOperations()) {
                MOWorkOrder wo = MOWorkOrder.builder()
                        .manufacturingOrder(mo)
                        .operation(op.getOperation())
                        .workCenter(op.getWorkCenter())
                        .expectedDurationMinutes(op.getExpectedDurationMinutes())
                        .status(WorkOrderStatus.PENDING)
                        .build();
                mo.getWorkOrders().add(wo);
            }
        }

        ManufacturingOrder saved = moRepository.save(mo);
        auditLogService.log("MANUFACTURING", "ManufacturingOrder", saved.getId(), saved.getRef(),
                "CREATED", "status", null, "DRAFT", "MO created for " + saved.getQuantity() + "x " + saved.getFinishedProduct().getName());
        return saved;
    }

    @Transactional
    public ManufacturingOrder confirm(Long id) {
        ManufacturingOrder mo = getById(id);
        if (mo.getStatus() != ManufacturingOrderStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT MOs can be confirmed");
        }

        // Reserve components
        for (MOComponent comp : mo.getComponents()) {
            Product product = comp.getProduct();
            product.setReservedQty(product.getReservedQty() + comp.getToConsumeQty());

            // Check availability
            if (product.getFreeToUseQty() >= 0) {
                comp.setAvailability(ComponentAvailability.AVAILABLE);
            } else if (product.getOnHandQty() > 0) {
                comp.setAvailability(ComponentAvailability.PARTIALLY_AVAILABLE);
            } else {
                comp.setAvailability(ComponentAvailability.NOT_AVAILABLE);
            }
            productRepository.save(product);
        }

        mo.setStatus(ManufacturingOrderStatus.CONFIRMED);
        ManufacturingOrder saved = moRepository.save(mo);
        auditLogService.log("MANUFACTURING", "ManufacturingOrder", saved.getId(), saved.getRef(),
                "CONFIRMED", "status", "DRAFT", "CONFIRMED", "MO confirmed");
        notificationService.sendOrderUpdate("MO", saved.getRef(), "DRAFT", "CONFIRMED");
        return saved;
    }

    @Transactional
    public ManufacturingOrder startProduction(Long id) {
        ManufacturingOrder mo = getById(id);
        if (mo.getStatus() != ManufacturingOrderStatus.CONFIRMED) {
            throw new RuntimeException("Only CONFIRMED MOs can be started");
        }
        mo.setStatus(ManufacturingOrderStatus.IN_PROGRESS);
        // Start first work order
        mo.getWorkOrders().stream()
                .filter(wo -> wo.getStatus() == WorkOrderStatus.PENDING)
                .findFirst()
                .ifPresent(wo -> {
                    wo.setStatus(WorkOrderStatus.IN_PROGRESS);
                    wo.setStartedAt(LocalDateTime.now());
                });

        ManufacturingOrder saved = moRepository.save(mo);
        auditLogService.log("MANUFACTURING", "ManufacturingOrder", saved.getId(), saved.getRef(),
                "STARTED", "status", "CONFIRMED", "IN_PROGRESS", "Production started");
        notificationService.sendOrderUpdate("MO", saved.getRef(), "CONFIRMED", "IN_PROGRESS");
        return saved;
    }

    @Transactional
    public ManufacturingOrder completeWorkOrder(Long moId, Long woId, Integer realDurationMinutes) {
        ManufacturingOrder mo = getById(moId);
        MOWorkOrder wo = mo.getWorkOrders().stream()
                .filter(w -> w.getId().equals(woId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Work Order not found"));

        wo.setStatus(WorkOrderStatus.DONE);
        wo.setRealDurationMinutes(realDurationMinutes);
        wo.setCompletedAt(LocalDateTime.now());

        // Start next pending work order
        mo.getWorkOrders().stream()
                .filter(w -> w.getStatus() == WorkOrderStatus.PENDING)
                .findFirst()
                .ifPresent(next -> {
                    next.setStatus(WorkOrderStatus.IN_PROGRESS);
                    next.setStartedAt(LocalDateTime.now());
                });

        ManufacturingOrder saved = moRepository.save(mo);
        auditLogService.log("MANUFACTURING", "ManufacturingOrder", saved.getId(), saved.getRef(),
                "WORK_ORDER_DONE", "workOrder", wo.getOperation(), "DONE",
                wo.getOperation() + " completed in " + realDurationMinutes + " mins (expected: " + wo.getExpectedDurationMinutes() + " mins)");
        return saved;
    }

    @Transactional
    public ManufacturingOrder produce(Long id) {
        ManufacturingOrder mo = getById(id);
        if (mo.getStatus() != ManufacturingOrderStatus.IN_PROGRESS && mo.getStatus() != ManufacturingOrderStatus.CONFIRMED) {
            throw new RuntimeException("MO must be IN_PROGRESS or CONFIRMED to produce");
        }

        // Consume components
        for (MOComponent comp : mo.getComponents()) {
            Product product = comp.getProduct();
            double oldQty = product.getOnHandQty();
            double consumeQty = comp.getToConsumeQty();

            product.setOnHandQty(Math.max(0, oldQty - consumeQty));
            product.setReservedQty(Math.max(0, product.getReservedQty() - consumeQty));
            comp.setConsumedQty(consumeQty);
            productRepository.save(product);

            notificationService.sendStockUpdate(product.getId(), product.getName(),
                    oldQty, product.getOnHandQty(), "Consumed in MO " + mo.getRef());
            auditLogService.log("INVENTORY", "Product", product.getId(), product.getRef(),
                    "STOCK_OUT", "onHandQty", String.valueOf(oldQty),
                    String.valueOf(product.getOnHandQty()),
                    "Component consumed in MO " + mo.getRef());
        }

        // Add finished goods to stock
        Product finished = mo.getFinishedProduct();
        double oldFinishedQty = finished.getOnHandQty();
        finished.setOnHandQty(oldFinishedQty + mo.getQuantity());
        productRepository.save(finished);

        notificationService.sendStockUpdate(finished.getId(), finished.getName(),
                oldFinishedQty, finished.getOnHandQty(), "Produced via MO " + mo.getRef());
        stockLedgerService.recordStockIn(finished, mo.getQuantity(), oldFinishedQty, "MO", mo.getId(), mo.getRef(), "Finished goods produced via " + mo.getRef());
        auditLogService.log("INVENTORY", "Product", finished.getId(), finished.getRef(),
                "STOCK_IN", "onHandQty", String.valueOf(oldFinishedQty),
                String.valueOf(finished.getOnHandQty()),
                "Finished goods produced via MO " + mo.getRef());

        // Complete all work orders
        mo.getWorkOrders().forEach(wo -> {
            if (wo.getStatus() != WorkOrderStatus.DONE) {
                wo.setStatus(WorkOrderStatus.DONE);
                wo.setCompletedAt(LocalDateTime.now());
            }
        });

        mo.setStatus(ManufacturingOrderStatus.DONE);
        ManufacturingOrder saved = moRepository.save(mo);
        auditLogService.log("MANUFACTURING", "ManufacturingOrder", saved.getId(), saved.getRef(),
                "DONE", "status", "IN_PROGRESS", "DONE",
                "MO completed: produced " + mo.getQuantity() + "x " + finished.getName());
        notificationService.sendOrderUpdate("MO", saved.getRef(), "IN_PROGRESS", "DONE");
        notificationService.sendDashboardRefresh();

        return saved;
    }

    @Transactional
    public ManufacturingOrder cancel(Long id) {
        ManufacturingOrder mo = getById(id);
        if (mo.getStatus() == ManufacturingOrderStatus.DONE) {
            throw new RuntimeException("Cannot cancel a completed MO");
        }
        // Release reserved components
        if (mo.getStatus() == ManufacturingOrderStatus.CONFIRMED ||
                mo.getStatus() == ManufacturingOrderStatus.IN_PROGRESS) {
            for (MOComponent comp : mo.getComponents()) {
                Product product = comp.getProduct();
                product.setReservedQty(Math.max(0, product.getReservedQty() - comp.getToConsumeQty()));
                productRepository.save(product);
            }
        }
        mo.setStatus(ManufacturingOrderStatus.CANCELLED);
        ManufacturingOrder saved = moRepository.save(mo);
        auditLogService.log("MANUFACTURING", "ManufacturingOrder", saved.getId(), saved.getRef(),
                "CANCELLED", "status", mo.getStatus().name(), "CANCELLED", "MO cancelled");
        return saved;
    }

    private String generateRef() {
        return String.format("MO-%06d", moCounter.getAndIncrement());
    }
}
