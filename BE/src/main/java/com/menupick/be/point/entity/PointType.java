package com.menupick.be.point.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PointType {
    WELCOME(12, "신규 가입 축하 포인트"),
    AI_RECOMMENDATION(-3, "AI 맛집 추천 차감"),
    REVIEW_CREATE(1, "리뷰 작성 보상"),
    NEW_RESTAURANT_CREATE(5, "신규 매장 등록 보상");

    private final int delta;
    private final String defaultReason;
}