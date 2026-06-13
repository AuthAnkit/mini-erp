package com.minierp.entity;

import com.minierp.enums.WorkOrderStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mo_work_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MOWorkOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manufacturing_order_id", nullable = false)
    private ManufacturingOrder manufacturingOrder;

    @Column(nullable = false)
    private String operation;

    @Column(nullable = false)
    private String workCenter;

    @Column(nullable = false)
    private Integer expectedDurationMinutes;

    private Integer realDurationMinutes;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private WorkOrderStatus status = WorkOrderStatus.PENDING;

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}
