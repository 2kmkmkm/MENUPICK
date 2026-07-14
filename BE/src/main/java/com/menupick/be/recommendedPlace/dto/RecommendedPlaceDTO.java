package com.menupick.be.recommendedPlace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

public class RecommendedPlaceDTO {
    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RecoResultResponse {
        private Long restaurantId;
        private String name;
        private String category;
        private String address;

        private Double lat;
        private Double lng;

        private Long distanceM;
        private Integer rank;

        private String reason;
        private List<String> quote;

        private Integer evidenceCount;
        private String verdict;
        private Boolean groupOk;

        private Boolean isScraped;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OnHoldResponse {
        private Long restaurantId;
        private String name;
        private String reason;
        private Double lat;
        private Double lng;
        private Boolean isScraped;
    }
}
