package com.menupick.be.Restaurant.controller;

import com.menupick.be.Restaurant.dto.RestaurantDTO.PlaceInfo;
import com.menupick.be.Restaurant.dto.RestaurantDTO.PlaceLookupInfo;
import com.menupick.be.Restaurant.service.RestaurantService;
import com.menupick.be.common.dto.ApiResponse;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/places")
@RequiredArgsConstructor
@Validated
public class RestaurantController {

    private final RestaurantService restaurantService;

    // 반경 내 매장 조회 (추천 대기 중 지도 마커)
    @GetMapping
    public ResponseEntity<ApiResponse<List<PlaceInfo>>> nearby(
            @RequestParam @DecimalMin("-90.0") @DecimalMax("90.0") double lat,
            @RequestParam @DecimalMin("-180.0") @DecimalMax("180.0") double lng,
            @RequestParam(defaultValue = "1000") @Min(100) @Max(5000) int radius) {
        List<PlaceInfo> response = restaurantService.findNearby(lat, lng, radius);

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(200, "주변 매장 조회에 성공했습니다.", response));
    }

    // 제보 화면의 "이미 등록된 가게" 상호 검색
    @GetMapping("/lookup")
    public ResponseEntity<ApiResponse<List<PlaceLookupInfo>>> lookup(@RequestParam @Size(max = 100) String query) {
        List<PlaceLookupInfo> response = restaurantService.lookup(query);

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(200, "매장 검색에 성공했습니다.", response));
    }
}
