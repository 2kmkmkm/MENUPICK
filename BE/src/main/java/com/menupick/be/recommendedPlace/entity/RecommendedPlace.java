package com.menupick.be.recommendedPlace.entity;

import com.menupick.be.Restaurant.entity.Restaurant;
import com.menupick.be.common.util.StringListConverter;
import com.menupick.be.recommendation.entity.Recommendation;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "recommended_place")
public class RecommendedPlace {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer rankNo;

    @Column(length = 500)
    private String reason;

    @Convert(converter = StringListConverter.class)
    private List<String> quote = new ArrayList<>();

    private Integer evidenceCount;

    private String verdict;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommendation_id", nullable = false)
    private Recommendation recommendation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Builder
    public RecommendedPlace(Recommendation recommendation, Restaurant restaurant, int rankNo,
                            String reason, List<String> quote, int evidenceCount, String verdict) {
        this.recommendation = recommendation;
        this.restaurant = restaurant;
        this.rankNo = rankNo;
        this.reason = reason;
        this.quote = quote != null ? quote : new ArrayList<>();
        this.evidenceCount = evidenceCount;
        this.verdict = verdict;
    }
}
