package com.menuapp.profile;
import com.menuapp.user.User;
import jakarta.persistence.*;
@Entity
@Table(name="user_preference", uniqueConstraints=@UniqueConstraint(name="uk_preference_user_category", columnNames={"user_id","category"}))
public class UserPreference {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="pref_id") private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="user_id", nullable=false) private User user;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30) private Category category;
    @Column(nullable=false) private double weight;
    protected UserPreference() {}
    public UserPreference(User user, Category category, double weight) { this.user=user;this.category=category;this.weight=weight; }
    public Category getCategory() { return category; }
    public double getWeight() { return weight; }
}
