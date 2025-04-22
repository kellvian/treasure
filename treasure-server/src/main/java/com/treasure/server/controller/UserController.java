package com.treasure.server.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.treasure.server.entity.User;
import com.treasure.server.service.UserService;
import com.treasure.server.utils.PasswordUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 获取用户列表，支持分页
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "pageSize", defaultValue = "10") int pageSize) {
        
        Page<User> pageRequest = new Page<>(page, pageSize);
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.orderByDesc(User::getCreateTime);
        
        Page<User> result = userService.page(pageRequest, queryWrapper);
        
        // 不返回密码
        result.getRecords().forEach(user -> user.setPassword(null));
        
        Map<String, Object> response = new HashMap<>();
        response.put("users", result.getRecords());
        response.put("total", result.getTotal());
        
        return ResponseEntity.ok(response);
    }

    /**
     * 获取单个用户信息
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> get(@PathVariable Long id) {
        User user = userService.getById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        
        // 不返回密码
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }

    /**
     * 添加用户
     */
    @PostMapping
    public ResponseEntity<User> add(@RequestBody User user) {
        // 检查用户名是否已存在
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getUsername, user.getUsername());
        if (userService.count(queryWrapper) > 0) {
            return ResponseEntity.badRequest().build();
        }
        
        // 确保角色有值，默认为普通用户
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("user");
        }
        
        // 如果是管理员，才需要处理密码
        if ("admin".equals(user.getRole()) && StringUtils.hasText(user.getPassword())) {
            // 使用MD5+盐加密密码
            user.setPassword(PasswordUtil.encrypt(user.getPassword()));
        }
        
        // 设置初始值
        user.setPoints(0);
        user.setStatus("active");
        user.setCreateTime(LocalDateTime.now());
        user.setUpdateTime(LocalDateTime.now());
        
        userService.save(user);
        
        // 不返回密码
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }

    /**
     * 更新用户
     */
    @PutMapping("/{id}")
    public ResponseEntity<User> update(@PathVariable Long id, @RequestBody User user) {
        User existingUser = userService.getById(id);
        if (existingUser == null) {
            return ResponseEntity.notFound().build();
        }
        
        // 设置ID
        user.setId(id);
        
        // 确保角色有值，默认保持原有角色
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole(existingUser.getRole());
        }
        
        // 如果是管理员，才处理密码
        if ("admin".equals(user.getRole())) {
            if (StringUtils.hasText(user.getPassword())) {
                // 如果提供了新密码，则加密
                user.setPassword(PasswordUtil.encrypt(user.getPassword()));
            } else {
                // 否则保留原密码
                user.setPassword(existingUser.getPassword());
            }
        } else {
            // 普通用户保留原密码
            user.setPassword(existingUser.getPassword());
        }
        
        // 保留创建时间
        user.setCreateTime(existingUser.getCreateTime());
        user.setUpdateTime(LocalDateTime.now());
        
        userService.updateById(user);
        
        // 不返回密码
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }

    /**
     * 删除用户
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        User user = userService.getById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        
        // 逻辑删除用户
        userService.removeById(id);
        return ResponseEntity.ok().build();
    }
} 