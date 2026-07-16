package com.menupick.be.recommendation.entity;

import com.menupick.be.common.util.StringListConverter;
import com.menupick.be.recommendedPlace.entity.RecommendedPlace;
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
    private Double lat;

    @Column(nullable = false)
    private Double lng;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private Integer radius;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "recommendation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RecommendedPlace> places = new ArrayList<>();

    public Recommendation(User user, List<String> menu, Double lat, Double lng, Integer radius, String address) {
        this.user = user;
        this.menu = menu;
        this.lat = lat;
        this.lng = lng;
        this.radius = radius;
        this.address = address;
    }

    public void addPlace(RecommendedPlace place) {
        places.add(place);
        place.setRecommendation(this);
    }
}
