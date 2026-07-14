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
}
