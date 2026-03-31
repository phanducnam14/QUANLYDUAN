package com.projectmanagement.core_system.service;

import com.projectmanagement.core_system.model.AdminActivityLog;
import com.projectmanagement.core_system.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLogService {

    private final ActivityLogRepository repository;
    private final MongoTemplate mongoTemplate;

    @Async
    public void logActivity(AdminActivityLog activityLog) {
        try {
            activityLog.setTimestamp(LocalDateTime.now());
            repository.save(activityLog);
            log.debug("Activity Log saved: {} for admin {}", activityLog.getActionType(), activityLog.getAdminId());
        } catch (Exception e) {
            log.error("Failed to save activity log: ", e);
        }
    }

    public Page<AdminActivityLog> searchLogs(String adminId, String actionType, LocalDateTime startDate, 
                                           LocalDateTime endDate, int page, int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        
        Query query = new Query().with(pageable);
        
        if (adminId != null && !adminId.isEmpty()) {
            query.addCriteria(Criteria.where("adminId").is(adminId));
        }
        
        if (actionType != null && !actionType.isEmpty()) {
            query.addCriteria(Criteria.where("actionType").is(actionType));
        }
        
        if (startDate != null && endDate != null) {
            query.addCriteria(Criteria.where("timestamp").gte(startDate).lte(endDate));
        } else if (startDate != null) {
            query.addCriteria(Criteria.where("timestamp").gte(startDate));
        } else if (endDate != null) {
            query.addCriteria(Criteria.where("timestamp").lte(endDate));
        }
        
        List<AdminActivityLog> logs = mongoTemplate.find(query, AdminActivityLog.class);
        long count = mongoTemplate.count(Query.of(query).limit(-1).skip(-1), AdminActivityLog.class);
        
        return new org.springframework.data.domain.PageImpl<>(logs, pageable, count);
    }

    public AdminActivityLog getLogById(String id) {
        return repository.findById(id).orElse(null);
    }

    public void saveLog(AdminActivityLog log) {
        repository.save(log);
    }

    public AdminActivityLog getLatestLogByAdmin(String adminId) {
        Pageable pageable = PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "timestamp"));
        Query query = new Query().with(pageable);
        query.addCriteria(Criteria.where("adminId").is(adminId));
        List<AdminActivityLog> logs = mongoTemplate.find(query, AdminActivityLog.class);
        return logs.isEmpty() ? null : logs.get(0);
    }
}
