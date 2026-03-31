package com.projectmanagement.core_system.repository;

import com.projectmanagement.core_system.model.AdminActivityLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActivityLogRepository extends MongoRepository<AdminActivityLog, String> {

    List<AdminActivityLog> findByAdminId(String adminId);

    List<AdminActivityLog> findByActionType(String actionType);

    List<AdminActivityLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end);

    List<AdminActivityLog> findByAdminIdAndActionTypeAndTimestampBetween(
            String adminId, String actionType, LocalDateTime start, LocalDateTime end);

    // Custom query to support flexible filtering on large datasets if needed
}
