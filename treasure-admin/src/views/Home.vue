<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>仪表盘</h1>
      <div class="date-picker">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="handleDateChange"
        />
      </div>
    </div>

    <el-row :gutter="20" v-loading="loading">
      <el-col :span="6" v-for="card in statCards" :key="card.title">
        <el-card class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-icon" :style="{ backgroundColor: card.color }">
            <i :class="card.icon"></i>
          </div>
          <div class="stat-content">
            <div class="stat-title">{{ card.title }}</div>
            <div class="stat-value">{{ card.value }}</div>
            <div class="stat-change" :class="card.change >= 0 ? 'positive' : 'negative'">
              <i :class="card.change >= 0 ? 'el-icon-top' : 'el-icon-bottom'"></i>
              {{ Math.abs(card.change) }}% 相比上个周期
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>宝藏收集趋势</span>
              <el-radio-group v-model="timeUnit" size="small" @change="handleTimeUnitChange">
                <el-radio-button label="day">日</el-radio-button>
                <el-radio-button label="week">周</el-radio-button>
                <el-radio-button label="month">月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <!-- 替换占位符为实际图表 -->
            <div ref="trendChartRef" style="width: 100%; height: 100%"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="recent-activities" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span>最近活动</span>
              <el-button class="button" text>查看全部</el-button>
            </div>
          </template>
          <el-empty v-if="recentActivities.length === 0" description="暂无活动记录"></el-empty>
          <el-timeline v-else>
            <el-timeline-item
              v-for="(activity, index) in recentActivities"
              :key="index"
              :timestamp="activity.time"
              :type="activity.type"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="top-collectors" v-loading="loading">
          <template #header>
            <div class="card-header">
              <span>顶级收藏家</span>
              <el-button class="button" text>查看全部</el-button>
            </div>
          </template>
          <el-empty v-if="topCollectors.length === 0" description="暂无排行数据"></el-empty>
          <el-table v-else :data="topCollectors" style="width: 100%">
            <el-table-column prop="rank" label="排名" width="70" />
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="treasures" label="宝藏数" width="100" />
            <el-table-column prop="value" label="价值" width="120" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';

// 数据
const dateRange = ref([]);
const timeUnit = ref('week');
const loading = ref(false);
const trendChartRef = ref(null);
let trendChart = null;

// 图表数据
const trendData = ref({
  xAxis: [],
  series: []
});

// 统计数据
const statCards = ref([]);
const recentActivities = ref([]);
const topCollectors = ref([]);

// 获取仪表盘数据
const fetchDashboardData = () => {
  loading.value = true;
  
  axios.get('/api/dashboard/stats', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }).then(response => {
    const { data } = response;
    if (data.code === 0) {
      // 更新统计数据
      statCards.value = data.data.statCards;
      recentActivities.value = data.data.recentActivities;
      
      // 处理排行榜数据
      const ranking = data.data.topCollectors;
      topCollectors.value = ranking.map((item, index) => {
        return {
          rank: index + 1,
          name: item.nickname || item.username,
          treasures: item.treasureCount,
          value: `${item.totalPoints} 积分`
        };
      });
      
      console.log('仪表盘数据加载成功');
    } else {
      console.error('获取仪表盘数据失败:', data.message);
      ElMessage.error(data.message || '获取仪表盘数据失败');
    }
  }).catch(error => {
    console.error('获取仪表盘数据失败:', error);
    ElMessage.error('获取仪表盘数据失败，请稍后重试');
  }).finally(() => {
    loading.value = false;
    // 获取趋势图数据
    fetchTrendData();
  });
};

