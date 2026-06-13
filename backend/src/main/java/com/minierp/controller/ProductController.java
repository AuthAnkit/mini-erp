package com.minierp.controller;

import com.minierp.entity.*;
import com.minierp.enums.ProcurementMethod;
import com.minierp.repository.*;
import com.minierp.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final VendorRepository vendorRepository;

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        Product product = mapToProduct(body);
        return ResponseEntity.ok(productService.createProduct(product));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Product product = mapToProduct(body);
        return ResponseEntity.ok(productService.updateProduct(id, product));
    }

    @PostMapping("/{id}/bom/components")
    public ResponseEntity<?> addComponent(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long componentId = Long.valueOf(body.get("componentId").toString());
        Double qty = Double.valueOf(body.get("quantity").toString());
        String uom = body.getOrDefault("uom", "Units").toString();
        productService.addBomComponent(id, componentId, qty, uom);
        return ResponseEntity.ok(productService.getById(id));
    }

    @DeleteMapping("/{id}/bom/components/{componentId}")
    public ResponseEntity<?> removeComponent(@PathVariable Long id, @PathVariable Long componentId) {
        productService.removeBomComponent(id, componentId);
        return ResponseEntity.ok(productService.getById(id));
    }

    @GetMapping("/graph")
    public ResponseEntity<?> getFullGraph() {
        return ResponseEntity.ok(productService.buildFullGraph());
    }

    @GetMapping("/{id}/graph")
    public ResponseEntity<?> getProductGraph(@PathVariable Long id,
                                              @RequestParam(defaultValue = "5") int depth) {
        return ResponseEntity.ok(productService.buildGraph(id, depth));
    }

    @GetMapping("/{id}/simulate")
    public ResponseEntity<?> simulate(@PathVariable Long id,
                                       @RequestParam Double qty) {
        return ResponseEntity.ok(productService.simulate(id, qty));
    }

    // ── Helper: safe string extraction (empty string treated as null) ──────────
    private String str(Map<String, Object> body, String key) {
        Object val = body.get(key);
        if (val == null) return null;
        String s = val.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private Product mapToProduct(Map<String, Object> body) {
        Product p = new Product();

        // Required string fields
        String name = str(body, "name");
        if (name == null || name.isEmpty()) {
            throw new RuntimeException("Product name is required");
        }
        p.setName(name);

        // Optional string fields — treat empty as null
        String ref = str(body, "ref");
        if (ref != null) p.setRef(ref);

        String description = str(body, "description");
        if (description != null) p.setDescription(description);

        String category = str(body, "category");
        if (category != null) p.setCategory(category);

        // Numeric fields — safe parse with fallback
        try {
            Object sp = body.get("salesPrice");
            if (sp != null) p.setSalesPrice(new java.math.BigDecimal(sp.toString()));

            Object cp = body.get("costPrice");
            if (cp != null) p.setCostPrice(new java.math.BigDecimal(cp.toString()));

            Object oq = body.get("onHandQty");
            if (oq != null) p.setOnHandQty(Double.valueOf(oq.toString()));
        } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid number value for price or quantity: " + e.getMessage());
        }

        // Boolean field
        Object pod = body.get("procureOnDemand");
        if (pod != null) {
            p.setProcureOnDemand(Boolean.parseBoolean(pod.toString()));
        }

        // Enum field — only parse if non-empty string, silently skip empty/null
        String pm = str(body, "procurementMethod");
        if (pm != null) {
            try {
                p.setProcurementMethod(ProcurementMethod.valueOf(pm.toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid procurement method: '" + pm + "'. Must be PURCHASE or MANUFACTURING.");
            }
        }

        // Vendor FK — only if procurementMethod is PURCHASE
        Object vendorIdObj = body.get("vendorId");
        if (vendorIdObj != null) {
            try {
                Long vendorId = Long.valueOf(vendorIdObj.toString());
                if (vendorId > 0) {
                    vendorRepository.findById(vendorId).ifPresent(p::setVendor);
                }
            } catch (NumberFormatException e) {
                // ignore invalid vendorId silently
            }
        }

        return p;
    }
}
