package com.minierp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Feature 11: Business Health Score
 * Comprehensive KPI representing overall business performance
 */
@Entity
@Table(name = "business_health_scores", indexes = {
    @Index(name = "idx_score_date", columnList = "score_date")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessHealthScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate scoreDate;

    @Column(nullable = false)
    private Integer overallScore; // 0-100

    @Column(nullable = false)
    private String healthStatus; // EXCELLENT, GOOD, FAIR, POOR, CRITICAL

    // Component scores (each 0-100)
    @Column(nullable = false)
    private Integer inventoryHealthScore;

    @Column(nullable = false)
    private Integer revenueGrowthScore;

    @Column(nullable = false)
    private Integer manufacturingEfficiencyScore;

    @Column(nullable = false)
    private Integer orderCompletionScore;

    @Column(nullable = false)
    private Integer procurementEfficiencyScore;

    @Column(nullable = false)
    private Integer stockAvailabilityScore;

    private String recommendations;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
