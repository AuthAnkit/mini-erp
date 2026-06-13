package com.minierp.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bom_operations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BomOperation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"bomComponents", "bomOperations", "hibernateLazyInitializer", "handler"})
    private Product product;

    @Column(nullable = false)
    private String operation;

    @Column(nullable = false)
    private String workCenter;

    @Column(nullable = false)
    private Integer expectedDurationMinutes;
}
