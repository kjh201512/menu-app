package com.menuapp.restaurant;

import com.menuapp.common.ApiException;
import com.menuapp.recommendation.GeoDistance;
import com.menuapp.recommendation.Menu;
import com.menuapp.recommendation.MenuRepository;
import com.menuapp.recommendation.Restaurant;
import com.menuapp.recommendation.RestaurantRepository;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RestaurantService {

    public record Detail(Long restaurantId, String name, String category, Long distanceMeters,
                         String businessHours, String openStatus, String openStatusLabel,
                         List<String> signatureMenus, String mapUrl) {}

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final RestaurantRepository restaurants;
    private final MenuRepository menus;
    private final MapLinkBuilder maps;

    public RestaurantService(RestaurantRepository restaurants, MenuRepository menus, MapLinkBuilder maps) {
        this.restaurants = restaurants;
        this.menus = menus;
        this.maps = maps;
    }

    @Transactional(readOnly = true)
    public Detail detail(Long restaurantId, Double lat, Double lng) {
        Restaurant restaurant = restaurants.findById(restaurantId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND", "식당 정보를 찾을 수 없습니다."));
        boolean hasLocation = lat != null && lng != null && Double.isFinite(lat) && Double.isFinite(lng)
                && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
        Long distance = hasLocation
                ? Math.round(GeoDistance.meters(lat, lng, restaurant.getLatitude(), restaurant.getLongitude()))
                : null;
        String hours = BusinessHours.isValid(restaurant.getBusinessHours()) ? restaurant.getBusinessHours().strip() : null;
        BusinessHours.Status status = BusinessHours.statusAt(restaurant.getBusinessHours(), LocalTime.now(SEOUL));
        List<String> signature = menus.findByRestaurant_IdOrderByIdAsc(restaurant.getId()).stream()
                .filter(Menu::isIngredientsComplete)
                .map(Menu::getName)
                .limit(3)
                .toList();
        return new Detail(restaurant.getId(), restaurant.getName(), restaurant.getCategory().name(), distance,
                hours, status.name(), status.label(), signature,
                maps.googleMapUrl(restaurant.getLatitude(), restaurant.getLongitude()));
    }
}