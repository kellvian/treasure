<template>
  <div class="dashboard">
    <el-container>
      <el-aside width="220px">
        <div class="logo">
          <span>寻宝管理系统</span>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
          router
        >
          <el-menu-item index="/dashboard/home">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/treasure">
            <el-icon><GoldMedal /></el-icon>
            <span>宝藏管理</span>
          </el-menu-item>
          <el-menu-item index="/dashboard/user">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-container>
        <el-header>
          <div class="header-right">
            <span class="user-name">{{ userInfo.name }}</span>
            <el-dropdown @command="handleCommand">
              <span class="el-dropdown-link">
                <el-avatar :size="30" :src="userInfo.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'"></el-avatar>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { HomeFilled, User, GoldMedal } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';

const router = useRouter();
const route = useRoute();

// 用户信息
const userInfo = ref({
  name: '管理员',
  avatar: ''
});

// 计算当前激活的菜单项
const activeMenu = computed(() => {
  return route.path;
});

// 生命周期钩子
onMounted(() => {
  // 获取本地存储的用户信息
  const storedUserInfo = localStorage.getItem('userInfo');
  if (storedUserInfo) {
    userInfo.value = JSON.parse(storedUserInfo);
  }
});

// 处理下拉菜单命令
const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      // 清除存储的用户信息和token
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      // 跳转到登录页
      router.push('/login');
    }).catch(() => {});
  }
};
</script>

<style scoped>
.dashboard {
  height: 100vh;
}

.el-container {
  height: 100%;
}

.el-aside {
  background-color: #304156;
  color: #fff;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  background-color: #2b3649;
}

.sidebar-menu {
  border-right: none;
}

.el-header {
  background-color: #fff;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-right {
  display: flex;
  align-items: center;
}

.user-name {
  margin-right: 10px;
}

.el-main {
  background-color: #f5f5f5;
  padding: 20px;
}
</style> 