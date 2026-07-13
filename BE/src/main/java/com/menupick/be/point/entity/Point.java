package com.menupick.be.point.entity;

import com.menupick.be.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "point_tx")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Point {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer delta;

    @Column(length = 225)
    private String reason;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name ="user_id", nullable = false)
    private User user;

    @Builder
    public Point(User user, Integer delta, String reason, LocalDateTime createdAt) {
        this.user = user;
        this.delta = delta;
        this.reason = reason;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now(); // 기본값 설정
    }
}
