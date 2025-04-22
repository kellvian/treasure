<template>
  <div class="stats-container">
    <div class="page-header">
      <h1>数据统计分析</h1>
      <div class="filter-controls">
        <el-select v-model="timeRange" placeholder="时间范围" style="width: 120px; margin-right: 10px;">
          <el-option label="今日" value="today" />
          <el-option label="本周" value="week" />
          <el-option label="本月" value="month" />
          <el-option label="全部" value="all" />
        </el-select>
        <el-button type="primary" @click="refreshData">刷新</el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :md="12" :lg="8" v-for="(card, index) in statCards" :key="index">
        <el-card class="stat-card">
          <div class="card-content">
            <div class="card-icon" :style="{ backgroundColor: card.color }">
              <i :class="card.icon"></i>
            </div>
            <div class="card-info">
              <div class="card-title">{{ card.title }}</div>
              <div class="card-value">{{ card.value }}</div>
              <div class="card-trend" v-if="card.trend">
                <span :class="['trend-value', card.trend > 0 ? 'positive' : 'negative']">
                  {{ card.trend > 0 ? '+' : '' }}{{ card.trend }}%
                </span>
                <span class="trend-period">同比上期</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-section">
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card">
          <div class="chart-header">
            <h3>寻宝活动参与趋势</h3>
          </div>
          <div class="chart-placeholder">
            <div class="placeholder-text">活动参与用户数量趋势图</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card">
          <div class="chart-header">
            <h3>宝藏发现率</h3>
          </div>
          <div class="chart-placeholder">
            <div class="placeholder-text">各宝藏的发现率对比图</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-section">
      <el-col :span="24">
        <el-card class="chart-card">
          <div class="chart-header">
            <h3>寻宝热力图</h3>
          </div>
          <div class="chart-placeholder" style="height: 400px">
            <div class="placeholder-text">用户寻宝活动热力图</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-divider content-position="center">详细数据</el-divider>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="寻宝任务数据" name="treasures">
        <el-table :data="treasureStats" border style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="宝藏名称" />
          <el-table-column prop="views" label="查看次数" width="120" />
          <el-table-column prop="hunters" label="寻宝人数" width="120" />
          <el-table-column prop="found" label="发现次数" width="120" />
          <el-table-column prop="rate" label="发现率" width="120">
            <template #default="scope">
              <el-progress :percentage="scope.row.rate" :format="format" />
            </template>
          </el-table-column>
          <el-table-column prop="avgTime" label="平均寻找时间" width="150" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="用户活跃数据" name="users">
        <el-table :data="userStats" border style="width: 100%" v-loading="loading">
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="newUsers" label="新增用户" width="120" />
          <el-table-column prop="activeUsers" label="活跃用户" width="120" />
          <el-table-column prop="avgTime" label="平均使用时长" width="150" />
          <el-table-column prop="completionRate" label="任务完成率" width="150">
            <template #default="scope">
              <el-progress :percentage="scope.row.completionRate" :format="format" />
            </template>
          </el-table-column>
          <el-table-column prop="retention" label="次日留存率" width="150">
            <template #default="scope">
              <el-progress :percentage="scope.row.retention" :format="format" />
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

// Data
const timeRange = ref('month');
const loading = ref(false);
const activeTab = ref('treasures');

// Stat cards data
const statCards = ref([
  {
    title: '累计用户数',
    value: '8,426',
    trend: 23.5,
    icon: 'el-icon-user',
    color: '#409EFF'
  },
  {
    title: '累计宝藏数',
    value: '256',
    trend: 9.2,
    icon: 'el-icon-present',
    color: '#67C23A'
  },
  {
    title: '累计寻宝次数',
    value: '32,145',
    trend: 15.8,
    icon: 'el-icon-map-location',
    color: '#E6A23C'
  },
  {
    title: '宝藏发现率',
    value: '68.3%',
    trend: 4.6,
    icon: 'el-icon-data-line',
    color: '#F56C6C'
  },
  {
    title: '平均寻宝时长',
    value: '23分钟',
    trend: -8.4,
    icon: 'el-icon-time',
    color: '#909399'
  },
  {
    title: '用户留存率',
    value: '32.5%',
    trend: 5.2,
    icon: 'el-icon-data-analysis',
    color: '#9C27B0'
  }
]);

// Mock treasure statistics data
const treasureStats = ref([
  {
    id: 1,
    name: '古城宝藏',
    views: 3245,
    hunters: 876,
    found: 432,
    rate: 49.3,
    avgTime: '18分钟'
  },
  {
    id: 2,
    name: '神秘洞穴',
    views: 2876,
    hunters: 754,
    found: 587,
    rate: 77.9,
    avgTime: '26分钟'
  },
  {
    id: 3,
    name: '沉船遗宝',
    views: 3567,
    hunters: 1245,
    found: 865,
    rate: 69.5,
    avgTime: '32分钟'
  },
  {
    id: 4,
    name: '丛林探险',
    views: 2345,
    hunters: 876,
    found: 521,
    rate: 59.5,
    avgTime: '25分钟'
  },
  {
    id: 5,
    name: '雪山秘径',
    views: 1876,
    hunters: 654,
    found: 321,
    rate: 49.1,
    avgTime: '40分钟'
  }
]);

// Mock user statistics data
const userStats = ref([
  {
    date: '2023-05-01',
    newUsers: 145,
    activeUsers: 1245,
    avgTime: '28分钟',
    completionRate: 65.4,
    retention: 35.2
  },
  {
    date: '2023-05-02',
    newUsers: 132,
    activeUsers: 1356,
    avgTime: '32分钟',
    completionRate: 68.7,
    retention: 33.8
  },
  {
    date: '2023-05-03',
    newUsers: 156,
    activeUsers: 1432,
    avgTime: '26分钟',
    completionRate: 72.3,
    retention: 37.5
  },
  {
    date: '2023-05-04',
    newUsers: 178,
    activeUsers: 1526,
    avgTime: '30分钟',
    completionRate: 70.1,
    retention: 36.9
  },
  {
    date: '2023-05-05',
    newUsers: 201,
    activeUsers: 1687,
    avgTime: '35分钟',
    completionRate: 75.6,
    retention: 39.2
  }
]);

// Methods
const refreshData = () => {
  loading.value = true;
  
  // Simulate API call
  setTimeout(() => {
    loading.value = false;
    // In a real application, this would fetch new data based on the selected time range
    console.log('Refreshing data with time range:', timeRange.value);
  }, 800);
};

const format = (percentage) => {
  return `${percentage.toFixed(1)}%`;
};

// Lifecycle
onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.stats-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.stat-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-content {
  display: flex;
  align-items: center;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px;
  margin-right: 16px;
}

.card-info {
  flex: 1;
}

.card-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.card-trend {
  font-size: 12px;
}

.trend-value.positive {
  color: #67C23A;
}

.trend-value.negative {
  color: #F56C6C;
}

.trend-period {
  color: #909399;
  margin-left: 4px;
}

.chart-section {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-header {
  margin-bottom: 16px;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
}

.chart-placeholder {
  height: 300px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-text {
  color: #909399;
  font-style: italic;
}

.el-divider {
  margin: 32px 0;
}
</style> 