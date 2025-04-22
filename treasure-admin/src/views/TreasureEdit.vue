<template>
  <div class="treasure-edit-container">
    <div class="page-header">
      <h2>{{ isEdit ? '编辑宝藏' : '添加宝藏' }}</h2>
      <el-button @click="goBack">返回</el-button>
    </div>
    
    <el-card class="form-card">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="宝藏名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入宝藏名称" />
            </el-form-item>
            
            <el-form-item label="宝藏描述" prop="description">
              <el-input v-model="form.description" type="textarea" rows="4" placeholder="请输入宝藏描述" />
            </el-form-item>
            
            <el-form-item label="奖励积分" prop="points">
              <el-input-number v-model="form.points" :min="1" :max="1000" />
            </el-form-item>
            
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态">
                <el-option label="激活" value="active" />
                <el-option label="未激活" value="inactive" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="经度" prop="longitude">
              <el-input v-model="form.longitude" placeholder="请输入或在地图上选择位置" />
            </el-form-item>
            
            <el-form-item label="纬度" prop="latitude">
              <el-input v-model="form.latitude" placeholder="请输入或在地图上选择位置" />
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="地图选点">
              <div class="map-container" id="map"></div>
              <div class="map-tip">提示：点击地图选择宝藏位置，拖动标记可微调位置</div>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="loading">保存</el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import coordTransform from '../utils/coord-transform'; // 引入坐标转换工具

const router = useRouter();
const route = useRoute();
const formRef = ref(null);
const loading = ref(false);
const map = ref(null);
const marker = ref(null);

// 判断是编辑还是新增
const isEdit = ref(route.params.id !== undefined);

// 表单数据 - 更新默认位置为更准确的坐标
const form = reactive({
  name: '',
  description: '',
  points: 10,
  status: 'active',
  // 更新默认坐标为广州中心区域
  longitude: 113.264385,
  latitude: 23.129112
});

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入宝藏名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入宝藏描述', trigger: 'blur' }],
  points: [{ required: true, message: '请输入奖励积分', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  longitude: [
    { required: true, message: '请输入经度', trigger: 'blur' },
    { pattern: /^-?((1[0-7][0-9])|([0-9]?[0-9]))(\.[0-9]{1,6})?$/, message: '经度格式不正确', trigger: 'blur' }
  ],
  latitude: [
    { required: true, message: '请输入纬度', trigger: 'blur' },
    { pattern: /^-?([0-8]?[0-9]|90)(\.[0-9]{1,6})?$/, message: '纬度格式不正确', trigger: 'blur' }
  ]
};

// 获取当前位置
const getCurrentPosition = () => {
  if (navigator.geolocation) {
    ElMessage.info('正在获取当前位置...');
    
    // 定义位置选项
    const options = {
      enableHighAccuracy: true,  // 高精度
      timeout: 10000,           // 10秒超时
      maximumAge: 0             // 不使用缓存
    };
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const wgsLat = parseFloat(position.coords.latitude);
        const wgsLng = parseFloat(position.coords.longitude);
        
        // 将WGS-84坐标转换为GCJ-02坐标(高德地图使用)
        const gcj02 = coordTransform.wgs84ToGcj02(wgsLat, wgsLng);
        
        console.log('原始WGS-84坐标:', wgsLat, wgsLng);
        console.log('转换后GCJ-02坐标:', gcj02.latitude, gcj02.longitude);
        
        // 更新表单数据
        form.latitude = gcj02.latitude.toFixed(6);
        form.longitude = gcj02.longitude.toFixed(6);
        
        if (map.value) {
          try {
            // 更新地图中心
            map.value.setCenter([gcj02.longitude, gcj02.latitude]);
            
            // 创建新标记
            createMarker(gcj02.latitude, gcj02.longitude);
            
            ElMessage.success('已获取当前位置');
          } catch (err) {
            console.error('更新位置错误:', err);
            ElMessage.warning('地图更新位置失败，但已获取坐标');
          }
        }
      },
      (error) => {
        // 错误处理
        let errorMessage = '无法获取当前位置: ';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += '用户拒绝了位置请求权限';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += '位置信息不可用';
            break;
          case error.TIMEOUT:
            errorMessage += '获取位置超时';
            break;
          default:
            errorMessage += error.message || '未知错误';
        }
        
        console.error('获取位置失败:', errorMessage);
        ElMessage.warning(errorMessage);
        
        // 使用更准确的默认位置信息
        ElMessage.info('将使用默认位置，您可以在地图上手动选择更精确的位置');
      },
      options
    );
  } else {
    ElMessage.warning('您的浏览器不支持地理定位功能，请在地图上手动选择位置');
  }
};

// 初始化地图
const initMap = () => {
  nextTick(() => {
    try {
      // 使用简单的数值创建中心点
      const lat = parseFloat(form.latitude);
      const lng = parseFloat(form.longitude);
      
      // 创建高德地图实例
      map.value = new AMap.Map('map', {
        center: [lng, lat], // 高德地图使用[经度, 纬度]的顺序
        zoom: 16,
        viewMode: '2D'
      });
      
      // 添加控件
      map.value.plugin(['AMap.ToolBar', 'AMap.Scale'], () => {
        map.value.addControl(new AMap.ToolBar());
        map.value.addControl(new AMap.Scale());
      });
      
      // 标记初始化
      createMarker(lat, lng);
      
      // 地图点击事件
      map.value.on('click', handleMapClick);
      
      // 如果不是编辑模式，尝试获取用户当前位置
      if (!isEdit.value) {
        getCurrentPosition();
      }
    } catch (err) {
      console.error('初始化地图错误:', err);
      ElMessage.error('地图初始化失败，请检查网络连接并刷新页面');
    }
  });
};

