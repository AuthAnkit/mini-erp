package com.minierp.repository;

import com.minierp.entity.ProcurementRecommendation;
import com.minierp.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ProcurementRecommendationRepository extends JpaRepository<ProcurementRecommendation, Long> {
    
    @Query("SELECT pr FROM ProcurementRecommendation pr WHERE pr.recommendationStatus = 'PENDING' ORDER BY pr.urgencyLevel DESC, pr.daysUntilStockout ASC")
    List<ProcurementRecommendation> findPendingRecommendations();
    
    @Query("SELECT pr FROM ProcurementRecommendation pr WHERE pr.product.id = :productId ORDER BY pr.recommendationDate DESC")
    List<ProcurementRecommendation> findByProduct(@Param("productId") Long productId);
    
    @Query("SELECT pr FROM ProcurementRecommendation pr WHERE pr.urgencyLevel IN ('CRITICAL', 'HIGH') AND pr.recommendationStatus = 'PENDING'")
    List<ProcurementRecommendation> findCriticalRecommendations();
    
    @Query("SELECT pr FROM ProcurementRecommendation pr WHERE pr.recommendationDate = :date ORDER BY pr.urgencyLevel DESC")
    List<ProcurementRecommendation> findRecommendationsForDate(@Param("date") LocalDate date);
}
