package com.menuapp.recommendation;
import com.menuapp.profile.Category;
import com.menuapp.profile.IngredientNormalizer;
import jakarta.persistence.*;
import java.util.*;
@Entity @Table(name="menu")
public class Menu {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="menu_id") private Long id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="restaurant_id",nullable=false) private Restaurant restaurant;
    @Column(nullable=false,length=100) private String name;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=30) private Category category;
    @Column(nullable=false) private int price;
    @Column(name="is_signature",nullable=false) private boolean signature;
    @Column(name="ingredients_complete",nullable=false) private boolean ingredientsComplete;
    @OneToMany(mappedBy="menu",cascade=CascadeType.ALL,orphanRemoval=true) private List<MenuIngredient> ingredients=new ArrayList<>();
    protected Menu() {}
    public Menu(Restaurant restaurant,String name,Category category,int price,boolean complete,List<String> ingredients) {
        this.restaurant=restaurant;this.name=name;this.category=category;this.price=price;this.signature=true;this.ingredientsComplete=complete;
        ingredients.stream().map(IngredientNormalizer::normalize).distinct().forEach(i->this.ingredients.add(new MenuIngredient(this,i)));
    }
    public Long getId() { return id; }
    public Restaurant getRestaurant() { return restaurant; }
    public String getName() { return name; }
    public Category getCategory() { return category; }
    public int getPrice() { return price; }
    public boolean isIngredientsComplete() { return ingredientsComplete; }
    public List<String> ingredientNames() { return ingredients.stream().map(MenuIngredient::getIngredientName).sorted().toList(); }
}
