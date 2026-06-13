package com.minierp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Feature 4: AI Business Assistant Chatbot
 * Stores conversation history for the ERP AI assistant
 */
@Entity
@Table(name = "chat_messages", indexes = {
    @Index(name = "idx_user_timestamp", columnList = "user_id,created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String userQuestion;

    @Column(columnDefinition = "TEXT")
    private String aiResponse;

    @Column(nullable = false)
    private String queryType; // INVENTORY, SALES, MANUFACTURING, CUSTOMER, REVENUE, GENERAL

    @Column(nullable = false)
    private String responseType; // DIRECT_ANSWER, QUERY_RESULT, RECOMMENDATION

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
