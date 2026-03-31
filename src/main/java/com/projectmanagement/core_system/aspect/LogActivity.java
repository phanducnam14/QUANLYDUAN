package com.projectmanagement.core_system.aspect;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark methods for activity logging.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface LogActivity {
    String actionType(); // LOGIN, CREATE, UPDATE, DELETE, etc.
    String resourceType(); // USER, PROJECT, DEPARTMENT, etc.
}
