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
    private final SalesOrderLineRepository salesOrderLineRepository;
    private final StockLedgerRepository stockLedgerRepository;
    private final ProductRepository productRepository;

    /**
     * Generate demand forecast for a product
     */
    public DemandForecast generateDemandForecast(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Calculate sales trends
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        LocalDate ninetyDaysAgo = LocalDate.now().minusDays(90);

        double dailyAvgSales = calculateAverageDailySales(productId, 30);
        double weeklyAvgSales = calculateAverageWeeklySales(productId, 30);
        double monthlyAvgSales = calculateAverageMonthlySales(productId, 90);

        // Predict next month demand
        double predictedDemand = predictNextMonthDemand(dailyAvgSales, weeklyAvgSales, monthlyAvgSales);

        // Calculate trend
        double currentMonthSales = calculateAverageMonthlySales(productId, 30);
        double previousMonthSales = calculateAverageMonthlySales(productId, 60);
        double trendPercentage = calculateTrendPercentage(previousMonthSales, currentMonthSales);

        String trendDirection = trendPercentage > 5 ? "INCREASING" : 
                               trendPercentage < -5 ? "DECREASING" : "STABLE";

        // Determine confidence
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

    private double calculateAverageDailySales(Long productId, int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        return salesOrderLineRepository.findAll().stream()
                .filter(line -> line.getProduct().getId().equals(productId))
                .filter(line -> line.getSalesOrder().getCreationDate().isAfter(startDate))
                .mapToDouble(SalesOrderLine::getQuantity)
                .average()
                .orElse(0.0);
    }

    private double calculateAverageWeeklySales(Long productId, int days) {
        return calculateAverageDailySales(productId, days) * 7;
    }

    private double calculateAverageMonthlySales(Long productId, int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        return salesOrderLineRepository.findAll().stream()
                .filter(line -> line.getProduct().getId().equals(productId))
                .filter(line -> line.getSalesOrder().getCreationDate().isAfter(startDate))
                .mapToDouble(SalesOrderLine::getQuantity)
                .sum();
    }

    private double predictNextMonthDemand(double daily, double weekly, double monthly) {
        // Weight-based prediction: 30% daily, 30% weekly, 40% monthly average
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
        LocalDate sixMonthsAgo = LocalDate.now().minusMonths(6);
        List<SalesOrderLine> recentSales = salesOrderLineRepository.findAll().stream()
                .filter(line -> line.getProduct().getId().equals(productId))
                .filter(line -> line.getSalesOrder().getCreationDate().isAfter(sixMonthsAgo.atStartOfDay()))
                .collect(Collectors.toList());

        // Analyze monthly variance
        Map<Integer, Double> monthlySales = new HashMap<>();
        for (SalesOrderLine line : recentSales) {
            int month = line.getSalesOrder().getCreationDate().getMonthValue();
            monthlySales.put(month, monthlySales.getOrDefault(month, 0.0) + line.getQuantity());
        }

        if (monthlySales.isEmpty()) return "NO_DATA";

        double avgSales = monthlySales.values().stream().mapToDouble(Double::doubleValue).average().orElse(0);
        double maxSales = monthlySales.values().stream().mapToDouble(Double::doubleValue).max().orElse(0);
        double variance = maxSales / avgSales;

        if (variance > 2) return "HIGHLY_SEASONAL";
        if (variance > 1.5) return "SEASONAL";
        return "NON_SEASONAL";
    }

    /**
     * Get all products with increasing demand
     */
    public List<Map<String, Object>> getIncreasingDemandProducts() {
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        return demandForecastRepository.findProductsWithIncreasingDemand(thirtyDaysAgo, LocalDate.now())
                .stream()
                .map(this::formatForecastResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all products with decreasing demand
     */
    public List<Map<String, Object>> getDecreasingDemandProducts() {
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        return demandForecastRepository.findProductsWithDecreasingDemand(thirtyDaysAgo, LocalDate.now())
                .stream()
                .map(this::formatForecastResponse)
                .collect(Collectors.toList());
    }

    private Map<String, Object> formatForecastResponse(DemandForecast df) {
        return Map.of(
                "productId", df.getProduct().getId(),
                "productName", df.getProduct().getName(),
                "forecastDate", df.getForecastDate(),
                "predictedDemand", df.getPredictedDemand(),
                "confidencePercentage", df.getConfidencePercentage(),
                "trendPercentage", df.getTrendPercentage(),
                "trendDirection", df.getTrendDirection(),
                "monthlyAvgSales", df.getMonthlyAvgSales(),
                "seasonalityNote", df.getSeasonalityNote()
        );
    }
}
