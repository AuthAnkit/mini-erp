package com.minierp.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendStockUpdate(Long productId, String productName, Double oldQty, Double newQty, String reason) {
        messagingTemplate.convertAndSend("/topic/stock", Map.of(
                "type", "STOCK_UPDATE",
                "productId", productId,
                "productName", productName,
                "oldQty", oldQty,
                "newQty", newQty,
                "reason", reason,
                "timestamp", System.currentTimeMillis()
        ));
    }

    public void sendOrderUpdate(String orderType, String ref, String oldStatus, String newStatus) {
        messagingTemplate.convertAndSend("/topic/orders", Map.of(
                "type", "ORDER_UPDATE",
                "orderType", orderType,
                "ref", ref,
                "oldStatus", oldStatus,
                "newStatus", newStatus,
                "timestamp", System.currentTimeMillis()
        ));
    }

    public void sendProcurementTrigger(String message, Object data) {
        messagingTemplate.convertAndSend("/topic/procurement", Map.of(
                "type", "PROCUREMENT_TRIGGERED",
                "message", message,
                "data", data,
                "timestamp", System.currentTimeMillis()
        ));
    }

    public void sendDashboardRefresh() {
        messagingTemplate.convertAndSend("/topic/dashboard", Map.of(
                "type", "REFRESH",
                "timestamp", System.currentTimeMillis()
        ));
    }
}
