package com.minierp.entity;

import com.minierp.enums.ProcurementMethod;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String ref;

    @Column(nullable = false)
    private String name;

    private String description;
    private String category;

    @Column(nullable = false)
    private BigDecimal salesPrice;

    @Column(nullable = false)
    private BigDecimal costPrice;

    @Column(nullable = false)
    private Double onHandQty = 0.0;

    @Column(nullable = false)
    private Double reservedQty = 0.0;

    // procureOnDemand: whether to auto-trigger procurement on SO confirm
    private boolean procureOnDemand = false;

    @Enumerated(EnumType.STRING)
    private ProcurementMethod procurementMethod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Vendor vendor;

    // BoM components (this product IS the parent finished good)
    @OneToMany(mappedBy = "parentProduct", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BomComponent> bomComponents = new ArrayList<>();

    // BoM operations
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BomOperation> bomOperations = new ArrayList<>();

    // Computed: freeToUseQty = onHandQty - reservedQty
    @Transient
    public Double getFreeToUseQty() {
        return onHandQty - reservedQty;
    }

    @Transient
    public String getStockStatus() {
        double free = getFreeToUseQty();
        if (free <= 0) return "CRITICAL";
        if (free < onHandQty * 0.2) return "LOW";
        return "OK";
    }
}
