package com.minierp.repository;

import com.minierp.entity.BusinessHealthScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BusinessHealthScoreRepository extends JpaRepository<BusinessHealthScore, Long> {
    
    Optional<BusinessHealthScore> findByScoreDate(LocalDate date);
    
    @Query("SELECT bhs FROM BusinessHealthScore bhs WHERE bhs.scoreDate BETWEEN :startDate AND :endDate ORDER BY bhs.scoreDate DESC")
    List<BusinessHealthScore> findScoresInDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT bhs FROM BusinessHealthScore bhs ORDER BY bhs.scoreDate DESC LIMIT 1")
    Optional<BusinessHealthScore> findLatestScore();
    
    @Query("SELECT bhs FROM BusinessHealthScore bhs WHERE bhs.healthStatus = :status ORDER BY bhs.scoreDate DESC")
    List<BusinessHealthScore> findByHealthStatus(@Param("status") String status);
}
