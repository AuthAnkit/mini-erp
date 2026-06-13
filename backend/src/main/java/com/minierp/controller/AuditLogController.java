package com.minierp.controller;

import com.minierp.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(auditLogService.getAllLogs(PageRequest.of(page, size)));
    }

    @GetMapping("/record/{type}/{id}")
    public ResponseEntity<?> getRecordHistory(@PathVariable String type, @PathVariable Long id) {
        return ResponseEntity.ok(auditLogService.getRecordHistory(type, id));
    }

    @GetMapping("/module/{module}")
    public ResponseEntity<?> getByModule(@PathVariable String module) {
        return ResponseEntity.ok(auditLogService.getByModule(module));
    }
}
