package com.menuapp.profile;
import com.menuapp.user.User;
import jakarta.persistence.*;
@Entity
@Table(name="user_restriction", uniqueConstraints=@UniqueConstraint(name="uk_restriction_user_ingredient", columnNames={"user_id","ingredient_name"}))
public class UserRestriction {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="restriction_id") private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="user_id", nullable=false) private User user;
    @Column(name="ingredient_name", nullable=false, length=50) private String ingredientName;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20) private RestrictionType type;
    protected UserRestriction() {}
    public UserRestriction(User user, String ingredientName, RestrictionType type) { this.user=user;this.ingredientName=ingredientName;this.type=type; }
    public String getIngredientName() { return ingredientName; }
    public RestrictionType getType() { return type; }
}
