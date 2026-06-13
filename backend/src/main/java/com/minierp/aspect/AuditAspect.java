package com.minierp.aspect;

import com.minierp.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;

/**
 * AOP-based audit logging.
 * Intercepts all service method calls and logs status changes automatically.
 * This is the "Extras: AOP for audit logs" requirement from the tech stack.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLogService auditLogService;

    /**
     * Pointcut: all public methods in any service class
     */
    @Pointcut("execution(public * com.minierp.service.*Service.*(..))")
    public void serviceLayer() {}

    /**
     * Pointcut: specifically status-changing operations
     */
    @Pointcut("execution(public * com.minierp.service.*Service.confirm(..)) || " +
              "execution(public * com.minierp.service.*Service.cancel(..)) || " +
              "execution(public * com.minierp.service.*Service.deliver(..)) || " +
              "execution(public * com.minierp.service.*Service.receive(..)) || " +
              "execution(public * com.minierp.service.*Service.produce(..)) || " +
              "execution(public * com.minierp.service.*Service.startProduction(..)) || " +
              "execution(public * com.minierp.service.*Service.completeWorkOrder(..))")
    public void statusChangingOps() {}

    /**
     * Around advice: wraps status-changing operations to log timing & errors
     */
    @Around("statusChangingOps()")
    public Object aroundStatusChange(ProceedingJoinPoint pjp) throws Throwable {
        String methodName = pjp.getSignature().getName();
        String className = pjp.getTarget().getClass().getSimpleName();
        long start = System.currentTimeMillis();

        try {
            Object result = pjp.proceed();
            long elapsed = System.currentTimeMillis() - start;
            log.debug("AOP [{}.{}] completed in {}ms", className, methodName, elapsed);
            return result;
        } catch (Exception ex) {
            // Log exceptions from status operations
            Object[] args = pjp.getArgs();
            String idStr = args.length > 0 ? args[0].toString() : "?";
            auditLogService.log(
                deriveModule(className), deriveRecordType(className), tryParseLong(idStr), null,
                "ERROR_" + methodName.toUpperCase(), null, null, ex.getMessage(),
                "Exception in " + className + "." + methodName + ": " + ex.getMessage()
            );
            throw ex;
        }
    }

    /**
     * After-returning advice: log whenever a create() method succeeds
     */
    @AfterReturning(
        pointcut = "execution(public * com.minierp.service.*Service.create*(..))",
        returning = "result"
    )
    public void afterCreate(JoinPoint jp, Object result) {
        String className = jp.getTarget().getClass().getSimpleName();
        log.debug("AOP [{}] create operation returned: {}", className, result != null ? result.getClass().getSimpleName() : "null");
    }

    /**
     * After-throwing advice: catch and log any unhandled exception from services
     */
    @AfterThrowing(pointcut = "serviceLayer()", throwing = "ex")
    public void afterThrowing(JoinPoint jp, Throwable ex) {
        String className = jp.getTarget().getClass().getSimpleName();
        String methodName = jp.getSignature().getName();
        log.error("AOP Exception in [{}.{}]: {}", className, methodName, ex.getMessage());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String deriveModule(String className) {
        if (className.contains("Sales")) return "SALES";
        if (className.contains("Purchase")) return "PURCHASE";
        if (className.contains("Manufacturing")) return "MANUFACTURING";
        if (className.contains("Product")) return "PRODUCT";
        return "SYSTEM";
    }

    private String deriveRecordType(String className) {
        if (className.contains("Sales")) return "SalesOrder";
        if (className.contains("Purchase")) return "PurchaseOrder";
        if (className.contains("Manufacturing")) return "ManufacturingOrder";
        if (className.contains("Product")) return "Product";
        return "Unknown";
    }

    private Long tryParseLong(String s) {
        try { return Long.parseLong(s); } catch (Exception e) { return null; }
    }
}
