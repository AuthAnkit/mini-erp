package com.minierp.repository;

import com.minierp.entity.DeadStockAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DeadStockAlertRepository extends JpaRepository<DeadStockAlert, Long> {
    
    @Query("SELECT dsa FROM DeadStockAlert dsa WHERE dsa.alertStatus = 'PENDING' ORDER BY dsa.daysSinceLastSale DESC")
    List<DeadStockAlert> findPendingAlerts();
    
    @Query("SELECT dsa FROM DeadStockAlert dsa WHERE dsa.daysSinceLastSale > :days AND dsa.alertStatus = 'PENDING'")
    List<DeadStockAlert> findDeadStockOlderThan(@Param("days") Integer days);
    
    @Query("SELECT dsa FROM DeadStockAlert dsa WHERE dsa.daysSinceLastSale > 120 AND dsa.alertStatus = 'PENDING' ORDER BY dsa.inventoryValue DESC")
    List<DeadStockAlert> findHighValueDeadStock();
    
    @Query("SELECT dsa FROM DeadStockAlert dsa WHERE dsa.lastSaleDate < :date AND dsa.alertStatus = 'PENDING'")
    List<DeadStockAlert> findDeadStockBeforeDate(@Param("date") LocalDate date);
}
