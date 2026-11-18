package com.menuapp.user;
import com.menuapp.auth.AuthDtos.UserView;
import com.menuapp.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
/** US-01 세션 복원을 위한 보조 엔드포인트입니다. US-04 프로필 API는 구현하지 않습니다. */
@RestController
public class CurrentUserController {
    private final UserRepository users;
    public CurrentUserController(UserRepository users) { this.users = users; }
    @GetMapping("/api/users/me")
    public UserView me(@AuthenticationPrincipal Long userId) {
        User user = users.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "다시 로그인해 주세요."));
        return new UserView(user.getId(), user.getEmail(), user.getNickname());
    }
}
