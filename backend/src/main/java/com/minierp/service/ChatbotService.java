package com.minierp.service;

import com.minierp.entity.*;
import com.minierp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Feature 4: AI Business Assistant Chatbot
 * Rule-based NLP chatbot that answers ERP questions from live data
 */
@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final ProductRepository productRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ManufacturingOrderRepository manufacturingOrderRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    public Map<String, Object> chat(String question, Long userId) {
        String q = question.toLowerCase().trim();
        String answer;
        String queryType = detectQueryType(q);

        try {
            answer = generateAnswer(q, queryType);
        } catch (Exception e) {
            answer = "I encountered an issue processing your question. Please try rephrasing.";
        }

        // Persist chat
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            ChatMessage msg = ChatMessage.builder()
                    .user(user)
                    .userQuestion(question)
                    .aiResponse(answer)
                    .queryType(queryType)
                    .responseType("DIRECT_ANSWER")
                    .createdAt(LocalDateTime.now())
                    .build();
            chatMessageRepository.save(msg);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("question", question);
        result.put("answer", answer);
        result.put("queryType", queryType);
        result.put("timestamp", LocalDateTime.now().toString());
        return result;
    }

    private String detectQueryType(String q) {
        if (q.contains("stock") || q.contains("inventory") || q.contains("product")) return "INVENTORY";
        if (q.contains("sale") || q.contains("order") || q.contains("revenue") || q.contains("customer")) return "SALES";
        if (q.contains("manufactur") || q.contains("production") || q.contains("mo")) return "MANUFACTURING";
        if (q.contains("purchase") || q.contains("vendor") || q.contains("supplier") || q.contains("po")) return "PROCUREMENT";
        return "GENERAL";
    }

    private String generateAnswer(String q, String queryType) {
        // --- INVENTORY ---
        if (q.contains("low stock") || q.contains("critical stock")) {
            List<Product> critical = productRepository.findCriticalStockProducts();
            List<Product> low      = productRepository.findLowStockProducts();
            if (critical.isEmpty() && low.isEmpty())
                return "✅ Great news! All products are at healthy stock levels. No critical or low stock items detected.";
            StringBuilder sb = new StringBuilder("⚠️ Stock Alert Summary:\n");
            if (!critical.isEmpty()) {
                sb.append("\n🔴 CRITICAL (out of stock):\n");
                critical.forEach(p -> sb.append("• ").append(p.getName()).append(" — ").append(p.getOnHandQty()).append(" units\n"));
            }
            if (!low.isEmpty()) {
                sb.append("\n🟡 LOW STOCK:\n");
                low.forEach(p -> sb.append("• ").append(p.getName()).append(" — ").append(p.getOnHandQty()).append(" units\n"));
            }
            return sb.toString();
        }

        if (q.contains("total product") || q.contains("how many product")) {
            long total = productRepository.count();
            return "📦 There are currently **" + total + " products** in the system.";
        }

        if (q.contains("stock") && (q.contains("of") || q.contains("for"))) {
            // Try to find a product name in the question
            return productRepository.findAll().stream()
                    .filter(p -> q.contains(p.getName().toLowerCase()))
                    .findFirst()
                    .map(p -> "📦 **" + p.getName() + "**\n• On Hand: " + p.getOnHandQty()
                            + " units\n• Reserved: " + p.getReservedQty()
                            + " units\n• Free to Use: " + p.getFreeToUseQty() + " units")
                    .orElse("I couldn't find a specific product matching your query. Try: \"What is the stock of Wooden Table?\"");
        }

        // --- SALES ---
        if (q.contains("top customer") || q.contains("best customer")) {
            Map<String, Double> customerRevenue = new HashMap<>();
            salesOrderRepository.findAll().forEach(so -> {
                double rev = so.getLines().stream()
                        .mapToDouble(l -> l.getSalesPrice().doubleValue() * l.getOrderedQty()).sum();
                customerRevenue.merge(so.getCustomer().getName(), rev, Double::sum);
            });
            if (customerRevenue.isEmpty()) return "No sales data available yet.";
            String top = customerRevenue.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(e -> e.getKey() + " with ₹" + String.format("%,.0f", e.getValue()) + " total revenue")
                    .orElse("N/A");
            return "🏆 Your top customer is **" + top + "**.";
        }

        if (q.contains("total revenue") || q.contains("total sales") || q.contains("how much revenue")) {
            double total = salesOrderRepository.findAll().stream()
                    .flatMap(so -> so.getLines().stream())
                    .mapToDouble(l -> l.getSalesPrice().doubleValue() * l.getOrderedQty()).sum();
            return "💰 Total revenue from all sales orders: **₹" + String.format("%,.2f", total) + "**";
        }

        if (q.contains("open order") || q.contains("pending order") || q.contains("how many order")) {
            long pending = salesOrderRepository.countPending();
            long delayed = salesOrderRepository.countDelayed();
            return "📋 You have **" + pending + " pending sales orders**, of which **" + delayed + " are delayed**.";
        }

        // --- MANUFACTURING ---
        if (q.contains("active manufactur") || q.contains("running manufactur") || q.contains("production")) {
            List<ManufacturingOrder> active = manufacturingOrderRepository.findByStatus(
                    com.minierp.enums.ManufacturingOrderStatus.IN_PROGRESS);
            if (active.isEmpty()) return "🏭 No manufacturing orders are currently in progress.";
            StringBuilder sb = new StringBuilder("🏭 **" + active.size() + " active manufacturing orders:**\n");
            active.forEach(mo -> sb.append("• ").append(mo.getRef()).append(" — ")
                    .append(mo.getQuantity()).append("x ").append(mo.getFinishedProduct().getName()).append("\n"));
            return sb.toString();
        }

        // --- PROCUREMENT ---
        if (q.contains("open purchase") || q.contains("pending purchase") || q.contains("purchase order")) {
            long pending = purchaseOrderRepository.countPending();
            return "🛒 There are **" + pending + " pending purchase orders** awaiting action.";
        }

        // --- GENERAL HELP ---
        if (q.contains("help") || q.contains("what can you") || q.contains("what do you")) {
            return "👋 I can answer ERP questions like:\n\n" +
                   "• \"What products are low on stock?\"\n" +
                   "• \"Who is my top customer?\"\n" +
                   "• \"What is the total revenue?\"\n" +
                   "• \"How many open orders do I have?\"\n" +
                   "• \"What manufacturing orders are active?\"\n" +
                   "• \"How many pending purchase orders?\"\n\n" +
                   "Just ask me naturally!";
        }

        return "🤔 I'm not sure I understood that. Try asking about stock levels, revenue, customers, orders, or manufacturing. Type **help** to see what I can answer.";
    }

    public List<Map<String, Object>> getChatHistory(Long userId) {
        return chatMessageRepository.findChatHistoryByUser(userId).stream()
                .limit(50)
                .map(m -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("id", m.getId());
                    map.put("question", m.getUserQuestion());
                    map.put("answer", m.getAiResponse());
                    map.put("queryType", m.getQueryType());
                    map.put("timestamp", m.getCreatedAt());
                    return map;
                })
                .collect(Collectors.toList());
    }
}
