package com.menupick.be.Restaurant.service;

import com.menupick.be.Restaurant.dto.RestaurantDTO.PlaceInfo;
import com.menupick.be.Restaurant.dto.RestaurantDTO.PlaceLookupInfo;
import com.menupick.be.Restaurant.entity.Restaurant;
import com.menupick.be.Restaurant.repository.RestaurantRepository;
import com.menupick.be.common.util.GeoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RestaurantService {

    private final RestaurantRepository restaurantRepository;

    /** 반경 내 활성 매장, 가까운 순 — 추천 대기 중 지도의 1차 후보 마커용. */
    @Transactional(readOnly = true)
    public List<PlaceInfo> findNearby(double lat, double lng, int radius) {
        return restaurantRepository.findAllActiveWithSignals().stream()
                .map(restaurant -> toPlaceInfo(restaurant, lat, lng))
                .filter(dto -> dto.distanceM() <= radius)
                .sorted(Comparator.comparingLong(PlaceInfo::distanceM))
                .toList();
    }

    /** 제보 화면의 상호 검색 — 정규화 부분일치 상위 5곳. 1글자 검색은 잡음만 내므로 빈 결과. */
    @Transactional(readOnly = true)
    public List<PlaceLookupInfo> lookup(String query) {
        String norm = query == null ? "" : query.toLowerCase().replaceAll("\\s+", "");
        if (norm.length() < 2) {
            return List.of();
        }
        return restaurantRepository.findTop5ByIsActiveTrueAndNameNormContaining(norm).stream()
                .map(r -> new PlaceLookupInfo(r.getId(), r.getName(), r.getCategory(), r.displayAddress()))
                .toList();
    }

    private PlaceInfo toPlaceInfo(Restaurant restaurant, double lat, double lng) {
        long distance = GeoUtil.haversineMeters(lat, lng, restaurant.getLat(), restaurant.getLng());
        return new PlaceInfo(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getCategory(),
                restaurant.displayAddress(),
                restaurant.getLat(),
                restaurant.getLng(),
                distance);
    }
}
