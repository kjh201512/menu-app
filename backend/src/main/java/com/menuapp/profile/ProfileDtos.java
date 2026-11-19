package com.menuapp.profile;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
public final class ProfileDtos {
    private ProfileDtos() {}
    public record PreferencesRequest(@NotEmpty(message="선호 카테고리를 1개 이상 선택해 주세요.")
        @Size(max=9) List<@NotNull Category> categories) {}
    public record RestrictionInput(@NotBlank(message="식재료 이름을 입력해 주세요.") @Size(max=50) String ingredientName,
                                   @NotNull RestrictionType type) {}
    public record RestrictionsRequest(@NotNull @Size(max=100) List<@NotNull @Valid RestrictionInput> items) {}
    public record ProfileView(List<Category> preferences, List<RestrictionInput> restrictions,
                              boolean restrictionsCompleted, boolean onboardingCompleted) {}
}
