package com.minierp.repository;

import com.minierp.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByRecordTypeAndRecordIdOrderByDateTimeDesc(String recordType, Long recordId);
    Page<AuditLog> findAllByOrderByDateTimeDesc(Pageable pageable);
    List<AuditLog> findByUserIdOrderByDateTimeDesc(Long userId);
    List<AuditLog> findByModuleOrderByDateTimeDesc(String module);
}
