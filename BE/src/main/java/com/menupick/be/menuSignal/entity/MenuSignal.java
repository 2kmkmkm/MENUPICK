package com.menupick.be.menuSignal.entity;

import com.menupick.be.Restaurant.entity.Restaurant;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "restaurant_menu_signal")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MenuSignal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String menu;

    private Integer mentionCount;

    private double sentiment;

    @Column(length = 500)
    private String snippet;

    private String sourceLink;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Builder
    public MenuSignal(Restaurant restaurant, String menu, int mentionCount,
                                double sentiment, String snippet, String sourceLink) {
        this.restaurant = restaurant;
        this.menu = menu;
        this.mentionCount = mentionCount;
        this.sentiment = sentiment;
        this.snippet = snippet;
        this.sourceLink = sourceLink;
    }
}
