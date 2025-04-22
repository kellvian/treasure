package com.treasure.server.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.treasure.server.entity.TreasureRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
@Repository
public interface TreasureRecordMapper extends BaseMapper<TreasureRecord> {
    
    /**
     * 获取用户排行榜（只包含普通用户，不包含管理员）
     * 
     * @param limit 限制数量
     * @return 排行榜数据
     */
    @Select("SELECT u.id, u.username, u.nickname, u.avatar, COUNT(tr.id) as treasureCount, " +
            "SUM(tr.points) as totalPoints " +
            "FROM treasure_record tr " +
            "JOIN user u ON tr.user_id = u.id " +
            "WHERE u.role = 'user' " +
            "GROUP BY tr.user_id " +
            "ORDER BY totalPoints DESC, treasureCount DESC " +
            "LIMIT #{limit}")
    List<Map<String, Object>> getUserRankingList(@Param("limit") int limit);
    
    /**
     * 获取每日收集统计
     */
    List<Map<String, Object>> getDailyCollectionStats(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    /**
     * 获取每周收集统计
     */
    List<Map<String, Object>> getWeeklyCollectionStats(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    /**
     * 获取每月收集统计
     */
    List<Map<String, Object>> getMonthlyCollectionStats(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
} 