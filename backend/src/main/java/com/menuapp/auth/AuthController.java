package com.menuapp.auth;
import com.menuapp.auth.AuthDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service;
    public AuthController(AuthService service) { this.service = service; }
    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody Credentials request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.signup(request));
    }
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody Credentials request) { return service.login(request); }
}
