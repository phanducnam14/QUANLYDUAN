package com.projectmanagement.core_system.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@ControllerAdvice
public class GlobalExceptionHandler {

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ErrorResponse {
        private LocalDateTime timestamp;
        private int status;
        private String error;
        private String message;
        private String path;
    }

    @ExceptionHandler(EmployeeServiceException.class)
    public ResponseEntity<ErrorResponse> handleEmployeeServiceException(EmployeeServiceException ex, WebRequest request) {
        ErrorResponse errorResponse = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.BAD_REQUEST.value(),
                "Employee Service Error",
                ex.getMessage(),
                request.getDescription(false).replace("uri=", "")
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateEmail(DuplicateEmailException ex, WebRequest request) {
        ErrorResponse errorResponse = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.CONFLICT.value(),
                "Duplicate Email",
                ex.getMessage(),
                request.getDescription(false).replace("uri=", "")
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex, WebRequest request) {
        ErrorResponse errorResponse = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                ex.getMessage(),
                request.getDescription(false).replace("uri=", "")
        );
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // --- Custom Exceptions ---
    public static class EmployeeServiceException extends RuntimeException {
        public EmployeeServiceException(String message) {
            super(message);
        }
    }

    public static class DuplicateEmailException extends EmployeeServiceException {
        public DuplicateEmailException(String email) {
            super("Email '" + email + "' already exists in the system.");
        }
    }
    
    public static class EmailGenerationException extends EmployeeServiceException {
        public EmailGenerationException(String message) {
            super("Failed to generate email: " + message);
        }
    }
}
