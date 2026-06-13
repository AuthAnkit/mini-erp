package com.minierp.controller;

import com.minierp.service.StockLedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stock-ledger")
@RequiredArgsConstructor
public class StockLedgerController {

    private final StockLedgerService ledgerService;

    /**
     * Full stock ledger — all movements across all products.
     * The "Stock Ledger / traceability view" from the spec.
     */
    @GetMapping
    public ResponseEntity<?> getFullLedger() {
        return ResponseEntity.ok(ledgerService.getFullLedger());
    }

    /**
     * Per-product ledger — shows every stock movement for one product.
     * Timeline of: when it came in, when it went out, from which order.
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getProductLedger(@PathVariable Long productId) {
        return ResponseEntity.ok(ledgerService.getProductLedger(productId));
    }

    /**
     * Movements by source document (e.g., all movements from MO-000001).
     * Perfect for end-to-end traceability: "what did MO-000001 consume/produce?"
     */
    @GetMapping("/source/{sourceType}/{sourceId}")
    public ResponseEntity<?> getBySource(@PathVariable String sourceType,
                                          @PathVariable Long sourceId) {
        return ResponseEntity.ok(ledgerService.getBySource(sourceType, sourceId));
    }

    /**
     * Summary: total in / total out / net per product.
     */
    @GetMapping("/summary")
    public ResponseEntity<?> getSummary() {
        return ResponseEntity.ok(ledgerService.getStockSummary());
    }
}
