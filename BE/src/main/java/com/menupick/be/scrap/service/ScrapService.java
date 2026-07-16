package com.menupick.be.scrap.service;

import com.menupick.be.Restaurant.entity.Restaurant;
import com.menupick.be.Restaurant.repository.RestaurantRepository;
import com.menupick.be.common.exception.ApiException;
import com.menupick.be.common.exception.ErrorCode;
import com.menupick.be.point.entity.PointType;
import com.menupick.be.point.service.PointService;
import com.menupick.be.scrap.dto.ScrapDTO;
import com.menupick.be.scrap.dto.ScrapDTO.ReviewInfo;
import com.menupick.be.scrap.dto.ScrapDTO.ScrapInfo;
import com.menupick.be.scrap.dto.ScrapDTO.ScrapListResponse;
import com.menupick.be.scrap.dto.ScrapDTO.ScrapValue;
import com.menupick.be.scrap.entity.Scrap;
import com.menupick.be.scrap.repository.ScrapRepository;
import com.menupick.be.user.entity.User;
import com.menupick.be.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ScrapService {
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final ScrapRepository scrapRepository;
    private final PointService pointService;

    // 스크랩 등록/삭제
    @Transactional
    public ScrapValue toggle(String email, Long restaurantId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "해당 이메일의 유저를 찾을 수 없습니다: " + email));

        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ApiException(ErrorCode.RESTAURANT_NOT_FOUND));

        Optional<Scrap> existingScrap = scrapRepository.findByUserIdAndRestaurantId(user.getId(), restaurantId);

        if(existingScrap.isPresent()) {
            scrapRepository.delete(existingScrap.get());
            return new ScrapValue(false);
        } else {
            Scrap scrap = Scrap.builder()
                    .user(user)
                    .restaurant(restaurant)
                    .name(restaurant.getName())
                    .address(restaurant.displayAddress())
                    .menu(List.of())
                    .build();

            scrapRepository.save(scrap);
            return new ScrapValue(true);
        }
    }

    // 스크랩한 맛집 리스트 조회
    @Transactional
    public ScrapListResponse list(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "해당 이메일의 유저를 찾을 수 없습니다: " + email));

        List<Scrap> scraps = scrapRepository.findAllByUserIdWithRestaurant(user.getId());

        List<ScrapInfo> infoList = scraps.stream()
                .map(this::toScrapInfo)
                .toList();

        return new ScrapListResponse(infoList);
    }

    // 리뷰 등록
    @Transactional
    public ScrapInfo updateReview(String email, ReviewInfo request, Long restaurantId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        Scrap scrap = scrapRepository.findByUserIdAndRestaurantId(user.getId(), restaurantId)
                .orElseThrow(() -> new ApiException(ErrorCode.SCRAP_NOT_FOUND));

        boolean wasVisitedBefore = scrap.isVisited();

        if (request.getMemo() != null) {
            scrap.updateMemo(request.getMemo());
        }
        if (request.getRating() != null) {
            scrap.updateRating(request.getRating());
        }
        if (request.getTags() != null) {
            scrap.updateTags(request.getTags());
        }

        scrap.updateVisited(true);

        if (!wasVisitedBefore) {
            pointService.savePointTx(user, PointType.REVIEW_CREATE);
        }

        return toScrapInfo(scrap);
    }

    // 방문 체크/취소 — 체크 시각을 기록해 '내 기록' 타임라인의 기준으로 쓴다
    @Transactional
    public ScrapInfo updateVisited(String email, Long restaurantId, boolean visited) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        Scrap scrap = scrapRepository.findByUserIdAndRestaurantId(user.getId(), restaurantId)
                .orElseThrow(() -> new ApiException(ErrorCode.SCRAP_NOT_FOUND));

        scrap.updateVisited(visited);
        return toScrapInfo(scrap);
    }

    public Set<Long> getScrapedRestaurantIds(Long userId) {
        return scrapRepository.findRestaurantIdsByUserId(userId);
    }

    private ScrapInfo toScrapInfo(Scrap scrap) {
        return ScrapDTO.ScrapInfo.builder()
                .restaurantId(scrap.getRestaurant().getId())
                .menu(scrap.getMenu())
                .name(scrap.getName())
                .address(scrap.getAddress())
                .memo(scrap.getMemo())
                .rating(scrap.getRating())
                .tags(scrap.getTags())
                .visited(scrap.isVisited())
                .visitedAt(scrap.getVisitedAt())
                .build();
    }
}
