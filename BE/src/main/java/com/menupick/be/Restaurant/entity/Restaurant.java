package com.menupick.be.Restaurant.entity;

import com.menupick.be.RestaurantMenuSignal.entity.RestaurantMenuSignal;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "restaurant")
public class Restaurant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String nameNorm;
    private String category;
    private String roadAddr;
    private String jibunAddr;
    private String regionCode;

    @Column(nullable = false)
    private Double lat;

    @Column(nullable = false)
    private Double lng;

    private String placeId;

    @Setter
    private String placeUrl;

    @Column(nullable = false)
    private String bizStatus = "영업";

    @Column(nullable = false)
    private boolean isActive = true;

    @Setter
    @Column(nullable = false)
    private boolean groupOk = false;

    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RestaurantMenuSignal> signals = new ArrayList<>();

    @Builder
    public Restaurant(String name, String category, String roadAddr, double lat, double lng) {
        this.name = name;
        this.nameNorm = name == null ? null : name.toLowerCase().replaceAll("\\s+", "");
        this.category = category;
        this.roadAddr = roadAddr;
        this.lat = lat;
        this.lng = lng;
    }

    public void addSignal(RestaurantMenuSignal signal) {
        signals.add(signal);
        signal.setRestaurant(this);
    }

    public String displayAddress() {
        return roadAddr != null ? roadAddr : jibunAddr;
    }

}
