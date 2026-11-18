package com.menuapp.auth;
import com.menuapp.auth.AuthDtos.*;
import com.menuapp.common.ApiException;
import com.menuapp.security.JwtProvider;
import com.menuapp.user.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtProvider jwt;
    private final String dummyHash;
    public AuthService(UserRepository users, PasswordEncoder encoder, JwtProvider jwt) {
        this.users = users; this.encoder = encoder; this.jwt = jwt;
        this.dummyHash = encoder.encode("dummy-password-for-timing-only");
    }
    @Transactional
    public AuthResponse signup(Credentials request) {
        if (users.existsByEmail(request.email())) throw duplicateEmail();
        User user;
        try {
            // DB UNIQUE 제약이 동시 가입을 최종 방어합니다. 실패 후 동일 트랜잭션에서 조회하지 않습니다.
            user = users.saveAndFlush(new User(request.email(), encoder.encode(request.password()), "사용자"));
        } catch (DataIntegrityViolationException e) {
            if (isEmailConflict(e)) throw duplicateEmail();
            throw e;
        }
        return response(user, "ONBOARDING");
    }
    @Transactional(readOnly = true)
    public AuthResponse login(Credentials request) {
        User user = users.findByEmail(request.email()).orElse(null);
        boolean matches = encoder.matches(request.password(), user == null ? dummyHash : user.getPasswordHash());
        if (user == null || !matches) throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다.");
        return response(user, "HOME");
    }
    private AuthResponse response(User user, String nextScreen) {
        return new AuthResponse(jwt.issue(user.getId()), "Bearer", jwt.ttlSeconds(),
            new UserView(user.getId(), user.getEmail(), user.getNickname()), nextScreen);
    }
    private ApiException duplicateEmail() {
        return new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "이미 가입된 이메일입니다. 로그인해 주세요.");
    }
    private boolean isEmailConflict(Throwable error) {
        for (Throwable cause = error; cause != null; cause = cause.getCause()) {
            if (cause instanceof org.hibernate.exception.ConstraintViolationException constraint
                    && constraint.getConstraintName() != null
                    && constraint.getConstraintName().toLowerCase(java.util.Locale.ROOT).contains("uk_users_email")) return true;
        }
        return false;
    }
}
