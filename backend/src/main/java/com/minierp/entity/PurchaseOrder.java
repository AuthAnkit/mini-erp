package com.minierp.entity;

import com.minierp.enums.PurchaseOrderStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "purchase_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String ref;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    private String vendorAddress;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "responsible_person_id")
    private User responsiblePerson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PurchaseOrderStatus status = PurchaseOrderStatus.DRAFT;

    private LocalDate scheduleDate;

    @Column(nullable = false)
    private LocalDateTime creationDate;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PurchaseOrderLine> lines = new ArrayList<>();

    // Track which SO triggered this (for traceability)
    private Long triggeredBySoId;
    private String notes;

    @PrePersist
    protected void onCreate() {
        creationDate = LocalDateTime.now();
    }
}
