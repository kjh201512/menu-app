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
    public record Selection(String sessionId, Long menuId, Long restaurantId, String menuName, String restaurantName) {}
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
        validateCoordinates(lat,lng);
        return build(requireUser(userId),lat,lng,UUID.randomUUID().toString(),Set.of());
    }
    @Transactional
    public Result reject(Long userId,String sessionId,double lat,double lng) {
        validateCoordinates(lat,lng);
        User user=requireUser(userId);
        List<RecommendationLog> session=logs.findSession(userId,sessionId);
        if (session.isEmpty())
            throw new ApiException(HttpStatus.NOT_FOUND,"RECOMMENDATION_NOT_FOUND","추천 기록을 찾을 수 없습니다. 추천을 다시 받아 주세요.");
        if (session.stream().anyMatch(l->l.getStatus()==RecommendationLog.Status.SELECTED))
            throw new ApiException(HttpStatus.CONFLICT,"ALREADY_SELECTED","이미 메뉴를 선택한 추천입니다. 홈에서 새로 추천받아 주세요.");
        session.stream().filter(l->l.getStatus()==RecommendationLog.Status.SHOWN).forEach(RecommendationLog::reject);
        Set<Long> excluded=session.stream().map(l->l.getMenu().getId()).collect(Collectors.toSet());
        return build(user,lat,lng,sessionId,excluded);
    }
    private Result build(User user,double lat,double lng,String sessionId,Set<Long> excluded) {
        Long userId=user.getId();
        var weights=preferences.findForUser(userId).stream().collect(Collectors.toMap(UserPreference::getCategory,UserPreference::getWeight));
        var blocked=restrictions.findForUser(userId).stream().map(UserRestriction::getIngredientName).toList();
        double latDelta=Math.toDegrees(1000.0/GeoDistance.EARTH_RADIUS_METERS);
        var candidates=menus.findCandidates(Math.max(-90,lat-latDelta),Math.min(90,lat+latDelta)).stream()
            .filter(m->!excluded.contains(m.getId()))
            .filter(m->filter.allowed(m,blocked))
            .map(m->new Candidate(m,GeoDistance.meters(lat,lng,m.getRestaurant().getLatitude(),m.getRestaurant().getLongitude()),weights.getOrDefault(m.getCategory(),0.0)))
            .filter(c->c.distance()<=1000.0)
            .sorted(Comparator.comparingDouble(Candidate::weight).reversed().thenComparingDouble(Candidate::distance).thenComparing(c->c.menu().getId()))
            .toList();
        var selected=candidates.stream().limit(3).toList();
        logs.saveAll(selected.stream().map(c->new RecommendationLog(user,c.menu(),sessionId)).toList());
        var cards=selected.stream().map(c->new Card(c.menu().getId(),c.menu().getRestaurant().getId(),c.menu().getName(),
            c.menu().getRestaurant().getName(),c.menu().getCategory(),c.menu().getPrice(),Math.round(c.distance()),
            weights.containsKey(c.menu().getCategory()),c.menu().ingredientNames())).toList();
        return new Result(sessionId,cards.size(),candidates.size(),message(cards.size(),!excluded.isEmpty()),cards);
    }
    private String message(int count,boolean reroll) {
        if (count==0) return reroll?"추천할 수 있는 메뉴를 모두 보여드렸어요. 홈에서 조건을 바꾸거나 새로 추천받아 주세요."
            :"조건에 맞는 메뉴가 없습니다. 알레르기 필터는 완화하지 않았습니다.";
        if (count<3) return (reroll?"남은 메뉴가 ":"조건에 맞는 메뉴가 ")+count+"개뿐입니다. 가능한 메뉴만 표시합니다.";
        return reroll?"이전에 본 메뉴를 제외한 새 메뉴입니다.":"등록된 제한 식재료를 제외한 메뉴입니다.";
    }
    @Transactional
    public Selection select(Long userId, String sessionId, Long menuId) {
        List<RecommendationLog> session = logs.findSession(userId, sessionId);
        if (session.isEmpty())
            throw new ApiException(HttpStatus.NOT_FOUND, "RECOMMENDATION_NOT_FOUND", "추천 기록을 찾을 수 없습니다. 추천을 다시 받아 주세요.");
        RecommendationLog chosen = session.stream()
            .filter(l -> l.getMenu().getId().equals(menuId) && l.getStatus() != RecommendationLog.Status.REJECTED).findFirst()
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "MENU_NOT_RECOMMENDED", "현재 추천된 메뉴 중에서만 선택할 수 있습니다."));
        boolean otherSelected = session.stream().anyMatch(l -> l != chosen && l.getStatus() == RecommendationLog.Status.SELECTED);
        if (otherSelected)
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_SELECTED", "이미 다른 메뉴를 선택했습니다. 추천을 다시 받아 주세요.");
        chosen.select();
        Menu menu = chosen.getMenu();
        return new Selection(sessionId, menu.getId(), menu.getRestaurant().getId(), menu.getName(), menu.getRestaurant().getName());
    }
    private void validateCoordinates(double lat,double lng) {
        if (!Double.isFinite(lat) || !Double.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180)
            throw new ApiException(HttpStatus.BAD_REQUEST,"INVALID_COORDINATES","위도는 -90~90, 경도는 -180~180의 유한한 숫자여야 합니다.");
    }
    private User requireUser(Long userId) {
        return users.findById(userId).orElseThrow(()->new ApiException(HttpStatus.UNAUTHORIZED,"UNAUTHORIZED","다시 로그인해 주세요."));
    }
}