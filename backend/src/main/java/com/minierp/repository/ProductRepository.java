package com.minierp.repository;

import com.minierp.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByRef(String ref);

    boolean existsByRef(String ref);

    List<Product> findByNameContainingIgnoreCase(String name);

    @Query("SELECT p FROM Product p WHERE p.onHandQty - p.reservedQty <= 0")
    List<Product> findCriticalStockProducts();

    @Query("SELECT p FROM Product p WHERE (p.onHandQty - p.reservedQty) < p.onHandQty * 0.2 AND p.onHandQty > 0")
    List<Product> findLowStockProducts();

    @Query("SELECT p from Product p WHERE p.onHandQty > 0")
    List<Product> findAvailableProducts();
}