// 生成模拟仪表盘数据
const generateMockDashboardData = () => {
  console.log('生成模拟仪表盘数据');
  
  // 生成模拟统计卡片数据
  statCards.value = [
    {
      title: '宝藏总数',
      value: '256',
      change: 5.8,
      icon: 'el-icon-coin',
      color: '#F56C6C'
    },
    {
      title: '进行中的寻宝',
      value: '186',
      change: 2.3,
      icon: 'el-icon-map-location',
      color: '#409EFF'
    },
    {
      title: '参与人数',
      value: '157',
      change: 12.7,
      icon: 'el-icon-user',
      color: '#67C23A'
    },
    {
      title: '已找到宝藏',
      value: '789',
      change: 8.1,
      icon: 'el-icon-money',
      color: '#E6A23C'
    }
  ];
  
  // 生成模拟最近活动数据
  const activities = [];
  const activityTypes = ['success', 'warning', 'info', 'primary', 'danger'];
  const actionTypes = ['找到了', '隐藏了', '评论了', '分享了', '放弃了'];
  const users = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
  const treasureNames = ['传说之剑', '黄金珠宝', '失落的卷轴', '神秘宝箱', '海盗的藏品', '远古遗物', '皇冠珠宝', '沉没的宝藏'];
  
  for (let i = 0; i < 8; i++) {
    const date = new Date();
    date.setHours(date.getHours() - i * 3 - Math.floor(Math.random() * 3));
    
    const user = users[Math.floor(Math.random() * users.length)];
    const action = actionTypes[Math.floor(Math.random() * actionTypes.length)];
    const treasure = treasureNames[Math.floor(Math.random() * treasureNames.length)];
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    
    activities.push({
      content: `${user} ${action}宝藏 "${treasure}"`,
      time: date.toLocaleString(),
      type
    });
  }
  
  recentActivities.value = activities;
  
  // 生成模拟排行榜数据
  const collectors = [];
  for (let i = 0; i < 5; i++) {
    const user = users[i];
    const treasureCount = Math.floor(Math.random() * 50) + 10;
    const points = treasureCount * (Math.floor(Math.random() * 30) + 20);
    
    collectors.push({
      rank: i + 1,
      name: user,
      treasures: treasureCount,
      value: `${points} 积分`
    });
  }
  
  // 按积分排序
  collectors.sort((a, b) => {
    const aPoints = parseInt(a.value);
    const bPoints = parseInt(b.value);
    return bPoints - aPoints;
  });
  
  // 更新排名
  collectors.forEach((item, index) => {
    item.rank = index + 1;
  });
  
  topCollectors.value = collectors;
  
  console.log('模拟仪表盘数据生成完成');
};

// 获取趋势图数据
const fetchTrendData = () => {
  if (!dateRange.value || dateRange.value.length !== 2) {
    return;
  }
  
  // 使用axios发送请求，404错误会被拦截器处理并返回模拟数据
  const startDate = dateRange.value[0].toISOString().split('T')[0];
  const endDate = dateRange.value[1].toISOString().split('T')[0];
  
  loading.value = true;
  
  axios.get(`/api/dashboard/trend?startDate=${startDate}&endDate=${endDate}&unit=${timeUnit.value}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }).then(response => {
    loading.value = false;
    const { data } = response;
    if (data.code === 0) {
      trendData.value = data.data;
      initTrendChart();
    } else {
      ElMessage.error(data.message || '获取趋势数据失败');
    }
  }).catch(error => {
    loading.value = false;
    console.error('获取趋势数据失败:', error);
    ElMessage.error('获取趋势数据失败，请稍后重试');
  });
};

// 初始化趋势图
const initTrendChart = () => {
  if (!trendChartRef.value) return;
  
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value);
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c} 个宝藏'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.value.xAxis
    },
    yAxis: {
      type: 'value',
      name: '宝藏数量'
    },
    series: [
      {
        name: '宝藏收集',
        type: 'line',
        smooth: true,
        data: trendData.value.series,
        itemStyle: {
          color: '#FF9800'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 152, 0, 0.5)' },
              { offset: 1, color: 'rgba(255, 152, 0, 0.1)' }
            ]
          }
        }
      }
    ]
  };
  
  trendChart.setOption(option);
  
  // 监听窗口大小变化，调整图表大小
  window.addEventListener('resize', () => {
    trendChart && trendChart.resize();
  });
};

// 方法
const handleDateChange = (val) => {
  console.log('日期范围已更改:', val);
  // 根据选择的日期范围获取新数据
  fetchTrendData();
};

const handleTimeUnitChange = () => {
  // 时间单位变化时重新获取趋势数据
  fetchTrendData();
};

// 监听时间单位变化
watch(timeUnit, () => {
  fetchTrendData();
});

// 生命周期
onMounted(() => {
  // 设置默认日期范围（最近30天）
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  dateRange.value = [start, end];
  
  // 获取初始仪表盘数据
  fetchDashboardData();
});
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.stat-card {
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.stat-card .stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  margin-bottom: 10px;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-change {
  font-size: 12px;
}

.stat-change.positive {
  color: #67C23A;
}

.stat-change.negative {
  color: #F56C6C;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 400px;
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 320px;
}

.chart-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #909399;
  border-radius: 4px;
  font-style: italic;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recent-activities, .top-collectors {
  height: 450px;
  margin-bottom: 20px;
}
</style> 