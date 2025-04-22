package com.treasure.server.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("treasure_record")
public class TreasureRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long userId;
    
    private Long treasureId;
    
    private Double longitude;
    
    private Double latitude;
    
    private Integer points;
    
    private LocalDateTime findTime;
} 