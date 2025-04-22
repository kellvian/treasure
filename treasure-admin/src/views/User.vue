<template>
  <div class="user-management">
    <div class="page-header">
      <h1>用户管理</h1>
      <el-button type="primary" @click="handleAddUser">添加用户</el-button>
    </div>

    <el-card class="user-table">
      <el-table :data="users" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="role" label="角色" width="150">
          <template #default="scope">
            <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'success'">
              {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- User form dialog -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="500px">
      <el-form :model="userForm" :rules="rules" ref="userFormRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="isAddMode">
          <el-input v-model="userForm.password" type="password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// Data
const users = ref([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const dialogVisible = ref(false);
const isAddMode = ref(true);
const userFormRef = ref(null);

const userForm = reactive({
  id: '',
  username: '',
  email: '',
  role: 'user',
  password: ''
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur', validator: (rule, value, callback) => {
    if (isAddMode.value && !value) {
      callback(new Error('请输入密码'));
    } else {
      callback();
    }
  }}]
};

const dialogTitle = computed(() => {
  return isAddMode.value ? '添加用户' : '编辑用户';
});

// Methods
const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await fetch(`/api/users?page=${currentPage.value}&pageSize=${pageSize.value}`);
    if (!response.ok) {
      throw new Error('获取用户列表失败');
    }
    const data = await response.json();
    users.value = data.users;
    total.value = data.total;
    loading.value = false;
  } catch (error) {
    console.error('获取用户失败:', error);
    ElMessage.error('加载用户列表失败');
    loading.value = false;
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
  fetchUsers();
};

const handleAddUser = () => {
  isAddMode.value = true;
  resetForm();
  userForm.role = 'user';
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  isAddMode.value = false;
  resetForm();
  Object.assign(userForm, {
    id: row.id,
    username: row.username,
    email: row.email || '',
    role: row.role || 'user',
  });
  userForm.password = '';
  dialogVisible.value = true;
};

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await fetch(`/api/users/${row.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('删除用户失败');
      }
      
      ElMessage.success('删除成功');
      fetchUsers();
    } catch (error) {
      console.error('删除用户失败:', error);
      ElMessage.error('删除用户失败');
    }
  }).catch(() => {});
};

const resetForm = () => {
  userForm.id = '';
  userForm.username = '';
  userForm.email = '';
  userForm.role = 'user';
  userForm.password = '';
  
  if (userFormRef.value) {
    userFormRef.value.resetFields();
  }
};

const submitForm = () => {
  userFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const method = isAddMode.value ? 'POST' : 'PUT';
        const url = isAddMode.value ? '/api/users' : `/api/users/${userForm.id}`;
        
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userForm)
        });
        
        if (!response.ok) {
          throw new Error(isAddMode.value ? '添加用户失败' : '更新用户失败');
        }
        
        const successMsg = isAddMode.value ? '添加用户成功' : '更新用户成功';
        ElMessage.success(successMsg);
        dialogVisible.value = false;
        fetchUsers();
      } catch (error) {
        console.error('保存用户失败:', error);
        ElMessage.error(error.message || '操作失败');
      }
    }
  });
};

// Lifecycle
onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.user-management {
  padding: 30px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
}

.user-table {
  margin-bottom: 30px;
  font-size: 16px;
}

:deep(.el-table) {
  font-size: 16px;
}

:deep(.el-table th) {
  font-size: 16px;
  font-weight: 600;
  padding: 16px 0;
}

:deep(.el-table td) {
  padding: 16px 0;
}

:deep(.el-tag) {
  font-size: 14px;
  padding: 6px 12px;
}

:deep(.el-button) {
  font-size: 16px;
  padding: 12px 20px;
  height: auto;
}

:deep(.el-table .cell) {
  line-height: 1.8;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 30px;
}

:deep(.el-pagination) {
  font-size: 16px;
}

:deep(.el-pagination .el-pager li) {
  font-size: 16px;
  min-width: 36px;
  height: 36px;
  line-height: 36px;
}

:deep(.el-form-item__label) {
  font-size: 16px;
}

:deep(.el-input__inner) {
  font-size: 16px;
  height: 46px;
  line-height: 46px;
}

:deep(.el-select) {
  width: 100%;
}

.dialog-footer {
  text-align: right;
  display: block;
  margin-top: 30px;
}
</style> 