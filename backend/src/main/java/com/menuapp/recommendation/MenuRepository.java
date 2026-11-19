package com.menuapp.recommendation;
import java.util.List;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
public interface MenuRepository extends JpaRepository<Menu,Long> {
    // 위도 범위로 1차 축소하고 Java에서 Haversine 정확 반경을 적용합니다.
    @Query("select distinct m from Menu m join fetch m.restaurant r left join fetch m.ingredients where r.latitude between :minLat and :maxLat")
    List<Menu> findCandidates(@Param("minLat") double minLat,@Param("maxLat") double maxLat);
    List<Menu> findByRestaurant_IdOrderByIdAsc(Long restaurantId);
}
