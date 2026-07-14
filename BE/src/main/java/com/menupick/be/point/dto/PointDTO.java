package com.menupick.be.point.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

public class PointDTO {
    // 1. 적립/차감된 포인트 내역 조회
    @Getter
    @Builder
    public static class PointListResponse {
        private Long pointId;
        private String reason;
        private Integer delta;
        private LocalDateTime createdAt;
    }

    // 2. 현재 포인트 조회
    @Getter
    @Builder
    public static class PointResponse {
        private Integer point;
    }
}
