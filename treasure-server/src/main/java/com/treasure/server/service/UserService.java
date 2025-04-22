package com.treasure.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.treasure.server.entity.User;

public interface UserService extends IService<User> {
    
    /**
     * 用户名密码登录
     * 
     * @param username 用户名
     * @param password 密码
     * @return 用户信息
     */
    User login(String username, String password);
    
    /**
     * 微信登录
     * 
     * @param code 微信登录code
     * @param userInfo 微信用户信息
     * @return 用户信息
     */
    User wxLogin(String code, Object userInfo);
    
    /**
     * 用户注册
     * 
     * @param user 用户信息
     * @return 是否成功
     */
    boolean register(User user);
    
    /**
     * 增加用户积分
     * 
     * @param userId 用户ID
     * @param points 积分
     * @return 是否成功
     */
    boolean addPoints(Long userId, Integer points);
} 