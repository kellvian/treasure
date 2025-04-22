package com.treasure.server.service.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.treasure.server.entity.Treasure;
import com.treasure.server.entity.TreasureRecord;
import com.treasure.server.mapper.TreasureMapper;
import com.treasure.server.mapper.TreasureRecordMapper;
import com.treasure.server.service.TreasureService;
import com.treasure.server.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TreasureServiceImpl extends ServiceImpl<TreasureMapper, Treasure> implements TreasureService {

    private final TreasureRecordMapper treasureRecordMapper;
    private final UserService userService;

    @Override
    public List<Treasure> getActiveTreasures() {
        LambdaQueryWrapper<Treasure> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Treasure::getStatus, "active");
        return this.list(wrapper);
    }

    @Override
    public IPage<Treasure> getTreasurePage(Page<Treasure> page) {
        return this.page(page);
    }

    /**
     * 分页查询带状态筛选的宝藏列表
     */
    @Override
    public IPage<Treasure> getTreasurePage(Page<Treasure> page, String status) {
        LambdaQueryWrapper<Treasure> wrapper = new LambdaQueryWrapper<>();
        
        // 如果提供了状态参数，则按状态筛选
        if (status != null && !status.isEmpty()) {
            wrapper.eq(Treasure::getStatus, status);
        }
        
        // 按创建时间降序排序
        wrapper.orderByDesc(Treasure::getCreateTime);
        
        return this.page(page, wrapper);
    }

    @Override
    @Transactional
    public boolean addTreasure(Treasure treasure) {
        if (treasure == null || StrUtil.isBlank(treasure.getName())) {
            return false;
        }
        
        // 设置默认值
        if (treasure.getStatus() == null) {
            treasure.setStatus("active");
        }
        treasure.setCreateTime(LocalDateTime.now());
        treasure.setUpdateTime(LocalDateTime.now());
        
        return this.save(treasure);
    }

    @Override
    @Transactional
    public boolean updateTreasure(Treasure treasure) {
        if (treasure == null || treasure.getId() == null) {
            return false;
        }
        
        treasure.setUpdateTime(LocalDateTime.now());
        return this.updateById(treasure);
    }

    @Override
    @Transactional
    public boolean updateTreasureStatus(Long treasureId, String status) {
        if (treasureId == null || StrUtil.isBlank(status)) {
            return false;
        }
        
        Treasure treasure = this.getById(treasureId);
        if (treasure == null) {
            return false;
        }
        
        treasure.setStatus(status);
        treasure.setUpdateTime(LocalDateTime.now());
        
        return this.updateById(treasure);
    }

    @Override
    @Transactional
    public boolean deleteTreasure(Long treasureId) {
        if (treasureId == null) {
            return false;
        }
        
        return this.removeById(treasureId);
    }

    @Override
    @Transactional
    public TreasureRecord findTreasure(Long userId, Long treasureId, Double longitude, Double latitude) {
        // 验证参数
        if (userId == null || treasureId == null || longitude == null || latitude == null) {
            throw new RuntimeException("参数错误");
        }
        
        // 查询宝藏是否存在
        Treasure treasure = this.getById(treasureId);
        if (treasure == null) {
            throw new RuntimeException("宝藏不存在");
        }
        
        // 检查宝藏是否处于激活状态
        if (!"active".equals(treasure.getStatus())) {
            throw new RuntimeException("该宝藏尚未激活");
        }
        
        // 检查用户是否已经找到过该宝藏
        LambdaQueryWrapper<TreasureRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TreasureRecord::getUserId, userId)
               .eq(TreasureRecord::getTreasureId, treasureId);
        List<TreasureRecord> records = treasureRecordMapper.selectList(wrapper);
        
        if (CollUtil.isNotEmpty(records)) {
            throw new RuntimeException("您已经找到过该宝藏");
        }
        
        // 计算距离（简单计算，实际项目中应使用更精确的距离计算公式）
        double distance = calculateDistance(latitude, longitude, treasure.getLatitude(), treasure.getLongitude());
        
        // 检查距离是否在范围内（5米以内）
        if (distance > 5) {
            throw new RuntimeException("距离太远，无法找到宝藏");
        }
        
        // 创建寻宝记录
        TreasureRecord record = new TreasureRecord();
        record.setUserId(userId);
        record.setTreasureId(treasureId);
        record.setLongitude(longitude);
        record.setLatitude(latitude);
        record.setPoints(treasure.getPoints());
        record.setFindTime(LocalDateTime.now());
        
        treasureRecordMapper.insert(record);
        
        // 增加用户积分
        userService.addPoints(userId, treasure.getPoints());
        
        return record;
    }
    
    /**
     * 计算两点间的距离（单位：米）
     * 使用Haversine公式计算球面两点间的距离
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        // 地球平均半径，单位：米
        final double EARTH_RADIUS = 6371000;
        
        // 将经纬度转换为弧度
        double radLat1 = Math.toRadians(lat1);
        double radLon1 = Math.toRadians(lon1);
        double radLat2 = Math.toRadians(lat2);
        double radLon2 = Math.toRadians(lon2);
        
        // Haversine公式
        double dLat = radLat2 - radLat1;
        double dLon = radLon2 - radLon1;
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(radLat1) * Math.cos(radLat2) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        // 计算距离
        return EARTH_RADIUS * c;
    }

    @Override
    public List<Treasure> getActiveTreasuresWithCollectionStatus(Long userId) {
        // 获取所有激活的宝藏
        List<Treasure> treasures = getActiveTreasures();
        
        // 如果用户ID为空，直接返回宝藏列表（没有collected标记）
        if (userId == null) {
            // 为每个宝藏设置默认未收集
            treasures.forEach(treasure -> treasure.setCollected(false));
            return treasures;
        }
        
        // 查询用户已收集的宝藏记录
        LambdaQueryWrapper<TreasureRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TreasureRecord::getUserId, userId)
               .select(TreasureRecord::getTreasureId);
        List<TreasureRecord> records = treasureRecordMapper.selectList(wrapper);
        
        // 提取用户已收集的宝藏ID集合
        Set<Long> collectedIds = records.stream()
                .map(TreasureRecord::getTreasureId)
                .collect(Collectors.toSet());
        
        // 标记宝藏是否已被收集
        treasures.forEach(treasure -> {
            boolean collected = collectedIds.contains(treasure.getId());
            treasure.setCollected(collected);
        });
        
        return treasures;
    }

    @Override
    public List<Treasure> getTreasuresByStatus(String status, Long userId) {
        // 获取指定状态的宝藏
        LambdaQueryWrapper<Treasure> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Treasure::getStatus, status);
        List<Treasure> treasures = this.list(wrapper);
        
        // 如果用户ID为空，直接返回宝藏列表（没有collected标记）
        if (userId == null) {
            // 为每个宝藏设置默认未收集
            treasures.forEach(treasure -> treasure.setCollected(false));
            return treasures;
        }
        
        // 查询用户已收集的宝藏记录
        LambdaQueryWrapper<TreasureRecord> recordWrapper = new LambdaQueryWrapper<>();
        recordWrapper.eq(TreasureRecord::getUserId, userId)
               .select(TreasureRecord::getTreasureId);
        List<TreasureRecord> records = treasureRecordMapper.selectList(recordWrapper);
        
        // 提取用户已收集的宝藏ID集合
        Set<Long> collectedIds = records.stream()
                .map(TreasureRecord::getTreasureId)
                .collect(Collectors.toSet());
        
        // 标记宝藏是否已被收集
        treasures.forEach(treasure -> {
            boolean collected = collectedIds.contains(treasure.getId());
            treasure.setCollected(collected);
        });
        
        return treasures;
    }
    
    @Override
    public List<Treasure> getAllTreasuresWithCollectionStatus(Long userId) {
        // 获取所有宝藏，不限状态
        List<Treasure> treasures = this.list();
        
        // 如果用户ID为空，直接返回宝藏列表（没有collected标记）
        if (userId == null) {
            // 为每个宝藏设置默认未收集
            treasures.forEach(treasure -> treasure.setCollected(false));
            return treasures;
        }
        
        // 查询用户已收集的宝藏记录
        LambdaQueryWrapper<TreasureRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TreasureRecord::getUserId, userId)
               .select(TreasureRecord::getTreasureId);
        List<TreasureRecord> records = treasureRecordMapper.selectList(wrapper);
        
        // 提取用户已收集的宝藏ID集合
        Set<Long> collectedIds = records.stream()
                .map(TreasureRecord::getTreasureId)
                .collect(Collectors.toSet());
        
        // 标记宝藏是否已被收集
        treasures.forEach(treasure -> {
            boolean collected = collectedIds.contains(treasure.getId());
            treasure.setCollected(collected);
        });
        
        return treasures;
    }

    @Override
    public List<Map<String, Object>> getRankingList(int limit) {
        // 获取用户寻宝排行榜
        return treasureRecordMapper.getUserRankingList(limit);
    }

    @Override
    public long countActiveTreasures() {
        LambdaQueryWrapper<Treasure> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Treasure::getStatus, "active");
        return this.count(wrapper);
    }
} 