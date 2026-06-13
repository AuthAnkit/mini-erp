package com.minierp.service;

import com.minierp.entity.*;
import com.minierp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Features 9 & 10: Customer Rankings and Product Rankings
 * Ranks customers and products by revenue generated
 */
@Service
@RequiredArgsConstructor
public class CustomerRankingService {

    private final SalesOrderRepository salesOrderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;

    public List<Map<String, Object>> getTopCustomers(int limit) {
        Map<Long, Double> revenueByCustomer = new LinkedHashMap<>();
        Map<Long, String> customerNames = new HashMap<>();
        Map<Long, Integer> orderCountByCustomer = new HashMap<>();

        salesOrderRepository.findAll().forEach(so -> {
            Long cid = so.getCustomer().getId();
            customerNames.put(cid, so.getCustomer().getName());

            double rev = so.getLines().stream()
                    .mapToDouble(l -> l.getSalesPrice().doubleValue() * l.getOrderedQty())
                    .sum();

            revenueByCustomer.merge(cid, rev, Double::sum);
            orderCountByCustomer.merge(cid, 1, Integer::sum);
        });

        List<Map<String, Object>> rankings = new ArrayList<>();
        int rank = 1;

        List<Map.Entry<Long, Double>> sorted = revenueByCustomer.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .limit(limit)
                .collect(Collectors.toList());

        double maxRevenue = sorted.isEmpty() ? 1.0 : sorted.get(0).getValue();

        for (Map.Entry<Long, Double> entry : sorted) {
            Long cid = entry.getKey();
            double revenue = entry.getValue();
            String tier = revenue > 500000 ? "VIP" : revenue > 100000 ? "REGULAR" : "NEW";

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("rank", rank++);
            item.put("customerId", cid);
            item.put("customerName", customerNames.get(cid));
            item.put("totalRevenue", Math.round(revenue * 100.0) / 100.0);
            item.put("orderCount", orderCountByCustomer.getOrDefault(cid, 0));
            item.put("tier", tier);
            item.put("revenueShare", Math.round((revenue / maxRevenue) * 100.0) / 100.0);
            rankings.add(item);
        }

        return rankings;
    }

    public List<Map<String, Object>> getTopProducts(int limit) {
        Map<Long, Double> revenueByProduct = new LinkedHashMap<>();
        Map<Long, String> productNames = new HashMap<>();
        Map<Long, Double> qtyByProduct = new HashMap<>();

        salesOrderRepository.findAll().forEach(so ->
            so.getLines().forEach(line -> {
                Long pid = line.getProduct().getId();
                productNames.put(pid, line.getProduct().getName());
                double rev = line.getSalesPrice().doubleValue() * line.getOrderedQty();
                revenueByProduct.merge(pid, rev, Double::sum);
                qtyByProduct.merge(pid, line.getOrderedQty(), Double::sum);
            })
        );

        List<Map<String, Object>> rankings = new ArrayList<>();
        int rank = 1;

        List<Map.Entry<Long, Double>> sorted = revenueByProduct.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .limit(limit)
                .collect(Collectors.toList());

        double totalRevenue = revenueByProduct.values().stream().mapToDouble(Double::doubleValue).sum();

        for (Map.Entry<Long, Double> entry : sorted) {
            Long pid = entry.getKey();
            double revenue = entry.getValue();

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("rank", rank++);
            item.put("productId", pid);
            item.put("productName", productNames.get(pid));
            item.put("totalRevenue", Math.round(revenue * 100.0) / 100.0);
            item.put("totalQtySold", Math.round(qtyByProduct.getOrDefault(pid, 0.0)));
            item.put("revenueShare", totalRevenue > 0
                    ? Math.round((revenue / totalRevenue) * 10000.0) / 100.0
                    : 0.0);

            // Enrich with product details
            productRepository.findById(pid).ifPresent(p -> {
                item.put("currentStock", p.getOnHandQty());
                item.put("salesPrice", p.getSalesPrice());
                item.put("category", p.getCategory() != null ? p.getCategory() : "Uncategorized");
            });

            rankings.add(item);
        }

        return rankings;
    }

    public Map<String, Object> getRankingsSummary() {
        List<Map<String, Object>> topCustomers = getTopCustomers(5);
        List<Map<String, Object>> topProducts  = getTopProducts(5);

        double totalRevenue = salesOrderRepository.findAll().stream()
                .flatMap(so -> so.getLines().stream())
                .mapToDouble(l -> l.getSalesPrice().doubleValue() * l.getOrderedQty())
                .sum();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalRevenue", Math.round(totalRevenue * 100.0) / 100.0);
        summary.put("totalCustomers", customerRepository.count());
        summary.put("totalProducts", productRepository.count());
        summary.put("topCustomers", topCustomers);
        summary.put("topProducts", topProducts);
        return summary;
    }
}
