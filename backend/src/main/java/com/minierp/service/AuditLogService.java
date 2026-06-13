package com.minierp.service;

import com.minierp.entity.AuditLog;
import com.minierp.repository.AuditLogRepository;
import com.minierp.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String module, String recordType, Long recordId, String recordRef,
                    String action, String fieldChanged, String oldValue, String newValue, String details) {
        Long userId = null;
        String userName = "System";

        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl ud) {
                userId = ud.getId();
                userName = ud.getName();
            }
        } catch (Exception ignored) {}

        AuditLog log = AuditLog.builder()
                .dateTime(LocalDateTime.now())
                .userId(userId)
                .userName(userName)
                .module(module)
                .recordType(recordType)
                .recordId(recordId)
                .recordRef(recordRef)
                .action(action)
                .fieldChanged(fieldChanged)
                .oldValue(oldValue)
                .newValue(newValue)
                .details(details)
                .build();

        auditLogRepository.save(log);
    }

    public List<AuditLog> getRecordHistory(String recordType, Long recordId) {
        return auditLogRepository.findByRecordTypeAndRecordIdOrderByDateTimeDesc(recordType, recordId);
    }

    public Page<AuditLog> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByDateTimeDesc(pageable);
    }

    public List<AuditLog> getByModule(String module) {
        return auditLogRepository.findByModuleOrderByDateTimeDesc(module);
    }
}
