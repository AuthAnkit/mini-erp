package com.minierp.service;

import com.minierp.entity.*;
import com.minierp.enums.*;
import com.minierp.service.StockLedgerService;
import com.minierp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository poRepository;
    private final ProductRepository productRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;
    private final StockLedgerService stockLedgerService;

    private static final AtomicLong poCounter = new AtomicLong(100);

    public List<PurchaseOrder> getAll() {
        return poRepository.findAll();
    }

    public PurchaseOrder getById(Long id) {
        return poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase Order not found: " + id));
    }

    @Transactional
    public PurchaseOrder create(PurchaseOrder po) {
        po.setRef(generateRef());
        po.setStatus(PurchaseOrderStatus.DRAFT);
        PurchaseOrder saved = poRepository.save(po);
        auditLogService.log("PURCHASE", "PurchaseOrder", saved.getId(), saved.getRef(),
                "CREATED", "status", null, "DRAFT", "Purchase Order created");
        return saved;
    }

    @Transactional
    public PurchaseOrder confirm(Long id) {
        PurchaseOrder po = getById(id);
        if (po.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT POs can be confirmed");
        }
        po.setStatus(PurchaseOrderStatus.CONFIRMED);
        PurchaseOrder saved = poRepository.save(po);
        auditLogService.log("PURCHASE", "PurchaseOrder", saved.getId(), saved.getRef(),
                "CONFIRMED", "status", "DRAFT", "CONFIRMED", "PO confirmed");
        notificationService.sendOrderUpdate("PO", saved.getRef(), "DRAFT", "CONFIRMED");
        return saved;
    }

    @Transactional
    public PurchaseOrder receive(Long id, Map<Long, Double> lineReceipts) {
        PurchaseOrder po = getById(id);
        if (po.getStatus() != PurchaseOrderStatus.CONFIRMED && po.getStatus() != PurchaseOrderStatus.PARTIALLY_RECEIVED) {
            throw new RuntimeException("Cannot receive PO in status: " + po.getStatus());
        }

        boolean allReceived = true;
        for (PurchaseOrderLine line : po.getLines()) {
            Double receiveQty = lineReceipts.getOrDefault(line.getId(), 0.0);
            if (receiveQty > 0) {
                line.setReceivedQty(line.getReceivedQty() + receiveQty);

                // Increase onHand stock
                Product product = line.getProduct();
                double oldQty = product.getOnHandQty();
                product.setOnHandQty(oldQty + receiveQty);
                productRepository.save(product);

                notificationService.sendStockUpdate(product.getId(), product.getName(),
                        oldQty, product.getOnHandQty(), "Received via " + po.getRef());
                stockLedgerService.recordStockIn(product, receiveQty, oldQty,
                        "PO", po.getId(), po.getRef(), "Stock received via " + po.getRef());
                auditLogService.log("INVENTORY", "Product", product.getId(), product.getRef(),
                        "STOCK_IN", "onHandQty", String.valueOf(oldQty),
                        String.valueOf(product.getOnHandQty()),
                        "Stock received via PO " + po.getRef());
            }
            if (line.getReceivedQty() < line.getOrderedQty()) {
                allReceived = false;
            }
        }

        String oldStatus = po.getStatus().name();
        po.setStatus(allReceived ? PurchaseOrderStatus.FULLY_RECEIVED : PurchaseOrderStatus.PARTIALLY_RECEIVED);
        PurchaseOrder saved = poRepository.save(po);
        auditLogService.log("PURCHASE", "PurchaseOrder", saved.getId(), saved.getRef(),
                "RECEIVED", "status", oldStatus, saved.getStatus().name(), "Products received");
        notificationService.sendOrderUpdate("PO", saved.getRef(), oldStatus, saved.getStatus().name());
        notificationService.sendDashboardRefresh();
        return saved;
    }

    @Transactional
    public PurchaseOrder cancel(Long id) {
        PurchaseOrder po = getById(id);
        if (po.getStatus() == PurchaseOrderStatus.FULLY_RECEIVED) {
            throw new RuntimeException("Cannot cancel a fully received PO");
        }
        po.setStatus(PurchaseOrderStatus.CANCELLED);
        PurchaseOrder saved = poRepository.save(po);
        auditLogService.log("PURCHASE", "PurchaseOrder", saved.getId(), saved.getRef(),
                "CANCELLED", "status", po.getStatus().name(), "CANCELLED", "PO cancelled");
        return saved;
    }

    private String generateRef() {
        return String.format("PO-%06d", poCounter.getAndIncrement());
    }
}
