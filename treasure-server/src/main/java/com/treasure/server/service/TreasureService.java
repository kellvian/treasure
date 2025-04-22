package com.treasure.server.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.treasure.server.entity.Treasure;
import com.treasure.server.entity.TreasureRecord;

import java.util.List;
import java.util.Map;

public interface TreasureService extends IService<Treasure> {
    
    /**
     * 获取所有激活的宝藏列表
     * 
     * @return 宝藏列表
     */
    List<Treasure> getActiveTreasures();
    
    /**
     * 获取所有激活的宝藏列表，并标记用户是否已收集
     * 
     * @param userId 用户ID，可以为null
     * @return 宝藏列表（包含collected字段）
     */
    List<Treasure> getActiveTreasuresWithCollectionStatus(Long userId);
    
    /**
     * 根据状态获取宝藏列表，并标记用户是否已收集
     * 
     * @param status 宝藏状态
     * @param userId 用户ID，可以为null
     * @return 宝藏列表（包含collected字段）
     */
    List<Treasure> getTreasuresByStatus(String status, Long userId);
    
    /**
     * 获取所有宝藏列表，不限状态，并标记用户是否已收集
     * 
     * @param userId 用户ID，可以为null
     * @return 宝藏列表（包含collected字段）
     */
    List<Treasure> getAllTreasuresWithCollectionStatus(Long userId);
    
    /**
     * 分页查询宝藏列表（管理员用）
     * 
     * @param page 分页参数
     * @return 分页结果
     */
    IPage<Treasure> getTreasurePage(Page<Treasure> page);
    
    /**
     * 分页查询宝藏列表，带状态筛选（管理员用）
     * 
     * @param page 分页参数
     * @param status 状态筛选，可为null
     * @return 分页结果
     */
    IPage<Treasure> getTreasurePage(Page<Treasure> page, String status);
    
    /**
     * 添加宝藏
     * 
     * @param treasure 宝藏信息
     * @return 是否成功
     */
    boolean addTreasure(Treasure treasure);
    
    /**
     * 更新宝藏
     * 
     * @param treasure 宝藏信息
     * @return 是否成功
     */
    boolean updateTreasure(Treasure treasure);
    
    /**
     * 更新宝藏状态
     * 
     * @param treasureId 宝藏ID
     * @param status 状态
     * @return 是否成功
     */
    boolean updateTreasureStatus(Long treasureId, String status);
    
    /**
     * 删除宝藏
     * 
     * @param treasureId 宝藏ID
     * @return 是否成功
     */
    boolean deleteTreasure(Long treasureId);
    
    /**
     * 用户发现宝藏
     * 
     * @param userId 用户ID
     * @param treasureId 宝藏ID
     * @param longitude 经度
     * @param latitude 纬度
     * @return 寻宝记录
     */
    TreasureRecord findTreasure(Long userId, Long treasureId, Double longitude, Double latitude);
    
    /**
     * 获取寻宝排行榜
     * 
     * @param limit 限制数量
     * @return 排行榜列表
     */
    List<Map<String, Object>> getRankingList(int limit);
    
    /**
     * 统计激活宝藏数量
     * 
     * @return 激活宝藏数量
     */
    long countActiveTreasures();
} 