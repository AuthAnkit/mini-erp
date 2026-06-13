package com.minierp.controller;

import com.minierp.entity.*;
import com.minierp.repository.*;
import com.minierp.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;
    private final VendorRepository vendorRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(purchaseOrderService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseOrderService.getById(id));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        PurchaseOrder po = new PurchaseOrder();
        Long vendorId = Long.valueOf(body.get("vendorId").toString());
        po.setVendor(vendorRepository.findById(vendorId)
                .orElseThrow(() -> new RuntimeException("Vendor not found")));
        if (body.get("vendorAddress") != null)
            po.setVendorAddress(body.get("vendorAddress").toString());
        if (body.get("scheduleDate") != null)
            po.setScheduleDate(LocalDate.parse(body.get("scheduleDate").toString()));
        if (body.get("notes") != null)
            po.setNotes(body.get("notes").toString());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> linesData = (List<Map<String, Object>>) body.get("lines");
        if (linesData != null) {
            for (Map<String, Object> ld : linesData) {
                Long productId = Long.valueOf(ld.get("productId").toString());
                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new RuntimeException("Product not found"));
                PurchaseOrderLine line = PurchaseOrderLine.builder()
                        .purchaseOrder(po)
                        .product(product)
                        .orderedQty(Double.valueOf(ld.get("orderedQty").toString()))
                        .costPrice(ld.get("costPrice") != null ?
                                new BigDecimal(ld.get("costPrice").toString()) : product.getCostPrice())
                        .build();
                po.getLines().add(line);
            }
        }
        return ResponseEntity.ok(purchaseOrderService.create(po));
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseOrderService.confirm(id));
    }

    @PostMapping("/{id}/receive")
    public ResponseEntity<?> receive(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        Map<String, Object> rawMap = (Map<String, Object>) body.get("receipts");
        Map<Long, Double> receipts = new HashMap<>();
        if (rawMap != null) {
            rawMap.forEach((k, v) -> receipts.put(Long.valueOf(k), Double.valueOf(v.toString())));
        }
        return ResponseEntity.ok(purchaseOrderService.receive(id, receipts));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseOrderService.cancel(id));
    }
}
