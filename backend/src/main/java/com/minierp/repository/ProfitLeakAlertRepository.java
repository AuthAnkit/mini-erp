package com.minierp.repository;

import com.minierp.entity.ProfitLeakAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProfitLeakAlertRepository extends JpaRepository<ProfitLeakAlert, Long> {
    
    @Query("SELECT pla FROM ProfitLeakAlert pla WHERE pla.leakStatus = 'PENDING' ORDER BY pla.severityScore DESC")
    List<ProfitLeakAlert> findPendingLeaks();
    
    @Query("SELECT pla FROM ProfitLeakAlert pla ORDER BY pla.estimatedMonthlyImpact DESC")
    List<ProfitLeakAlert> findMostImpactfulLeaks();
    
    @Query("SELECT pla FROM ProfitLeakAlert pla WHERE pla.leakType = :type AND pla.leakStatus = 'PENDING'")
    List<ProfitLeakAlert> findByLeakType(@Param("type") String type);
    
    @Query("SELECT SUM(pla.estimatedMonthlyImpact) FROM ProfitLeakAlert pla WHERE pla.leakStatus = 'PENDING'")
    BigDecimal calculateTotalMonthlyImpact();
}
