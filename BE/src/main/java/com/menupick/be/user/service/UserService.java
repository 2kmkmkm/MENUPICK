package com.menupick.be.user.service;

import com.menupick.be.common.exception.ApiException;
import com.menupick.be.common.exception.ErrorCode;
import com.menupick.be.common.util.JwtTokenProvider;
import com.menupick.be.point.entity.Point;
import com.menupick.be.point.repository.PointRepository;
import com.menupick.be.point.service.PointService;
import com.menupick.be.user.dto.UserDTO;
import com.menupick.be.user.dto.UserDTO.LoginRequest;
import com.menupick.be.user.dto.UserDTO.LoginResponse;
import com.menupick.be.user.dto.UserDTO.SignUpRequest;
import com.menupick.be.user.entity.User;
import com.menupick.be.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

}
