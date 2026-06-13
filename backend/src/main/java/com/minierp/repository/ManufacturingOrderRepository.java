package com.minierp.repository;

import com.minierp.entity.ManufacturingOrder;
import com.minierp.enums.ManufacturingOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface ManufacturingOrderRepository extends JpaRepository<ManufacturingOrder, Long> {
    Optional<ManufacturingOrder> findByRef(String ref);
    List<ManufacturingOrder> findByStatus(ManufacturingOrderStatus status);
    List<ManufacturingOrder> findByFinishedProductId(Long productId);

    @Query("SELECT COUNT(mo) FROM ManufacturingOrder mo WHERE mo.status IN ('CONFIRMED', 'IN_PROGRESS')")
    long countActive();
}
