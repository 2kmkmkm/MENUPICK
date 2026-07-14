package com.menupick.be.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private final int status;
    private final String error;
    private final String message;
    private final T data;

    private ApiResponse(int status, String error, String message, T data) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.data = data;
    }

    // 생성/수정/삭제 성공 시 (201 Created)
    public static <T> ApiResponse<T> success(int status, String message) {
        return new ApiResponse<>(status, null, message, null);
    }

    // 조회 성공 시 (200 OK)
    public static <T> ApiResponse<T> success(int status, String message, T data) {
        return new ApiResponse<>(status, null, message, data);
    }

    // 에러 발생 시
    public static <T> ApiResponse<T> fail(int status, String error, String message) {
        return new ApiResponse<>(status, error, message, null);
    }
}