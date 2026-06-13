package com.minierp.repository;

import com.minierp.entity.ShortageAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShortageAlertRepository extends JpaRepository<ShortageAlert, Long> {
    
    @Query("SELECT sa FROM ShortageAlert sa WHERE sa.alertStatus = 'PENDING' ORDER BY sa.severity DESC")
    List<ShortageAlert> findPendingAlerts();
    
    @Query("SELECT sa FROM ShortageAlert sa WHERE sa.manufacturingOrder.id = :moId ORDER BY sa.createdAt DESC")
    List<ShortageAlert> findAlertsForManufacturingOrder(@Param("moId") Long moId);
    
    @Query("SELECT sa FROM ShortageAlert sa WHERE sa.severity = 'CRITICAL' AND sa.alertStatus = 'PENDING'")
    List<ShortageAlert> findCriticalAlerts();
    
    @Query("SELECT sa FROM ShortageAlert sa WHERE sa.canBlockProduction = true AND sa.alertStatus = 'PENDING' ORDER BY sa.severity DESC")
    List<ShortageAlert> findProductionBlockingAlerts();
}
