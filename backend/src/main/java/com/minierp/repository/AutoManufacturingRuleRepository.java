package com.minierp.repository;

import com.minierp.entity.AutoManufacturingRule;
import com.minierp.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AutoManufacturingRuleRepository extends JpaRepository<AutoManufacturingRule, Long> {
    
    Optional<AutoManufacturingRule> findByProduct(Product product);
    
    @Query("SELECT amr FROM AutoManufacturingRule amr WHERE amr.isActive = true")
    List<AutoManufacturingRule> findActiveRules();
    
    @Query("SELECT amr FROM AutoManufacturingRule amr WHERE amr.isActive = true AND amr.product.onHandQty < amr.triggerStockLevel")
    List<AutoManufacturingRule> findTriggeredRules();
}
