package com.minierp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Feature 1: Demand Prediction Engine
 * Stores historical sales trends and future demand predictions for each product
 */
@Entity
@Table(name = "demand_forecasts", indexes = {
    @Index(name = "idx_product_date", columnList = "product_id,forecast_date"),
    @Index(name = "idx_forecast_date", columnList = "forecast_date")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandForecast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private LocalDate forecastDate;

    @Column(nullable = false)
    private Double dailyAvgSales;

    @Column(nullable = false)
    private Double weeklyAvgSales;

    @Column(nullable = false)
    private Double monthlyAvgSales;

    @Column(nullable = false)
    private Double predictedDemand;

    @Column(nullable = false)
    private Integer confidencePercentage;

    private Double trendPercentage; // growth or decline %

    @Column(nullable = false)
    private String trendDirection; // INCREASING, DECREASING, STABLE

    private String seasonalityNote;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
