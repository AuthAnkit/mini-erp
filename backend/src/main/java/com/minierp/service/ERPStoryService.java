package com.minierp.service;

import com.minierp.entity.*;
import com.minierp.enums.ManufacturingOrderStatus;
import com.minierp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Feature 13: ERP Story Generator
 * Generates natural-language business summaries for daily/weekly/monthly periods
 */
@Service
@RequiredArgsConstructor
public class ERPStoryService {

    private final BusinessStoryRepository storyRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final ManufacturingOrderRepository moRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    public Map<String, Object> generateStory(String periodType) {
        LocalDate today = LocalDate.now();
        LocalDate periodStart = switch (periodType.toUpperCase()) {
            case "WEEKLY"  -> today.minusDays(7);
            case "MONTHLY" -> today.withDayOfMonth(1);
            default        -> today.minusDays(1); // DAILY
        };

        LocalDateTime startDT = periodStart.atStartOfDay();

        // Revenue
        double revenue = salesOrderRepository.findAll().stream()
                .filter(so -> so.getCreationDate().isAfter(startDT))
                .flatMap(so -> so.getLines().stream())
                .mapToDouble(l -> l.getSalesPrice().doubleValue() * l.getOrderedQty())
                .sum();

        // Orders received
        int ordersReceived = (int) salesOrderRepository.findAll().stream()
                .filter(so -> so.getCreationDate().isAfter(startDT))
                .count();

        // MOs completed
        int moCompleted = (int) moRepository.findByStatus(ManufacturingOrderStatus.DONE).stream()
                .count();

        // Low stock count
        int lowStockCount = productRepository.findLowStockProducts().size()
                + productRepository.findCriticalStockProducts().size();

        // Top customer
        String topCustomerName = "N/A";
        Long topCustomerId = null;
        double topCustomerRevenue = 0;
        Map<Long, Double> customerRevMap = new HashMap<>();
        Map<Long, String> customerNameMap = new HashMap<>();
        salesOrderRepository.findAll().stream()
                .filter(so -> so.getCreationDate().isAfter(startDT))
                .forEach(so -> {
                    double rev = so.getLines().stream()
                            .mapToDouble(l -> l.getSalesPrice().doubleValue() * l.getOrderedQty()).sum();
                    customerRevMap.merge(so.getCustomer().getId(), rev, Double::sum);
                    customerNameMap.put(so.getCustomer().getId(), so.getCustomer().getName());
                });
        Optional<Map.Entry<Long, Double>> topCust = customerRevMap.entrySet().stream()
                .max(Map.Entry.comparingByValue());
        if (topCust.isPresent()) {
            topCustomerId   = topCust.get().getKey();
            topCustomerName = customerNameMap.get(topCustomerId);
            topCustomerRevenue = topCust.get().getValue();
        }

        // Top product
        String topProductName = "N/A";
        Long topProductId = null;
        double topProductRevenue = 0;
        Map<Long, Double> productRevMap = new HashMap<>();
        Map<Long, String> productNameMap = new HashMap<>();
        salesOrderRepository.findAll().stream()
                .filter(so -> so.getCreationDate().isAfter(startDT))
                .flatMap(so -> so.getLines().stream())
                .forEach(line -> {
                    double rev = line.getSalesPrice().doubleValue() * line.getOrderedQty();
                    productRevMap.merge(line.getProduct().getId(), rev, Double::sum);
                    productNameMap.put(line.getProduct().getId(), line.getProduct().getName());
                });
        Optional<Map.Entry<Long, Double>> topProd = productRevMap.entrySet().stream()
                .max(Map.Entry.comparingByValue());
        if (topProd.isPresent()) {
            topProductId      = topProd.get().getKey();
            topProductName    = productNameMap.get(topProductId);
            topProductRevenue = topProd.get().getValue();
        }

        // Revenue change vs previous period
        LocalDateTime prevStart = startDT.minusDays(periodType.equals("MONTHLY") ? 30 : periodType.equals("WEEKLY") ? 7 : 1);
        double prevRevenue = salesOrderRepository.findAll().stream()
                .filter(so -> so.getCreationDate().isAfter(prevStart) && so.getCreationDate().isBefore(startDT))
                .flatMap(so -> so.getLines().stream())
                .mapToDouble(l -> l.getSalesPrice().doubleValue() * l.getOrderedQty())
                .sum();
        double revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

        // Build the story narrative
        String storyContent = buildStoryNarrative(periodType, revenue, ordersReceived,
                moCompleted, lowStockCount, topCustomerName, topProductName, revenueChange, today);

        BusinessStory story = BusinessStory.builder()
                .storyDate(today)
                .periodType(periodType.toUpperCase())
                .storyContent(storyContent)
                .totalOrdersReceived(ordersReceived)
                .revenueGenerated(revenue)
                .revenueChange(revenueChange)
                .manufacturingOrdersCompleted(moCompleted)
                .lowStockAlerts(lowStockCount)
                .topCustomerId(topCustomerId)
                .topCustomerName(topCustomerName)
                .topCustomerRevenue(topCustomerRevenue)
                .topProductId(topProductId)
                .topProductName(topProductName)
                .topProductRevenue(topProductRevenue)
                .generatedAt(LocalDateTime.now())
                .build();

        storyRepository.save(story);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("periodType", periodType.toUpperCase());
        result.put("storyDate", today);
        result.put("storyContent", storyContent);
        result.put("metrics", Map.of(
                "revenue", Math.round(revenue * 100.0) / 100.0,
                "ordersReceived", ordersReceived,
                "moCompleted", moCompleted,
                "lowStockAlerts", lowStockCount,
                "revenueChange", Math.round(revenueChange * 10.0) / 10.0,
                "topCustomer", topCustomerName,
                "topProduct", topProductName
        ));
        result.put("generatedAt", story.getGeneratedAt());
        return result;
    }

