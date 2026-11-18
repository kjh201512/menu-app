package com.menuapp.recommendation;
import java.util.List;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
public interface RecommendationLogRepository extends JpaRepository<RecommendationLog,Long> {
    @Query("select l from RecommendationLog l join fetch l.menu m join fetch m.restaurant where l.user.id = :userId and l.sessionId = :sessionId")
    List<RecommendationLog> findSession(@Param("userId") Long userId, @Param("sessionId") String sessionId);
}