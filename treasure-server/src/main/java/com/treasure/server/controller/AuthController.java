package com.treasure.server.controller;

import com.treasure.server.common.Result;
import com.treasure.server.entity.User;
import com.treasure.server.service.UserService;
import com.treasure.server.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    /**
     * 用户登录接口
     */
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody Map<String, String> loginForm) {
        try {
            String username = loginForm.get("username");
            String password = loginForm.get("password");
            
            User user = userService.login(username, password);
            String token = jwtUtil.generateToken(user.getId());
            
            Map<String, Object> result = new HashMap<>();
            result.put("token", token);
            
            // 组装前端需要的用户信息，移除敏感信息
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("username", user.getUsername());
            userInfo.put("nickname", user.getNickname());
            userInfo.put("avatar", user.getAvatar());
            userInfo.put("points", user.getPoints());
            result.put("userInfo", userInfo);
            
            return Result.success(result);
        } catch (Exception e) {
            log.error("登录失败：{}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }

    /**
     * 微信登录接口
     */
    @PostMapping("/wechat")
    public Result<Map<String, Object>> wxLogin(@RequestBody Map<String, Object> loginForm) {
        try {
            String code = (String) loginForm.get("code");
            Object userInfo = loginForm.get("userInfo");
            
            User user = userService.wxLogin(code, userInfo);
            String token = jwtUtil.generateToken(user.getId());
            
            Map<String, Object> result = new HashMap<>();
            result.put("token", token);
            
            // 组装前端需要的用户信息，移除敏感信息
            Map<String, Object> userInfoMap = new HashMap<>();
            userInfoMap.put("id", user.getId());
            userInfoMap.put("username", user.getUsername());
            userInfoMap.put("nickname", user.getNickname());
            userInfoMap.put("avatar", user.getAvatar());
            userInfoMap.put("points", user.getPoints());
            result.put("userInfo", userInfoMap);
            
            return Result.success(result);
        } catch (Exception e) {
            log.error("微信登录失败：{}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }

    /**
     * 用户注册接口
     */
    @PostMapping("/register")
    public Result<Void> register(@RequestBody User user) {
        try {
            boolean success = userService.register(user);
            return success ? Result.success() : Result.error("注册失败");
        } catch (Exception e) {
            log.error("注册失败：{}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }
} 