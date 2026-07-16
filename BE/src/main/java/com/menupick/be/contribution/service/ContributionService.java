package com.menupick.be.contribution.service;

import com.menupick.be.Restaurant.entity.Restaurant;
import com.menupick.be.Restaurant.repository.RestaurantRepository;
import com.menupick.be.RestaurantMenuSignal.entity.RestaurantMenuSignal;
import com.menupick.be.common.exception.ApiException;
import com.menupick.be.common.exception.ErrorCode;
import com.menupick.be.contribution.dto.ContributionDTO.ContributeRequest;
import com.menupick.be.contribution.dto.ContributionDTO.ContributionResponse;
import com.menupick.be.contribution.dto.ContributionDTO.ReviewContributeRequest;
import com.menupick.be.point.entity.PointType;
import com.menupick.be.point.repository.PointRepository;
import com.menupick.be.point.service.PointService;
import com.menupick.be.user.entity.User;
import com.menupick.be.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;

/**
 * 사용자 제보. 검증된 카카오 매장 등록(+5P), 미검증 직접 입력(+0P), 등록 매장 리뷰(+1P).
 * 매장/신호 변경과 포인트 적립은 항상 한 트랜잭션.
 */
@Service
@RequiredArgsConstructor
public class ContributionService {

    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final PointService pointService;
    private final PointRepository pointRepository;

    @Transactional
    public ContributionResponse contribute(String email, ContributeRequest request) {
        User user = requireUser(email);

        // 중복 가드 — 같은 상호(정규화 완전일치)가 이미 있으면 신규 등록 대신 리뷰 제보로 유도한다.
        String nameNorm = request.name().toLowerCase().replaceAll("\\s+", "");
        restaurantRepository.findFirstByIsActiveTrueAndNameNorm(nameNorm).ifPresent(existing -> {
            throw new ApiException(ErrorCode.DUPLICATE_RESTAURANT,
                    "'" + existing.getName() + "'은(는) 이미 등록된 가게입니다. 검색해서 리뷰로 제보해주세요.");
        });

        Restaurant restaurant = Restaurant.builder()
                .name(request.name())
                .category(blankToNull(request.category()))
                .roadAddr(blankToNull(request.address()))
                .lat(request.lat())
                .lng(request.lng())
                .build();
        restaurant.setGroupOk(request.groupOk());
        String placeUrl = safeHttpUrl(request.placeUrl());
        restaurant.setPlaceUrl(placeUrl); // 카카오 검증 제보면 원문 링크 보존

        // 제보 매장은 리뷰 근거가 없으므로 mentionCount=1 시드 시그널만 붙인다 —
        // 출처 "user:{id}" 태그로 크롤 신호와 구분돼 커버리지 랭킹을 하이재킹하지 못한다.
        restaurant.addSignal(new RestaurantMenuSignal(
                request.menu().trim(), 1, "사용자 제보", "user:" + user.getId()));

        Restaurant saved = restaurantRepository.save(restaurant);

        // 직접 입력은 서버가 실존 매장을 확인할 수 없으므로 자동 보상하지 않는다.
        // provider place-id 서버 검증을 붙이기 전까지는 카카오 장소 URL 형태만 최소 게이트로 사용한다.
        int awarded = 0;
        if (isKakaoPlaceUrl(placeUrl)) {
            pointService.savePointTx(user, PointType.NEW_RESTAURANT_CREATE);
            awarded = PointType.NEW_RESTAURANT_CREATE.getDelta();
        }
        return new ContributionResponse(saved.getId(), saved.getName(), awarded, balanceOf(user));
    }

    @Transactional
    public ContributionResponse review(String email, ReviewContributeRequest request) {
        User user = requireUser(email);
        Restaurant restaurant = restaurantRepository.findById(request.restaurantId())
                .filter(Restaurant::isActive)
                .orElseThrow(() -> new ApiException(ErrorCode.RESTAURANT_NOT_FOUND));

        // 같은 사용자는 한 가게에 1회만 — 반복 제보로 포인트를 캐거나 신호를 부풀리지 못하게.
        String sourceTag = "user:" + user.getId();
        boolean alreadyReviewed = restaurant.getSignals().stream()
                .anyMatch(s -> sourceTag.equals(s.getSourceLink()));
        if (alreadyReviewed) {
            throw new ApiException(ErrorCode.ALREADY_REVIEWED);
        }

        String comment = blankToNull(request.comment());
        restaurant.addSignal(new RestaurantMenuSignal(
                request.menu().trim(), 1, comment == null ? "사용자 제보" : comment, sourceTag));

        pointService.savePointTx(user, PointType.REVIEW_CREATE);
        return new ContributionResponse(restaurant.getId(), restaurant.getName(),
                PointType.REVIEW_CREATE.getDelta(), balanceOf(user));
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
    }

    private int balanceOf(User user) {
        Integer sum = pointRepository.sumDeltaByUserId(user.getId());
        return sum != null ? sum : 0;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /**
     * 외부 링크는 http/https 만 저장한다 — "javascript:" 같은 스킴이 저장되면
     * 다른 사용자의 '원문 보기' href 로 렌더되는 저장형 XSS 가 된다.
     */
    private static String safeHttpUrl(String value) {
        String url = blankToNull(value);
        if (url == null) {
            return null;
        }
        String lower = url.toLowerCase();
        if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
            throw new ApiException(ErrorCode.INVALID_PLACE_URL);
        }
        return url;
    }

    private static boolean isKakaoPlaceUrl(String value) {
        if (value == null) {
            return false;
        }
        try {
            URI uri = URI.create(value);
            String host = uri.getHost();
            String path = uri.getPath();
            return host != null
                    && host.equalsIgnoreCase("place.map.kakao.com")
                    && path != null
                    && path.matches("/\\d+/?");
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
