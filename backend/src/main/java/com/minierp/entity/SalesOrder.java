package com.minierp.entity;

import com.minierp.enums.SalesOrderStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sales_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String ref;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    private String customerAddress;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sales_person_id")
    private User salesPerson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SalesOrderStatus status = SalesOrderStatus.DRAFT;

    private LocalDate scheduleDate;

    @Column(nullable = false)
    private LocalDateTime creationDate;

    @OneToMany(mappedBy = "salesOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SalesOrderLine> lines = new ArrayList<>();

    private String notes;

    @PrePersist
    protected void onCreate() {
        creationDate = LocalDateTime.now();
    }
}
