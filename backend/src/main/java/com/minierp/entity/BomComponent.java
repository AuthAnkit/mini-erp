package com.minierp.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bom_components")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BomComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The finished product this component belongs to
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_product_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"bomComponents", "bomOperations", "hibernateLazyInitializer", "handler"})
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Product parentProduct;

    // The component product (can itself have a BoM - multi-level!)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "component_product_id", nullable = false)
    private Product componentProduct;

    @Column(nullable = false)
    private Double quantity;

    private String uom = "Units";

    /**
     * finishedQty: how many finished units this BoM produces per run.
     * Spec requirement: BOM(id, ref, finishedProductId, finishedQty)
     * Default 1.0 — one run produces one unit of the finished product.
     */
    private Double finishedQty = 1.0;
}
