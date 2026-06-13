package com.minierp.repository;

import com.minierp.entity.BusinessStory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BusinessStoryRepository extends JpaRepository<BusinessStory, Long> {
    
    Optional<BusinessStory> findByStoryDateAndPeriodType(LocalDate date, String periodType);
    
    @Query("SELECT bs FROM BusinessStory bs WHERE bs.periodType = :periodType ORDER BY bs.storyDate DESC LIMIT 1")
    Optional<BusinessStory> findLatestStory(@Param("periodType") String periodType);
    
    @Query("SELECT bs FROM BusinessStory bs WHERE bs.storyDate BETWEEN :startDate AND :endDate ORDER BY bs.storyDate DESC")
    List<BusinessStory> findStoriesInDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT bs FROM BusinessStory bs WHERE bs.periodType = :periodType ORDER BY bs.storyDate DESC")
    List<BusinessStory> findByPeriodType(@Param("periodType") String periodType);
}
