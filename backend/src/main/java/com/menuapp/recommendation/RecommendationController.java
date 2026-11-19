package com.menuapp.recommendation;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
@RestController
public class RecommendationController {
    public record SelectRequest(@NotNull(message = "선택할 메뉴를 지정해 주세요.") Long menuId) {}
    public record RejectRequest(@NotNull(message = "위도를 입력해 주세요.") Double lat, @NotNull(message = "경도를 입력해 주세요.") Double lng) {}
    private final RecommendationService recommendations;
    public RecommendationController(RecommendationService recommendations) { this.recommendations=recommendations; }
    @GetMapping("/api/recommendations")
    public RecommendationService.Result get(@AuthenticationPrincipal Long id,@RequestParam("lat") double lat,@RequestParam("lng") double lng) {
        return recommendations.recommend(id,lat,lng);
    }
    @PostMapping("/api/recommendations/{sessionId}/select")
    public RecommendationService.Selection select(@AuthenticationPrincipal Long id, @PathVariable("sessionId") String sessionId, @Valid @RequestBody SelectRequest body) {
        return recommendations.select(id, sessionId, body.menuId());
    }
    @PostMapping("/api/recommendations/{sessionId}/reject")
    public RecommendationService.Result reject(@AuthenticationPrincipal Long id, @PathVariable("sessionId") String sessionId, @Valid @RequestBody RejectRequest body) {
        return recommendations.reject(id, sessionId, body.lat(), body.lng());
    }
}