package com.minierp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Feature 3: Manufacturing Priority Engine
 * Determines manufacturing order priority based on urgency, order value, and customer importance
 */
@Entity
@Table(name = "manufacturing_priorities", indexes = {
    @Index(name = "idx_mo_priority_score", columnList = "manufacturing_order_id,priority_score"),
    @Index(name = "idx_priority_rank", columnList = "priority_rank")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManufacturingPriority {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "manufacturing_order_id", nullable = false, unique = true)
    private ManufacturingOrder manufacturingOrder;

    @Column(nullable = false)
    private Integer priorityRank;

    @Column(nullable = false)
    private Double priorityScore; // 0-100

    @Column(nullable = false)
    private Integer urgencyScore; // based on delivery deadline

    @Column(nullable = false)
    private BigDecimal orderValue;

    @Column(nullable = false)
    private Integer customerImportanceScore; // VIP, Regular, New customer

    @Column(nullable = false)
    private Integer componentAvailabilityScore; // % of components available

    @Column(nullable = false)
    private String priorityLevel; // CRITICAL, HIGH, NORMAL, LOW

    @Column(nullable = false)
    private String status; // PENDING, IN_PROGRESS, COMPLETED, CANCELLED

    @Column(nullable = false)
    private LocalDateTime calculatedAt;

    @PrePersist
    protected void onCreate() {
        calculatedAt = LocalDateTime.now();
    }
}
