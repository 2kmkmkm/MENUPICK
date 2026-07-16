package com.menupick.be.share.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ShareDTO {

    /** 공유 생성/마감 응답 — 프론트는 token 으로 /vote/{token} URL 을 만든다. */
    public record ShareInfo(String token, boolean closed) {
    }

    /** 익명 투표 요청 — voterKey 는 브라우저가 만들어 보관하는 UUID. */
    public record VoteRequest(
            @NotNull(message = "가게를 선택해주세요.") Long restaurantId,
            @NotBlank(message = "voterKey가 필요합니다.")
            @Size(max = 64) String voterKey) {
    }

    /** 공유 투표 페이지(비로그인)가 그리는 전부 — 추천 스냅샷 + 실시간 득표. */
    public record SharedView(
            String token,
            List<String> menu,
            LocalDateTime createdAt,
            boolean closed,
            List<SharedPlace> places,
            Map<Long, Long> votes,
            long totalVotes,
            Long myVote) { // voterKey 로 조회한 내 선택(없으면 null)
    }

    public record SharedPlace(
            Long restaurantId,
            int rankNo,
            String name,
            String category,
            String reason,
            List<String> quote,
            Integer evidenceCount,
            boolean groupOk,
            String placeUrl) {
    }
}
