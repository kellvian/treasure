package com.treasure.server.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("treasure")
public class Treasure {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private String name;
    
    private String description;
    
    private Double longitude;
    
    private Double latitude;
    
    private Integer points;
    
    private String status;  // active, inactive
    
    private LocalDateTime createTime;
    
    private LocalDateTime updateTime;
    
    @TableLogic
    private Integer deleted;
    
    // 标记宝藏是否已被当前用户收集，不映射到数据库
    @TableField(exist = false)
    private Boolean collected;
} 