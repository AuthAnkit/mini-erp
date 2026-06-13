package com.minierp.entity;

import com.minierp.enums.ComponentAvailability;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mo_components")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MOComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manufacturing_order_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private ManufacturingOrder manufacturingOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Double toConsumeQty;

    @Builder.Default
    private Double consumedQty = 0.0;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ComponentAvailability availability = ComponentAvailability.NOT_AVAILABLE;
}
