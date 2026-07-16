package com.menupick.be.common.util;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. HTTP 요청 헤더에서 JWT 토큰 추출
        String jwt = resolveToken(request);

        // 2. 토큰이 유효한지 검증
        if (StringUtils.hasText(jwt) && jwtTokenProvider.validateToken(jwt)) {
            String email = jwtTokenProvider.getEmail(jwt);  // 토큰에서 유저 이메일 추출

            // 3. 스프링 시큐리티 인증 객체(Authentication) 생성
            UserDetails userDetails = User.withUsername(email)
                    .password("")
                    .authorities(Collections.emptyList())
                    .build();

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            // 4. 세션에 인증 정보 저장 -> 이 요청은 이제 "인증된 상태"
            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.debug(">>>> SecurityContext에 [{}] 유저 인증 정보를 저장했습니다.", email);
        }

        // 5. 다음 필터로 요청 넘기기
        filterChain.doFilter(request, response);
    }

    // Request Header에서 토큰 정보 꺼내오기
    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}