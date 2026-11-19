package com.menuapp.restaurant;

import com.menuapp.profile.Category;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RestaurantController {

    private final RestaurantService restaurants;

    public RestaurantController(RestaurantService restaurants) {
        this.restaurants = restaurants;
    }

    @GetMapping("/api/restaurants/nearby")
    public RestaurantService.Nearby nearby(@AuthenticationPrincipal Long userId,
                                           @RequestParam("lat") double lat,
                                           @RequestParam("lng") double lng,
                                           @RequestParam(value = "radius", defaultValue = "1000") int radius,
                                           @RequestParam(value = "category", required = false) Category category) {
        return restaurants.nearby(userId, lat, lng, radius, category);
    }

    @GetMapping("/api/restaurants/{id}")
    public RestaurantService.Detail detail(@PathVariable("id") Long id,
                                           @RequestParam(value = "lat", required = false) Double lat,
                                           @RequestParam(value = "lng", required = false) Double lng) {
        return restaurants.detail(id, lat, lng);
    }
}
