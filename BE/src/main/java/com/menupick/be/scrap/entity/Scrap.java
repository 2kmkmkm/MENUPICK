package com.menupick.be.scrap.entity;

import com.menupick.be.Restaurant.entity.Restaurant;
import com.menupick.be.common.util.StringListConverter;
import com.menupick.be.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Table(name = "scrap")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Scrap {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String address;

    @Convert(converter = StringListConverter.class)
    @Column(nullable = false)
    private List<String> menu;

    private String memo;

    @Min(1)
    @Max(5)
    private Integer rating;

    @Column(nullable = false)
    private boolean visited;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @Builder
    public Scrap(User user, Restaurant restaurant, String name, String address, List<String> menu) {
        this.user = user;
        this.restaurant = restaurant;
        this.name = name;
        this.address = address;
        this.menu = menu;
    }


    public void updateMemo(String memo) {
        this.memo = memo;
    }

    public void updateRating(Integer rating) {
        this.rating = rating;
    }

    public void updateVisited(boolean visited) {
        this.visited = visited;
    }
}
