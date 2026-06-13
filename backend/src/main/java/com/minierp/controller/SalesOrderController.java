package com.minierp.controller;

import com.minierp.entity.*;
import com.minierp.repository.*;
import com.minierp.service.SalesOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/sales-orders")
@RequiredArgsConstructor
public class SalesOrderController {

    private final SalesOrderService salesOrderService;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(salesOrderService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return ResponseEntity.ok(salesOrderService.getById(id));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        SalesOrder so = new SalesOrder();

        Long customerId = Long.valueOf(body.get("customerId").toString());
        so.setCustomer(customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found")));

        if (body.get("customerAddress") != null)
            so.setCustomerAddress(body.get("customerAddress").toString());
        if (body.get("scheduleDate") != null)
            so.setScheduleDate(LocalDate.parse(body.get("scheduleDate").toString()));
        if (body.get("notes") != null)
            so.setNotes(body.get("notes").toString());
        if (body.get("salesPersonId") != null) {
            Long spId = Long.valueOf(body.get("salesPersonId").toString());
            userRepository.findById(spId).ifPresent(so::setSalesPerson);
        }

        // Parse lines
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> linesData = (List<Map<String, Object>>) body.get("lines");
        if (linesData != null) {
            for (Map<String, Object> ld : linesData) {
                Long productId = Long.valueOf(ld.get("productId").toString());
                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new RuntimeException("Product not found: " + productId));
                SalesOrderLine line = SalesOrderLine.builder()
                        .salesOrder(so)
                        .product(product)
                        .orderedQty(Double.valueOf(ld.get("orderedQty").toString()))
                        .salesPrice(ld.get("salesPrice") != null ?
                                new BigDecimal(ld.get("salesPrice").toString()) : product.getSalesPrice())
                        .build();
                so.getLines().add(line);
            }
        }

        return ResponseEntity.ok(salesOrderService.create(so));
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(salesOrderService.confirm(id));
    }

    @PostMapping("/{id}/deliver")
    public ResponseEntity<?> deliver(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        Map<String, Object> rawMap = (Map<String, Object>) body.get("deliveries");
        Map<Long, Double> deliveries = new HashMap<>();
        if (rawMap != null) {
            rawMap.forEach((k, v) -> deliveries.put(Long.valueOf(k), Double.valueOf(v.toString())));
        }
        return ResponseEntity.ok(salesOrderService.deliver(id, deliveries));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(salesOrderService.cancel(id));
    }
}
