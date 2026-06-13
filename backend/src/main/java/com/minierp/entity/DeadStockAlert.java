package com.minierp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Feature 8: Dead Stock Detection Engine
 * Identifies products that haven't been sold for extended periods
 */
@Entity
@Table(name = "dead_stock_alerts", indexes = {
    @Index(name = "idx_product_last_sale", columnList = "product_id,last_sale_date"),
    @Index(name = "idx_alert_status", columnList = "alert_status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeadStockAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private LocalDate lastSaleDate;

    @Column(nullable = false)
    private Integer daysSinceLastSale;

    @Column(nullable = false)
    private Double currentOnHandQty;

    @Column(nullable = false)
    private Double inventoryValue; // onHandQty * costPrice

    @Column(nullable = false)
    private String deadStockReason; // NO_DEMAND, OBSOLETE, OVERSTOCK

    @Column(nullable = false)
    private String recommendedAction; // DISCOUNT, CLEARANCE, DONATION, DESTROY

    @Column(nullable = false)
    private String alertStatus; // PENDING, ACTED_UPON, RESOLVED

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
