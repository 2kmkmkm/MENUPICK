package com.menupick.be.scrap.repository;

import com.menupick.be.scrap.entity.Scrap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface ScrapRepository extends JpaRepository<Scrap, Long> {
    // 1. 유저 ID와 식당 ID로 단건 스크랩 조회
    Optional<Scrap> findByUserIdAndRestaurantId(Long userId, Long restaurantId);

    // 2. 유저가 스크랩한 전체 맛집 목록 조회
    @Query("select s from Scrap s join fetch s.restaurant where s.user.id = :userId order by s.createdAt desc")
    List<Scrap> findAllByUserIdWithRestaurant(@Param("userId") Long userId);

    // 3. [추천 서비스 연동용] 유저가 스크랩한 식당 ID 세트만 조회
    @Query("select s.restaurant.id from Scrap s where s.user.id = :userId")
    Set<Long> findRestaurantIdsByUserId(@Param("userId") Long userId);
}