    private String buildStoryNarrative(String period, double revenue, int orders,
                                        int moCompleted, int lowStock,
                                        String topCust, String topProd,
                                        double revenueChange, LocalDate today) {
        String periodLabel = switch (period.toUpperCase()) {
            case "WEEKLY"  -> "this week";
            case "MONTHLY" -> "this month (" + today.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH) + ")";
            default        -> "today";
        };

        String revTrend = revenueChange > 5  ? "📈 up " + String.format("%.1f", revenueChange) + "% from last period" :
                          revenueChange < -5 ? "📉 down " + String.format("%.1f", Math.abs(revenueChange)) + "% from last period" :
                          "➡️ stable compared to last period";

        String lowStockNote = lowStock == 0 ? "All products are well-stocked." :
                "⚠️ " + lowStock + " product(s) need restocking attention.";

        return "📊 **ERP Business Summary — " + periodLabel.substring(0,1).toUpperCase() + periodLabel.substring(1) + "**\n\n" +
               "Your business " + periodLabel + " generated **₹" + String.format("%,.2f", revenue) + "** in revenue — " + revTrend + ".\n\n" +
               "**Sales Activity:** " + orders + " sales order(s) were received.\n\n" +
               "**Top Customer:** " + (topCust.equals("N/A") ? "No sales this period." : topCust + " led with the highest order value.") + "\n\n" +
               "**Best-Selling Product:** " + (topProd.equals("N/A") ? "No product sales this period." : topProd + " generated the most revenue.") + "\n\n" +
               "**Manufacturing:** " + moCompleted + " manufacturing order(s) completed.\n\n" +
               "**Inventory:** " + lowStockNote + "\n\n" +
               "---\n*Report generated on " + today + " by ERP Intelligence Engine.*";
    }

    public List<Map<String, Object>> getRecentStories() {
        return storyRepository.findStoriesInDateRange(LocalDate.now().minusDays(30), LocalDate.now())
                .stream().map(s -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", s.getId());
                    map.put("storyDate", s.getStoryDate());
                    map.put("periodType", s.getPeriodType());
                    map.put("storyContent", s.getStoryContent());
                    map.put("revenue", s.getRevenueGenerated());
                    map.put("revenueChange", s.getRevenueChange());
                    map.put("ordersReceived", s.getTotalOrdersReceived());
                    map.put("topCustomer", s.getTopCustomerName());
                    map.put("topProduct", s.getTopProductName());
                    map.put("generatedAt", s.getGeneratedAt());
                    return map;
                }).collect(Collectors.toList());
    }
}
