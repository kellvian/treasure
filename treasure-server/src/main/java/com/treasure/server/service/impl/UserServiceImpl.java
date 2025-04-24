package com.treasure.server.service.impl;

import cn.hutool.core.util.StrUtil;
import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.treasure.server.entity.User;
import com.treasure.server.mapper.UserMapper;
import com.treasure.server.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    @Value("${wechat.appid}")
    private String appid;
    
    @Value("${wechat.secret}")
    private String secret;
    
    // 微信登录获取openid的URL
    private static final String WX_LOGIN_URL = "https://api.weixin.qq.com/sns/jscode2session";

    @Override
    public User login(String username, String password) {
        if (StrUtil.isBlank(username) || StrUtil.isBlank(password)) {
            throw new RuntimeException("用户名或密码不能为空");
        }
        
        // 查询用户是否存在
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        User user = this.getOne(wrapper);
        
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        
        // 验证密码
        if (!BCrypt.checkpw(password, user.getPassword())) {
            throw new RuntimeException("密码错误");
        }
        
        // 检查用户状态
        if (!"active".equals(user.getStatus())) {
            throw new RuntimeException("账号已被禁用");
        }
        
        return user;
    }

    @Override
    public User wxLogin(String code, Object userInfo) {
        // 通过微信接口获取openid
        String openid = getWxOpenId(code);
        if (StrUtil.isBlank(openid)) {
            throw new RuntimeException("获取微信用户openid失败");
        }
        
        // 通过openid查询用户
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getOpenId, openid);
        User user = this.getOne(wrapper);
        
        // 用户不存在则自动注册
        if (user == null) {
            user = new User();
            user.setOpenId(openid);
            
            // 从userInfo中获取用户信息
            if (userInfo instanceof Map) {
                Map<String, Object> wxUserInfo = (Map<String, Object>) userInfo;
                user.setNickname((String) wxUserInfo.get("nickName"));
                user.setAvatar((String) wxUserInfo.get("avatarUrl"));
                user.setUsername("wx_" + openid.substring(0, 8));
                user.setPassword(BCrypt.hashpw(openid, BCrypt.gensalt()));
            }
            
            user.setPoints(0);
            user.setStatus("active");
            user.setCreateTime(LocalDateTime.now());
            user.setUpdateTime(LocalDateTime.now());
            
            this.save(user);
        }
        
        return user;
    }
    
    /**
     * 调用微信接口获取openid
     * @param code 微信授权码
     * @return openid
     */
    private String getWxOpenId(String code) {
        try {
            String url = WX_LOGIN_URL + "?appid=" + appid + "&secret=" + secret + "&js_code=" + code + "&grant_type=authorization_code";
            
            // 使用HttpClient或RestTemplate发送请求
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            
            // 解析返回的JSON
            JSONObject jsonObject = JSON.parseObject(response.getBody());
            log.info("微信登录返回: {}", jsonObject);
            
            if (jsonObject.containsKey("openid")) {
                return jsonObject.getString("openid");
            } else {
                log.error("获取微信openid失败: {}", jsonObject.getString("errmsg"));
                return null;
            }
        } catch (Exception e) {
            log.error("调用微信接口异常", e);
            return null;
        }
    }

    @Override
    @Transactional
    public boolean register(User user) {
        // 检查用户名是否已存在
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, user.getUsername());
        if (this.count(wrapper) > 0) {
            throw new RuntimeException("用户名已存在");
        }
        
        // 密码加密
        user.setPassword(BCrypt.hashpw(user.getPassword(), BCrypt.gensalt()));
        
        // 初始化用户数据
        user.setPoints(0);
        user.setStatus("active");
        user.setCreateTime(LocalDateTime.now());
        user.setUpdateTime(LocalDateTime.now());
        
        return this.save(user);
    }

    @Override
    @Transactional
    public boolean addPoints(Long userId, Integer points) {
        if (userId == null || points == null || points <= 0) {
            return false;
        }
        
        User user = this.getById(userId);
        if (user == null) {
            return false;
        }
        
        // 增加积分
        user.setPoints(user.getPoints() + points);
        user.setUpdateTime(LocalDateTime.now());
        
        return this.updateById(user);
    }
} 