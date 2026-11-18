package com.menuapp.recommendation;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
@RestController
public class RecommendationController {
    private final RecommendationService recommendations;
    public RecommendationController(RecommendationService recommendations) { this.recommendations=recommendations; }
    @GetMapping("/api/recommendations")
    public RecommendationService.Result get(@AuthenticationPrincipal Long id,@RequestParam("lat") double lat,@RequestParam("lng") double lng) {
        return recommendations.recommend(id,lat,lng);
    }
}
