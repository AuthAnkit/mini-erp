package com.minierp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Feature 6: Component Shortage Detection System
 * Alerts when manufacturing components are insufficient
 */
@Entity
@Table(name = "shortage_alerts", indexes = {
    @Index(name = "idx_mo_alert_status", columnList = "manufacturing_order_id,alert_status"),
    @Index(name = "idx_alert_created", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShortageAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "manufacturing_order_id", nullable = false)
    private ManufacturingOrder manufacturingOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "component_product_id", nullable = false)
    private Product componentProduct;

    @Column(nullable = false)
    private Double requiredQuantity;

    @Column(nullable = false)
    private Double availableQuantity;

    @Column(nullable = false)
    private Double shortageQuantity;

    @Column(nullable = false)
    private String severity; // CRITICAL, HIGH, MEDIUM, LOW

    @Column(nullable = false)
    private Boolean canBlockProduction = true;

    @Column(nullable = false)
    private String alertStatus; // PENDING, RESOLVED, IGNORED

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
