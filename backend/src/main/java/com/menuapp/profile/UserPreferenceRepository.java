package com.menuapp.profile;
import java.util.List;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
public interface UserPreferenceRepository extends JpaRepository<UserPreference, Long> {
    @Query("select p from UserPreference p where p.user.id = :id order by p.category")
    List<UserPreference> findForUser(@Param("id") Long id);
    @Modifying @Query("delete from UserPreference p where p.user.id = :id")
    void deleteForUser(@Param("id") Long id);
}
