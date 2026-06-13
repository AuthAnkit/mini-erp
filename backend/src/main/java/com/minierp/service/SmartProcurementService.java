package com.minierp.service;

import com.minierp.entity.*;
import com.minierp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Feature 2: Smart Procurement Advisor
 * Intelligent procurement recommendations based on stock levels and consumption rates
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SmartProcurementService {

    private final ProcurementRecommendationRepository procurementRepository;
    private final ProductRepository productRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final VendorRepository vendorRepository;

    public void generateProcurementRecommendations() {
        // Clear old pending recommendations before regenerating
        List<ProcurementRecommendation> old = procurementRepository.findPendingRecommendations();
        procurementRepository.deleteAll(old);

        productRepository.findAll().forEach(p -> generateRecommendationForProduct(p.getId()));
    }

    public ProcurementRecommendation generateRecommendationForProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        double currentStock       = product.getOnHandQty();
        double averageDailyUsage  = calculateAverageDailyUsage(productId);
        int    daysUntilStockout  = calculateDaysUntilStockout(currentStock, averageDailyUsage);
        String urgencyLevel       = determineUrgencyLevel(daysUntilStockout);
        double recommendedQty     = calculateRecommendedQuantity(averageDailyUsage);
        String reason             = buildReason(currentStock, averageDailyUsage, daysUntilStockout);

        ProcurementRecommendation recommendation = ProcurementRecommendation.builder()
                .product(product)
                .preferredVendor(product.getVendor())
                .recommendationDate(LocalDate.now())
                .currentStock(currentStock)
                .averageDailyUsage(averageDailyUsage)
                .daysUntilStockout(daysUntilStockout)
                .recommendedQuantity(recommendedQty)
                .urgencyLevel(urgencyLevel)
                .estimatedDepletion((double) daysUntilStockout)
                .reason(reason)
                .recommendationStatus("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        return procurementRepository.save(recommendation);
    }

    private double calculateAverageDailyUsage(Long productId) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<SalesOrderLine> lines = salesOrderRepository.findAll().stream()
                .filter(so -> so.getCreationDate().isAfter(thirtyDaysAgo))
                .flatMap(so -> so.getLines().stream())
                .filter(line -> line.getProduct().getId().equals(productId))
                .collect(Collectors.toList());

        return lines.stream().mapToDouble(SalesOrderLine::getOrderedQty).average().orElse(0.0);
    }

    private int calculateDaysUntilStockout(double currentStock, double dailyUsage) {
        if (dailyUsage <= 0) return Integer.MAX_VALUE;
        long days = (long)(currentStock / dailyUsage);
        return days > 9999 ? 9999 : (int) days;
    }

    private String determineUrgencyLevel(int days) {
        if (days <= 2)  return "CRITICAL";
        if (days <= 7)  return "HIGH";
        if (days <= 15) return "MEDIUM";
        return "LOW";
    }

    private double calculateRecommendedQuantity(double dailyUsage) {
        return Math.max(dailyUsage * 60, 10);
    }

    private String buildReason(double currentStock, double dailyUsage, int daysUntilStockout) {
        if (daysUntilStockout <= 2)
            return "CRITICAL: Stock will be exhausted within 2 days at current consumption rate";
        if (daysUntilStockout <= 7)
            return "HIGH: Stock will run out within 7 days. Immediate procurement required.";
        if (daysUntilStockout <= 15)
            return "MEDIUM: Stock available for ~15 days. Plan procurement in advance.";
        return "LOW: Stock level is healthy. Consider routine procurement.";
    }

    public List<Map<String, Object>> getPendingRecommendations() {
        return procurementRepository.findPendingRecommendations().stream()
                .map(this::formatRecommendation).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getCriticalRecommendations() {
        return procurementRepository.findCriticalRecommendations().stream()
                .map(this::formatRecommendation).collect(Collectors.toList());
    }

    public void approveProcurementRecommendation(Long recommendationId) {
        ProcurementRecommendation rec = procurementRepository.findById(recommendationId)
                .orElseThrow(() -> new RuntimeException("Recommendation not found"));
        rec.setRecommendationStatus("APPROVED");
        procurementRepository.save(rec);
    }

    private Map<String, Object> formatRecommendation(ProcurementRecommendation rec) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("recommendationId", rec.getId());
        map.put("productId", rec.getProduct().getId());
        map.put("productName", rec.getProduct().getName());
        map.put("currentStock", rec.getCurrentStock());
        map.put("averageDailyUsage", String.format("%.2f", rec.getAverageDailyUsage()));
        map.put("daysUntilStockout", rec.getDaysUntilStockout() == 9999 ? "∞" : rec.getDaysUntilStockout());
        map.put("recommendedQuantity", Math.round(rec.getRecommendedQuantity()));
        map.put("urgencyLevel", rec.getUrgencyLevel());
        map.put("reason", rec.getReason());
        map.put("preferredVendor", rec.getPreferredVendor() != null ? rec.getPreferredVendor().getName() : "Not Set");
        return map;
    }
}
