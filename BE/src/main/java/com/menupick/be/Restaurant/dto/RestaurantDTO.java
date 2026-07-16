package com.menupick.be.Restaurant.dto;

public class RestaurantDTO {

    /** 주변 매장 한 건 — 검색 대기 중 지도의 1차 후보 마커. */
    public record PlaceInfo(
            Long restaurantId,
            String name,
            String category,
            String address,
            double lat,
            double lng,
            long distanceM) {
    }

    /** 제보 화면의 "이미 등록된 가게" 검색 결과 한 건. */
    public record PlaceLookupInfo(
            Long id,
            String name,
            String category,
            String address) {
    }
}
