package com.menupick.be.share.repository;

import com.menupick.be.share.entity.ShareVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShareVoteRepository extends JpaRepository<ShareVote, Long> {

    Optional<ShareVote> findByShareIdAndVoterKey(Long shareId, String voterKey);

    /** 후보별 득표수 — [restaurantId, count] 행 목록. */
    @Query("select v.restaurantId, count(v) from ShareVote v where v.share.id = :shareId group by v.restaurantId")
    List<Object[]> countByRestaurant(@Param("shareId") Long shareId);
}
