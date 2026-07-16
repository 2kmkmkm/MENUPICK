package com.menupick.be.recommendedPlace.entity;

import com.menupick.be.Restaurant.entity.Restaurant;
import com.menupick.be.common.util.StringListConverter;
import com.menupick.be.recommendation.entity.Recommendation;
import jakarta.persistence.*;
import lombok.*;

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
    private List<String> quote;

    private Integer evidenceCount;
    private String verdict;

    @Setter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommendation_id", nullable = false)
    private Recommendation recommendation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Builder
    public RecommendedPlace(Restaurant restaurant, int rankNo,
                            String reason, List<String> quote, int evidenceCount, String verdict) {
        this.restaurant = restaurant;
        this.rankNo = rankNo;
        this.reason = reason;
        this.quote = quote;
        this.evidenceCount = evidenceCount;
        this.verdict = verdict;
    }
}
