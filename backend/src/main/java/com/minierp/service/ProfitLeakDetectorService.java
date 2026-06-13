package com.minierp.service;

import com.minierp.entity.*;
import com.minierp.enums.ManufacturingOrderStatus;
import com.minierp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Feature 12: Profit Leak Detector
 * Identifies hidden losses: dead stock, delayed manufacturing, overpriced vendors, price erosion
 */
@Service
@RequiredArgsConstructor
public class ProfitLeakDetectorService {

    private final ProfitLeakAlertRepository profitLeakAlertRepository;
    private final ProductRepository productRepository;
    private final ManufacturingOrderRepository moRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final VendorRepository vendorRepository;
    private final DeadStockService deadStockService;

    public List<Map<String, Object>> detectAndGetProfitLeaks() {
        // Clear old pending leaks
        profitLeakAlertRepository.findPendingLeaks().forEach(profitLeakAlertRepository::delete);

        List<ProfitLeakAlert> leaks = new ArrayList<>();

        leaks.addAll(detectDeadStockLosses());
        leaks.addAll(detectDelayedManufacturingLosses());
        leaks.addAll(detectInventoryHoldingCosts());
        leaks.addAll(detectPriceErosion());

        leaks.forEach(profitLeakAlertRepository::save);

        return leaks.stream().map(this::formatLeak).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getPendingLeaks() {
        return profitLeakAlertRepository.findPendingLeaks().stream()
                .map(this::formatLeak).collect(Collectors.toList());
    }

    public Map<String, Object> getLeakSummary() {
        List<Map<String, Object>> leaks = getPendingLeaks();
        BigDecimal totalImpact = profitLeakAlertRepository.calculateTotalMonthlyImpact();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalLeaks", leaks.size());
        summary.put("totalMonthlyImpact", totalImpact != null ? totalImpact : BigDecimal.ZERO);
        summary.put("leaks", leaks);

        // Group by type
        Map<String, Long> byType = leaks.stream()
                .collect(Collectors.groupingBy(l -> (String) l.get("leakType"), Collectors.counting()));
        summary.put("byType", byType);
        return summary;
    }

    private List<ProfitLeakAlert> detectDeadStockLosses() {
        List<ProfitLeakAlert> result = new ArrayList<>();
        List<Map<String, Object>> deadStock = deadStockService.detectAndGetDeadStock();

        for (Map<String, Object> ds : deadStock) {
            double inventoryValue = Double.parseDouble(ds.get("inventoryValue").toString());
            if (inventoryValue < 1000) continue; // Only flag significant dead stock

            // Holding cost: ~2% of inventory value per month
            BigDecimal monthlyLoss = BigDecimal.valueOf(inventoryValue * 0.02);

            result.add(ProfitLeakAlert.builder()
                    .leakType("DEAD_STOCK_LOSS")
                    .productId(((Number) ds.get("productId")).longValue())
                    .estimatedMonthlyImpact(monthlyLoss)
                    .description("Product '" + ds.get("productName") + "' has been dead for "
                            + ds.get("daysSinceLastSale") + " days with ₹"
                            + String.format("%,.0f", inventoryValue) + " locked in inventory.")
                    .recommendedAction("Run clearance sale or discount campaign. Consider liquidating " + ds.get("recommendedAction") + ".")
                    .severityScore(Math.min(inventoryValue / 1000.0 * 10, 100))
                    .leakStatus("PENDING")
                    .createdAt(LocalDateTime.now())
                    .build());
        }
        return result;
    }

    private List<ProfitLeakAlert> detectDelayedManufacturingLosses() {
        List<ProfitLeakAlert> result = new ArrayList<>();
        List<ManufacturingOrder> delayed = moRepository.findAll().stream()
                .filter(mo -> mo.getStatus() == ManufacturingOrderStatus.CONFIRMED
                        || mo.getStatus() == ManufacturingOrderStatus.IN_PROGRESS)
                .collect(Collectors.toList());

        for (ManufacturingOrder mo : delayed) {
            double orderValue = mo.getFinishedProduct().getSalesPrice().doubleValue() * mo.getQuantity();
            if (orderValue < 5000) continue;

            BigDecimal dailyOpportunityCost = BigDecimal.valueOf(orderValue * 0.003);

            result.add(ProfitLeakAlert.builder()
                    .leakType("DELAYED_MANUFACTURING")
                    .productId(mo.getFinishedProduct().getId())
                    .estimatedMonthlyImpact(dailyOpportunityCost.multiply(BigDecimal.valueOf(30)))
                    .description("Manufacturing order " + mo.getRef() + " for '"
                            + mo.getFinishedProduct().getName() + "' is stalled. "
                            + "Order value: ₹" + String.format("%,.0f", orderValue) + ".")
                    .recommendedAction("Expedite MO " + mo.getRef() + ". Check component availability and work center capacity.")
                    .severityScore(Math.min(orderValue / 5000.0 * 20, 80))
                    .leakStatus("PENDING")
                    .createdAt(LocalDateTime.now())
                    .build());
        }
        return result;
    }

    private List<ProfitLeakAlert> detectInventoryHoldingCosts() {
        List<ProfitLeakAlert> result = new ArrayList<>();
        List<Product> overStock = productRepository.findAll().stream()
                .filter(p -> p.getOnHandQty() > 500)
                .collect(Collectors.toList());

        for (Product p : overStock) {
            double stockValue = p.getCostPrice().doubleValue() * p.getOnHandQty();
            BigDecimal holdingCost = BigDecimal.valueOf(stockValue * 0.018); // 1.8%/month holding cost

            if (holdingCost.doubleValue() < 500) continue;

            result.add(ProfitLeakAlert.builder()
                    .leakType("INVENTORY_HOLDING")
                    .productId(p.getId())
                    .estimatedMonthlyImpact(holdingCost)
                    .description("'" + p.getName() + "' has " + p.getOnHandQty()
                            + " units overstocked (value: ₹" + String.format("%,.0f", stockValue) + "). High holding costs.")
                    .recommendedAction("Reduce purchase quantity in next cycle. Consider just-in-time procurement.")
                    .severityScore(Math.min(stockValue / 10000.0 * 15, 60))
                    .leakStatus("PENDING")
                    .createdAt(LocalDateTime.now())
                    .build());
        }
        return result;
    }

    private List<ProfitLeakAlert> detectPriceErosion() {
        List<ProfitLeakAlert> result = new ArrayList<>();

        // Find products where sales price is less than 1.2x cost (below 20% margin)
        productRepository.findAll().stream()
                .filter(p -> p.getSalesPrice() != null && p.getCostPrice() != null)
                .filter(p -> {
                    double margin = (p.getSalesPrice().doubleValue() - p.getCostPrice().doubleValue())
                            / p.getSalesPrice().doubleValue();
                    return margin < 0.20 && p.getSalesPrice().doubleValue() > 0;
                })
                .forEach(p -> {
                    double margin = (p.getSalesPrice().doubleValue() - p.getCostPrice().doubleValue())
                            / p.getSalesPrice().doubleValue() * 100;
                    double totalSold = salesOrderRepository.findAll().stream()
                            .flatMap(so -> so.getLines().stream())
                            .filter(l -> l.getProduct().getId().equals(p.getId()))
                            .mapToDouble(l -> l.getOrderedQty())
                            .sum();
                    double lostMargin = (0.20 - margin / 100) * p.getSalesPrice().doubleValue() * totalSold;

                    if (lostMargin < 100) return;

                    result.add(ProfitLeakAlert.builder()
                            .leakType("PRICE_EROSION")
                            .productId(p.getId())
                            .estimatedMonthlyImpact(BigDecimal.valueOf(lostMargin / 12))
                            .description("'" + p.getName() + "' has only " + String.format("%.1f", margin)
                                    + "% margin (below 20% target). Cost: ₹"
                                    + p.getCostPrice() + " vs Sales: ₹" + p.getSalesPrice())
                            .recommendedAction("Renegotiate vendor cost or increase sales price to maintain ≥20% margin.")
                            .severityScore(Math.min((0.20 - margin / 100) * 500, 70))
                            .leakStatus("PENDING")
                            .createdAt(LocalDateTime.now())
                            .build());
                });

        return result;
    }

    private Map<String, Object> formatLeak(ProfitLeakAlert l) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("leakId", l.getId());
        map.put("leakType", l.getLeakType());
        map.put("productId", l.getProductId());
        map.put("estimatedMonthlyImpact", l.getEstimatedMonthlyImpact());
        map.put("description", l.getDescription());
        map.put("recommendedAction", l.getRecommendedAction());
        map.put("severityScore", Math.round(l.getSeverityScore()));
        map.put("leakStatus", l.getLeakStatus());
        return map;
    }
}
