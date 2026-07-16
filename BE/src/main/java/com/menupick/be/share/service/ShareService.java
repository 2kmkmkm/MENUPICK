package com.menupick.be.share.service;

import com.menupick.be.Restaurant.entity.Restaurant;
import com.menupick.be.common.exception.ApiException;
import com.menupick.be.common.exception.ErrorCode;
import com.menupick.be.recommendation.entity.Recommendation;
import com.menupick.be.recommendation.repository.RecommendationRepository;
import com.menupick.be.recommendedPlace.entity.RecommendedPlace;
import com.menupick.be.share.dto.ShareDTO.ShareInfo;
import com.menupick.be.share.dto.ShareDTO.SharedPlace;
import com.menupick.be.share.dto.ShareDTO.SharedView;
import com.menupick.be.share.dto.ShareDTO.VoteRequest;
import com.menupick.be.share.entity.RecoShare;
import com.menupick.be.share.entity.ShareVote;
import com.menupick.be.share.repository.RecoShareRepository;
import com.menupick.be.share.repository.ShareVoteRepository;
import com.menupick.be.user.entity.User;
import com.menupick.be.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 추천 결과 공유 + 익명 투표.
 * 링크(토큰)만 알면 비로그인으로 조회·투표할 수 있고, 마감은 공유를 만든 사람만 할 수 있다.
 */
@Service
@RequiredArgsConstructor
public class ShareService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final RecoShareRepository shareRepository;
    private final ShareVoteRepository voteRepository;
    private final RecommendationRepository recommendationRepository;
    private final UserRepository userRepository;

    /** 공유 링크 생성 — 이미 있으면 기존 토큰 재사용(추천 1건당 링크 1개). */
    @Transactional
    public ShareInfo create(String email, Long recommendationId) {
        User user = requireUser(email);
        Recommendation recommendation = recommendationRepository.findByIdWithPlaces(recommendationId)
                .filter(rec -> rec.getUser() != null && rec.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND_ENTITY, "존재하지 않는 추천이에요."));

        RecoShare share = shareRepository.findByRecommendationId(recommendationId)
                .orElseGet(() -> shareRepository.save(
                        new RecoShare(newToken(), recommendation, recommendation.getUser())));
        return new ShareInfo(share.getToken(), share.isClosed());
    }

    /** 투표 마감 — 공유를 만든 본인만. 마감 후엔 결과만 보인다. */
    @Transactional
    public ShareInfo close(String email, Long recommendationId) {
        User user = requireUser(email);
        RecoShare share = shareRepository.findByRecommendationId(recommendationId)
                .orElseThrow(() -> new ApiException(ErrorCode.SHARE_NOT_FOUND));
        if (share.getCreator() == null || !share.getCreator().getId().equals(user.getId())) {
            throw new ApiException(ErrorCode.UNAUTHORIZED_USER, "공유를 만든 사람만 마감할 수 있어요.");
        }
        share.close();
        return new ShareInfo(share.getToken(), true);
    }

    /** 공유 페이지 조회(비로그인) — 추천 스냅샷 + 현재 득표. voter 를 주면 그 사람의 선택도 함께. */
    @Transactional(readOnly = true)
    public SharedView view(String token, String voterKey) {
        return toView(requireShare(token), voterKey);
    }

    /** 익명 투표 — 같은 voterKey 가 다시 투표하면 선택 변경. 응답은 갱신된 전체 뷰. */
    @Transactional
    public SharedView vote(String token, VoteRequest request) {
        RecoShare share = requireShare(token);
        if (share.isClosed()) {
            throw new ApiException(ErrorCode.VOTE_CLOSED);
        }

        boolean validChoice = share.getRecommendation().getPlaces().stream()
                .anyMatch(p -> p.getRestaurant().getId().equals(request.restaurantId()));
        if (!validChoice) {
            throw new ApiException(ErrorCode.INVALID_VOTE_CANDIDATE);
        }

        voteRepository.findByShareIdAndVoterKey(share.getId(), request.voterKey())
                .ifPresentOrElse(
                        existing -> existing.changeChoice(request.restaurantId()),
                        () -> voteRepository.save(
                                new ShareVote(share, request.restaurantId(), request.voterKey())));

        voteRepository.flush(); // 집계 전에 반영 — 응답의 득표수가 방금 표를 포함하게
        return toView(share, request.voterKey());
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
    }

    private RecoShare requireShare(String token) {
        return shareRepository.findByToken(token)
                .orElseThrow(() -> new ApiException(ErrorCode.SHARE_NOT_FOUND));
    }

    private SharedView toView(RecoShare share, String voterKey) {
        Recommendation rec = share.getRecommendation();

        List<SharedPlace> places = rec.getPlaces().stream()
                .sorted(Comparator.comparingInt(RecommendedPlace::getRankNo))
                .map(place -> {
                    Restaurant r = place.getRestaurant();
                    return new SharedPlace(
                            r.getId(), place.getRankNo(), r.getName(), r.getCategory(),
                            place.getReason(), place.getQuote(), place.getEvidenceCount(),
                            r.isGroupOk(), r.getPlaceUrl());
                })
                .toList();

        Map<Long, Long> votes = new LinkedHashMap<>();
        long total = 0;
        for (Object[] row : voteRepository.countByRestaurant(share.getId())) {
            long count = (Long) row[1];
            votes.put((Long) row[0], count);
            total += count;
        }

        Long myVote = (voterKey == null || voterKey.isBlank()) ? null
                : voteRepository.findByShareIdAndVoterKey(share.getId(), voterKey)
                        .map(ShareVote::getRestaurantId)
                        .orElse(null);

        return new SharedView(
                share.getToken(), rec.getMenu(), share.getCreatedAt(), share.isClosed(),
                places, votes, total, myVote);
    }

    private String newToken() {
        // 16자리 hex(64bit) — 추측 불가 + URL 안전. 충돌은 unique 제약이 최후 방어.
        byte[] bytes = new byte[8];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
