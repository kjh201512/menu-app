package com.menuapp.security;
import com.menuapp.user.UserRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtProvider jwt;
    private final UserRepository users;
    private final JsonAuthenticationEntryPoint entryPoint;
    public JwtAuthenticationFilter(JwtProvider jwt, UserRepository users, JsonAuthenticationEntryPoint entryPoint) {
        this.jwt = jwt; this.users = users; this.entryPoint = entryPoint;
    }
    @Override protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return "OPTIONS".equals(request.getMethod()) || path.equals("/api/auth/signup") || path.equals("/api/auth/login");
    }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                               FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null) { chain.doFilter(request, response); return; }
        try {
            if (!header.startsWith("Bearer ") || header.substring(7).isBlank()) throw new BadCredentialsException("Invalid bearer header");
            Long userId = jwt.parseUserId(header.substring(7));
            if (!users.existsById(userId)) throw new BadCredentialsException("Unknown user");
            var auth = new UsernamePasswordAuthenticationToken(userId, null, List.of());
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (JwtException | IllegalArgumentException | BadCredentialsException e) {
            SecurityContextHolder.clearContext();
            entryPoint.commence(request, response, new BadCredentialsException("Invalid access token"));
            return;
        }
        chain.doFilter(request, response);
    }
}
