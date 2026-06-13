package com.minierp.controller;

import com.minierp.entity.User;
import com.minierp.enums.UserRole;
import com.minierp.repository.UserRepository;
import com.minierp.security.JwtUtils;
import com.minierp.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> req) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.get("loginId"), req.get("password")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        String token = jwtUtils.generateToken(auth);
        UserDetailsImpl ud = (UserDetailsImpl) auth.getPrincipal();
        return ResponseEntity.ok(Map.of(
                "token", token,
                "id", ud.getId(),
                "loginId", ud.getUsername(),
                "name", ud.getName(),
                "role", ud.getRole()
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.existsByLoginId(user.getLoginId())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Login ID already taken"));
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if (user.getRole() == null) user.setRole(UserRole.SALES);
        User saved = userRepository.save(user);
        saved.setPassword(null);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl ud = (UserDetailsImpl) auth.getPrincipal();
        return ResponseEntity.ok(Map.of(
                "id", ud.getId(),
                "loginId", ud.getUsername(),
                "name", ud.getName(),
                "role", ud.getRole()
        ));
    }
}
