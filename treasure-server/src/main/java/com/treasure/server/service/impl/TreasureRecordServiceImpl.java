package com.treasure.server.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.treasure.server.entity.Treasure;
import com.treasure.server.entity.TreasureRecord;
import com.treasure.server.entity.User;
import com.treasure.server.mapper.TreasureMapper;
import com.treasure.server.mapper.TreasureRecordMapper;
import com.treasure.server.mapper.UserMapper;
import com.treasure.server.service.TreasureRecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TreasureRecordServiceImpl extends ServiceImpl<TreasureRecordMapper, TreasureRecord> implements TreasureRecordService {

    private final TreasureMapper treasureMapper;
    private final UserMapper userMapper;
    private final TreasureRecordMapper treasureRecordMapper;
    
    @Override
    public List<Map<String, Object>> getRecentActivities(int limit) {
        // 获取最近的寻宝记录
        LambdaQueryWrapper<TreasureRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(TreasureRecord::getFindTime)
               .last("LIMIT " + limit);
        List<TreasureRecord> records = this.list(wrapper);
        
        List<Map<String, Object>> activities = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        for (TreasureRecord record : records) {
            Map<String, Object> activity = new HashMap<>();
            
            // 获取相关用户和宝藏信息
            User user = userMapper.selectById(record.getUserId());
            Treasure treasure = treasureMapper.selectById(record.getTreasureId());
            
            if (user != null && treasure != null) {
                String username = user.getNickname() != null ? user.getNickname() : user.getUsername();
                String content = String.format("用户 %s 发现了宝藏 %s", username, treasure.getName());
                String time = record.getFindTime().format(formatter);
                
                activity.put("content", content);
                activity.put("time", time);
                activity.put("type", "success");
                
                activities.add(activity);
            }
        }
        
        return activities;
    }
    
    @Override
    public Map<String, Integer> getDailyTreasureCollectionTrend(LocalDateTime start, LocalDateTime end) {
        // 获取指定时间范围内的每日收集数据
        List<Map<String, Object>> records = treasureRecordMapper.getDailyCollectionStats(start, end);
        
        // 转换为日期->数量的映射
        Map<String, Integer> result = new HashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/dd");
        
        for (Map<String, Object> record : records) {
            // 安全地转换日期类型
            LocalDateTime date = convertToLocalDateTime(record.get("collect_date"));
            Integer count = ((Number) record.get("count")).intValue();
            
            result.put(date.format(formatter), count);
        }
        
        return result;
    }
    
    @Override
    public Map<String, Integer> getWeeklyTreasureCollectionTrend(LocalDateTime start, LocalDateTime end) {
        // 获取指定时间范围内的每周收集数据
        List<Map<String, Object>> records = treasureRecordMapper.getWeeklyCollectionStats(start, end);
        
        // 转换为周->数量的映射
        Map<String, Integer> result = new HashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-ww");
        
        for (Map<String, Object> record : records) {
            // 安全地转换日期类型
            LocalDateTime date = convertToLocalDateTime(record.get("collect_date"));
            Integer count = ((Number) record.get("count")).intValue();
            
            // 使用ISO周格式
            result.put(date.format(formatter), count);
        }
        
        return result;
    }
    
    @Override
    public Map<String, Integer> getMonthlyTreasureCollectionTrend(LocalDateTime start, LocalDateTime end) {
        // 获取指定时间范围内的每月收集数据
        List<Map<String, Object>> records = treasureRecordMapper.getMonthlyCollectionStats(start, end);
        
        // 转换为月份->数量的映射
        Map<String, Integer> result = new HashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy/MM");
        
        for (Map<String, Object> record : records) {
            // 安全地转换日期类型
            LocalDateTime date = convertToLocalDateTime(record.get("collect_date"));
            Integer count = ((Number) record.get("count")).intValue();
            
            result.put(date.format(formatter), count);
        }
        
        return result;
    }
    
    /**
     * 安全地将各种日期类型转换为LocalDateTime
     * @param dateValue 日期值对象
     * @return LocalDateTime对象
     */
    private LocalDateTime convertToLocalDateTime(Object dateValue) {
        if (dateValue == null) {
            return LocalDateTime.now(); // 或者返回null，取决于业务需求
        }
        
        if (dateValue instanceof LocalDateTime) {
            return (LocalDateTime) dateValue;
        } else if (dateValue instanceof java.sql.Timestamp) {
            return ((java.sql.Timestamp) dateValue).toLocalDateTime();
        } else if (dateValue instanceof java.sql.Date) {
            return ((java.sql.Date) dateValue).toLocalDate().atStartOfDay();
        } else if (dateValue instanceof java.util.Date) {
            return new java.sql.Timestamp(((java.util.Date) dateValue).getTime()).toLocalDateTime();
        } else if (dateValue instanceof String) {
            try {
                // 尝试解析日期字符串，这里假设格式为yyyy-MM-dd
                return LocalDateTime.parse((String) dateValue, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            } catch (Exception e) {
                try {
                    // 如果是日期格式而非日期时间格式
                    return LocalDateTime.parse((String) dateValue + " 00:00:00", 
                                              DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                } catch (Exception ex) {
                    log.error("Cannot parse date string: {}", dateValue, ex);
                    return LocalDateTime.now(); // 或返回null
                }
            }
        }
        
        log.warn("Unknown date type: {}, class: {}", dateValue, dateValue.getClass().getName());
        return LocalDateTime.now(); // 或返回null
    }
} 