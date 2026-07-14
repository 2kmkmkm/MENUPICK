package com.menupick.be.user.dto;

import lombok.Builder;
import lombok.Getter;

class UserDTO {
    @Getter
    public static class SignUpRequest {
        private String email;
        private String password;
        private String name;
    }

    @Getter
    @Builder
    public static class SignUpResponse {
        private Long id;
        private String email;
    }

    @Getter
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Getter
    @Builder
    public static class LoginResponse {
        private String accessToken;
    }
}