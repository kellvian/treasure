package com.treasure.server.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private String username;
    
    private String password;
    
    private String nickname;
    
    private String avatar;
    
    private String openId;
    
    private String phone;
    
    private String email;
    
    private Integer points;
    
    private String status;
    
    private LocalDateTime createTime;
    
    private LocalDateTime updateTime;

    private String role;
    
    @TableLogic
    private Integer deleted;
} 