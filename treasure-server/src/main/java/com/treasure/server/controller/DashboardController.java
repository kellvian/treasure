package com.treasure.server.controller;

import com.treasure.server.common.Result;
import com.treasure.server.service.TreasureRecordService;
import com.treasure.server.service.TreasureService;
import com.treasure.server.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final TreasureService treasureService;
    private final UserService userService;
    private final TreasureRecordService treasureRecordService;
    
    /**
     * 获取首页统计数据
     */
    @GetMapping("/stats")
    public Result<Map<String, Object>> getStats() {
        try {
            Map<String, Object> statsMap = new HashMap<>();
            
            // 宝藏相关统计
            long totalTreasures = treasureService.count();
            long activeTreasures = treasureService.countActiveTreasures();
            
            // 用户相关统计
            long totalUsers = userService.count();
            
            // 寻宝记录统计
            long totalRecords = treasureRecordService.count();
            
            // 统计卡片数据
            List<Map<String, Object>> statCards = new ArrayList<>();
            statCards.add(createStatCard("宝藏总数", String.valueOf(totalTreasures), 
                    calculateChange(totalTreasures, totalTreasures - 5), "el-icon-coin", "#F56C6C"));
            statCards.add(createStatCard("进行中的寻宝", String.valueOf(activeTreasures), 
                    calculateChange(activeTreasures, activeTreasures - 2), "el-icon-map-location", "#409EFF"));
            statCards.add(createStatCard("参与人数", String.valueOf(totalUsers), 
                    calculateChange(totalUsers, totalUsers - 8), "el-icon-user", "#67C23A"));
            statCards.add(createStatCard("已找到宝藏", String.valueOf(totalRecords), 
                    calculateChange(totalRecords, totalRecords - 15), "el-icon-money", "#E6A23C"));
            
            // 最近活动
            List<Map<String, Object>> recentActivities = treasureRecordService.getRecentActivities(5);
            
            // 排行榜
            List<Map<String, Object>> topCollectors = treasureService.getRankingList(5);
            
            // 组装数据
            statsMap.put("statCards", statCards);
            statsMap.put("recentActivities", recentActivities);
            statsMap.put("topCollectors", topCollectors);
            
            return Result.success(statsMap);
        } catch (Exception e) {
            log.error("获取首页统计数据失败：{}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 生成统计卡片数据
     */
    private Map<String, Object> createStatCard(String title, String value, double change, String icon, String color) {
        Map<String, Object> card = new HashMap<>();
        card.put("title", title);
        card.put("value", value);
        card.put("change", change);
        card.put("icon", icon);
        card.put("color", color);
        return card;
    }
    
    /**
     * 计算变化百分比
     */
    private double calculateChange(long current, long previous) {
        if (previous <= 0) return 0;
        double change = ((double) (current - previous) / previous) * 100;
        // 保留一位小数
        return Math.round(change * 10) / 10.0;
    }
    
    /**
     * 获取宝藏收集趋势数据
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @param unit 时间单位（day/week/month）
     * @return 趋势数据
     */
    @GetMapping("/trend")
    public Result<Map<String, Object>> getTrendData(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "day") String unit) {
        try {
            LocalDateTime start = null;
            LocalDateTime end = LocalDateTime.now();
            
            if (startDate != null && !startDate.isEmpty()) {
                start = LocalDateTime.parse(startDate + "T00:00:00");
            } else {
                // 默认30天
                start = end.minusDays(30);
            }
            
            if (endDate != null && !endDate.isEmpty()) {
                end = LocalDateTime.parse(endDate + "T23:59:59");
            }
            
            // 获取趋势数据
            List<String> xAxis = new ArrayList<>();
            List<Integer> series = new ArrayList<>();
            
            // 根据时间单位处理数据
            switch (unit) {
                case "day":
                    Map<String, Integer> dailyData = treasureRecordService.getDailyTreasureCollectionTrend(start, end);
                    DateTimeFormatter dailyFormatter = DateTimeFormatter.ofPattern("MM/dd");
                    
                    LocalDateTime current = start;
                    while (!current.isAfter(end)) {
                        String dateStr = current.format(dailyFormatter);
                        xAxis.add(dateStr);
                        series.add(dailyData.getOrDefault(dateStr, 0));
                        current = current.plusDays(1);
                    }
                    break;
                    
                case "week":
                    Map<String, Integer> weeklyData = treasureRecordService.getWeeklyTreasureCollectionTrend(start, end);
                    DateTimeFormatter weeklyFormatter = DateTimeFormatter.ofPattern("yyyy-ww");
                    
                    current = start;
                    while (!current.isAfter(end)) {
                        String weekKey = current.format(weeklyFormatter);
                        int weekNum = current.get(java.time.temporal.WeekFields.ISO.weekOfMonth());
                        String weekLabel = current.format(DateTimeFormatter.ofPattern("MM")) + "月第" + weekNum + "周";
                        
                        xAxis.add(weekLabel);
                        series.add(weeklyData.getOrDefault(weekKey, 0));
                        current = current.plusWeeks(1);
                    }
                    break;
                    
                case "month":
                default:
                    Map<String, Integer> monthlyData = treasureRecordService.getMonthlyTreasureCollectionTrend(start, end);
                    DateTimeFormatter monthlyFormatter = DateTimeFormatter.ofPattern("yyyy/MM");
                    
                    current = start.withDayOfMonth(1);
                    while (!current.isAfter(end)) {
                        String monthStr = current.format(monthlyFormatter);
                        xAxis.add(monthStr);
                        series.add(monthlyData.getOrDefault(monthStr, 0));
                        current = current.plusMonths(1);
                    }
                    break;
            }
            
            Map<String, Object> resultMap = new HashMap<>();
            resultMap.put("xAxis", xAxis);
            resultMap.put("series", series);
            
            return Result.success(resultMap);
        } catch (Exception e) {
            log.error("获取趋势数据失败:", e);
            return Result.error(e.getMessage());
        }
    }
} 