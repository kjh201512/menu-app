package com.menuapp.profile;
import com.menuapp.profile.ProfileDtos.*;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/users/me")
public class ProfileController {
    private final ProfileService profiles;
    public ProfileController(ProfileService profiles) { this.profiles=profiles; }
    @GetMapping("/profile") public ProfileView get(@AuthenticationPrincipal Long id) { return profiles.get(id); }
    @PutMapping("/preferences") public ProfileView preferences(@AuthenticationPrincipal Long id,@Valid @RequestBody PreferencesRequest body) { return profiles.savePreferences(id,body); }
    @PutMapping("/restrictions") public ProfileView restrictions(@AuthenticationPrincipal Long id,@Valid @RequestBody RestrictionsRequest body) { return profiles.saveRestrictions(id,body); }
    @PostMapping("/restrictions") public ProfileView add(@AuthenticationPrincipal Long id,@Valid @RequestBody RestrictionInput body) { return profiles.addRestriction(id,body); }
}
