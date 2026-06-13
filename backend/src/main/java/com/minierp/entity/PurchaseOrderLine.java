package com.minierp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "purchase_order_lines")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrderLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Double orderedQty;

    @Builder.Default
    private Double receivedQty = 0.0;

    @Column(nullable = false)
    private BigDecimal costPrice;

    // Stored total column (spec requirement: PurchaseOrderLine has total field)
    private BigDecimal total = BigDecimal.ZERO;

    @Transient
    public BigDecimal computedTotal() {
        return costPrice != null && orderedQty != null
                ? costPrice.multiply(BigDecimal.valueOf(orderedQty))
                : BigDecimal.ZERO;
    }
}
