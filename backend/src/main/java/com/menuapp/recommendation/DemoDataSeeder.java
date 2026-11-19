package com.menuapp.recommendation;
import com.menuapp.profile.Category;
import java.util.List;
import org.springframework.boot.*;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
/** 가상의 메뉴/식당. 외부 API나 실제 알레르겐 정보가 아닙니다. demo 프로필에서만 로드합니다. */
@Component @Profile("demo")
public class DemoDataSeeder implements ApplicationRunner {
    private final RestaurantRepository restaurants;
    private final MenuRepository menus;
    public DemoDataSeeder(RestaurantRepository restaurants,MenuRepository menus) { this.restaurants=restaurants;this.menus=menus; }
    @Override @Transactional public void run(ApplicationArguments args) {
        if (restaurants.existsByExternalPlaceId("demo-korean")) return;
        Restaurant korean=restaurants.save(new Restaurant("demo-korean","데모 한식당",37.5670,126.9783,Category.KOREAN,"10:30-21:00"));
        Restaurant japanese=restaurants.save(new Restaurant("demo-japanese","데모 일본식당",37.5660,126.9788,Category.JAPANESE,"11:30-21:00"));
        Restaurant western=restaurants.save(new Restaurant("demo-western","데모 양식당",37.5680,126.9790,Category.WESTERN,"22:00-04:00"));
        Restaurant salad=restaurants.save(new Restaurant("demo-salad","데모 샐러드집",37.5668,126.9775,Category.SALAD,null));
        Restaurant far=restaurants.save(new Restaurant("demo-far","반경 밖 데모 식당",37.6000,126.9780,Category.KOREAN,"10:00-22:00"));
        menus.saveAll(List.of(
            new Menu(korean,"채소 비빔밥",Category.KOREAN,8500,true,List.of("쌀","당근","시금치","참기름")),
            new Menu(korean,"소고기 덮밥",Category.KOREAN,10000,true,List.of("쌀","소고기","대두","밀")),
            new Menu(korean,"달걀 볶음밥",Category.KOREAN,8000,true,List.of("쌀","달걀","대두")),
            new Menu(japanese,"새우 우동",Category.JAPANESE,9000,true,List.of("밀","새우","대두")),
            new Menu(japanese,"연어 덮밥",Category.JAPANESE,12000,true,List.of("쌀","연어","대두")),
            new Menu(western,"크림 파스타",Category.WESTERN,13000,true,List.of("밀","우유","달걀")),
            new Menu(salad,"닭가슴살 샐러드",Category.SALAD,9500,true,List.of("닭고기","양상추","토마토")),
            new Menu(salad,"견과 샐러드",Category.SALAD,9000,true,List.of("양상추","땅콩","호두")),
            new Menu(korean,"식재료 미확인 메뉴(제외)",Category.KOREAN,7000,false,List.of()),
            new Menu(far,"반경 밖 비빔밥(제외)",Category.KOREAN,8000,true,List.of("쌀","당근"))
        ));
    }
}
