package com.menupick.be.recommendation.dto;

import com.menupick.be.Restaurant.entity.Restaurant;
import com.menupick.be.ai.RecoResult;
import com.menupick.be.recommendation.entity.Recommendation;
import com.menupick.be.recommendedPlace.dto.RecommendedPlaceDTO;
import com.menupick.be.recommendedPlace.dto.RecommendedPlaceDTO.OnHoldResponse;
import com.menupick.be.recommendedPlace.dto.RecommendedPlaceDTO.RecoResultResponse;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class RecommendationDTO {
    // 1. 맛집 추천 검색 요청 (프론트 -> 백엔드)
    @Getter
    public static class SearchRequest {
        private List<String> menus;
        private Integer headcount;
        private Integer radius;

        // 백엔드 -> AI 요청 필드
        @NotNull
        private Double lat;

        @NotNull
        private Double lng;

        @NotNull
        private String address;

        public int radiusOrDefault() {
            return radius == null ? 1000 : radius;
        }

        public int headCountOrDefault() {
            return headcount == null || headcount < 1 ? 1 : headcount;
        }

        public List<String> menuList() {
                return menus.stream()
                        .filter(m -> m != null && !m.isBlank())
                        .map(String::trim)
                        .distinct()
                        .toList();
        }
    }

    // 2. 맛집 추천 최종 응답 (백엔드 -> 프론트)
    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SearchResponse {
        private Long recommendationId;
        private List<String> menu;
        private LocalDateTime createdAt;
        private List<RecoResultResponse> recommendations;
        private List<OnHoldResponse> onHold;
    }

    // 4. 맛집 검색 내역
    @Getter
    @RequiredArgsConstructor
    public static class HistoryResponse {
        private final Long recommendationId;
        private final List<String> menu;
        private final LocalDateTime createdAt;
        private final String location;
    }
}
