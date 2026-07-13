package com.menupick.be.scrap.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

public class ScrapDTO {
    // 1. 맛집 스크랩 토글(등록/취소) 요청 (프론트 -> 백엔드)
    @Getter
    @Builder
    public static class ScrapResponse {
        private boolean isScraped;
    }

    // 2. 스크랩한 맛집 전체 리스트 조회 (백엔드 -> 프론트)
    @Getter
    @Builder
    public static class ScrapListResponse {
        private List<ScrapInfo> restaurants;
    }

    @Getter
    @Builder
    public static class ScrapInfo {
        private Long restaurantId;
        private List<String> menus;
        private String restaurantName;
        private String restaurantAddress;
        private String memo;
        private Integer rating;
        private boolean visited;
    }

    // 3. 리뷰/평점 작성 및 수정 (프론트 -> 백엔드)
    @Getter
    public static class ReviewRequest {
        private String memo;
        private Integer rating;
    }
}
