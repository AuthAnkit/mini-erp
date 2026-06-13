package com.minierp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Feature 12: Profit Leak Detector
 * Identifies hidden losses in the business
 */
@Entity
@Table(name = "profit_leak_alerts", indexes = {
    @Index(name = "idx_leak_type", columnList = "leak_type"),
    @Index(name = "idx_leak_status", columnList = "leak_status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfitLeakAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String leakType; // EXPENSIVE_VENDOR, DEAD_STOCK_LOSS, DELAYED_MANUFACTURING, INVENTORY_HOLDING, PRICE_EROSION

    private Long vendorId;
    private Long productId;

    @Column(nullable = false)
    private BigDecimal estimatedMonthlyImpact;

    @Column(nullable = false)
    private String description;

    @Column(columnDefinition = "TEXT")
    private String recommendedAction;

    @Column(nullable = false)
    private Double severityScore; // 0-100

    @Column(nullable = false)
    private String leakStatus; // PENDING, ACKNOWLEDGED, IN_PROGRESS, RESOLVED

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
