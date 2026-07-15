package com.menupick.be.point.repository;

import com.menupick.be.point.entity.Point;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PointRepository extends JpaRepository<Point, Long> {
    List<Point> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("select sum(p.delta) from Point p where p.user.id = :userId")
    Integer sumDeltaByUserId(@Param("userId") Long userId);
}
