package com.menuapp.recommendation;
import com.menuapp.profile.IngredientNormalizer;
import java.util.Collection;
import org.springframework.stereotype.Component;
@Component
public class FilterPolicy {
    public boolean allowed(Menu menu,Collection<String> restrictedIngredients) {
        // 식재료 정보가 없거나 불완전한 메뉴는 안전측으로 제외합니다.
        var names=menu.ingredientNames();
        return menu.isIngredientsComplete() && !names.isEmpty() && names.stream().noneMatch(
            i->restrictedIngredients.stream().anyMatch(r->IngredientNormalizer.conflicts(i,r)));
    }
}
