<template>
  <div class="treasure-container">
    <div class="page-header">
      <h2>宝藏管理</h2>
      <div class="filter-actions">
        <el-select v-model="statusFilter" placeholder="状态筛选" clearable @change="handleStatusFilterChange">
          <el-option label="全部" value="" />
          <el-option label="激活" value="active" />
          <el-option label="未激活" value="inactive" />
        </el-select>
        <el-button type="primary" @click="handleAdd">添加宝藏</el-button>
      </div>
    </div>
    
    <el-card class="table-card">
      <el-table :data="treasureList" border style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="宝藏名称" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="points" label="奖励积分" width="100" />
        <el-table-column label="位置" width="180">
          <template #default="scope">
            <span>经度: {{ scope.row.longitude.toFixed(6) }}</span><br>
            <span>纬度: {{ scope.row.latitude.toFixed(6) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
              {{ scope.row.status === 'active' ? '激活' : '未激活' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
            <el-button 
              :type="scope.row.status === 'active' ? 'warning' : 'success'" 
              size="small" 
              @click="handleToggleStatus(scope.row)"
            >
              {{ scope.row.status === 'active' ? '停用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-size="pageSize"
          :current-page="currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';

const router = useRouter();

// 数据列表
const treasureList = ref([]);
const loading = ref(false);
const total = ref(0);
const pageSize = ref(10);
const currentPage = ref(1);
const statusFilter = ref(''); // 状态筛选默认为空，显示所有

// 获取宝藏列表
const fetchTreasureList = () => {
  loading.value = true;
  
  axios.get('/api/treasures', {
    params: {
      page: currentPage.value,
      size: pageSize.value,
      status: statusFilter.value // 传递状态筛选参数
    },
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }).then(response => {
    const { data } = response;
    if (data.code === 0) {
      treasureList.value = data.data.list || data.data;
      total.value = data.data.total || data.data.length;
    } else {
      ElMessage.error(data.message || '获取宝藏列表失败');
    }
  }).catch(error => {
    console.error('获取宝藏列表出错', error);
    ElMessage.error('获取宝藏列表失败，请稍后重试');
  }).finally(() => {
    loading.value = false;
  });
};

// 处理状态筛选变化
const handleStatusFilterChange = () => {
  currentPage.value = 1; // 重置页码
  fetchTreasureList();
};

// 生命周期钩子
onMounted(() => {
  fetchTreasureList();
});

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size;
  fetchTreasureList();
};

const handleCurrentChange = (page) => {
  currentPage.value = page;
  fetchTreasureList();
};

// 添加宝藏
const handleAdd = () => {
  router.push('/dashboard/treasure/add');
};

// 编辑宝藏
const handleEdit = (row) => {
  router.push(`/dashboard/treasure/edit/${row.id}`);
};

// 删除宝藏
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除"${row.name}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    axios.delete(`/api/treasures/${row.id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(response => {
      const { data } = response;
      if (data.code === 0) {
        ElMessage.success('删除成功');
        fetchTreasureList();
      } else {
        ElMessage.error(data.message || '删除失败');
      }
    }).catch(error => {
      console.error('删除宝藏出错', error);
      ElMessage.error('删除失败，请稍后重试');
    });
  }).catch(() => {});
};

// 切换宝藏状态
const handleToggleStatus = (row) => {
  const action = row.status === 'active' ? '停用' : '启用';
  const newStatus = row.status === 'active' ? 'inactive' : 'active';
  
  ElMessageBox.confirm(`确定要${action}"${row.name}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    axios.put(`/api/treasures/${row.id}/status`, {
      status: newStatus
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(response => {
      const { data } = response;
      if (data.code === 0) {
        ElMessage.success(`${action}成功`);
        row.status = newStatus;
      } else {
        ElMessage.error(data.message || `${action}失败`);
      }
    }).catch(error => {
      console.error(`${action}宝藏出错`, error);
      ElMessage.error(`${action}失败，请稍后重试`);
    });
  }).catch(() => {});
};
</script>

<style scoped>
.treasure-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 