package com.minierp.service;

import com.minierp.entity.*;
import com.minierp.enums.ManufacturingOrderStatus;
import com.minierp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Feature 6: Component Shortage Detection System
 * Scans manufacturing orders for insufficient component stock
 */
@Service
@RequiredArgsConstructor
public class ShortageDetectionService {

    private final ManufacturingOrderRepository moRepository;
    private final ShortageAlertRepository shortageAlertRepository;

    public List<Map<String, Object>> detectAndGetShortages() {
        // Clear old pending alerts
        shortageAlertRepository.findPendingAlerts().forEach(shortageAlertRepository::delete);

        // Scan all CONFIRMED/IN_PROGRESS MOs
        List<ManufacturingOrder> activeMOs = new ArrayList<>();
        activeMOs.addAll(moRepository.findByStatus(ManufacturingOrderStatus.CONFIRMED));
        activeMOs.addAll(moRepository.findByStatus(ManufacturingOrderStatus.IN_PROGRESS));

        List<ShortageAlert> alerts = new ArrayList<>();
        for (ManufacturingOrder mo : activeMOs) {
            for (MOComponent comp : mo.getComponents()) {
                Product product = comp.getProduct();
                double available = product.getFreeToUseQty();
                double required  = comp.getToConsumeQty();

                if (available < required) {
                    double shortage  = required - available;
                    String severity  = determineSeverity(available, required);

                    ShortageAlert alert = ShortageAlert.builder()
                            .manufacturingOrder(mo)
                            .componentProduct(product)
                            .requiredQuantity(required)
                            .availableQuantity(Math.max(available, 0))
                            .shortageQuantity(shortage)
                            .severity(severity)
                            .canBlockProduction(severity.equals("CRITICAL") || severity.equals("HIGH"))
                            .alertStatus("PENDING")
                            .createdAt(LocalDateTime.now())
                            .build();

                    alerts.add(shortageAlertRepository.save(alert));
                }
            }
        }

        return alerts.stream().map(this::formatAlert).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getPendingShortages() {
        return shortageAlertRepository.findPendingAlerts().stream()
                .map(this::formatAlert).collect(Collectors.toList());
    }

    private String determineSeverity(double available, double required) {
        double pct = available / required;
        if (pct <= 0)    return "CRITICAL";
        if (pct <= 0.25) return "HIGH";
        if (pct <= 0.5)  return "MEDIUM";
        return "LOW";
    }

    private Map<String, Object> formatAlert(ShortageAlert a) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("alertId", a.getId());
        map.put("moRef", a.getManufacturingOrder().getRef());
        map.put("moId", a.getManufacturingOrder().getId());
        map.put("componentName", a.getComponentProduct().getName());
        map.put("requiredQuantity", a.getRequiredQuantity());
        map.put("availableQuantity", a.getAvailableQuantity());
        map.put("shortageQuantity", a.getShortageQuantity());
        map.put("severity", a.getSeverity());
        map.put("canBlockProduction", a.getCanBlockProduction());
        map.put("alertStatus", a.getAlertStatus());
        return map;
    }
}
