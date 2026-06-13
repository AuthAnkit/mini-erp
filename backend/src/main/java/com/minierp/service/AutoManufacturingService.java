package com.minierp.service;

import com.minierp.entity.*;
import com.minierp.enums.ManufacturingOrderStatus;
import com.minierp.enums.WorkOrderStatus;
import com.minierp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Feature 5: Auto Manufacturing Engine
 * Automatically creates manufacturing orders when stock falls below trigger levels
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AutoManufacturingService {

    private final AutoManufacturingRuleRepository ruleRepository;
    private final ManufacturingOrderRepository moRepository;
    private final ProductRepository productRepository;
    private final AuditLogService auditLogService;

    private static final AtomicLong autoMoCounter = new AtomicLong(9000);

    public AutoManufacturingRule createRule(Long productId, Double triggerStock, Double mfgQty,
                                            Double safetyStock, Integer leadTimeDays) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Delete existing rule for this product
        ruleRepository.findByProduct(product).ifPresent(ruleRepository::delete);

        AutoManufacturingRule rule = AutoManufacturingRule.builder()
                .product(product)
                .isActive(true)
                .triggerStockLevel(triggerStock)
                .manufacturingQuantity(mfgQty)
                .safetyStock(safetyStock)
                .leadTimeDays(leadTimeDays)
                .createdAt(LocalDateTime.now())
                .build();

        return ruleRepository.save(rule);
    }

    public List<Map<String, Object>> getAllRules() {
        return ruleRepository.findAll().stream()
                .map(this::formatRule)
                .collect(Collectors.toList());
    }

    public void toggleRule(Long ruleId, boolean active) {
        AutoManufacturingRule rule = ruleRepository.findById(ruleId)
                .orElseThrow(() -> new RuntimeException("Rule not found"));
        rule.setIsActive(active);
        ruleRepository.save(rule);
    }

    public void deleteRule(Long ruleId) {
        ruleRepository.deleteById(ruleId);
    }

    @Transactional
    public List<Map<String, Object>> triggerAutoManufacturing() {
        List<AutoManufacturingRule> triggered = ruleRepository.findTriggeredRules();
        List<Map<String, Object>> created = new ArrayList<>();

        for (AutoManufacturingRule rule : triggered) {
            Product product = rule.getProduct();

            // Check if an auto MO already exists for this product
            boolean alreadyExists = moRepository.findAll().stream()
                    .anyMatch(mo -> mo.getFinishedProduct().getId().equals(product.getId())
                            && (mo.getStatus() == ManufacturingOrderStatus.DRAFT
                                || mo.getStatus() == ManufacturingOrderStatus.CONFIRMED
                                || mo.getStatus() == ManufacturingOrderStatus.IN_PROGRESS));

            if (alreadyExists) continue;

            String ref = "AUTO-MO-" + String.format("%05d", autoMoCounter.getAndIncrement());
            ManufacturingOrder mo = ManufacturingOrder.builder()
                    .ref(ref)
                    .finishedProduct(product)
                    .quantity(rule.getManufacturingQuantity())
                    .status(ManufacturingOrderStatus.DRAFT)
                    .components(new ArrayList<>())
                    .workOrders(new ArrayList<>())
                    .build();

            // Auto-load BoM if available
            if (!product.getBomComponents().isEmpty()) {
                for (BomComponent bc : product.getBomComponents()) {
                    MOComponent comp = MOComponent.builder()
                            .manufacturingOrder(mo)
                            .product(bc.getComponentProduct())
                            .toConsumeQty(bc.getQuantity() * rule.getManufacturingQuantity())
                            .build();
                    mo.getComponents().add(comp);
                }
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
            }

            ManufacturingOrder saved = moRepository.save(mo);
            auditLogService.log("MANUFACTURING", "ManufacturingOrder", saved.getId(), saved.getRef(),
                    "AUTO_CREATED", "trigger", "STOCK_LOW", "DRAFT",
                    "Auto-MO created: stock " + product.getOnHandQty() + " < trigger " + rule.getTriggerStockLevel());

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("moRef", saved.getRef());
            entry.put("product", product.getName());
            entry.put("quantity", rule.getManufacturingQuantity());
            entry.put("currentStock", product.getOnHandQty());
            entry.put("triggerLevel", rule.getTriggerStockLevel());
            created.add(entry);
        }

        return created;
    }

    private Map<String, Object> formatRule(AutoManufacturingRule r) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("ruleId", r.getId());
        map.put("productId", r.getProduct().getId());
        map.put("productName", r.getProduct().getName());
        map.put("currentStock", r.getProduct().getOnHandQty());
        map.put("isActive", r.getIsActive());
        map.put("triggerStockLevel", r.getTriggerStockLevel());
        map.put("manufacturingQuantity", r.getManufacturingQuantity());
        map.put("safetyStock", r.getSafetyStock());
        map.put("leadTimeDays", r.getLeadTimeDays());
        map.put("triggered", r.getProduct().getOnHandQty() < r.getTriggerStockLevel());
        return map;
    }
}
