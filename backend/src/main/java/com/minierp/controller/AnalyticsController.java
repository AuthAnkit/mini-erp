package com.minierp.controller;

import com.minierp.service.*;
import com.minierp.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final DemandPredictionService demandPredictionService;
    private final SmartProcurementService smartProcurementService;
    private final ChatbotService chatbotService;
    private final AutoManufacturingService autoManufacturingService;
    private final ShortageDetectionService shortageDetectionService;
    private final InventoryHeatMapService inventoryHeatMapService;
    private final DeadStockService deadStockService;
    private final CustomerRankingService customerRankingService;
    private final BusinessHealthScoreService businessHealthScoreService;
    private final ProfitLeakDetectorService profitLeakDetectorService;
    private final ERPStoryService erpStoryService;
    private final BusinessSimulatorService businessSimulatorService;
    private final ManufacturingPriorityService manufacturingPriorityService;

    // Feature 1: Demand Forecasts
    @GetMapping("/demand-forecasts")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'SALES', 'INVENTORY')")
    public ResponseEntity<List<Map<String, Object>>> getDemandForecasts() {
        return ResponseEntity.ok(demandPredictionService.generateForecastsForAllProducts());
    }

    // Feature 3: Manufacturing Priority
    @GetMapping("/manufacturing-priority")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'MANUFACTURING')")
    public ResponseEntity<List<Map<String, Object>>> getManufacturingPriority() {
        manufacturingPriorityService.calculatePrioritiesForAllOrders();
        return ResponseEntity.ok(manufacturingPriorityService.getRankedManufacturingOrders());
    }

    // Feature 2: Smart Procurement
    @GetMapping("/procurement-recommendations")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'PURCHASE')")
    public ResponseEntity<List<Map<String, Object>>> getProcurementRecommendations() {
        smartProcurementService.generateProcurementRecommendations();
        return ResponseEntity.ok(smartProcurementService.getPendingRecommendations());
    }

    @PostMapping("/procurement-recommendations/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'PURCHASE')")
    public ResponseEntity<Void> approveProcurementRecommendation(@PathVariable Long id) {
        smartProcurementService.approveProcurementRecommendation(id);
        return ResponseEntity.ok().build();
    }

    // Feature 4: Chatbot
    @PostMapping("/chat")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody Map<String, String> payload) {
        UserDetailsImpl ud = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String question = payload.get("question");
        return ResponseEntity.ok(chatbotService.chat(question, ud.getId()));
    }

    @GetMapping("/chat/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<List<Map<String, Object>>> getChatHistory() {
        UserDetailsImpl ud = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(chatbotService.getChatHistory(ud.getId()));
    }

    // Feature 5: Auto Manufacturing
    @PostMapping("/auto-manufacturing/rules")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'MANUFACTURING')")
    public ResponseEntity<Map<String, Object>> createAutoMfgRule(@RequestBody Map<String, Object> payload) {
        Long productId = ((Number) payload.get("productId")).longValue();
        Double triggerStock = ((Number) payload.get("triggerStockLevel")).doubleValue();
        Double mfgQty = ((Number) payload.get("manufacturingQuantity")).doubleValue();
        Double safetyStock = payload.containsKey("safetyStock") ? ((Number) payload.get("safetyStock")).doubleValue() : 0.0;
        Integer leadTimeDays = payload.containsKey("leadTimeDays") ? ((Number) payload.get("leadTimeDays")).intValue() : 0;
        
        autoManufacturingService.createRule(productId, triggerStock, mfgQty, safetyStock, leadTimeDays);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/auto-manufacturing/rules")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'MANUFACTURING')")
    public ResponseEntity<List<Map<String, Object>>> getAutoMfgRules() {
        return ResponseEntity.ok(autoManufacturingService.getAllRules());
    }

    @PostMapping("/auto-manufacturing/trigger")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'MANUFACTURING')")
    public ResponseEntity<List<Map<String, Object>>> triggerAutoMfg() {
        return ResponseEntity.ok(autoManufacturingService.triggerAutoManufacturing());
    }

    // Feature 6: Shortage Alerts
    @GetMapping("/shortage-alerts")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'MANUFACTURING', 'INVENTORY')")
    public ResponseEntity<List<Map<String, Object>>> getShortageAlerts() {
        return ResponseEntity.ok(shortageDetectionService.detectAndGetShortages());
    }

    // Feature 7: Inventory Heat Map
    @GetMapping("/inventory-heatmap")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'INVENTORY')")
    public ResponseEntity<Map<String, Object>> getInventoryHeatMap() {
        return ResponseEntity.ok(inventoryHeatMapService.getInventoryHeatMapData());
    }

    // Feature 8: Dead Stock
    @GetMapping("/dead-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER', 'INVENTORY')")
    public ResponseEntity<List<Map<String, Object>>> getDeadStock() {
        return ResponseEntity.ok(deadStockService.detectAndGetDeadStock());
    }

    // Feature 9 & 10: Rankings
    @GetMapping("/rankings")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Map<String, Object>> getRankings() {
        return ResponseEntity.ok(customerRankingService.getRankingsSummary());
    }

    // Feature 11: Business Health Score
    @GetMapping("/health-score")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Map<String, Object>> getHealthScore() {
        return ResponseEntity.ok(businessHealthScoreService.computeAndGetHealthScore());
    }

    // Feature 12: Profit Leaks
    @GetMapping("/profit-leaks")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Map<String, Object>> getProfitLeaks() {
        profitLeakDetectorService.detectAndGetProfitLeaks();
        return ResponseEntity.ok(profitLeakDetectorService.getLeakSummary());
    }

    // Feature 13: ERP Story
    @GetMapping("/stories")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<List<Map<String, Object>>> getStories() {
        return ResponseEntity.ok(erpStoryService.getRecentStories());
    }

    @PostMapping("/stories/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Map<String, Object>> generateStory(@RequestBody Map<String, String> payload) {
        String periodType = payload.getOrDefault("periodType", "DAILY");
        return ResponseEntity.ok(erpStoryService.generateStory(periodType));
    }

    // Feature 14: Simulator
    @GetMapping("/simulations")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<List<Map<String, Object>>> getSimulations() {
        return ResponseEntity.ok(businessSimulatorService.getRecentSimulations());
    }

    @PostMapping("/simulations")
    @PreAuthorize("hasAnyRole('ADMIN', 'OWNER')")
    public ResponseEntity<Map<String, Object>> runSimulation(@RequestBody Map<String, Object> payload) {
        String scenarioType = (String) payload.get("scenarioType");
        @SuppressWarnings("unchecked")
        Map<String, Object> params = (Map<String, Object>) payload.getOrDefault("parameters", Map.of());
        return ResponseEntity.ok(businessSimulatorService.runSimulation(scenarioType, params));
    }
}
