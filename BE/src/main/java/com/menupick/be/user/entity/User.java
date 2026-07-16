package com.menupick.be.user.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int pointBalance;

    @Column
    private String hashedRefreshToken;

    @Column
    private LocalDateTime refreshTokenExpiryDate;

    @Builder
    public User(String email, String password, String name) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.pointBalance = 12;
    }

    // 로그인/재발급 시 리프레시 토큰 업데이트
    public void updateRefreshToken(String hashedRefreshToken, LocalDateTime expiryDate) {
        this.hashedRefreshToken = hashedRefreshToken;
        this.refreshTokenExpiryDate = expiryDate;
    }

    // 리프레시 토큰 만료 여부 확인
    public boolean isRefreshTokenExpired() {
        if (this.refreshTokenExpiryDate == null) return true;
        return LocalDateTime.now().isAfter(this.refreshTokenExpiryDate);
    }

    // 로그아웃 시 토큰, 만료 시간 삭제
    public void clearRefreshToken() {
        this.hashedRefreshToken = null;
        this.refreshTokenExpiryDate = null;
    }
}
