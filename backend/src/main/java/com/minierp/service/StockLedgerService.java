package com.minierp.service;

import com.minierp.entity.Product;
import com.minierp.entity.StockLedger;
import com.minierp.repository.StockLedgerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StockLedgerService {

    private final StockLedgerRepository ledgerRepository;

    /**
     * Record a STOCK_IN movement (PO received, MO produced).
     * Called from PurchaseOrderService and ManufacturingOrderService.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordStockIn(Product product, Double qty, Double balanceBefore,
                               String sourceType, Long sourceId, String sourceRef, String notes) {
        StockLedger entry = StockLedger.builder()
                .product(product)
                .dateTime(LocalDateTime.now())
                .movementType("STOCK_IN")
                .quantity(qty)
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceBefore + qty)
                .sourceType(sourceType)
                .sourceId(sourceId)
                .sourceRef(sourceRef)
                .notes(notes)
                .build();
        ledgerRepository.save(entry);
    }

    /**
     * Record a STOCK_OUT movement (SO delivered, MO component consumed).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordStockOut(Product product, Double qty, Double balanceBefore,
                                String sourceType, Long sourceId, String sourceRef, String notes) {
        StockLedger entry = StockLedger.builder()
                .product(product)
                .dateTime(LocalDateTime.now())
                .movementType("STOCK_OUT")
                .quantity(qty)
                .balanceBefore(balanceBefore)
                .balanceAfter(Math.max(0, balanceBefore - qty))
                .sourceType(sourceType)
                .sourceId(sourceId)
                .sourceRef(sourceRef)
                .notes(notes)
                .build();
        ledgerRepository.save(entry);
    }

    /**
     * Get full ledger for a product — chronological stock movement history.
     */
    public List<StockLedger> getProductLedger(Long productId) {
        return ledgerRepository.findByProductIdOrderByDateTimeDesc(productId);
    }

    /**
     * Get ledger entries caused by a specific source document.
     * E.g., all stock movements from MO-000001
     */
    public List<StockLedger> getBySource(String sourceType, Long sourceId) {
        return ledgerRepository.findBySourceTypeAndSourceIdOrderByDateTimeDesc(sourceType, sourceId);
    }

    /**
     * Get full ledger (all products, all movements) — for the Traceability view.
     */
    public List<StockLedger> getFullLedger() {
        return ledgerRepository.findAllByOrderByDateTimeDesc();
    }

    /**
     * Summary per product: total in, total out, net movement.
     */
    public List<Map<String, Object>> getStockSummary() {
        List<StockLedger> all = ledgerRepository.findAll();
        Map<Long, Map<String, Object>> byProduct = new LinkedHashMap<>();

        for (StockLedger entry : all) {
            Long pid = entry.getProduct().getId();
            byProduct.computeIfAbsent(pid, k -> {
                Map<String, Object> m = new HashMap<>();
                m.put("productId", pid);
                m.put("productName", entry.getProduct().getName());
                m.put("productRef", entry.getProduct().getRef());
                m.put("totalIn", 0.0);
                m.put("totalOut", 0.0);
                m.put("movements", 0);
                return m;
            });

            Map<String, Object> m = byProduct.get(pid);
            m.put("movements", (int) m.get("movements") + 1);
            if ("STOCK_IN".equals(entry.getMovementType())) {
                m.put("totalIn", (double) m.get("totalIn") + entry.getQuantity());
            } else {
                m.put("totalOut", (double) m.get("totalOut") + entry.getQuantity());
            }
        }

        List<Map<String, Object>> result = new ArrayList<>(byProduct.values());
        result.forEach(m -> m.put("net", (double) m.get("totalIn") - (double) m.get("totalOut")));
        return result;
    }
}
