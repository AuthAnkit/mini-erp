package com.minierp.repository;

import com.minierp.entity.DemandForecast;
import com.minierp.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DemandForecastRepository extends JpaRepository<DemandForecast, Long> {
    
    List<DemandForecast> findByProductOrderByForecastDateDesc(Product product);
    
    @Query("SELECT df FROM DemandForecast df WHERE df.product.id = :productId AND df.forecastDate = :date")
    Optional<DemandForecast> findLatestForecast(@Param("productId") Long productId, @Param("date") LocalDate date);
    
    @Query("SELECT df FROM DemandForecast df WHERE df.forecastDate BETWEEN :startDate AND :endDate ORDER BY df.trendPercentage DESC")
    List<DemandForecast> findIncreasingDemandProducts(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT df FROM DemandForecast df WHERE df.forecastDate BETWEEN :startDate AND :endDate AND df.trendDirection = 'INCREASING' ORDER BY df.trendPercentage DESC")
    List<DemandForecast> findProductsWithIncreasingDemand(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT df FROM DemandForecast df WHERE df.forecastDate BETWEEN :startDate AND :endDate AND df.trendDirection = 'DECREASING' ORDER BY df.trendPercentage ASC")
    List<DemandForecast> findProductsWithDecreasingDemand(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
