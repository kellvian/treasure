package com.treasure.server.util;

import cn.hutool.core.date.DateUtil;
import cn.hutool.jwt.JWT;
import cn.hutool.jwt.JWTPayload;
import cn.hutool.jwt.JWTUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    private static final String USER_ID_KEY = "userId";

    /**
     * 生成token
     */
    public String generateToken(Long userId) {
        Date now = new Date();
        Date expireTime = new Date(now.getTime() + expiration);

        Map<String, Object> payload = new HashMap<>();
        // 签发时间
        payload.put(JWTPayload.ISSUED_AT, now);
        // 过期时间
        payload.put(JWTPayload.EXPIRES_AT, expireTime);
        // 生效时间
        payload.put(JWTPayload.NOT_BEFORE, now);
        // 用户ID
        payload.put(USER_ID_KEY, userId);

        // 使用Hutool的JWTUtil生成token
        return JWTUtil.createToken(payload, secret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * 从token中获取用户ID
     */
    public Long getUserIdFromToken(String token) {
        try {
            JWT jwt = JWTUtil.parseToken(token);
            Object userIdObj = jwt.getPayload().getClaim(USER_ID_KEY);
            if (userIdObj != null) {
                return Long.valueOf(userIdObj.toString());
            }
            return null;
        } catch (Exception e) {
            log.error("从Token获取用户ID失败：{}", e.getMessage());
            return null;
        }
    }

    /**
     * 验证token是否有效
     */
    public Boolean validateToken(String token) {
        try {
            JWT jwt = JWTUtil.parseToken(token);
            
            // 验证签名
            boolean verify = jwt.setKey(secret.getBytes(StandardCharsets.UTF_8)).verify();
            if (!verify) {
                return false;
            }
            
            // 验证是否过期
            return !isTokenExpired(jwt);
        } catch (Exception e) {
            log.error("Token验证失败：{}", e.getMessage());
            return false;
        }
    }

    /**
     * 检查token是否已过期
     */
    private Boolean isTokenExpired(JWT jwt) {
        Date expiration = jwt.getPayload().getClaimsJson().getDate(JWTPayload.EXPIRES_AT);
        return expiration.before(new Date());
    }
} 