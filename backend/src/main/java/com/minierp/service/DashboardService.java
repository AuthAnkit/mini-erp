package com.minierp.service;

import com.minierp.entity.*;
import com.minierp.enums.*;
import com.minierp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final SalesOrderRepository soRepository;
    private final PurchaseOrderRepository poRepository;
    private final ManufacturingOrderRepository moRepository;
    private final ProductRepository productRepository;

    public Map<String, Object> getDashboard() {
        Map<String, Object> dashboard = new HashMap<>();

        // Counts
        dashboard.put("totalSO", soRepository.count());
        dashboard.put("pendingSO", soRepository.countPending());
        dashboard.put("delayedSO", soRepository.countDelayed());
        dashboard.put("totalPO", poRepository.count());
        dashboard.put("pendingPO", poRepository.countPending());
        dashboard.put("activeMO", moRepository.countActive());
        dashboard.put("totalProducts", productRepository.count());

        // Critical stock
        List<Product> critical = productRepository.findCriticalStockProducts();
        List<Product> low = productRepository.findLowStockProducts();
        dashboard.put("criticalStockCount", critical.size());
        dashboard.put("lowStockCount", low.size());

        // Recent SOs
        List<SalesOrder> recentSOs = soRepository.findAll().stream()
                .sorted((a, b) -> b.getCreationDate().compareTo(a.getCreationDate()))
                .limit(5).toList();
        dashboard.put("recentSOs", recentSOs.stream().map(so -> Map.of(
                "ref", so.getRef(),
                "customer", so.getCustomer().getName(),
                "status", so.getStatus()
        )).toList());

        // Active MOs
        List<ManufacturingOrder> activeMOs = moRepository.findByStatus(ManufacturingOrderStatus.IN_PROGRESS);
        activeMOs.addAll(moRepository.findByStatus(ManufacturingOrderStatus.CONFIRMED));
        dashboard.put("activeMOs", activeMOs.stream().map(mo -> Map.of(
                "ref", mo.getRef(),
                "product", mo.getFinishedProduct().getName(),
                "qty", mo.getQuantity(),
                "status", mo.getStatus()
        )).toList());

        // Bottleneck analysis: work centers with efficiency data
        dashboard.put("bottlenecks", analyzeBottlenecks());

        // Stock summary for chart
        dashboard.put("stockSummary", productRepository.findAll().stream()
                .limit(10)
                .map(p -> Map.of(
                        "name", p.getName(),
                        "onHand", p.getOnHandQty(),
                        "reserved", p.getReservedQty(),
                        "freeToUse", p.getFreeToUseQty()
                )).toList());

        return dashboard;
    }

    private List<Map<String, Object>> analyzeBottlenecks() {
        // Analyze real vs expected durations by work center
        Map<String, List<Integer>> expected = new HashMap<>();
        Map<String, List<Integer>> real = new HashMap<>();

        moRepository.findAll().forEach(mo ->
            mo.getWorkOrders().stream()
                    .filter(wo -> wo.getRealDurationMinutes() != null)
                    .forEach(wo -> {
                        expected.computeIfAbsent(wo.getWorkCenter(), k -> new ArrayList<>())
                                .add(wo.getExpectedDurationMinutes());
                        real.computeIfAbsent(wo.getWorkCenter(), k -> new ArrayList<>())
                                .add(wo.getRealDurationMinutes());
                    })
        );

        List<Map<String, Object>> bottlenecks = new ArrayList<>();
        for (String wc : expected.keySet()) {
            List<Integer> exp = expected.get(wc);
            List<Integer> act = real.getOrDefault(wc, List.of());
            if (!act.isEmpty()) {
                double avgExp = exp.stream().mapToInt(i -> i).average().orElse(0);
                double avgAct = act.stream().mapToInt(i -> i).average().orElse(0);
                double efficiency = avgExp > 0 ? (avgAct / avgExp) * 100 : 100;
                bottlenecks.add(Map.of(
                        "workCenter", wc,
                        "avgExpected", Math.round(avgExp),
                        "avgActual", Math.round(avgAct),
                        "efficiencyPct", Math.round(efficiency),
                        "isBottleneck", efficiency > 120
                ));
            }
        }
        return bottlenecks;
    }
}
