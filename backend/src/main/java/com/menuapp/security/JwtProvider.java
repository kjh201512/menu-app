package com.menuapp.security;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
@Component
public class JwtProvider {
    private static final String ISSUER = "menu-app";
    private final SecretKey key;
    private final long ttlSeconds;
    public JwtProvider(@Value("${app.jwt.secret-base64}") String secret,
                       @Value("${app.jwt.ttl-seconds}") long ttlSeconds) {
        byte[] bytes = Decoders.BASE64.decode(secret);
        if (bytes.length < 32) throw new IllegalArgumentException("JWT secret must be at least 32 bytes");
        if (ttlSeconds <= 0) throw new IllegalArgumentException("JWT TTL must be positive");
        this.key = Keys.hmacShaKeyFor(bytes);
        this.ttlSeconds = ttlSeconds;
    }
    public String issue(Long userId) {
        Instant now = Instant.now();
        return Jwts.builder().issuer(ISSUER).subject(userId.toString())
            .issuedAt(Date.from(now)).expiration(Date.from(now.plusSeconds(ttlSeconds)))
            .signWith(key, Jwts.SIG.HS256).compact();
    }
    public Long parseUserId(String token) {
        Jws<Claims> parsed = Jwts.parser().verifyWith(key).requireIssuer(ISSUER)
            .build().parseSignedClaims(token);
        if (!"HS256".equals(parsed.getHeader().getAlgorithm())) throw new IllegalArgumentException("Unexpected algorithm");
        Claims claims = parsed.getPayload();
        if (claims.getExpiration() == null || claims.getIssuedAt() == null) throw new IllegalArgumentException("Missing time claims");
        long id = Long.parseLong(claims.getSubject());
        if (id <= 0) throw new IllegalArgumentException("Invalid subject");
        return id;
    }
    public long ttlSeconds() { return ttlSeconds; }
}
