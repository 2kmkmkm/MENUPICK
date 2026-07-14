package com.menupick.be.Restaurant.repository;

import com.menupick.be.Restaurant.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    @Query("select distinct r from Restaurant r left join fetch r.signals where r.isActive = true")
    List<Restaurant> findAllActiveWithSignals();
}

