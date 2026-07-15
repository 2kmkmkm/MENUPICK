package com.menupick.be.user.controller;

import com.menupick.be.common.dto.ApiResponse;
import com.menupick.be.common.util.JwtTokenProvider;
import com.menupick.be.user.dto.UserDTO.LoginRequest;
import com.menupick.be.user.dto.UserDTO.LoginResponse;
import com.menupick.be.user.dto.UserDTO.SignUpRequest;
import com.menupick.be.user.entity.User;
import com.menupick.be.user.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class UserController {
    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    // 회원가입
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Void>> signup(@RequestBody SignUpRequest request) {
        userService.signup(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(201, "회원가입이 완료되었습니다."));
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@RequestBody LoginRequest request, HttpServletResponse httpServletResponse) {
        LoginResponse response = userService.login(request);

        String rawRefreshToken = userService.createRefreshToken(request.getEmail());

        // HttpOnly 쿠키 생성 후 헤더에 탑재
        ResponseCookie cookie = ResponseCookie.from("refreshToken", rawRefreshToken)
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(14 * 24 * 60 * 60) // 14일
                .sameSite("Lax")
                .build();

        httpServletResponse.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(200, "로그인에 성공했습니다.", response));
    }

    // 리프레시 토큰
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Map<String, String>>> refresh(@CookieValue(value = "refreshToken", required = false) String rawRefreshToken, HttpServletResponse response) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail(401, "UNAUTHORIZED", "리프레시 토큰이 존재하지 않습니다."));
        }

        User user = userService.validateRefreshToken(rawRefreshToken);
        String email = user.getEmail();

        // 한 번 사용하면 새 리프레시 토큰 발급 (RTR)
        String newRawRefreshToken = userService.createRefreshToken(email);

        // 새 리프레시 토큰 쿠키 세팅
        ResponseCookie cookie = ResponseCookie.from("refreshToken", newRawRefreshToken)
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(14 * 24 * 60 * 60) // 14일
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        // 새로운 액세스 토큰 생성
        String newAccessToken = jwtTokenProvider.createAccessToken(email);

        return ResponseEntity.ok(ApiResponse.success(
                200,
                "토큰 재발급에 성공했습니다.",
                Map.of("accessToken", newAccessToken)
        ));
    }

    // 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(value = "refreshToken", required = false) String rawRefreshToken,
            HttpServletResponse response
    ) {
        if (rawRefreshToken != null) {
            try {
                User user = userService.validateRefreshToken(rawRefreshToken);
                userService.deleteRefreshToken(user.getEmail());
            } catch (Exception e) {
                // 이미 만료된 토큰인 경우 무시
            }
        }

        // 만료 시간을 0으로 세팅하여 즉시 소멸시킴
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0) // 즉시 만료
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(ApiResponse.success(200, "로그아웃에 성공했습니다.", null));
    }
}
