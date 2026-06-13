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
 * Feature 1: Demand Prediction Engine
 * Analyzes historical sales data and predicts future demand
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DemandPredictionService {

    private final DemandForecastRepository demandForecastRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final StockLedgerRepository stockLedgerRepository;
    private final ProductRepository productRepository;

    public DemandForecast generateDemandForecast(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        double dailyAvgSales   = calculateAverageDailySales(productId, 30);
        double weeklyAvgSales  = calculateAverageWeeklySales(productId, 30);
        double monthlyAvgSales = calculateAverageMonthlySales(productId, 90);

        double predictedDemand = predictNextMonthDemand(dailyAvgSales, weeklyAvgSales, monthlyAvgSales);

        double currentMonthSales  = calculateAverageMonthlySales(productId, 30);
        double previousMonthSales = calculateAverageMonthlySales(productId, 60);
        double trendPercentage    = calculateTrendPercentage(previousMonthSales, currentMonthSales);

        String trendDirection = trendPercentage > 5 ? "INCREASING" :
                                trendPercentage < -5 ? "DECREASING" : "STABLE";

        int confidencePercentage = calculateConfidence(dailyAvgSales, monthlyAvgSales);

        DemandForecast forecast = DemandForecast.builder()
                .product(product)
                .forecastDate(LocalDate.now().plusMonths(1))
                .dailyAvgSales(dailyAvgSales)
                .weeklyAvgSales(weeklyAvgSales)
                .monthlyAvgSales(monthlyAvgSales)
                .predictedDemand(predictedDemand)
                .confidencePercentage(confidencePercentage)
                .trendPercentage(trendPercentage)
                .trendDirection(trendDirection)
                .seasonalityNote(detectSeasonality(productId))
                .createdAt(LocalDateTime.now())
                .build();

        return demandForecastRepository.save(forecast);
    }

    private List<SalesOrderLine> getLinesForProduct(Long productId, LocalDateTime since) {
        return salesOrderRepository.findAll().stream()
                .filter(so -> so.getCreationDate().isAfter(since))
                .flatMap(so -> so.getLines().stream())
                .filter(line -> line.getProduct().getId().equals(productId))
                .collect(Collectors.toList());
    }

    private double calculateAverageDailySales(Long productId, int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        List<SalesOrderLine> lines = getLinesForProduct(productId, startDate);
        return lines.stream().mapToDouble(SalesOrderLine::getOrderedQty).average().orElse(0.0);
    }

    private double calculateAverageWeeklySales(Long productId, int days) {
        return calculateAverageDailySales(productId, days) * 7;
    }

    private double calculateAverageMonthlySales(Long productId, int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        List<SalesOrderLine> lines = getLinesForProduct(productId, startDate);
        return lines.stream().mapToDouble(SalesOrderLine::getOrderedQty).sum();
    }

    private double predictNextMonthDemand(double daily, double weekly, double monthly) {
        return (daily * 30 * 0.3) + (weekly * 4.3 * 0.3) + (monthly * 0.4);
    }

    private double calculateTrendPercentage(double previousMonth, double currentMonth) {
        if (previousMonth == 0) return currentMonth > 0 ? 100 : 0;
        return ((currentMonth - previousMonth) / previousMonth) * 100;
    }

    private int calculateConfidence(double dailyAvg, double monthlyAvg) {
        if (monthlyAvg == 0) return 50;
        double variance = Math.abs(dailyAvg * 30 - monthlyAvg) / monthlyAvg;
        if (variance < 0.1) return 95;
        if (variance < 0.2) return 85;
        if (variance < 0.3) return 75;
        return 60;
    }

    private String detectSeasonality(Long productId) {
        LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6);
        List<SalesOrderLine> recentSales = getLinesForProduct(productId, sixMonthsAgo);

        Map<Integer, Double> monthlySales = new HashMap<>();
        for (SalesOrderLine line : recentSales) {
            int month = line.getSalesOrder().getCreationDate().getMonthValue();
            monthlySales.merge(month, line.getOrderedQty(), Double::sum);
        }

        if (monthlySales.isEmpty()) return "NO_DATA";

        double avgSales = monthlySales.values().stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double maxSales = monthlySales.values().stream().mapToDouble(Double::doubleValue).max().orElse(0);
        double variance = avgSales > 0 ? maxSales / avgSales : 1;

        if (variance > 2) return "HIGHLY_SEASONAL";
        if (variance > 1.5) return "SEASONAL";
        return "NON_SEASONAL";
    }

    public List<Map<String, Object>> generateForecastsForAllProducts() {
        return productRepository.findAll().stream()
                .map(p -> formatForecastResponse(generateDemandForecast(p.getId())))
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getIncreasingDemandProducts() {
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        return demandForecastRepository.findProductsWithIncreasingDemand(thirtyDaysAgo, LocalDate.now())
                .stream().map(this::formatForecastResponse).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getDecreasingDemandProducts() {
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        return demandForecastRepository.findProductsWithDecreasingDemand(thirtyDaysAgo, LocalDate.now())
                .stream().map(this::formatForecastResponse).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getAllForecasts() {
        return demandForecastRepository.findAll().stream()
                .sorted(Comparator.comparing(DemandForecast::getCreatedAt).reversed())
                .map(this::formatForecastResponse)
                .collect(Collectors.toList());
    }

    private Map<String, Object> formatForecastResponse(DemandForecast df) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("productId", df.getProduct().getId());
        map.put("productName", df.getProduct().getName());
        map.put("forecastDate", df.getForecastDate());
        map.put("predictedDemand", Math.round(df.getPredictedDemand() * 10.0) / 10.0);
        map.put("confidencePercentage", df.getConfidencePercentage());
        map.put("trendPercentage", Math.round(df.getTrendPercentage() != null ? df.getTrendPercentage() * 10.0 : 0) / 10.0);
        map.put("trendDirection", df.getTrendDirection());
        map.put("monthlyAvgSales", Math.round(df.getMonthlyAvgSales() * 10.0) / 10.0);
        map.put("dailyAvgSales", Math.round(df.getDailyAvgSales() * 10.0) / 10.0);
        map.put("seasonalityNote", df.getSeasonalityNote());
        return map;
    }
}
