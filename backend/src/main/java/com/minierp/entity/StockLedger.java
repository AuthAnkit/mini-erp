package com.minierp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Stock Ledger — dedicated table tracking every inventory movement.
 * Every stock-in or stock-out event creates one ledger entry.
 * This gives a clean, queryable stock movement history separate from the audit log.
 */
@Entity
@Table(name = "stock_ledger")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private LocalDateTime dateTime;

    /**
     * Movement type: STOCK_IN (positive) or STOCK_OUT (negative)
     */
    @Column(nullable = false)
    private String movementType; // STOCK_IN, STOCK_OUT, ADJUSTMENT

    @Column(nullable = false)
    private Double quantity; // always positive

    @Column(nullable = false)
    private Double balanceBefore;

    @Column(nullable = false)
    private Double balanceAfter;

    /**
     * Source document — which order caused this movement
     */
    private String sourceType;  // SO, PO, MO, ADJUSTMENT
    private Long sourceId;
    private String sourceRef;

    private String notes;

    @PrePersist
    protected void onCreate() {
        if (dateTime == null) dateTime = LocalDateTime.now();
    }
}
