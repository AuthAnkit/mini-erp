package com.minierp.repository;

import com.minierp.entity.PurchaseOrder;
import com.minierp.enums.PurchaseOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    Optional<PurchaseOrder> findByRef(String ref);
    List<PurchaseOrder> findByStatus(PurchaseOrderStatus status);

    @Query("SELECT COUNT(po) FROM PurchaseOrder po WHERE po.status IN ('CONFIRMED', 'PARTIALLY_RECEIVED')")
    long countPending();
}
