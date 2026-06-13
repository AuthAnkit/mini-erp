package com.minierp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Feature 2: Smart Procurement Advisor
 * Intelligent procurement recommendations based on consumption rates and stock levels
 */
@Entity
@Table(name = "procurement_recommendations", indexes = {
    @Index(name = "idx_product_status", columnList = "product_id,recommendation_status"),
    @Index(name = "idx_recommendation_date", columnList = "recommendation_date")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcurementRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vendor_id")
    private Vendor preferredVendor;

    @Column(nullable = false)
    private LocalDate recommendationDate;

    @Column(nullable = false)
    private Double currentStock;

    @Column(nullable = false)
    private Double averageDailyUsage;

    @Column(nullable = false)
    private Integer daysUntilStockout;

    @Column(nullable = false)
    private Double recommendedQuantity;

    @Column(nullable = false)
    private String urgencyLevel; // CRITICAL, HIGH, MEDIUM, LOW

    private Double estimatedDepletion; // days

    @Column(nullable = false)
    private String reason;

    @Column(nullable = false)
    private String recommendationStatus; // PENDING, APPROVED, REJECTED, EXECUTED

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
