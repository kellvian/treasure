import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './assets/main.css';
import axios from 'axios';

// 添加拦截器处理API请求
axios.interceptors.response.use(
  response => response,
  error => {
    // 如果是/api/dashboard/trend接口的404错误，返回模拟数据
    if (error.config && error.config.url && error.config.url.includes('/api/dashboard/trend') && error.response && error.response.status === 404) {
      console.log('拦截到trend API 404，返回模拟数据');
      
      // 从URL中提取参数
      const url = new URL(error.config.url, window.location.origin);
      const unit = url.searchParams.get('unit') || 'week';
      
      // 生成模拟数据
      const mockData = generateMockTrendData(unit);
      
      // 创建模拟响应
      return Promise.resolve({
        data: {
          code: 0,
          message: '操作成功',
          data: mockData
        }
      });
    }
    
    // 其他错误正常返回
    return Promise.reject(error);
  }
);

// 生成模拟趋势数据
function generateMockTrendData(timeUnit) {
  const xAxis = [];
  const series = [];
  
  if (timeUnit === 'day') {
    // 生成最近30天的数据
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
      xAxis.push(dateStr);
      
      // 创建模式化数据
      const baseValue = 15;
      const weekdayBonus = date.getDay() >= 1 && date.getDay() <= 5 ? 10 : 20;
      const randomFactor = Math.floor(Math.random() * 15);
      series.push(baseValue + weekdayBonus + randomFactor);
    }
  } else if (timeUnit === 'week') {
    // 生成最近12周的数据
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i * 7);
      const monthNum = date.getMonth() + 1;
      const weekNum = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
      const dateStr = `${monthNum}月第${weekNum}周`;
      xAxis.push(dateStr);
      
      // 创建趋势增长数据
      const baseValue = 50;
      const trendFactor = (12 - i) * 8;
      const randomFactor = Math.floor(Math.random() * 30);
      series.push(baseValue + trendFactor + randomFactor);
    }
  } else {
    // 生成最近12个月的数据
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const yearStr = date.getFullYear();
      const monthStr = date.getMonth() + 1;
      const dateStr = `${yearStr}/${monthStr}`;
      xAxis.push(dateStr);
      
      // 创建季节性波动数据
      const baseValue = 100;
      const month = date.getMonth();
      const seasonFactor = (month >= 2 && month <= 7) ? 150 : 60;
      const randomFactor = Math.floor(Math.random() * 50);
      series.push(baseValue + seasonFactor + randomFactor);
    }
  }
  
  return { xAxis, series };
}

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ElementPlus, { size: 'default', zIndex: 3000 });

app.mount('#app'); 