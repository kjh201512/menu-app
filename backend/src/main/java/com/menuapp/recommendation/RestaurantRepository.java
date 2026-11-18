package com.menuapp.recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
public interface RestaurantRepository extends JpaRepository<Restaurant,Long> { boolean existsByExternalPlaceId(String id); }