// 创建标记的独立函数
const createMarker = (lat, lng) => {
  try {
    // 先移除已有标记
    if (marker.value) {
      map.value.remove(marker.value);
      marker.value = null;
    }
    
    // 创建新标记 - 高德地图标记
    marker.value = new AMap.Marker({
      position: [lng, lat], // 高德地图使用[经度, 纬度]的顺序
      draggable: true,      // 可拖拽
      cursor: 'move',       // 鼠标悬停点标记时的鼠标样式
      title: '宝藏位置'      // 鼠标点击标记点时显示的文字
    });
    
    // 添加到地图
    map.value.add(marker.value);
    
    // 标记拖拽结束事件
    marker.value.on('dragend', () => {
      const position = marker.value.getPosition();
      const lat = position.getLat();
      const lng = position.getLng();
      
      // 更新表单数据
      form.latitude = lat.toFixed(6);
      form.longitude = lng.toFixed(6);
      
      ElMessage.success('宝藏位置已更新');
    });
  } catch (err) {
    console.error('创建标记错误:', err);
  }
};

// 地图点击事件处理函数
const handleMapClick = (evt) => {
  try {
    if (!evt || !evt.lnglat) return;
    
    // 提取坐标
    const lng = evt.lnglat.getLng();
    const lat = evt.lnglat.getLat();
    
    // 更新表单数据
    form.latitude = lat.toFixed(6);
    form.longitude = lng.toFixed(6);
    
    // 创建新标记
    createMarker(lat, lng);
    
    // 显示信息提示
    ElMessage.success('宝藏位置已更新');
  } catch (err) {
    console.error('地图点击事件处理错误:', err);
  }
};

// 更新标记位置
const updateMarkerPosition = (lat, lng) => {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    // 尝试转换可能是字符串的坐标
    lat = parseFloat(lat);
    lng = parseFloat(lng);
  }
  
  if (isNaN(lat) || isNaN(lng)) {
    console.error('无效的坐标:', lat, lng);
    return;
  }
  
  try {
    // 创建新标记
    createMarker(lat, lng);
    
    // 更新表单数据
    form.latitude = lat.toFixed(6);
    form.longitude = lng.toFixed(6);
  } catch (err) {
    console.error('更新标记位置错误:', err);
  }
};

// 获取宝藏详情
const getTreasureDetail = () => {
  if (!isEdit.value) return;
  
  loading.value = true;
  
  axios.get(`/api/treasures/${route.params.id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }).then(response => {
    const { data } = response;
    if (data.code === 0) {
      Object.assign(form, data.data);
      
      // 更新地图标记位置
      nextTick(() => {
        if (map.value) {
          try {
            // 获取并转换坐标为数值
            const lat = parseFloat(form.latitude);
            const lng = parseFloat(form.longitude);
            
            // 更新地图中心点 - 高德地图使用[经度, 纬度]的顺序
            map.value.setCenter([lng, lat]);
            
            // 创建新标记
            createMarker(lat, lng);
          } catch (err) {
            console.error('更新地图位置错误:', err);
          }
        }
      });
    } else {
      ElMessage.error(data.message || '获取宝藏详情失败');
      goBack();
    }
  }).catch(error => {
    console.error('获取宝藏详情出错', error);
    ElMessage.error('获取宝藏详情失败，请稍后重试');
    goBack();
  }).finally(() => {
    loading.value = false;
  });
};

// 提交表单
const submitForm = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      loading.value = true;
      
      const url = isEdit.value ? `/api/treasures/${route.params.id}` : '/api/treasures';
      const method = isEdit.value ? 'put' : 'post';
      
      axios({
        url,
        method,
        data: form,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(response => {
        const { data } = response;
        if (data.code === 0) {
          ElMessage.success(isEdit.value ? '编辑成功' : '添加成功');
          goBack();
        } else {
          ElMessage.error(data.message || (isEdit.value ? '编辑失败' : '添加失败'));
        }
      }).catch(error => {
        console.error(isEdit.value ? '编辑宝藏出错' : '添加宝藏出错', error);
        ElMessage.error((isEdit.value ? '编辑' : '添加') + '失败，请稍后重试');
      }).finally(() => {
        loading.value = false;
      });
    }
  });
};

// 返回上一页
const goBack = () => {
  router.push('/dashboard/treasure');
};

// 生命周期钩子
onMounted(() => {
  // 初始化地图
  initMap();
  
  // 如果是编辑模式，获取宝藏详情
  if (isEdit.value) {
    getTreasureDetail();
  }
});
</script>

<style scoped>
.treasure-edit-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.form-card {
  margin-bottom: 20px;
}

.map-container {
  width: 100%;
  height: 400px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.map-tip {
  margin-top: 10px;
  color: #909399;
  font-size: 12px;
}
</style> 