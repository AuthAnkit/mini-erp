package com.minierp.entity;

import com.minierp.enums.ManufacturingOrderStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "manufacturing_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManufacturingOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String ref;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "finished_product_id", nullable = false)
    private Product finishedProduct;

    @Column(nullable = false)
    private Double quantity;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ManufacturingOrderStatus status = ManufacturingOrderStatus.DRAFT;

    private LocalDate scheduleDate;

    @Column(nullable = false)
    private LocalDateTime creationDate;

    @OneToMany(mappedBy = "manufacturingOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MOComponent> components = new ArrayList<>();

    @OneToMany(mappedBy = "manufacturingOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MOWorkOrder> workOrders = new ArrayList<>();

    // Traceability: which SO triggered this?
    private Long triggeredBySoId;
    private String notes;

    @PrePersist
    protected void onCreate() {
        creationDate = LocalDateTime.now();
    }
}
