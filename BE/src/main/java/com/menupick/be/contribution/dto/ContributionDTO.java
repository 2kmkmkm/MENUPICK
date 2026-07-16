package com.menupick.be.contribution.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ContributionDTO {

    /**
     * 사용자가 제보하는 신규 매장. 카카오 장소검색으로 고른 실존 가게면 placeUrl(원문 링크)이 함께 오고,
     * 직접 입력이면 주소를 지오코딩한 좌표가 온다.
     */
    public record ContributeRequest(
            @NotBlank(message = "매장 이름은 필수입니다.")
            @Size(max = 100, message = "매장 이름은 100자 이내로 입력해주세요.") String name,
            @Size(max = 100, message = "업종은 100자 이내로 입력해주세요.") String category,
            @Size(max = 200, message = "주소는 200자 이내로 입력해주세요.") String address,
            @NotBlank(message = "대표 메뉴를 하나 이상 입력하세요.")
            @Size(max = 50, message = "메뉴는 50자 이내로 입력해주세요.") String menu,
            @NotNull(message = "위치(lat)가 필요합니다.")
            @DecimalMin(value = "-90.0", message = "위도는 -90 이상이어야 합니다.")
            @DecimalMax(value = "90.0", message = "위도는 90 이하여야 합니다.") Double lat,
            @NotNull(message = "위치(lng)가 필요합니다.")
            @DecimalMin(value = "-180.0", message = "경도는 -180 이상이어야 합니다.")
            @DecimalMax(value = "180.0", message = "경도는 180 이하여야 합니다.") Double lng,
            boolean groupOk,
            @Size(max = 255, message = "원문 링크가 너무 깁니다.") String placeUrl) {
    }

    /** 이미 등록된 가게에 대한 리뷰 제보 — 메뉴 신호를 1건 보탠다. */
    public record ReviewContributeRequest(
            @NotNull(message = "가게를 선택해주세요.") Long restaurantId,
            @NotBlank(message = "어떤 메뉴가 맛있었는지 알려주세요.")
            @Size(max = 50, message = "메뉴는 50자 이내로 입력해주세요.") String menu,
            @Size(max = 300, message = "한줄평은 300자 이내로 적어주세요.") String comment) {
    }

    /** 제보 성공 결과 — 매장 id, 적립 포인트, 갱신된 잔액. */
    public record ContributionResponse(
            Long restaurantId,
            String name,
            int awarded,
            int pointBalance) {
    }
}
