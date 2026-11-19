package com.menuapp.restaurant;

import com.menuapp.common.ApiException;
import com.menuapp.profile.Category;
import com.menuapp.profile.UserRestriction;
import com.menuapp.profile.UserRestrictionRepository;
import com.menuapp.recommendation.FilterPolicy;
import com.menuapp.recommendation.GeoDistance;
import com.menuapp.recommendation.Menu;
import com.menuapp.recommendation.MenuRepository;
import com.menuapp.recommendation.Restaurant;
import com.menuapp.recommendation.RestaurantRepository;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RestaurantService {

    public record Detail(Long restaurantId, String name, String category, Long distanceMeters,
                         String businessHours, String openStatus, String openStatusLabel,
                         List<String> signatureMenus, String mapUrl,
                         String imageUrl, double latitude, double longitude) {}

    public record MenuView(Long menuId, String name, int price) {}

    public record NearbyItem(Long restaurantId, String name, String category, double latitude, double longitude,
                             long distanceMeters, String businessHours, String openStatus, String openStatusLabel,
                             String imageUrl, List<MenuView> menus, int hiddenMenuCount) {}

    public record Nearby(double lat, double lng, int radiusMeters, String category, int count, List<NearbyItem> items) {}

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final RestaurantRepository restaurants;
    private final MenuRepository menus;
    private final UserRestrictionRepository restrictions;
    private final FilterPolicy filter;
    private final MapLinkBuilder maps;

    public RestaurantService(RestaurantRepository restaurants, MenuRepository menus,
                             UserRestrictionRepository restrictions, FilterPolicy filter, MapLinkBuilder maps) {
        this.restaurants = restaurants;
        this.menus = menus;
        this.restrictions = restrictions;
        this.filter = filter;
        this.maps = maps;
    }

    @Transactional(readOnly = true)
    public Detail detail(Long restaurantId, Double lat, Double lng) {
        Restaurant restaurant = restaurants.findById(restaurantId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "RESTAURANT_NOT_FOUND", "식당 정보를 찾을 수 없습니다."));
        boolean hasLocation = lat != null && lng != null && validCoordinates(lat, lng);
        Long distance = hasLocation
                ? Math.round(GeoDistance.meters(lat, lng, restaurant.getLatitude(), restaurant.getLongitude()))
                : null;
        BusinessHours.Status status = BusinessHours.statusAt(restaurant.getBusinessHours(), LocalTime.now(SEOUL));
        List<String> signature = menus.findByRestaurant_IdOrderByIdAsc(restaurant.getId()).stream()
                .filter(Menu::isIngredientsComplete)
                .map(Menu::getName)
                .limit(3)
                .toList();
        return new Detail(restaurant.getId(), restaurant.getName(), restaurant.getCategory().name(), distance,
                hours(restaurant), status.name(), status.label(), signature,
                maps.googleMapUrl(restaurant.getLatitude(), restaurant.getLongitude()),
                restaurant.getImageUrl(), restaurant.getLatitude(), restaurant.getLongitude());
    }

    @Transactional(readOnly = true)
    public Nearby nearby(Long userId, double lat, double lng, int radius, Category category) {
        if (!validCoordinates(lat, lng))
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_COORDINATES", "위도는 -90~90, 경도는 -180~180의 유한한 숫자여야 합니다.");
        int radiusMeters = Math.max(100, Math.min(3000, radius));
        List<String> blocked = restrictions.findForUser(userId).stream().map(UserRestriction::getIngredientName).toList();
        double latDelta = Math.toDegrees(radiusMeters / GeoDistance.EARTH_RADIUS_METERS);
        Map<Long, List<Menu>> grouped = new LinkedHashMap<>();
        menus.findCandidates(Math.max(-90, lat - latDelta), Math.min(90, lat + latDelta)).stream()
                .sorted(Comparator.comparing(Menu::getId))
                .forEach(m -> grouped.computeIfAbsent(m.getRestaurant().getId(), k -> new ArrayList<>()).add(m));
        LocalTime now = LocalTime.now(SEOUL);
        List<NearbyItem> items = new ArrayList<>();
        for (List<Menu> list : grouped.values()) {
            Restaurant r = list.get(0).getRestaurant();
            if (category != null && r.getCategory() != category) continue;
            double distance = GeoDistance.meters(lat, lng, r.getLatitude(), r.getLongitude());
            if (distance > radiusMeters) continue;
            List<MenuView> allowed = list.stream()
                    .filter(m -> filter.allowed(m, blocked))
                    .map(m -> new MenuView(m.getId(), m.getName(), m.getPrice()))
                    .toList();
            if (allowed.isEmpty()) continue;
            BusinessHours.Status status = BusinessHours.statusAt(r.getBusinessHours(), now);
            items.add(new NearbyItem(r.getId(), r.getName(), r.getCategory().name(), r.getLatitude(), r.getLongitude(),
                    Math.round(distance), hours(r), status.name(), status.label(), r.getImageUrl(),
                    allowed, list.size() - allowed.size()));
        }
        items.sort(Comparator.comparingLong(NearbyItem::distanceMeters).thenComparing(NearbyItem::restaurantId));
        return new Nearby(lat, lng, radiusMeters, category == null ? null : category.name(), items.size(), items);
    }

    private String hours(Restaurant restaurant) {
        return BusinessHours.isValid(restaurant.getBusinessHours()) ? restaurant.getBusinessHours().strip() : null;
    }

    private boolean validCoordinates(double lat, double lng) {
        return Double.isFinite(lat) && Double.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    }
}
