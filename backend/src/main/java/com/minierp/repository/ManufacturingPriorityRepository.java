package com.minierp.repository;

import com.minierp.entity.ManufacturingPriority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ManufacturingPriorityRepository extends JpaRepository<ManufacturingPriority, Long> {
    
    @Query("SELECT mp FROM ManufacturingPriority mp ORDER BY mp.priorityRank ASC")
    List<ManufacturingPriority> findRankedManufacturingOrders();
    
    @Query("SELECT mp FROM ManufacturingPriority mp WHERE mp.status = 'PENDING' ORDER BY mp.priorityRank ASC")
    List<ManufacturingPriority> findPendingInPriorityOrder();
    
    @Query("SELECT mp FROM ManufacturingPriority mp WHERE mp.priorityLevel = :level ORDER BY mp.priorityScore DESC")
    List<ManufacturingPriority> findByPriorityLevel(@Param("level") String level);
}
