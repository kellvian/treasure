package com.treasure.server.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.treasure.server.common.Result;
import com.treasure.server.entity.Treasure;
import com.treasure.server.entity.TreasureRecord;
import com.treasure.server.service.TreasureService;
import com.treasure.server.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/treasures")
@RequiredArgsConstructor
public class TreasureController {

    private final TreasureService treasureService;
    private final JwtUtil jwtUtil;

    /**
     * 获取宝藏列表
     * 如果用户已登录，返回宝藏是否已被用户领取的信息
     * 可以通过status参数筛选状态
     */
    @GetMapping("")
    public Result<List<Treasure>> getTreasures(
            HttpServletRequest request,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        try {
            // 尝试从请求头获取token
            String token = request.getHeader("Authorization");
            Long userId = null;
            
            // 验证token并获取用户ID
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
                if (jwtUtil.validateToken(token)) {
                    userId = jwtUtil.getUserIdFromToken(token);
                }
            }
            
            // 根据是否有状态过滤参数决定调用哪个方法
            List<Treasure> treasures;
            if (status != null && !status.isEmpty()) {
                // 获取指定状态的宝藏列表
                treasures = treasureService.getTreasuresByStatus(status, userId);
            } else {
                // 获取所有宝藏列表（不再只限于激活状态）
                treasures = treasureService.getAllTreasuresWithCollectionStatus(userId);
            }
            
            return Result.success(treasures);
        } catch (Exception e) {
            log.error("获取宝藏列表失败：{}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 分页查询宝藏列表（管理员用）
     */
    @GetMapping("/page")
    public Result<IPage<Treasure>> getTreasurePage(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String status) {
        try {
            Page<Treasure> pageParam = new Page<>(page, size);
            IPage<Treasure> pageResult;
            
            // 根据是否有状态筛选参数决定调用哪个方法
            if (status != null && !status.isEmpty()) {
                pageResult = treasureService.getTreasurePage(pageParam, status);
            } else {
                pageResult = treasureService.getTreasurePage(pageParam);
            }
            
            return Result.success(pageResult);
        } catch (Exception e) {
            log.error("分页查询宝藏列表失败：{}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 获取单个宝藏详情
     */
    @GetMapping("/{id}")
    public Result<Treasure> getTreasure(@PathVariable Long id) {
        try {
            Treasure treasure = treasureService.getById(id);
            if (treasure != null) {
                return Result.success(treasure);
            } else {
                return Result.error("宝藏不存在");
            }
        } catch (Exception e) {
            log.error("获取宝藏详情失败：{}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 添加宝藏
     */
    @PostMapping("")
    public Result<Void> addTreasure(@RequestBody Treasure treasure) {
        try {
            boolean success = treasureService.addTreasure(treasure);
            return success ? Result.success() : Result.error("添加宝藏失败");
        } catch (Exception e) {
            log.error("添加宝藏失败：{}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 更新宝藏
     */
    @PutMapping("/{id}")
    public Result<Void> updateTreasure(@PathVariable Long id, @RequestBody Treasure treasure) {
        try {
            treasure.setId(id);
            boolean success = treasureService.updateTreasure(treasure);
            return success ? Result.success() : Result.error("更新宝藏失败");
        } catch (Exception e) {
            log.error("更新宝藏失败：{}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 删除宝藏
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteTreasure(@PathVariable Long id) {
        try {
            boolean success = treasureService.deleteTreasure(id);
            return success ? Result.success() : Result.error("删除宝藏失败");
        } catch (Exception e) {
            log.error("删除宝藏失败：{}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 更新宝藏状态
     */
    @PutMapping("/{id}/status")
    public Result<Void> updateTreasureStatus(@PathVariable Long id, @RequestBody Map<String, String> statusMap) {
        try {
            String status = statusMap.get("status");
            boolean success = treasureService.updateTreasureStatus(id, status);
            return success ? Result.success() : Result.error("更新宝藏状态失败");
        } catch (Exception e) {
            log.error("更新宝藏状态失败：{}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }

    /**
     * 用户发现宝藏接口
     */
    @PostMapping("/{treasureId}/find")
    public Result<Map<String, Object>> findTreasure(HttpServletRequest request, 
                                                   @PathVariable Long treasureId,
                                                   @RequestBody Map<String, Double> location) {
        try {
            // 从请求头中获取token
            String token = request.getHeader("Authorization");
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
            
            // 验证token并获取用户ID
            if (token == null || !jwtUtil.validateToken(token)) {
                return Result.error(401, "未登录或登录已过期");
            }
            
            Long userId = jwtUtil.getUserIdFromToken(token);
            Double longitude = location.get("longitude");
            Double latitude = location.get("latitude");
            
            // 调用服务，处理寻宝
            TreasureRecord record = treasureService.findTreasure(userId, treasureId, longitude, latitude);
            
            // 构建返回结果
            Map<String, Object> result = new HashMap<>();
            result.put("points", record.getPoints());
            result.put("findTime", record.getFindTime());
            
            return Result.success(result);
        } catch (Exception e) {
            log.error("寻宝失败：{}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取寻宝排行榜
     */
    @GetMapping("/ranking")
    public Result<List<Map<String, Object>>> getRankingList(
            @RequestParam(defaultValue = "10") Integer limit) {
        try {
            List<Map<String, Object>> rankingList = treasureService.getRankingList(limit);
            return Result.success(rankingList);
        } catch (Exception e) {
            log.error("获取排行榜失败：{}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }
}