package com.minierp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Feature 5: Auto Manufacturing Engine
 * Rules for automatic manufacturing order creation when shortages are detected
 */
@Entity
@Table(name = "auto_manufacturing_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AutoManufacturingRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(nullable = false)
    private Double triggerStockLevel; // auto-create MO when stock goes below this

    @Column(nullable = false)
    private Double manufacturingQuantity; // quantity to manufacture

    @Column(nullable = false)
    private Double safetyStock; // minimum stock to maintain

    @Column(nullable = false)
    private Integer leadTimeDays; // expected manufacturing lead time

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
