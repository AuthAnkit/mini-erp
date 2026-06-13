package com.minierp.repository;

import com.minierp.entity.BusinessSimulation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusinessSimulationRepository extends JpaRepository<BusinessSimulation, Long> {
    
    @Query("SELECT bs FROM BusinessSimulation bs WHERE bs.simulationStatus = 'COMPLETED' ORDER BY bs.createdAt DESC")
    List<BusinessSimulation> findCompletedSimulations();
    
    @Query("SELECT bs FROM BusinessSimulation bs WHERE bs.simulationStatus = :status ORDER BY bs.createdAt DESC")
    List<BusinessSimulation> findByStatus(@Param("status") String status);
    
    @Query("SELECT bs FROM BusinessSimulation bs ORDER BY bs.createdAt DESC LIMIT 10")
    List<BusinessSimulation> findRecentSimulations();
}
