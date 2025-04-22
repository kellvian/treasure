package com.treasure.server.utils;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

/**
 * 密码工具类，用于密码加密和验证
 */
public class PasswordUtil {
    
    // 固定盐值，实际应用中可以为每个用户生成不同的盐
    private static final String SALT = "treasure_hunt_salt";
    
    /**
     * 使用MD5+盐对密码进行加密
     * @param password 原始密码
     * @return 加密后的密码
     */
    public static String encrypt(String password) {
        if (password == null || password.isEmpty()) {
            return null;
        }
        
        try {
            // 加盐
            String saltedPassword = password + SALT;
            
            // 创建MD5摘要器
            MessageDigest md = MessageDigest.getInstance("MD5");
            
            // 计算MD5值
            byte[] digest = md.digest(saltedPassword.getBytes());
            
            // Base64编码
            return Base64.getEncoder().encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("加密失败", e);
        }
    }
    
    /**
     * 验证密码是否正确
     * @param rawPassword 原始密码
     * @param encodedPassword 加密后的密码
     * @return 是否匹配
     */
    public static boolean matches(String rawPassword, String encodedPassword) {
        if (rawPassword == null || encodedPassword == null) {
            return false;
        }
        
        String newEncoded = encrypt(rawPassword);
        return encodedPassword.equals(newEncoded);
    }
} 