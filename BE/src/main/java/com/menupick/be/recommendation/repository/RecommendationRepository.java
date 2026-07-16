package com.menupick.be.recommendation.repository;

import com.menupick.be.recommendation.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {
    @Query("select distinct rec from Recommendation rec "
            + "left join fetch rec.places p "
            + "left join fetch p.restaurant "
            + "where rec.user.id = :userId "
            + "order by rec.createdAt desc")
    List<Recommendation> findByUserWithPlaces(@Param("userId") Long userId);

    @Query("select distinct rec from Recommendation rec "
            + "left join fetch rec.places p "
            + "left join fetch p.restaurant "
            + "where rec.id = :id")
    Optional<Recommendation> findByIdWithPlaces(@Param("id") Long id);

    /** 같은 사용자·같은 지점(좌표·반경)의 최근 추천 — 10분 캐시 후보. 메뉴 일치는 서비스에서 비교한다. */
    @Query("select rec from Recommendation rec "
            + "where rec.user.id = :userId and rec.lat = :lat and rec.lng = :lng "
            + "and rec.radius = :radius and rec.createdAt > :after "
            + "order by rec.createdAt desc")
    List<Recommendation> findRecentByUserAndSpot(@Param("userId") Long userId,
                                                 @Param("lat") Double lat,
                                                 @Param("lng") Double lng,
                                                 @Param("radius") Integer radius,
                                                 @Param("after") java.time.LocalDateTime after);
}
