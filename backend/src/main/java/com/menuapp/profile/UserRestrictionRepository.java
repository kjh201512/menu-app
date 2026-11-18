package com.menuapp.profile;
import java.util.List;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
public interface UserRestrictionRepository extends JpaRepository<UserRestriction, Long> {
    @Query("select r from UserRestriction r where r.user.id = :id order by r.ingredientName")
    List<UserRestriction> findForUser(@Param("id") Long id);
    boolean existsByUser_IdAndIngredientName(Long userId, String ingredientName);
    @Modifying @Query("delete from UserRestriction r where r.user.id = :id")
    void deleteForUser(@Param("id") Long id);
}
