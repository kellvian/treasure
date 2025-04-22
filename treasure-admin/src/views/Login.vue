<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-title">寻宝小程序管理后台</div>
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-width="0" class="login-form">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="el-icon-user" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="el-icon-lock" size="large" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-button" :loading="loading" @click="handleLogin" size="large">登录</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import axios from 'axios';

const router = useRouter();
const route = useRoute();

const loginForm = reactive({
  username: '',
  password: ''
});

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

const loading = ref(false);
const loginFormRef = ref(null);

const handleLogin = () => {
  loginFormRef.value.validate(valid => {
    if (valid) {
      loading.value = true;
      
      axios.post('/api/auth/login', loginForm)
        .then(response => {
          const { data } = response;
          if (data.code === 0) {
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('userInfo', JSON.stringify(data.data.userInfo));
            
            ElMessage.success('登录成功');
            
            const redirect = route.query.redirect || '/dashboard';
            router.push(redirect);
          } else {
            ElMessage.error(data.message || '登录失败');
          }
        })
        .catch(error => {
          console.error('登录请求出错', error);
          ElMessage.error('登录失败，请稍后重试');
        })
        .finally(() => {
          loading.value = false;
        });
    }
  });
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
  background-image: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.login-box {
  width: 450px;
  padding: 50px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.login-title {
  text-align: center;
  margin-bottom: 40px;
  font-size: 28px;
  font-weight: bold;
  color: #FF9800;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 25px;
}

.login-form :deep(.el-input__inner) {
  height: 50px;
  font-size: 16px;
}

.login-button {
  width: 100%;
  height: 50px;
  font-size: 18px;
  border-radius: 5px;
  margin-top: 10px;
}
</style> 