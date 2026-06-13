package com.minierp.service;

import com.minierp.entity.*;
import com.minierp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final VendorRepository vendorRepository;
    private final AuditLogService auditLogService;

    private static final AtomicLong refCounter = new AtomicLong(1);

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));
    }

    @Transactional
    public Product createProduct(Product product) {
        if (product.getRef() == null || product.getRef().isEmpty()) {
            product.setRef(generateRef());
        }
        Product saved = productRepository.save(product);
        auditLogService.log("PRODUCT", "Product", saved.getId(), saved.getRef(),
                "CREATED", null, null, saved.getName(), "Product created: " + saved.getName());
        return saved;
    }

    @Transactional
    public Product updateProduct(Long id, Product updatedProduct) {
        Product existing = getById(id);
        String oldName = existing.getName();

        existing.setName(updatedProduct.getName());
        existing.setDescription(updatedProduct.getDescription());
        existing.setCategory(updatedProduct.getCategory());
        existing.setSalesPrice(updatedProduct.getSalesPrice());
        existing.setCostPrice(updatedProduct.getCostPrice());
        existing.setProcureOnDemand(updatedProduct.isProcureOnDemand());
        existing.setProcurementMethod(updatedProduct.getProcurementMethod());
        if (updatedProduct.getVendor() != null) {
            existing.setVendor(updatedProduct.getVendor());
        }

        Product saved = productRepository.save(existing);
        auditLogService.log("PRODUCT", "Product", saved.getId(), saved.getRef(),
                "UPDATED", "name", oldName, saved.getName(), "Product updated");
        return saved;
    }

    @Transactional
    public void addBomComponent(Long productId, Long componentId, Double qty, String uom) {
        Product parent = getById(productId);
        Product component = getById(componentId);

        // Prevent circular dependencies
        if (wouldCreateCircularDep(productId, componentId)) {
            throw new RuntimeException("Cannot add component: would create circular dependency");
        }

        BomComponent bc = BomComponent.builder()
                .parentProduct(parent)
                .componentProduct(component)
                .quantity(qty)
                .uom(uom != null ? uom : "Units")
                .build();

        parent.getBomComponents().add(bc);
        productRepository.save(parent);
        auditLogService.log("PRODUCT", "Product", productId, parent.getRef(),
                "BOM_UPDATED", "component_added", null, component.getName(),
                "Added component " + component.getName() + " x" + qty);
    }

    @Transactional
    public void removeBomComponent(Long productId, Long componentId) {
        Product parent = getById(productId);
        parent.getBomComponents().removeIf(bc ->
                bc.getComponentProduct().getId().equals(componentId));
        productRepository.save(parent);
    }

    /**
     * Build the full BoM graph for the Living Stock Graph visualization.
     * Returns nodes and edges recursively up to depth levels.
     */
    public Map<String, Object> buildGraph(Long rootProductId, int depth) {
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> edges = new ArrayList<>();
        Set<Long> visited = new HashSet<>();

        buildGraphRecursive(rootProductId, nodes, edges, visited, depth, 0);

        Map<String, Object> result = new HashMap<>();
        result.put("nodes", nodes);
        result.put("edges", edges);
        return result;
    }

    public Map<String, Object> buildFullGraph() {
        // Build graph for ALL products (showing all relationships)
        List<Product> allProducts = productRepository.findAll();
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> edges = new ArrayList<>();
        Set<Long> visitedNodes = new HashSet<>();
        Set<String> visitedEdges = new HashSet<>();

        for (Product p : allProducts) {
            if (!visitedNodes.contains(p.getId())) {
                nodes.add(buildNode(p));
                visitedNodes.add(p.getId());
            }
            for (BomComponent bc : p.getBomComponents()) {
                String edgeKey = p.getId() + "->" + bc.getComponentProduct().getId();
                if (!visitedEdges.contains(edgeKey)) {
                    edges.add(Map.of(
                            "id", "e" + edgeKey,
                            "source", String.valueOf(bc.getComponentProduct().getId()),
                            "target", String.valueOf(p.getId()),
                            "label", "×" + bc.getQuantity().intValue(),
                            "qty", bc.getQuantity(),
                            "uom", bc.getUom()
                    ));
                    visitedEdges.add(edgeKey);
                    Long cId = bc.getComponentProduct().getId();
                    if (!visitedNodes.contains(cId)) {
                        nodes.add(buildNode(bc.getComponentProduct()));
                        visitedNodes.add(cId);
                    }
                }
            }
        }

        return Map.of("nodes", nodes, "edges", edges);
    }

    /**
     * What-If Simulator: runs shortage calculation WITHOUT writing to DB.
     * Given a product and quantity, returns what procurement would be triggered.
     */
    public Map<String, Object> simulate(Long productId, Double orderQty) {
        Product product = getById(productId);
        List<Map<String, Object>> actions = new ArrayList<>();
        List<Map<String, Object>> stockImpact = new ArrayList<>();

        simulateRecursive(product, orderQty, actions, stockImpact, new HashSet<>(), 0);

        Map<String, Object> result = new HashMap<>();
        result.put("product", buildNode(product));
        result.put("orderQty", orderQty);
        result.put("currentStock", product.getOnHandQty());
        result.put("reservedQty", product.getReservedQty());
        result.put("freeToUseQty", product.getFreeToUseQty());

        double shortfall = orderQty - product.getFreeToUseQty();
        result.put("shortfall", Math.max(0, shortfall));
        result.put("canFulfillDirectly", shortfall <= 0);
        result.put("actions", actions);
        result.put("stockImpact", stockImpact);

        return result;
    }

    private void simulateRecursive(Product product, Double qtyNeeded,
                                   List<Map<String, Object>> actions,
                                   List<Map<String, Object>> stockImpact,
                                   Set<Long> visited, int depth) {
        if (depth > 5 || visited.contains(product.getId())) return;
        visited.add(product.getId());

        double free = product.getFreeToUseQty();
        double shortfall = qtyNeeded - free;

        Map<String, Object> impact = new HashMap<>();
        impact.put("productId", product.getId());
        impact.put("productName", product.getName());
        impact.put("productRef", product.getRef());
        impact.put("currentFree", free);
        impact.put("onHand", product.getOnHandQty());
        impact.put("qtyNeeded", qtyNeeded);
        impact.put("shortfall", Math.max(0, shortfall));
        impact.put("depth", depth);
        stockImpact.add(impact);

        if (shortfall > 0 && product.isProcureOnDemand()) {
            if (product.getProcurementMethod() != null) {
                Map<String, Object> action = new HashMap<>();
                action.put("type", product.getProcurementMethod().name());
                action.put("productName", product.getName());
                action.put("productId", product.getId());
                action.put("qty", shortfall);

                if (product.getProcurementMethod().name().equals("MANUFACTURING")) {
                    action.put("description", "Auto-create Manufacturing Order for " + shortfall + "x " + product.getName());
                    // Recursively check components
                    for (BomComponent bc : product.getBomComponents()) {
                        double componentQtyNeeded = bc.getQuantity() * shortfall;
                        simulateRecursive(bc.getComponentProduct(), componentQtyNeeded, actions, stockImpact, visited, depth + 1);
                    }

                    // Estimate duration from BoM operations
                    int totalMins = product.getBomOperations().stream()
                            .mapToInt(BomOperation::getExpectedDurationMinutes).sum();
                    action.put("estimatedDurationMinutes", (int)(totalMins * Math.ceil(shortfall)));
                } else {
                    action.put("description", "Auto-create Purchase Order for " + shortfall + "x " + product.getName());
                    if (product.getVendor() != null) {
                        action.put("vendorName", product.getVendor().getName());
                    }
                }
                actions.add(action);
            }
        }
    }

    private void buildGraphRecursive(Long productId, List<Map<String, Object>> nodes,
                                      List<Map<String, Object>> edges, Set<Long> visited,
                                      int maxDepth, int currentDepth) {
        if (currentDepth > maxDepth || visited.contains(productId)) return;
        visited.add(productId);

        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return;

        nodes.add(buildNode(product));

        for (BomComponent bc : product.getBomComponents()) {
            Long componentId = bc.getComponentProduct().getId();
            edges.add(Map.of(
                    "id", "e" + componentId + "-" + productId,
                    "source", String.valueOf(componentId),
                    "target", String.valueOf(productId),
                    "label", "×" + bc.getQuantity().intValue(),
                    "qty", bc.getQuantity()
            ));
            buildGraphRecursive(componentId, nodes, edges, visited, maxDepth, currentDepth + 1);
        }
    }

    private Map<String, Object> buildNode(Product p) {
        Map<String, Object> node = new HashMap<>();
        node.put("id", String.valueOf(p.getId()));
        node.put("productId", p.getId());
        node.put("ref", p.getRef());
        node.put("name", p.getName());
        node.put("onHandQty", p.getOnHandQty());
        node.put("reservedQty", p.getReservedQty());
        node.put("freeToUseQty", p.getFreeToUseQty());
        node.put("stockStatus", p.getStockStatus());
        node.put("procureOnDemand", p.isProcureOnDemand());
        node.put("procurementMethod", p.getProcurementMethod());
        node.put("hasBom", !p.getBomComponents().isEmpty());
        node.put("salesPrice", p.getSalesPrice());
        node.put("category", p.getCategory());
        return node;
    }

    private boolean wouldCreateCircularDep(Long parentId, Long componentId) {
        if (parentId.equals(componentId)) return true;
        Product component = productRepository.findById(componentId).orElse(null);
        if (component == null) return false;
        for (BomComponent bc : component.getBomComponents()) {
            if (wouldCreateCircularDep(parentId, bc.getComponentProduct().getId())) return true;
        }
        return false;
    }

    private String generateRef() {
        return String.format("PRD-%05d", refCounter.getAndIncrement());
    }
}
