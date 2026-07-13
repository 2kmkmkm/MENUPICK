package com.menupick.be.Restaurant.entity;

import com.menupick.be.menuSignal.entity.MenuSignal;
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
@Table(name = "restaurant")
public class Restaurant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String nameNorm;
    private String category;
    private String roadAddr;
    private String jibunAddr;
    private String regionCode;

    private double lat;
    private double lng;

    private String placeId;
    private String placeUrl;

    @Column(nullable = false)
    private String bizStatus = "영업";

    @Column(nullable = false)
    private boolean isActive = true;

    @Column(nullable = false)
    private boolean groupOk = false;

    @OneToMany(mappedBy = "restaurant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MenuSignal> menuSignals = new ArrayList<>();

    @Builder
    public Restaurant(String name, String nameNorm, String category, String roadAddr, String jibunAddr,
                      String regionCode, double lat, double lng, String placeId, String placeUrl,
                      String bizStatus, boolean isActive, boolean groupOk) {
        this.name = name;
        this.nameNorm = nameNorm;
        this.category = category;
        this.roadAddr = roadAddr;
        this.jibunAddr = jibunAddr;
        this.regionCode = regionCode;
        this.lat = lat;
        this.lng = lng;
        this.placeId = placeId;
        this.placeUrl = placeUrl;
        this.bizStatus = bizStatus;
        this.isActive = isActive;
        this.groupOk = groupOk;
    }
}
