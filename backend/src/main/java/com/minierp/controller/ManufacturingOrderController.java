package com.minierp.controller;

import com.minierp.entity.*;
import com.minierp.repository.*;
import com.minierp.service.ManufacturingOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/manufacturing-orders")
@RequiredArgsConstructor
public class ManufacturingOrderController {

    private final ManufacturingOrderService moService;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(moService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return ResponseEntity.ok(moService.getById(id));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        ManufacturingOrder mo = new ManufacturingOrder();
        Long productId = Long.valueOf(body.get("finishedProductId").toString());
        mo.setFinishedProduct(productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found")));
        mo.setQuantity(Double.valueOf(body.get("quantity").toString()));
        if (body.get("scheduleDate") != null)
            mo.setScheduleDate(LocalDate.parse(body.get("scheduleDate").toString()));
        if (body.get("notes") != null)
            mo.setNotes(body.get("notes").toString());
        if (body.get("assigneeId") != null) {
            Long assigneeId = Long.valueOf(body.get("assigneeId").toString());
            userRepository.findById(assigneeId).ifPresent(mo::setAssignee);
        }
        return ResponseEntity.ok(moService.create(mo));
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(moService.confirm(id));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<?> start(@PathVariable Long id) {
        return ResponseEntity.ok(moService.startProduction(id));
    }

    @PostMapping("/{id}/work-orders/{woId}/complete")
    public ResponseEntity<?> completeWorkOrder(@PathVariable Long id,
                                                @PathVariable Long woId,
                                                @RequestBody Map<String, Object> body) {
        Integer realDuration = Integer.valueOf(body.get("realDurationMinutes").toString());
        return ResponseEntity.ok(moService.completeWorkOrder(id, woId, realDuration));
    }

    @PostMapping("/{id}/produce")
    public ResponseEntity<?> produce(@PathVariable Long id) {
        return ResponseEntity.ok(moService.produce(id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(moService.cancel(id));
    }
}
