package com.menupick.be.scrap.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

public class ScrapDTO {
    // 1. 맛집 스크랩 토글(등록/취소) 요청 (프론트 -> 백엔드)
    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ScrapValue {
        private Boolean isScraped;
    }

    // 2. 스크랩한 맛집 전체 리스트 조회 (백엔드 -> 프론트)
    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ScrapListResponse {
        private List<ScrapInfo> restaurants;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ScrapInfo {
        private Long restaurantId;
        private List<String> menu;
        private String name;
        private String address;
        private String memo;
        private Integer rating;
        private boolean visited;
    }

    // 3. 리뷰/평점 작성 및 수정 (프론트 -> 백엔드)
    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ReviewInfo {
        private String memo;
        private Integer rating;
    }
}
