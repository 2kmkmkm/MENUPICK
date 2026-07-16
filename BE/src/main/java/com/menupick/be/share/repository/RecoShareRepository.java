package com.menupick.be.share.repository;

import com.menupick.be.share.entity.RecoShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecoShareRepository extends JpaRepository<RecoShare, Long> {

    Optional<RecoShare> findByToken(String token);

    Optional<RecoShare> findByRecommendationId(Long recommendationId);
}
