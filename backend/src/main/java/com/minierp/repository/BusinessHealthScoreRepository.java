package com.minierp.repository;

import com.minierp.entity.BusinessHealthScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BusinessHealthScoreRepository extends JpaRepository<BusinessHealthScore, Long> {
    @Query("SELECT b FROM BusinessHealthScore b WHERE b.scoreDate BETWEEN :startDate AND :endDate ORDER BY b.scoreDate DESC")
    List<BusinessHealthScore> findScoresInDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
