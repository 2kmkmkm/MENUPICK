package com.menupick.be.user.service;

import com.menupick.be.common.exception.ApiException;
import com.menupick.be.common.exception.ErrorCode;
import com.menupick.be.common.util.JwtTokenProvider;
import com.menupick.be.point.entity.Point;
import com.menupick.be.point.repository.PointRepository;
import com.menupick.be.user.dto.UserDTO.LoginRequest;
import com.menupick.be.user.dto.UserDTO.LoginResponse;
import com.menupick.be.user.dto.UserDTO.SignUpRequest;
import com.menupick.be.user.entity.User;
import com.menupick.be.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PointRepository pointRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    // 회원가입
    @Transactional
    public void signup(SignUpRequest request) {
        // 이메일 중복 검사
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException(ErrorCode.DUPLICATE_EMAIL);
        }

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = User.builder()
                .email(request.getEmail())
                .password(encodedPassword)
                .name(request.getName())
                .build();

        User savedUser = userRepository.save(user);

        Point welcomePoint = Point.builder().user(savedUser)
                .delta(12)
                .reason("신규 가입 축하 포인트")
                .build();

        pointRepository.save(welcomePoint);
    }

    // 로그인
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        // 이메일로 유저 존재 여부 확인
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException(ErrorCode.LOGIN_FAILED));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ApiException(ErrorCode.LOGIN_FAILED);
        }

        String token = jwtTokenProvider.createAccessToken(user.getEmail());

        return LoginResponse.builder()
                .accessToken(token)
                .build();
    }

    // 리프레시 토큰을 유저 테이블에 저장
    @Transactional
    public String createRefreshToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        String rawToken = UUID.randomUUID().toString();
        String hashedToken = hashToken(rawToken);
        LocalDateTime expiryDate = LocalDateTime.now().plusDays(14);

        user.updateRefreshToken(hashedToken, expiryDate);

        return rawToken;
    }

    // 평문 토큰으로 유저 검증 및 가져오기
    @Transactional
    public User validateRefreshToken(String rawRefreshToken) {
        String hashedToken = hashToken(rawRefreshToken);

        // DB에 해당 암호화 토큰을 가진 유저가 있는지 검색
        User user = userRepository.findByHashedRefreshToken(hashedToken)
                .orElseThrow(() -> new ApiException(ErrorCode.INVALID_TOKEN));

        // 만료 시간 체크
        if (user.isRefreshTokenExpired()) {
            user.clearRefreshToken();
            throw new ApiException(ErrorCode.EXPIRED_TOKEN);
        }

        return user;
    }

    // 리프레시 토큰 삭제
    @Transactional
    public void deleteRefreshToken(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
        user.clearRefreshToken();
    }

    // SHA-256 암호화 헬퍼 메서드
    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 알고리즘 매핑 실패", e);
        }
    }
}
