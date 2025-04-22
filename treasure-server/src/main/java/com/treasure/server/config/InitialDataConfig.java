package com.treasure.server.config;

import cn.hutool.crypto.digest.BCrypt;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.treasure.server.entity.User;
import com.treasure.server.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 初始化管理员账号
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class InitialDataConfig implements CommandLineRunner {

    private final UserService userService;

    @Override
    public void run(String... args) {
        initAdminUser();
    }

    /**
     * 初始化管理员账号
     */
    private void initAdminUser() {
        // 检查是否已经存在admin用户
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getUsername, "admin");
        
        if (userService.count(queryWrapper) == 0) {
            log.info("创建初始管理员账号...");
            
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(BCrypt.hashpw("admin123", BCrypt.gensalt())); // 使用BCrypt加密密码
            admin.setNickname("系统管理员");
            admin.setRole("admin");
            admin.setStatus("active");
            admin.setCreateTime(LocalDateTime.now());
            admin.setUpdateTime(LocalDateTime.now());
            admin.setPoints(0);
            
            userService.save(admin);
            
            log.info("管理员账号创建成功！");
        } else {
            log.info("管理员账号已存在，跳过初始化");
        }
    }
} 