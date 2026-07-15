package com.menupick.be.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // 공통 에러 규격
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, 400, "잘못된 입력값입니다."),
    UNAUTHORIZED_USER(HttpStatus.UNAUTHORIZED, 401, "인증되지 않은 사용자입니다."),
    NOT_FOUND_ENTITY(HttpStatus.NOT_FOUND, 404, "대상을 찾을 수 없습니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, 500, "서버 내부 오류가 발생했습니다."),

    // User 도메인 전용 에러
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, 404, "존재하지 않는 회원입니다."),
    DUPLICATE_EMAIL(HttpStatus.BAD_REQUEST, 400, "이미 존재하는 이메일입니다."),
    LOGIN_FAILED(HttpStatus.UNAUTHORIZED, 401, "이메일 또는 비밀번호가 일치하지 않습니다."),

    // Restaurant 도메인 전용 에러
    RESTAURANT_NOT_FOUND(HttpStatus.NOT_FOUND, 404, "존재하지 않는 식당입니다."),

    // Scrap 도메인 전용 에러
    SCRAP_NOT_FOUND(HttpStatus.NOT_FOUND, 404, "스크랩하지 않은 식당입니다. 먼저 스크랩을 등록해주세요."),

    // AI / 추천 도메인 전용 에러
    AI_RECOMMEND_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, 500, "AI 추천 서비스 구동에 실패했습니다."),
    NO_RESTAURANTS_NEARBY(HttpStatus.NOT_FOUND, 404, "반경 내에 조건에 맞는 맛집이 없습니다."),

    // 토큰 에러
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, 401, "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, 401, "만료된 토큰입니다. 다시 로그인해 주세요.");

    private final HttpStatus httpStatus;
    private final int status;
    private final String message;
}