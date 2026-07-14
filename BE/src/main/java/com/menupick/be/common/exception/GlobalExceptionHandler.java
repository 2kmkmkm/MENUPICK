package com.menupick.be.common.exception;

import com.menupick.be.common.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ApiException.class)
    protected ResponseEntity<ApiResponse<Void>> handleApiException(ApiException e) {
        log.error("ApiException 발생: {}", e.getMessage());
        ErrorCode errorCode = e.getErrorCode();

        ApiResponse<Void> response = ApiResponse.fail(
                errorCode.getStatus(),
                errorCode.getHttpStatus().name(),
                e.getMessage()
        );

        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(response);
    }

    @ExceptionHandler(Exception.class)
    protected ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("예상치 못한 서버 에러 발생: ", e);

        ApiResponse<Void> response = ApiResponse.fail(
                500,
                "INTERNAL_SERVER_ERROR",
                "서버 내부 오류가 발생했습니다."
        );

        return ResponseEntity
                .status(500)
                .body(response);
    }
}