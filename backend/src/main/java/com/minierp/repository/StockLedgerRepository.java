package com.minierp.repository;

import com.minierp.entity.StockLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

public interface StockLedgerRepository extends JpaRepository<StockLedger, Long> {

    List<StockLedger> findByProductIdOrderByDateTimeDesc(Long productId);

    List<StockLedger> findBySourceTypeAndSourceIdOrderByDateTimeDesc(String sourceType, Long sourceId);

    List<StockLedger> findAllByOrderByDateTimeDesc();

    List<StockLedger> findByDateTimeBetweenOrderByDateTimeDesc(LocalDateTime from, LocalDateTime to);

    @Query("SELECT sl FROM StockLedger sl WHERE sl.product.id = :productId ORDER BY sl.dateTime DESC")
    List<StockLedger> findLedgerForProduct(Long productId);

    @Query("SELECT sl FROM StockLedger sl WHERE sl.movementType = 'STOCK_OUT' ORDER BY sl.dateTime DESC")
    List<StockLedger> findAllOutMovements();

    @Query("SELECT sl FROM StockLedger sl WHERE sl.movementType = 'STOCK_IN' ORDER BY sl.dateTime DESC")
    List<StockLedger> findAllInMovements();
}
