package com.minierp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Feature 14: Business Simulation Engine
 * Stores simulation scenarios and results for future prediction
 */
@Entity
@Table(name = "business_simulations", indexes = {
    @Index(name = "idx_simulation_date", columnList = "created_at"),
    @Index(name = "idx_simulation_status", columnList = "simulation_status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusinessSimulation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String simulationName;

    @Column(columnDefinition = "TEXT")
    private String description;

    // Simulation inputs
    @Column(nullable = false)
    private Double salesGrowthPercentage;

    @Column(nullable = false)
    private Double demandSpikePercentage;

    @Column(nullable = false)
    private Integer simulationDays;

    // Simulation results
    @Column(columnDefinition = "TEXT")
    private String resultsSummary;

    @Column(nullable = false)
    private BigDecimal projectedRevenue;

    @Column(nullable = false)
    private Double projectedInventoryNeeded;

    @Column(nullable = false)
    private Integer projectedManufacturingCapacityNeeded;

    @Column(nullable = false)
    private Double stockoutRiskDays;

    @Column(columnDefinition = "TEXT")
    private String recommendations;

    @Column(nullable = false)
    private String simulationStatus; // DRAFT, EXECUTED, COMPLETED, ARCHIVED

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
