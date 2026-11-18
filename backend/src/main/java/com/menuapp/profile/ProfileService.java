package com.menuapp.profile;
import com.menuapp.common.ApiException;
import com.menuapp.profile.ProfileDtos.*;
import com.menuapp.user.*;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class ProfileService {
    private final UserRepository users;
    private final UserPreferenceRepository preferences;
    private final UserRestrictionRepository restrictions;
    public ProfileService(UserRepository users, UserPreferenceRepository preferences, UserRestrictionRepository restrictions) {
        this.users=users;this.preferences=preferences;this.restrictions=restrictions;
    }
    @Transactional(readOnly=true)
    public ProfileView get(Long userId) { return view(requireUser(userId)); }
    @Transactional
    public ProfileView savePreferences(Long userId, PreferencesRequest request) {
        User user=lockUser(userId);
        if (request.categories()==null || request.categories().isEmpty())
            throw new ApiException(HttpStatus.BAD_REQUEST,"PREFERENCE_REQUIRED","선호 카테고리를 1개 이상 선택해 주세요.");
        var unique=new LinkedHashSet<>(request.categories());
        if (unique.size()!=request.categories().size()) throw new ApiException(HttpStatus.CONFLICT,"DUPLICATE_CATEGORY","같은 카테고리를 중복 선택할 수 없습니다.");
        var weights=preferences.findForUser(userId).stream().collect(Collectors.toMap(UserPreference::getCategory,UserPreference::getWeight));
        preferences.deleteForUser(userId);
        preferences.saveAllAndFlush(unique.stream().map(c->new UserPreference(user,c,weights.getOrDefault(c,1.0))).toList());
        return view(user);
    }
    @Transactional
    public ProfileView saveRestrictions(Long userId, RestrictionsRequest request) {
        User user=lockUser(userId);
        List<RestrictionInput> clean=normalize(request.items()); // 삭제 전에 전체 검증
        restrictions.deleteForUser(userId);
        restrictions.saveAllAndFlush(clean.stream().map(r->new UserRestriction(user,r.ingredientName(),r.type())).toList());
        user.completeRestrictions();
        return view(user);
    }
    /** 단일 추가 확장: 이미 저장된 식재료는 타입이 달라도 중복 거부. */
    @Transactional
    public ProfileView addRestriction(Long userId, RestrictionInput input) {
        User user=lockUser(userId);
        RestrictionInput clean=normalize(List.of(input)).get(0);
        if (restrictions.existsByUser_IdAndIngredientName(userId,clean.ingredientName())) throw duplicate();
        if (restrictions.findForUser(userId).size()>=100) throw new ApiException(HttpStatus.BAD_REQUEST,"LIMIT_EXCEEDED","최대 100개까지 등록할 수 있습니다.");
        restrictions.saveAndFlush(new UserRestriction(user,clean.ingredientName(),clean.type()));
        return view(user); // 단계 완료는 PUT 저장/건너뛰기로 확정
    }
    private List<RestrictionInput> normalize(List<RestrictionInput> items) {
        if (items==null) throw new ApiException(HttpStatus.BAD_REQUEST,"VALIDATION_ERROR","items 배열을 입력해 주세요.");
        Set<String> seen=new HashSet<>();List<RestrictionInput> clean=new ArrayList<>();
        for (RestrictionInput item:items) {
            String name=IngredientNormalizer.normalize(item.ingredientName());
            if (name.isBlank() || name.codePointCount(0,name.length())>50)
                throw new ApiException(HttpStatus.BAD_REQUEST,"VALIDATION_ERROR","식재료 이름은 1~50자로 입력해 주세요.");
            if (!seen.add(name)) throw duplicate();
            clean.add(new RestrictionInput(name,item.type()));
        }
        return clean;
    }
    private ApiException duplicate() { return new ApiException(HttpStatus.CONFLICT,"DUPLICATE_RESTRICTION","이미 등록한 식재료입니다. 알레르기/비선호 간에도 중복 등록할 수 없습니다."); }
    private ProfileView view(User user) {
        var p=preferences.findForUser(user.getId()).stream().map(UserPreference::getCategory).toList();
        var r=restrictions.findForUser(user.getId()).stream().map(x->new RestrictionInput(x.getIngredientName(),x.getType())).toList();
        return new ProfileView(p,r,user.isRestrictionsCompleted(),!p.isEmpty() && user.isRestrictionsCompleted());
    }
    private User requireUser(Long id) { return users.findById(id).orElseThrow(this::unauthorized); }
    private User lockUser(Long id) { return users.lockById(id).orElseThrow(this::unauthorized); }
    private ApiException unauthorized() { return new ApiException(HttpStatus.UNAUTHORIZED,"UNAUTHORIZED","다시 로그인해 주세요."); }
}
