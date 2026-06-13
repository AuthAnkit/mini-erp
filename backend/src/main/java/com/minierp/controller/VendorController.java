package com.minierp.controller;

import com.minierp.entity.Vendor;
import com.minierp.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
public class VendorController {
    private final VendorRepository vendorRepository;

    @GetMapping
    public ResponseEntity<?> getAll() { return ResponseEntity.ok(vendorRepository.findAll()); }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Vendor vendor) {
        return ResponseEntity.ok(vendorRepository.save(vendor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Vendor vendor) {
        vendor.setId(id);
        return ResponseEntity.ok(vendorRepository.save(vendor));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        vendorRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
