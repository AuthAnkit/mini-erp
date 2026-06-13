package com.minierp.service;

import com.minierp.entity.*;
import com.minierp.enums.SalesOrderStatus;
import com.minierp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Feature 3: Manufacturing Priority Engine
 * Determines manufacturing order priority based on urgency, value, and customer importance
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ManufacturingPriorityService {

    private final ManufacturingPriorityRepository priorityRepository;
    private final ManufacturingOrderRepository manufacturingOrderRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final CustomerRepository customerRepository;

    /**
     * Calculate and rank all pending manufacturing orders
     */
    public void calculatePrioritiesForAllOrders() {
        List<ManufacturingOrder> pendingOrders = manufacturingOrderRepository.findByStatus(
                com.minierp.enums.ManufacturingOrderStatus.CONFIRMED);

        List<ManufacturingPriority> priorities = pendingOrders.stream()
                .map(this::calculatePriority)
                .sorted(Comparator.comparingDouble(ManufacturingPriority::getPriorityScore).reversed())
                .collect(Collectors.toList());

        // Assign ranks
        for (int i = 0; i < priorities.size(); i++) {
            priorities.get(i).setPriorityRank(i + 1);
        }

        priorityRepository.saveAll(priorities);
    }

    /**
     * Calculate priority for a specific manufacturing order
     */
    private ManufacturingPriority calculatePriority(ManufacturingOrder mo) {
        // Calculate individual scores
        int urgencyScore = calculateUrgencyScore(mo);
        int customerImportanceScore = calculateCustomerImportanceScore(mo);
        int componentAvailabilityScore = calculateComponentAvailabilityScore(mo);

        // Order value
        double orderValue = mo.getQuantity() * mo.getFinishedProduct().getSalesPrice().doubleValue();

        // Weighted priority score (0-100)
        double priorityScore = (urgencyScore * 0.4) + 
                              (Math.log(orderValue + 1) / Math.log(10000 + 1) * 100 * 0.3) +
                              (customerImportanceScore * 0.2) +
                              (componentAvailabilityScore * 0.1);

        String priorityLevel = determinePriorityLevel(priorityScore);

        ManufacturingPriority priority = ManufacturingPriority.builder()
                .manufacturingOrder(mo)
                .priorityScore(Math.min(priorityScore, 100))
                .urgencyScore(urgencyScore)
                .orderValue(mo.getFinishedProduct().getSalesPrice().multiply(
                        java.math.BigDecimal.valueOf(mo.getQuantity())))
                .customerImportanceScore(customerImportanceScore)
                .componentAvailabilityScore(componentAvailabilityScore)
                .priorityLevel(priorityLevel)
                .status("PENDING")
                .calculatedAt(LocalDateTime.now())
                .build();

        return priorityRepository.save(priority);
    }

    private int calculateUrgencyScore(ManufacturingOrder mo) {
        // Find associated sales order
        List<SalesOrder> salesOrders = salesOrderRepository.findAll().stream()
                .filter(so -> so.getStatus() != SalesOrderStatus.DRAFT)
                .collect(Collectors.toList());

        for (SalesOrder so : salesOrders) {
            boolean hasMoProduct = so.getLines().stream()
                    .anyMatch(line -> line.getProduct().getId().equals(mo.getFinishedProduct().getId()));
            if (hasMoProduct && so.getScheduleDate() != null) {
                long daysUntilDeadline = LocalDate.now().until(so.getScheduleDate()).getDays();
                if (daysUntilDeadline < 0) return 100;
                if (daysUntilDeadline <= 1) return 95;
                if (daysUntilDeadline <= 3) return 80;
                if (daysUntilDeadline <= 7) return 60;
                if (daysUntilDeadline <= 14) return 40;
                return 20;
            }
        }
        return 50;
    }

    private int calculateCustomerImportanceScore(ManufacturingOrder mo) {
        // Find customer associated with this MO
        List<SalesOrder> relevantSOs = salesOrderRepository.findAll().stream()
                .filter(so -> so.getLines().stream()
                        .anyMatch(line -> line.getProduct().getId().equals(mo.getFinishedProduct().getId())))
                .collect(Collectors.toList());

        if (relevantSOs.isEmpty()) return 50;

        Customer customer = relevantSOs.get(0).getCustomer();

        // Calculate customer lifetime value
        double customerRevenue = salesOrderRepository.findAll().stream()
                .filter(so -> so.getCustomer().getId().equals(customer.getId()))
                .flatMap(so -> so.getLines().stream())
                .mapToDouble(line -> line.getUnitPrice().doubleValue() * line.getQuantity())
                .sum();

        // Score based on customer value
        if (customerRevenue > 500000) return 95; // VIP
        if (customerRevenue > 100000) return 75; // Regular
        return 50; // New
    }

    private int calculateComponentAvailabilityScore(ManufacturingOrder mo) {
        if (mo.getComponents() == null || mo.getComponents().isEmpty()) return 100;

        long availableComponents = mo.getComponents().stream()
                .filter(comp -> comp.getProduct().getFreeToUseQty() >= comp.getRequiredQty())
                .count();

        return (int) ((availableComponents * 100) / mo.getComponents().size());
    }

    private String determinePriorityLevel(double priorityScore) {
        if (priorityScore >= 80) return "CRITICAL";
        if (priorityScore >= 60) return "HIGH";
        if (priorityScore >= 40) return "NORMAL";
        return "LOW";
    }

    /**
     * Get manufacturing orders ranked by priority
     */
    public List<Map<String, Object>> getRankedManufacturingOrders() {
        return priorityRepository.findRankedManufacturingOrders()
                .stream()
                .map(this::formatPriorityResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get next manufacturing order to start
     */
    public Map<String, Object> getNextOrderToManufacture() {
        Optional<ManufacturingPriority> nextOrder = priorityRepository.findPendingInPriorityOrder()
                .stream()
                .findFirst();

        if (nextOrder.isPresent()) {
            return formatPriorityResponse(nextOrder.get());
        }
        return new HashMap<>();
    }

    private Map<String, Object> formatPriorityResponse(ManufacturingPriority mp) {
        ManufacturingOrder mo = mp.getManufacturingOrder();
        return Map.of(
                "rank", mp.getPriorityRank(),
                "orderId", mo.getId(),
                "orderRef", mo.getRef(),
                "productName", mo.getFinishedProduct().getName(),
                "quantity", mo.getQuantity(),
                "priorityScore", String.format("%.2f", mp.getPriorityScore()),
                "priorityLevel", mp.getPriorityLevel(),
                "urgencyScore", mp.getUrgencyScore(),
                "orderValue", mp.getOrderValue(),
                "customerImportance", mp.getCustomerImportanceScore(),
                "componentAvailability", mp.getComponentAvailabilityScore()
        );
    }
}
