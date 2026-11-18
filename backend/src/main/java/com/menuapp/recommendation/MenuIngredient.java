package com.menuapp.recommendation;
import jakarta.persistence.*;
@Entity @Table(name="menu_ingredient",uniqueConstraints=@UniqueConstraint(name="uk_menu_ingredient",columnNames={"menu_id","ingredient_name"}))
public class MenuIngredient {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="menu_ingredient_id") private Long id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="menu_id",nullable=false) private Menu menu;
    @Column(name="ingredient_name",nullable=false,length=50) private String ingredientName;
    protected MenuIngredient() {}
    public MenuIngredient(Menu menu,String ingredientName) { this.menu=menu;this.ingredientName=ingredientName; }
    public String getIngredientName() { return ingredientName; }
}
