package com.minierp.service;

import com.minierp.entity.*;
import com.minierp.enums.ManufacturingOrderStatus;
import com.minierp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Feature 11: Business Health Score
 * Composite KPI score (0-100) covering inventory, revenue, manufacturing, and order performance
 */
@Service
@RequiredArgsConstructor
public class BusinessHealthScoreService {

    private final BusinessHealthScoreRepository scoreRepository;
    private final ProductRepository productRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final ManufacturingOrderRepository moRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    public Map<String, Object> computeAndGetHealthScore() {
        // 1. Inventory Health (0-100): low stock = bad
        int inventoryScore = calculateInventoryScore();

        // 2. Revenue Growth (0-100): compare this month vs last
        int revenueScore = calculateRevenueGrowthScore();

        // 3. Manufacturing Efficiency (0-100): done vs in-progress ratio
        int mfgScore = calculateManufacturingEfficiencyScore();

        // 4. Order Completion (0-100): completed SO ratio
        int orderScore = calculateOrderCompletionScore();

        // 5. Procurement Efficiency (0-100): pending POs ratio
        int procurementScore = calculateProcurementEfficiencyScore();

        // 6. Stock Availability (0-100): products with OK status
        int stockAvailScore = calculateStockAvailabilityScore();

        // Weighted overall (each component's weight)
        int overall = (int) (
                inventoryScore   * 0.20 +
                revenueScore     * 0.25 +
                mfgScore         * 0.20 +
                orderScore       * 0.15 +
                procurementScore * 0.10 +
                stockAvailScore  * 0.10
        );

        String status = overall >= 85 ? "EXCELLENT"
                      : overall >= 70 ? "GOOD"
                      : overall >= 50 ? "FAIR"
                      : overall >= 30 ? "POOR"
                      : "CRITICAL";

        String recommendations = buildRecommendations(inventoryScore, revenueScore,
                mfgScore, orderScore, procurementScore);

        BusinessHealthScore score = BusinessHealthScore.builder()
                .scoreDate(LocalDate.now())
                .overallScore(Math.min(overall, 100))
                .healthStatus(status)
                .inventoryHealthScore(inventoryScore)
                .revenueGrowthScore(revenueScore)
                .manufacturingEfficiencyScore(mfgScore)
                .orderCompletionScore(orderScore)
                .procurementEfficiencyScore(procurementScore)
                .stockAvailabilityScore(stockAvailScore)
                .recommendations(recommendations)
                .createdAt(LocalDateTime.now())
                .build();

        scoreRepository.save(score);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("overallScore", score.getOverallScore());
        result.put("healthStatus", score.getHealthStatus());
        result.put("scoreDate", score.getScoreDate());
        result.put("components", Map.of(
                "inventoryHealth",         inventoryScore,
                "revenueGrowth",           revenueScore,
                "manufacturingEfficiency", mfgScore,
                "orderCompletion",         orderScore,
                "procurementEfficiency",   procurementScore,
                "stockAvailability",       stockAvailScore
        ));
        result.put("recommendations", recommendations);
        // Historical scores (last 7)
        result.put("history", scoreRepository.findScoresInDateRange(
                LocalDate.now().minusDays(7), LocalDate.now()).stream()
                .map(s -> Map.of(
                        "date", s.getScoreDate(),
                        "score", s.getOverallScore(),
                        "status", s.getHealthStatus()
                )).toList());
        return result;
    }

    private int calculateInventoryScore() {
        long total    = productRepository.count();
        if (total == 0) return 100;
        long critical = productRepository.findCriticalStockProducts().size();
        long low      = productRepository.findLowStockProducts().size();
        // penalty: critical = -10 pts, low = -3 pts each, scaled
        double penalty = (critical * 10.0 + low * 3.0) / total;
        return (int) Math.max(0, 100 - penalty * 100);
    }

    private int calculateRevenueGrowthScore() {
        LocalDateTime thisMonthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime lastMonthStart = thisMonthStart.minusMonths(1);

        double thisMonth = salesOrderRepository.findAll().stream()
                .filter(so -> so.getCreationDate().isAfter(thisMonthStart))
                .flatMap(so -> so.getLines().stream())
                .mapToDouble(l -> l.getSalesPrice().doubleValue() * l.getOrderedQty())
                .sum();

        double lastMonth = salesOrderRepository.findAll().stream()
                .filter(so -> so.getCreationDate().isAfter(lastMonthStart) && so.getCreationDate().isBefore(thisMonthStart))
                .flatMap(so -> so.getLines().stream())
                .mapToDouble(l -> l.getSalesPrice().doubleValue() * l.getOrderedQty())
                .sum();

        if (lastMonth == 0) return thisMonth > 0 ? 80 : 50;
        double growth = (thisMonth - lastMonth) / lastMonth;
        if (growth >= 0.20) return 100;
        if (growth >= 0.10) return 85;
        if (growth >= 0.00) return 70;
        if (growth >= -0.10) return 50;
        return 30;
    }

    private int calculateManufacturingEfficiencyScore() {
        long done       = moRepository.findByStatus(ManufacturingOrderStatus.DONE).size();
        long cancelled  = moRepository.findByStatus(ManufacturingOrderStatus.CANCELLED).size();
        long total      = moRepository.count();
        if (total == 0) return 80;
        double rate = (double) done / total;
        return (int) Math.min(100, rate * 100 + 20);
    }

    private int calculateOrderCompletionScore() {
        long total   = salesOrderRepository.count();
        long delayed = salesOrderRepository.countDelayed();
        if (total == 0) return 80;
        double delayedRate = (double) delayed / total;
        return (int) Math.max(0, 100 - delayedRate * 150);
    }

    private int calculateProcurementEfficiencyScore() {
        long total   = purchaseOrderRepository.count();
        long pending = purchaseOrderRepository.countPending();
        if (total == 0) return 80;
        double pendingRate = (double) pending / total;
        return (int) Math.max(0, 100 - pendingRate * 80);
    }

    private int calculateStockAvailabilityScore() {
        long total = productRepository.count();
        if (total == 0) return 100;
        long ok = productRepository.findAll().stream()
                .filter(p -> "OK".equals(p.getStockStatus())).count();
        return (int) ((ok * 100.0) / total);
    }

    private String buildRecommendations(int inv, int rev, int mfg, int order, int proc) {
        List<String> tips = new ArrayList<>();
        if (inv < 60)   tips.add("⚠️ Multiple products are critically low on stock — run Smart Procurement Advisor immediately.");
        if (rev < 60)   tips.add("📉 Revenue is declining — review Sales pipeline and push pending orders.");
        if (mfg < 60)   tips.add("🏭 Manufacturing completion rate is low — check for blocked work orders.");
        if (order < 60) tips.add("⏰ Several sales orders are delayed — expedite delivery workflows.");
        if (proc < 60)  tips.add("🛒 Many purchase orders are still pending — follow up with vendors.");
        if (tips.isEmpty()) tips.add("✅ Business is performing well across all metrics. Keep it up!");
        return String.join("\n", tips);
    }
}
