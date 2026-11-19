package com.menuapp.restaurant;

import com.menuapp.profile.Category;
import com.menuapp.recommendation.Menu;
import com.menuapp.recommendation.MenuRepository;
import com.menuapp.recommendation.Restaurant;
import com.menuapp.recommendation.RestaurantRepository;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("demo")
public class CampusDataSeeder implements ApplicationRunner {

    private record M(String name, int price, String ingredients) {}

    private record R(String id, String name, double lat, double lng, Category category, String hours, int image, List<M> menus) {}

    private static final List<R> DATA = List.of(
            new R("cnu-01", "궁동 집밥", 36.3636, 127.3512, Category.KOREAN, "10:30-21:00", 1, List.of(
                    new M("된장찌개", 8000, "된장 두부 애호박 대두"),
                    new M("제육볶음", 9000, "돼지고기 고추장 양파 대두 밀"),
                    new M("비빔밥", 8500, "쌀 콩나물 시금치 달걀 고추장 대두 밀"))),
            new R("cnu-02", "든든 국밥", 36.3636, 127.3528, Category.KOREAN, null, 2, List.of(
                    new M("순대국밥", 9000, "돼지고기 순대 대파 들깨"),
                    new M("뼈해장국", 10000, "돼지고기 우거지 감자 들깨"))),
            new R("cnu-03", "한밭 칼국수", 36.3630, 127.3489, Category.KOREAN, "11:00-20:30", 3, List.of(
                    new M("바지락칼국수", 9000, "밀 바지락 애호박 대파"),
                    new M("김치만두", 6000, "밀 돼지고기 김치 두부 대두"))),
            new R("cnu-04", "심야 포차", 36.3617, 127.3488, Category.KOREAN, "22:00-04:00", 4, List.of(
                    new M("닭볶음탕", 22000, "닭고기 감자 고추장 대두 밀"),
                    new M("해물파전", 15000, "밀 오징어 새우 달걀 쪽파"))),
            new R("cnu-05", "궁동 차이나", 36.3630, 127.3504, Category.CHINESE, "11:00-21:30", 5, List.of(
                    new M("마파두부밥", 8500, "두부 돼지고기 대두 고추기름 쌀"),
                    new M("짜장면", 7000, "밀 돼지고기 춘장 양파 대두"),
                    new M("짬뽕", 8000, "밀 오징어 새우 홍합 돼지고기"))),
            new R("cnu-06", "마라공방", 36.3630, 127.3518, Category.CHINESE, "11:30-22:00", 6, List.of(
                    new M("마라탕", 10000, "청경채 숙주 두부 땅콩 대두 밀"),
                    new M("꿔바로우", 16000, "돼지고기 감자전분 설탕"))),
            new R("cnu-07", "스시 하루", 36.3630, 127.3531, Category.JAPANESE, "11:30-21:00", 7, List.of(
                    new M("모둠초밥", 15000, "쌀 연어 광어 새우 참치"),
                    new M("연어덮밥", 12000, "쌀 연어 양파 대두"))),
            new R("cnu-08", "카츠 연구소", 36.3623, 127.3492, Category.JAPANESE, "11:00-21:00", 8, List.of(
                    new M("규카츠", 16000, "소고기 밀 달걀 빵가루"),
                    new M("등심돈카츠", 10000, "돼지고기 밀 달걀 빵가루"))),
            new R("cnu-09", "라멘 유메", 36.3623, 127.3507, Category.JAPANESE, "11:00-21:00", 9, List.of(
                    new M("쇼유라멘", 9500, "밀 돼지고기 대두 달걀 김"),
                    new M("새우튀김우동", 9500, "밀 새우 달걀 대두"))),
            new R("cnu-10", "파스타 공방", 36.3623, 127.3521, Category.WESTERN, "11:00-22:00", 10, List.of(
                    new M("크림파스타", 12000, "밀 우유 버터 베이컨 돼지고기"),
                    new M("토마토파스타", 11000, "밀 토마토 마늘 올리브유"))),
            new R("cnu-11", "버거 스테이션", 36.3611, 127.3512, Category.WESTERN, "10:00-22:00", 11, List.of(
                    new M("더블치즈버거", 9500, "밀 소고기 치즈 우유 토마토 양상추"),
                    new M("감자튀김", 3500, "감자"))),
            new R("cnu-12", "궁동 분식", 36.3636, 127.3497, Category.SNACK, "09:00-21:00", 12, List.of(
                    new M("떡볶이", 4500, "떡 밀 고추장 어묵 대두"),
                    new M("순대", 5000, "돼지고기 순대 당면"),
                    new M("김밥", 4000, "쌀 달걀 단무지 시금치 햄 돼지고기"))),
            new R("cnu-13", "바삭 치킨", 36.3617, 127.3502, Category.CHICKEN, "15:00-02:00", 13, List.of(
                    new M("후라이드치킨", 19000, "닭고기 밀 대두"),
                    new M("양념치킨", 20000, "닭고기 밀 대두 고추장 땅콩"))),
            new R("cnu-14", "화덕 피자", 36.3617, 127.3517, Category.PIZZA, "11:00-22:00", 14, List.of(
                    new M("콤비네이션피자", 21000, "밀 치즈 우유 페퍼로니 돼지고기 피망 버섯 올리브"),
                    new M("마르게리타", 17000, "밀 치즈 우유 토마토 바질"))),
            new R("cnu-15", "사이공 쌀국수", 36.3617, 127.3530, Category.ASIAN, "10:30-21:00", 15, List.of(
                    new M("소고기쌀국수", 9500, "쌀국수 소고기 숙주 양파"),
                    new M("분짜", 11000, "쌀국수 돼지고기 상추 땅콩"))),
            new R("cnu-16", "샐러드 그린", 36.3610, 127.3526, Category.SALAD, "08:00-20:00", 16, List.of(
                    new M("그린샐러드", 8500, "양상추 방울토마토 당근 오이 올리브유"),
                    new M("닭가슴살샐러드", 9000, "닭고기 양상추 토마토 올리브유"))),
            new R("cnu-far", "둔산 버거 하우스", 36.3510, 127.3780, Category.WESTERN, "10:00-22:00", 11, List.of(
                    new M("치즈버거", 8000, "밀 소고기 치즈 우유"))));

    private final RestaurantRepository restaurants;
    private final MenuRepository menus;

    public CampusDataSeeder(RestaurantRepository restaurants, MenuRepository menus) {
        this.restaurants = restaurants;
        this.menus = menus;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (restaurants.existsByExternalPlaceId("cnu-01")) return;
        List<Menu> all = new ArrayList<>();
        for (R r : DATA) {
            String image = String.format("/images/food/r%02d.jpg", r.image());
            Restaurant saved = restaurants.save(new Restaurant(r.id(), r.name(), r.lat(), r.lng(), r.category(), r.hours(), image));
            for (M m : r.menus()) {
                all.add(new Menu(saved, m.name(), r.category(), m.price(), true, Arrays.asList(m.ingredients().split(" "))));
            }
        }
        menus.saveAll(all);
    }
}
