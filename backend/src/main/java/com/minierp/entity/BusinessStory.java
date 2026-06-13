package com.minierp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Feature 13: ERP Story Generator
 * Automated business summary reports generated daily/weekly/monthly
 */
@Entity
@Table(name = "business_stories", indexes = {
    @Index(name = "idx_story_date", columnList = "story_date"),
    @Index(name = "idx_story_period_type", columnList = "period_type")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessStory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate storyDate;

    @Column(nullable = false)
    private String periodType; // DAILY, WEEKLY, MONTHLY

    @Column(columnDefinition = "TEXT", nullable = false)
    private String storyContent;

    @Column(nullable = false)
    private Integer totalOrdersReceived;

    @Column(nullable = false)
    private Double revenueGenerated;

    @Column(nullable = false)
    private Double revenueChange; // % change vs previous period

    @Column(nullable = false)
    private Integer manufacturingOrdersCompleted;

    @Column(nullable = false)
    private Integer lowStockAlerts;

    private Long topCustomerId;

    private String topCustomerName;

    private Double topCustomerRevenue;

    private Long topProductId;

    private String topProductName;

    private Double topProductRevenue;

    @Column(nullable = false)
    private LocalDateTime generatedAt;

    @PrePersist
    protected void onCreate() {
        generatedAt = LocalDateTime.now();
    }
}
