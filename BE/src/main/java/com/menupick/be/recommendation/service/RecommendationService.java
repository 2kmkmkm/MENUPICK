package com.menupick.be.recommendation.service;

import com.menupick.be.Restaurant.entity.Restaurant;
import com.menupick.be.Restaurant.repository.RestaurantRepository;
import com.menupick.be.ai.AiService;
import com.menupick.be.ai.RecoResult;
import com.menupick.be.common.exception.ApiException;
import com.menupick.be.common.exception.ErrorCode;
import com.menupick.be.common.util.GeoUtil;
import com.menupick.be.point.entity.PointType;
import com.menupick.be.point.service.PointService;
import com.menupick.be.recommendation.entity.Recommendation;
import com.menupick.be.recommendedPlace.dto.RecommendedPlaceDTO.OnHoldResponse;
import com.menupick.be.recommendedPlace.dto.RecommendedPlaceDTO.RecoResultResponse;
import com.menupick.be.recommendedPlace.entity.RecommendedPlace;
import com.menupick.be.scrap.service.ScrapService;
import com.menupick.be.user.entity.User;
import com.menupick.be.user.repository.UserRepository;
import com.menupick.be.recommendation.dto.RecommendationDTO.HistoryResponse;
import com.menupick.be.recommendation.dto.RecommendationDTO.SearchRequest;
import com.menupick.be.recommendation.dto.RecommendationDTO.SearchResponse;
import com.menupick.be.recommendation.repository.RecommendationRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final PointService pointService;
    private final AiService aiService;
    private final ScrapService scrapService;

    private static final int GROUP_THRESHOLD = 5; // 5인 이상이면 단체 가능 매장 필터링
    private static final int CACHE_MINUTES = 10;  // 같은 조건 재검색은 10분간 포인트 미차감(캐시)

    // AI 기반 맛집 추천
    @Transactional
    public SearchResponse search(String email, SearchRequest request) {
        // 1. 로그인한 유저 정보 조회
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED_USER));

        int radius = request.radiusOrDefault();
        Double lat = request.getLat();
        Double lng = request.getLng();
        String address = request.getAddress();
        List<String> menus = request.menuList();

        // 1.5. 10분 캐시 — 같은 사용자·같은 조건(좌표·반경·메뉴) 재검색이면
        //      AI 호출과 포인트 차감 없이 직전 결과를 그대로 반환한다.
        LocalDateTime cacheCutoff = LocalDateTime.now().minusMinutes(CACHE_MINUTES);
        Recommendation cachedRec = recommendationRepository
                .findRecentByUserAndSpot(user.getId(), lat, lng, radius, cacheCutoff).stream()
                .filter(rec -> rec.getMenu().equals(menus))
                .findFirst()
                .orElse(null);
        if (cachedRec != null) {
            return getForUser(user.getId(), cachedRec.getId());
        }

        // 2. 반경 내 활성화된 맛집 후보군 필터링
        List<Restaurant> candidates = restaurantRepository.findAllActiveWithSignals().stream()
                .filter(r -> GeoUtil.haversineMeters(lat, lng, r.getLat(), r.getLng()) <= radius)
                .toList();

        // 후보군이 전멸했을 경우 예외 처리 예시
        if (candidates.isEmpty()) {
            throw new ApiException(ErrorCode.NO_RESTAURANTS_NEARBY);
        }

        // 3. 인원 수 조건 검사
        if (request.headCountOrDefault() >= GROUP_THRESHOLD) {
            List<Restaurant> groupPool = candidates.stream()
                    .filter(Restaurant::isGroupOk)
                    .toList();
            if (groupPool.size() >= 3) {
                candidates = groupPool;
            }
        }

        // 4. 선택된 메뉴 키워드들을 기반으로 OpenAI API 커스텀 서비스 호출
        RecoResult result = aiService.recommend(menus, candidates);

        // 5. DB에 추천 이력 원본 데이터 저장
        Recommendation recommendation = new Recommendation(user, menus, lat, lng, radius, address);
        for (RecoResult.Ranked ranked : result.recommendations()) {
            recommendation.addPlace(new RecommendedPlace(
                    ranked.restaurant(),
                    ranked.rankNo(),
                    ranked.reason(),
                    ranked.quote(),
                    ranked.evidenceCount(),
                    ranked.verdict()));
        }

        Recommendation saved = recommendationRepository.save(recommendation);

        Set<Long> scrapedIds = scrapService.getScrapedRestaurantIds(user.getId());

        List<RecoResultResponse> recommendations = result.recommendations().stream()
                .map(ranked -> toPlaceDto(ranked, lat, lng, scrapedIds))
                .toList();

        List<OnHoldResponse> onHold = result.onHold().stream()
                .map(held -> new OnHoldResponse(
                        held.restaurant().getId(), held.restaurant().getName(), held.reason(),
                        held.restaurant().getLat(), held.restaurant().getLng(), scrapedIds.contains(held.restaurant().getId())))
                .toList();

        pointService.savePointTx(user, PointType.AI_RECOMMENDATION);

        return new SearchResponse(
                saved.getId(), menus, saved.getCreatedAt(), recommendations, onHold);
    }

    // 검색 기록 조회
    @Transactional(readOnly = true)
    public List<HistoryResponse> history(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "해당 이메일의 유저를 찾을 수 없습니다: " + email));

        List<Recommendation> recommendations = recommendationRepository.findByUserWithPlaces(user.getId());

        return recommendations.stream()
                .map(this::toSummary)
                .toList();

    }

    @Transactional(readOnly = true)
    public List<HistoryResponse> listForUser(Long userId){
        return recommendationRepository.findByUserWithPlaces(userId).stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public SearchResponse getForUser(Long userId, Long recId) {
        Recommendation recommendation = recommendationRepository.findByIdWithPlaces(recId)
                .filter(rec -> rec.getUser() != null && rec.getUser().getId().equals(userId))
                .orElseThrow(() -> ApiException.notFound("Recommendation not found"));

        Set<Long> scrapedIds = scrapService.getScrapedRestaurantIds(userId);

        List<RecoResultResponse> recommendations = recommendation.getPlaces().stream()
                .sorted(Comparator.comparingInt(RecommendedPlace::getRankNo))
                .map(place -> toPlaceDto(place, recommendation.getLat(), recommendation.getLng(), scrapedIds))
                .toList();

        return new SearchResponse(
                recommendation.getId(),
                recommendation.getMenu(),
                recommendation.getCreatedAt(),
                recommendations,
                List.of());
    }

    private RecoResultResponse toPlaceDto(RecoResult.Ranked ranked, double lat, double lng, Set<Long> scrapedIds) {
        Restaurant restaurant = ranked.restaurant();

        boolean isScraped = scrapedIds.contains(restaurant.getId());
        long distance = GeoUtil.haversineMeters(lat, lng, restaurant.getLat(), restaurant.getLng());

        return new RecoResultResponse(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getCategory(),
                restaurant.displayAddress(),
                restaurant.getLat(),
                restaurant.getLng(),
                distance,
                ranked.rankNo(),
                ranked.reason(),
                ranked.quote(),
                ranked.evidenceCount(),
                ranked.verdict(),
                restaurant.isGroupOk(),
                isScraped
        );
    }

    private RecoResultResponse toPlaceDto(RecommendedPlace place, double lat, double lng, Set<Long> scrapedIds) {
        Restaurant restaurant = place.getRestaurant();

        boolean isScraped = scrapedIds.contains(restaurant.getId());
        long distance = GeoUtil.haversineMeters(lat, lng, restaurant.getLat(), restaurant.getLng());

        return new RecoResultResponse(
                restaurant.getId(),
                restaurant.getName(),
                restaurant.getCategory(),
                restaurant.displayAddress(),
                restaurant.getLat(),
                restaurant.getLng(),
                distance,
                place.getRankNo(),
                place.getReason(),
                place.getQuote(),
                place.getEvidenceCount(),
                place.getVerdict(),
                restaurant.isGroupOk(),
                isScraped
        );
    }

    private HistoryResponse toSummary(Recommendation recommendation) {
        String topName = recommendation.getPlaces().stream()
                .min(Comparator.comparingInt(RecommendedPlace::getRankNo))
                .map(place -> place.getRestaurant().getName())
                .orElse(null);
        return new HistoryResponse(
                recommendation.getId(),
                recommendation.getMenu(),
                recommendation.getCreatedAt(),
                recommendation.getAddress());
    }

}