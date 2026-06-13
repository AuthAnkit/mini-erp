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

    private Product mapToProduct(Map<String, Object> body) {
        Product p = new Product();
        if (body.get("name") != null)
            p.setName(body.get("name").toString());
        if (body.get("ref") != null)
            p.setRef(body.get("ref").toString());
        if (body.get("description") != null)
            p.setDescription(body.get("description").toString());
        if (body.get("category") != null)
            p.setCategory(body.get("category").toString());
        if (body.get("salesPrice") != null)
            p.setSalesPrice(new java.math.BigDecimal(body.get("salesPrice").toString()));
        if (body.get("costPrice") != null)
            p.setCostPrice(new java.math.BigDecimal(body.get("costPrice").toString()));
        if (body.get("onHandQty") != null)
            p.setOnHandQty(Double.valueOf(body.get("onHandQty").toString()));
        if (body.get("procureOnDemand") != null)
            p.setProcureOnDemand(Boolean.parseBoolean(body.get("procureOnDemand").toString()));
        if (body.get("procurementMethod") != null)
            p.setProcurementMethod(ProcurementMethod.valueOf(body.get("procurementMethod").toString()));
        if (body.get("vendorId") != null) {
            Long vendorId = Long.valueOf(body.get("vendorId").toString());
            vendorRepository.findById(vendorId).ifPresent(p::setVendor);
        }
        return p;
    }
}
