package com.minierp.repository;

import com.minierp.entity.SalesOrder;
import com.minierp.enums.SalesOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {
    Optional<SalesOrder> findByRef(String ref);
    List<SalesOrder> findByStatus(SalesOrderStatus status);
    List<SalesOrder> findByCustomerId(Long customerId);

    @Query("SELECT COUNT(so) FROM SalesOrder so WHERE so.status IN ('CONFIRMED', 'PARTIALLY_DELIVERED')")
    long countPending();

    @Query("SELECT COUNT(so) FROM SalesOrder so WHERE so.scheduleDate < CURRENT_DATE AND so.status IN ('CONFIRMED', 'PARTIALLY_DELIVERED')")
    long countDelayed();
}
