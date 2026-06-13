package com.minierp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime dateTime;

    private Long userId;
    private String userName;

    @Column(nullable = false)
    private String module;

    @Column(nullable = false)
    private String recordType;

    private Long recordId;
    private String recordRef;

    @Column(nullable = false)
    private String action;

    private String fieldChanged;

    @Column(length = 1000)
    private String oldValue;

    @Column(length = 1000)
    private String newValue;

    @Column(length = 2000)
    private String details;
}
