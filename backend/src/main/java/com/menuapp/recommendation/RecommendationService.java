package com.menuapp.recommendation;
import com.menuapp.common.ApiException;
import com.menuapp.profile.*;
import com.menuapp.user.*;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class RecommendationService {
    public record Card(Long menuId,Long restaurantId,String menuName,String restaurantName,Category category,
                       int price,long distanceMeters,boolean preferred,List<String> ingredients) {}
    public record Result(String sessionId,int count,int availableCount,String message,List<Card> items) {}
    private record Candidate(Menu menu,double distance,double weight) {}
    private final UserRepository users;
    private final UserPreferenceRepository preferences;
    private final UserRestrictionRepository restrictions;
    private final MenuRepository menus;
    private final RecommendationLogRepository logs;
    private final FilterPolicy filter;
    public RecommendationService(UserRepository users,UserPreferenceRepository preferences,UserRestrictionRepository restrictions,
                                 MenuRepository menus,RecommendationLogRepository logs,FilterPolicy filter) {
        this.users=users;this.preferences=preferences;this.restrictions=restrictions;this.menus=menus;this.logs=logs;this.filter=filter;
    }
    @Transactional
    public Result recommend(Long userId,double lat,double lng) {
        if (!Double.isFinite(lat) || !Double.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180)
            throw new ApiException(HttpStatus.BAD_REQUEST,"INVALID_COORDINATES","위도는 -90~90, 경도는 -180~180의 유한한 숫자여야 합니다.");
        User user=users.findById(userId).orElseThrow(()->new ApiException(HttpStatus.UNAUTHORIZED,"UNAUTHORIZED","다시 로그인해 주세요."));
        var weights=preferences.findForUser(userId).stream().collect(Collectors.toMap(UserPreference::getCategory,UserPreference::getWeight));
        var blocked=restrictions.findForUser(userId).stream().map(UserRestriction::getIngredientName).toList();
        double latDelta=Math.toDegrees(1000.0/GeoDistance.EARTH_RADIUS_METERS);
        var candidates=menus.findCandidates(Math.max(-90,lat-latDelta),Math.min(90,lat+latDelta)).stream()
            .filter(m->filter.allowed(m,blocked))
            .map(m->new Candidate(m,GeoDistance.meters(lat,lng,m.getRestaurant().getLatitude(),m.getRestaurant().getLongitude()),weights.getOrDefault(m.getCategory(),0.0)))
            .filter(c->c.distance()<=1000.0)
            .sorted(Comparator.comparingDouble(Candidate::weight).reversed().thenComparingDouble(Candidate::distance).thenComparing(c->c.menu().getId()))
            .toList();
        String sessionId=UUID.randomUUID().toString();
        var selected=candidates.stream().limit(3).toList();
        logs.saveAll(selected.stream().map(c->new RecommendationLog(user,c.menu(),sessionId)).toList());
        var cards=selected.stream().map(c->new Card(c.menu().getId(),c.menu().getRestaurant().getId(),c.menu().getName(),
            c.menu().getRestaurant().getName(),c.menu().getCategory(),c.menu().getPrice(),Math.round(c.distance()),
            weights.containsKey(c.menu().getCategory()),c.menu().ingredientNames())).toList();
        String message=cards.isEmpty()?"조건에 맞는 메뉴가 없습니다. 알레르기 필터는 완화하지 않았습니다.":
            cards.size()<3?"조건에 맞는 메뉴가 "+cards.size()+"개뿐입니다. 가능한 메뉴만 표시합니다.":"등록된 제한 식재료를 제외한 메뉴입니다.";
        return new Result(sessionId,cards.size(),candidates.size(),message,cards);
    }
}
