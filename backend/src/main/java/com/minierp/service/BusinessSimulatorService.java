package com.minierp.service;

import com.minierp.entity.*;
import com.minierp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Feature 14: Business Simulator
 * Runs "what-if" simulation scenarios
 */
@Service
@RequiredArgsConstructor
public class BusinessSimulatorService {

    private final BusinessSimulationRepository simulationRepository;
    private final ProductRepository productRepository;
    private final SalesOrderRepository salesOrderRepository;

    public Map<String, Object> runSimulation(String scenarioType, Map<String, Object> params) {
        String name = "Sim: " + scenarioType + " " + LocalDateTime.now();
        String desc = "Simulating " + scenarioType + " with params: " + params.toString();

        double currentRevenue = calculateCurrentRevenue();
        double currentCosts = calculateCurrentCosts();
        double currentProfit = currentRevenue - currentCosts;
        
        double projectedRevenue = currentRevenue;
        double projectedCosts = currentCosts;

        if ("PRICE_CHANGE".equals(scenarioType)) {
            double percentChange = Double.parseDouble(params.getOrDefault("percentChange", "0").toString());
            projectedRevenue = currentRevenue * (1 + (percentChange / 100.0));
        } else if ("DEMAND_SHOCK".equals(scenarioType)) {
            double percentChange = Double.parseDouble(params.getOrDefault("percentChange", "0").toString());
            projectedRevenue = currentRevenue * (1 + (percentChange / 100.0));
            projectedCosts = currentCosts * (1 + (percentChange / 100.0) * 0.8); // Costs increase slightly less than demand
        } else if ("COST_INCREASE".equals(scenarioType)) {
            double percentChange = Double.parseDouble(params.getOrDefault("percentChange", "0").toString());
            projectedCosts = currentCosts * (1 + (percentChange / 100.0));
        }

        double projectedProfit = projectedRevenue - projectedCosts;
        double profitImpact = projectedProfit - currentProfit;

        String insight = buildInsight(scenarioType, profitImpact, projectedProfit, currentProfit);

        BusinessSimulation sim = BusinessSimulation.builder()
                .simulationName(name)
                .scenarioType(scenarioType)
                .description(desc)
                .parameters(params.toString())
                .projectedRevenue(projectedRevenue)
                .projectedCosts(projectedCosts)
                .projectedProfit(projectedProfit)
                .estimatedImpact(profitImpact)
                .aiInsights(insight)
                .simulationStatus("COMPLETED")
                .createdAt(LocalDateTime.now())
                .build();

        simulationRepository.save(sim);

        return formatSimulation(sim);
    }

    private double calculateCurrentRevenue() {
        return salesOrderRepository.findAll().stream()
                .flatMap(so -> so.getLines().stream())
                .mapToDouble(l -> l.getSalesPrice().doubleValue() * l.getOrderedQty())
                .sum();
    }

    private double calculateCurrentCosts() {
        return productRepository.findAll().stream()
                .mapToDouble(p -> p.getCostPrice().doubleValue() * p.getOnHandQty())
                .sum();
    }
    
    private String buildInsight(String type, double impact, double projProfit, double currProfit) {
        if (impact > 0) {
            return "This scenario is favorable. It could increase profit by ₹" + String.format("%,.2f", impact) + ".";
        } else if (impact < 0) {
            return "This scenario is risky. It could decrease profit by ₹" + String.format("%,.2f", Math.abs(impact)) + ".";
        } else {
            return "This scenario has no net impact on current profit.";
        }
    }

    public List<Map<String, Object>> getRecentSimulations() {
        return simulationRepository.findRecentSimulations().stream()
                .map(this::formatSimulation)
                .collect(Collectors.toList());
    }

    private Map<String, Object> formatSimulation(BusinessSimulation sim) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", sim.getId());
        map.put("name", sim.getSimulationName());
        map.put("scenarioType", sim.getScenarioType());
        map.put("description", sim.getDescription());
        map.put("projectedRevenue", sim.getProjectedRevenue());
        map.put("projectedCosts", sim.getProjectedCosts());
        map.put("projectedProfit", sim.getProjectedProfit());
        map.put("estimatedImpact", sim.getEstimatedImpact());
        map.put("aiInsights", sim.getAiInsights());
        map.put("createdAt", sim.getCreatedAt());
        return map;
    }
}
