package com.treasure.server.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.treasure.server.entity.TreasureRecord;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface TreasureRecordService extends IService<TreasureRecord> {
    
    /**
     * 获取最近的寻宝活动记录
     * 
     * @param limit 限制数量
     * @return 最近活动列表
     */
    List<Map<String, Object>> getRecentActivities(int limit);
    
    /**
     * 获取每日宝藏收集趋势
     */
    Map<String, Integer> getDailyTreasureCollectionTrend(LocalDateTime start, LocalDateTime end);
    
    /**
     * 获取每周宝藏收集趋势
     */
    Map<String, Integer> getWeeklyTreasureCollectionTrend(LocalDateTime start, LocalDateTime end);
    
    /**
     * 获取每月宝藏收集趋势
     */
    Map<String, Integer> getMonthlyTreasureCollectionTrend(LocalDateTime start, LocalDateTime end);
} 