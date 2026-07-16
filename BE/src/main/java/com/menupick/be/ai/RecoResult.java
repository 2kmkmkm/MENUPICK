package com.menupick.be.ai;

import java.util.List;

import com.menupick.be.Restaurant.entity.Restaurant;

/** Ranking outcome produced by an {@link AiService}, independent of geo/DTO concerns. */
public record RecoResult(List<Ranked> recommendations, List<Held> onHold) {

    /** A recommended restaurant with its supporting evidence. */
    public record Ranked(
            Restaurant restaurant,
            int rankNo,
            int evidenceCount,
            String reason,
            List<String> quote,
            String verdict) {
    }

    /** A candidate with insufficient evidence to recommend. */
    public record Held(Restaurant restaurant, String reason) {
    }
}