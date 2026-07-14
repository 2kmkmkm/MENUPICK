package com.menupick.be.recommendation.entity;

import com.menupick.be.common.util.StringListConverter;
import com.menupick.be.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "recommendation")
public class Recommendation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Convert(converter = StringListConverter.class)
    @Column(nullable = false)
    private List<String> menu;

    @Column(nullable = false)
    private double lat;

    @Column(nullable = false)
    private double lng;

    @Column(nullable = false)
    private Integer radius;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Builder
    public Recommendation(User user, List<String> menu, double lat, double lng, int radius) {
        this.user = user;
        this.menu = menu != null ? menu : new ArrayList<>();
        this.lat = lat;
        this.lng = lng;
        this.radius = radius;
        this.createdAt = LocalDateTime.now();
    }
}
