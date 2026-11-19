package com.menuapp.recommendation;
import com.menuapp.profile.Category;
import jakarta.persistence.*;
@Entity @Table(name="restaurant",uniqueConstraints=@UniqueConstraint(name="uk_restaurant_external_id",columnNames="external_place_id"))
public class Restaurant {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="restaurant_id") private Long id;
    @Column(name="external_place_id",nullable=false,length=100) private String externalPlaceId;
    @Column(nullable=false,length=100) private String name;
    @Column(nullable=false) private double latitude;
    @Column(nullable=false) private double longitude;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=30) private Category category;
    @Column(name="business_hours",length=100) private String businessHours;
    protected Restaurant() {}
    public Restaurant(String externalPlaceId,String name,double latitude,double longitude,Category category) {
        this.externalPlaceId=externalPlaceId;this.name=name;this.latitude=latitude;this.longitude=longitude;this.category=category;this.businessHours="데모 정보";
    }
    public Long getId() { return id; }
    public String getName() { return name; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public Restaurant(String externalPlaceId,String name,double latitude,double longitude,Category category,String businessHours) {
        this(externalPlaceId,name,latitude,longitude,category);
        this.businessHours=businessHours;
    }
    public Category getCategory() { return category; }
    public String getBusinessHours() { return businessHours; }
}
