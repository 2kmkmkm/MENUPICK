package com.menupick.be.user.repository;

import com.menupick.be.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // 이메일로 유저 찾기 (로그인 및 중복 가입 방지용)
    Optional<User> findByEmail(String email);

    // 이메일 중복 여부 확인
    boolean existsByEmail(String email);

    //  암호화된 리프레시 토큰으로 유저 찾기
    Optional<User> findByHashedRefreshToken(String hashedRefreshToken);
}