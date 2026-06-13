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
    private final StockLedgerRepository stockLedgerRepository;
    private final SalesOrderLineRepository salesOrderLineRepository;
    private final VendorRepository vendorRepository;

    /**
     * Generate procurement recommendations for all products
     */
    public void generateProcurementRecommendations() {
        List<Product> allProducts = productRepository.findAll();
        for (Product product : allProducts) {
            generateRecommendationForProduct(product.getId());
        }
    }

    /**
     * Generate recommendation for a specific product
     */
    public ProcurementRecommendation generateRecommendationForProduct(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        double currentStock = product.getOnHandQty();
        double averageDailyUsage = calculateAverageDailyUsage(productId);
        int daysUntilStockout = calculateDaysUntilStockout(currentStock, averageDailyUsage);

        String urgencyLevel = determineUrgencyLevel(daysUntilStockout);
        double recommendedQuantity = calculateRecommendedQuantity(productId, averageDailyUsage);

        String reason = generateRecommendationReason(currentStock, averageDailyUsage, daysUntilStockout);

        ProcurementRecommendation recommendation = ProcurementRecommendation.builder()
                .product(product)
                .preferredVendor(product.getVendor())
                .recommendationDate(LocalDate.now())
                .currentStock(currentStock)
                .averageDailyUsage(averageDailyUsage)
                .daysUntilStockout(daysUntilStockout)
                .recommendedQuantity(recommendedQuantity)
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
        return salesOrderLineRepository.findAll().stream()
                .filter(line -> line.getProduct().getId().equals(productId))
                .filter(line -> line.getSalesOrder().getCreationDate().isAfter(thirtyDaysAgo))
                .mapToDouble(SalesOrderLine::getQuantity)
                .average()
                .orElse(0.0);
    }

    private int calculateDaysUntilStockout(double currentStock, double dailyUsage) {
        if (dailyUsage <= 0) return Integer.MAX_VALUE;
        return (int) (currentStock / dailyUsage);
    }

    private String determineUrgencyLevel(int daysUntilStockout) {
        if (daysUntilStockout <= 2) return "CRITICAL";
        if (daysUntilStockout <= 7) return "HIGH";
        if (daysUntilStockout <= 15) return "MEDIUM";
        return "LOW";
    }

    private double calculateRecommendedQuantity(Long productId, double dailyUsage) {
        // Recommend 60 days of stock
        return dailyUsage * 60;
    }

    private String generateRecommendationReason(double currentStock, double dailyUsage, int daysUntilStockout) {
        if (daysUntilStockout <= 2) {
            return "CRITICAL: Stock will be exhausted within 2 days at current consumption rate";
        }
        if (daysUntilStockout <= 7) {
            return "HIGH: Stock will be exhausted within 7 days. Immediate procurement required.";
        }
        if (daysUntilStockout <= 15) {
            return "MEDIUM: Stock available for 15 days. Plan procurement in advance.";
        }
        return "LOW: Stock level is healthy. Consider routine procurement.";
    }

    /**
     * Get all pending procurement recommendations sorted by urgency
     */
    public List<Map<String, Object>> getPendingRecommendations() {
        return procurementRepository.findPendingRecommendations()
                .stream()
                .map(this::formatRecommendation)
                .collect(Collectors.toList());
    }

    /**
     * Get critical procurement recommendations (CRITICAL and HIGH urgency)
     */
    public List<Map<String, Object>> getCriticalRecommendations() {
        return procurementRepository.findCriticalRecommendations()
                .stream()
                .map(this::formatRecommendation)
                .collect(Collectors.toList());
    }

    /**
     * Approve a procurement recommendation
     */
    public void approveProcurementRecommendation(Long recommendationId) {
        ProcurementRecommendation rec = procurementRepository.findById(recommendationId)
                .orElseThrow(() -> new RuntimeException("Recommendation not found"));
        rec.setRecommendationStatus("APPROVED");
        procurementRepository.save(rec);
    }

    private Map<String, Object> formatRecommendation(ProcurementRecommendation rec) {
        return Map.of(
                "recommendationId", rec.getId(),
                "productId", rec.getProduct().getId(),
                "productName", rec.getProduct().getName(),
                "currentStock", rec.getCurrentStock(),
                "averageDailyUsage", String.format("%.2f", rec.getAverageDailyUsage()),
                "daysUntilStockout", rec.getDaysUntilStockout(),
                "recommendedQuantity", rec.getRecommendedQuantity(),
                "urgencyLevel", rec.getUrgencyLevel(),
                "reason", rec.getReason(),
                "preferredVendor", rec.getPreferredVendor() != null ? rec.getPreferredVendor().getName() : "Not Set"
        );
    }
}
