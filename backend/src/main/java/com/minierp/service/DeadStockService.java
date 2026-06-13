package com.minierp.service;

import com.minierp.entity.*;
import com.minierp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Feature 8: Dead Stock Detection Engine
 * Identifies products with no recent sales activity and high on-hand quantities
 */
@Service
@RequiredArgsConstructor
public class DeadStockService {

    private final ProductRepository productRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final DeadStockAlertRepository deadStockAlertRepository;

    private static final int DEAD_STOCK_THRESHOLD_DAYS = 60;

    public List<Map<String, Object>> detectAndGetDeadStock() {
        // Clear old pending alerts
        deadStockAlertRepository.findPendingAlerts().forEach(deadStockAlertRepository::delete);

        // Build a map of productId -> last sale date
        Map<Long, LocalDate> lastSaleDates = new HashMap<>();
        salesOrderRepository.findAll().forEach(so -> {
            LocalDate saleDate = so.getCreationDate().toLocalDate();
            so.getLines().forEach(line -> {
                Long pid = line.getProduct().getId();
                lastSaleDates.merge(pid, saleDate, (a, b) -> a.isAfter(b) ? a : b);
            });
        });

        List<DeadStockAlert> alerts = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (Product p : productRepository.findAll()) {
            if (p.getOnHandQty() <= 0) continue;

            LocalDate lastSale = lastSaleDates.get(p.getId());
            int daysSinceSale;

            if (lastSale == null) {
                daysSinceSale = 365; // Never sold
                lastSale = today.minusYears(1);
            } else {
                daysSinceSale = (int) ChronoUnit.DAYS.between(lastSale, today);
            }

            if (daysSinceSale >= DEAD_STOCK_THRESHOLD_DAYS) {
                String reason = lastSaleDates.get(p.getId()) == null ? "NO_DEMAND" :
                               daysSinceSale > 180 ? "OBSOLETE" : "OVERSTOCK";
                String action = determineAction(daysSinceSale, p.getOnHandQty());

                DeadStockAlert alert = DeadStockAlert.builder()
                        .product(p)
                        .lastSaleDate(lastSale)
                        .daysSinceLastSale(daysSinceSale)
                        .currentOnHandQty(p.getOnHandQty())
                        .inventoryValue(p.getCostPrice().doubleValue() * p.getOnHandQty())
                        .deadStockReason(reason)
                        .recommendedAction(action)
                        .alertStatus("PENDING")
                        .createdAt(LocalDateTime.now())
                        .build();

                alerts.add(deadStockAlertRepository.save(alert));
            }
        }

        return alerts.stream().map(this::formatAlert).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getPendingDeadStock() {
        return deadStockAlertRepository.findPendingAlerts().stream()
                .map(this::formatAlert).collect(Collectors.toList());
    }

    private String determineAction(int days, double qty) {
        if (days > 180) return "CLEARANCE";
        if (days > 120) return "DISCOUNT";
        if (qty > 100)  return "DISCOUNT";
        return "MONITOR";
    }

    private Map<String, Object> formatAlert(DeadStockAlert a) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("alertId", a.getId());
        map.put("productId", a.getProduct().getId());
        map.put("productName", a.getProduct().getName());
        map.put("lastSaleDate", a.getLastSaleDate());
        map.put("daysSinceLastSale", a.getDaysSinceLastSale());
        map.put("currentOnHandQty", a.getCurrentOnHandQty());
        map.put("inventoryValue", String.format("%.2f", a.getInventoryValue()));
        map.put("deadStockReason", a.getDeadStockReason());
        map.put("recommendedAction", a.getRecommendedAction());
        map.put("alertStatus", a.getAlertStatus());
        return map;
    }
}
