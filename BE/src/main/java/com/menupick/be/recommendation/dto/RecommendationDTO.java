package com.menupick.be.recommendation.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

public class RecommendationDTO {
    // 1. 맛집 추천 검색 요청 (프론트 -> 백엔드)
    @Getter
    public static class SearchRequest {
        private String location;
        private List<String> menus;
        private Integer party;
    }

    // 2. 맛집 추천 최종 응답 (백엔드 -> 프론트)
    @Getter
    @Builder
    public static class SearchResponse {
        private Long recommendationId;
        private List<SearchResultInfo> restaurants;
    }

    // 3. 응답 내부의 개별 식당 상세 정보
    @Getter
    @Builder
    public static class SearchResultInfo {
        // [restaurant] 테이블에서 가져오는 식당 고유 정보
        private Long restaurantId;
        private String restaurantName;
        private String restaurantAddress;

        // [recommendation_restaurant] 매핑 테이블에서 가져오는 AI 추천 정보
        private Integer rankNo;
        private String reason;
        private List<String> quotes;
        private Integer evidenceCount;

        // 서비스 비즈니스 로직으로 채워지는 필드들
        private List<String> menus;
        private boolean isScraped;
    }
}
