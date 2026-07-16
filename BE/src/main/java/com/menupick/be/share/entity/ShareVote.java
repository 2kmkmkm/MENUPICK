package com.menupick.be.share.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 공유 페이지의 익명 투표 1건. voterKey(브라우저 로컬 UUID) 기준으로
 * 한 사람당 한 표 — 같은 키로 다시 투표하면 선택 변경으로 처리한다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "share_vote",
        uniqueConstraints = @UniqueConstraint(columnNames = {"share_id", "voter_key"}))
public class ShareVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "share_id", nullable = false)
    private RecoShare share;

    @Column(nullable = false)
    private Long restaurantId;

    @Column(name = "voter_key", nullable = false, length = 64)
    private String voterKey;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ShareVote(RecoShare share, Long restaurantId, String voterKey) {
        this.share = share;
        this.restaurantId = restaurantId;
        this.voterKey = voterKey;
    }

    public void changeChoice(Long restaurantId) {
        this.restaurantId = restaurantId;
    }
}
