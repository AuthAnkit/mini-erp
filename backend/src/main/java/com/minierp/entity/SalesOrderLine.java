package com.minierp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "sales_order_lines")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesOrderLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_order_id", nullable = false)
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Double orderedQty;

    @Builder.Default
    private Double deliveredQty = 0.0;

    @Column(nullable = false)
    private BigDecimal salesPrice;

    // Stored total column (spec requirement: SalesOrderLine has total field)
    private BigDecimal total = BigDecimal.ZERO;

    @Transient
    public BigDecimal computedTotal() {
        return salesPrice != null && orderedQty != null
                ? salesPrice.multiply(BigDecimal.valueOf(orderedQty))
                : BigDecimal.ZERO;
    }

    @Transient
    public Double getRemainingQty() {
        return orderedQty - deliveredQty;
    }
}
