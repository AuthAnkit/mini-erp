package com.minierp.service;

import com.minierp.entity.Product;
import com.minierp.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Feature 7: Inventory Heat Map
 * Returns stock intensity data for visual heat map rendering
 */
@Service
@RequiredArgsConstructor
public class InventoryHeatMapService {

    private final ProductRepository productRepository;

    public Map<String, Object> getInventoryHeatMapData() {
        List<Product> products = productRepository.findAll();

        double maxOnHand = products.stream().mapToDouble(Product::getOnHandQty).max().orElse(1);

        List<Map<String, Object>> heatItems = products.stream()
                .map(p -> {
                    double freeToUse = p.getFreeToUseQty();
                    double intensity  = maxOnHand > 0 ? p.getOnHandQty() / maxOnHand : 0;
                    String heatLevel  = determineHeatLevel(p);
                    String status     = p.getStockStatus();

                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("productId",    p.getId());
                    item.put("productName",  p.getName());
                    item.put("category",     p.getCategory() != null ? p.getCategory() : "Uncategorized");
                    item.put("onHand",       p.getOnHandQty());
                    item.put("reserved",     p.getReservedQty());
                    item.put("freeToUse",    Math.max(freeToUse, 0));
                    item.put("intensity",    Math.round(intensity * 100.0) / 100.0);
                    item.put("heatLevel",    heatLevel);
                    item.put("stockStatus",  status);
                    item.put("salesPrice",   p.getSalesPrice());
                    item.put("stockValue",   p.getCostPrice().doubleValue() * p.getOnHandQty());
                    return item;
                })
                .sorted(Comparator.comparingDouble((Map<String, Object> m) -> (double) m.get("onHand")).reversed())
                .collect(Collectors.toList());

        // Category summary
        Map<String, DoubleSummaryStatistics> byCat = products.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getCategory() != null ? p.getCategory() : "Uncategorized",
                        Collectors.summarizingDouble(Product::getOnHandQty)
                ));

        List<Map<String, Object>> categorySummary = byCat.entrySet().stream()
                .map(e -> {
                    Map<String, Object> cat = new LinkedHashMap<>();
                    cat.put("category", e.getKey());
                    cat.put("totalStock", e.getValue().getSum());
                    cat.put("productCount", e.getValue().getCount());
                    cat.put("avgStock", Math.round(e.getValue().getAverage() * 10.0) / 10.0);
                    return cat;
                })
                .sorted(Comparator.comparingDouble((Map<String, Object> m) -> (double) m.get("totalStock")).reversed())
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("heatMap", heatItems);
        result.put("categorySummary", categorySummary);
        result.put("totalProducts", products.size());
        result.put("criticalCount", products.stream().filter(p -> "CRITICAL".equals(p.getStockStatus())).count());
        result.put("lowCount", products.stream().filter(p -> "LOW".equals(p.getStockStatus())).count());
        result.put("okCount", products.stream().filter(p -> "OK".equals(p.getStockStatus())).count());
        return result;
    }

    private String determineHeatLevel(Product p) {
        double free = p.getFreeToUseQty();
        if (free <= 0)               return "NONE";
        if (free < p.getOnHandQty() * 0.1) return "VERY_LOW";
        if (free < p.getOnHandQty() * 0.3) return "LOW";
        if (free < p.getOnHandQty() * 0.6) return "MEDIUM";
        if (free < p.getOnHandQty() * 0.85) return "HIGH";
        return "VERY_HIGH";
    }
}
