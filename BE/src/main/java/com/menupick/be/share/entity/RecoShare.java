package com.menupick.be.share.entity;

import com.menupick.be.recommendation.entity.Recommendation;
import com.menupick.be.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 추천 결과의 공유 링크 — 토큰만 알면 비로그인으로 조회·투표할 수 있다.
 * 추천 1건당 공유 1개(재공유 시 기존 토큰 재사용).
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "reco_share")
public class RecoShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** URL 경로에 쓰는 식별자 — 추측 불가능한 랜덤 16자리 hex. */
    @Column(nullable = false, unique = true, length = 16)
    private String token;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommendation_id", nullable = false, unique = true)
    private Recommendation recommendation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User creator;

    /** 마감되면 투표는 막히고 결과만 보인다. */
    @Column(nullable = false)
    private boolean closed = false;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public RecoShare(String token, Recommendation recommendation, User creator) {
        this.token = token;
        this.recommendation = recommendation;
        this.creator = creator;
    }

    public void close() {
        this.closed = true;
    }
}
