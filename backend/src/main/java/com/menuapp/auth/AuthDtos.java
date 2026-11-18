package com.menuapp.auth;
import com.menuapp.common.CredentialsPolicy;
import com.menuapp.common.ValidEmail;
import com.menuapp.common.ValidPassword;
public final class AuthDtos {
    private AuthDtos() {}
    public record Credentials(@ValidEmail String email, @ValidPassword String password) {
        public Credentials { email = CredentialsPolicy.normalizeEmail(email); }
    }
    public record UserView(Long id, String email, String nickname) {}
    public record AuthResponse(String accessToken, String tokenType, long expiresIn,
                               UserView user, String nextScreen) {}
}
