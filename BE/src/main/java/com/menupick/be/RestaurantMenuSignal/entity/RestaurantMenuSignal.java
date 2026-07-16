package com.menupick.be.RestaurantMenuSignal.entity;

import com.menupick.be.Restaurant.entity.Restaurant;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "restaurant_menu_signal")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RestaurantMenuSignal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String menu;

    private Integer mentionCount;

    private Double sentiment;

    @Column(length = 500)
    private String snippet;

    private String sourceLink;

    @Column(nullable = false)
    private boolean userContributed = false;

    @Setter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Builder
    public RestaurantMenuSignal(String menu, int mentionCount, String snippet) {
        this.menu = menu;
        this.mentionCount = mentionCount;
        this.snippet = snippet;
    }

    /** 사용자 제보 신호 — sourceLink("user:{id}")와 userContributed 로 크롤 신호와 구분한다. */
    public RestaurantMenuSignal(String menu, int mentionCount, String snippet, String sourceLink) {
        this.menu = menu;
        this.mentionCount = mentionCount;
        this.snippet = snippet;
        this.sourceLink = sourceLink;
        this.userContributed = true;
    }
}
