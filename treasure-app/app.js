App({
  globalData: {
    userInfo: null,
    token: '',
    baseUrl: 'http://localhost:8080/api',
    mapKey: '1cbf8e3ca1b5ae3d111212cb1f7aef12',
    treasures: []
  },
  
  onLaunch: function() {
    // 检查更新
    this.checkUpdate();
    
    // 高德地图key
    this.globalData.mapKey = '1cbf8e3ca1b5ae3d111212cb1f7aef12'; // 恢复原有的key值
    
    // 不再主动请求位置权限，改为在地图页面请求
    // this.initLocationPermission();
    
    // 获取本地存储的用户信息和token
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
      console.log('已从存储恢复登录状态');
    } else {
      console.log('未找到存储的登录状态');
      // 仅当在登录页面以外的页面时，才检查登录状态
      const pages = getCurrentPages();
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        if (currentPage && currentPage.route !== 'pages/login/login') {
          wx.redirectTo({
            url: '/pages/login/login'
          });
        }
      }
    }
    
    // 获取设备信息
    wx.getSystemInfo({
      success: res => {
        this.globalData.systemInfo = res;
      }
    });
  },
  
  // 检查小程序更新
  checkUpdate: function() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate(function(res) {
        // 请求完新版本信息的回调
        if (res.hasUpdate) {
          console.log('有新版本可用');
        }
      });

      updateManager.onUpdateReady(function() {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: function(res) {
            if (res.confirm) {
              // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
              updateManager.applyUpdate();
            }
          }
        });
      });

      updateManager.onUpdateFailed(function() {
        // 新版本下载失败
        wx.showToast({
          title: '更新小程序失败',
          icon: 'none'
        });
      });
    }
  },
  
  // 检查用户是否已登录
  checkLogin: function() {
    if (!this.globalData.token) {
      // 先尝试从存储恢复token
      const token = wx.getStorageSync('token');
      const userInfo = wx.getStorageSync('userInfo');
      
      if (token && userInfo) {
        this.globalData.token = token;
        this.globalData.userInfo = userInfo;
        console.log('checkLogin: 从存储恢复登录状态成功');
        return true;
      }
      
      console.log('checkLogin: 未登录，跳转到登录页');
      wx.redirectTo({
        url: '/pages/login/login'
      });
      return false;
    }
    return true;
  },
  
  // 统一请求方法
  request: function(options) {
    const token = this.globalData.token;
    const header = options.header || {};
    
    if (token) {
      header.Authorization = `Bearer ${token}`;
    }
    
    // 打印请求信息，便于调试
    console.log('发送请求:', this.globalData.baseUrl + options.url, options.method || 'GET', options.data || {});
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.globalData.baseUrl + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: header,
        success: function(res) {
          console.log('请求成功:', options.url, '状态码:', res.statusCode);
          
          if (res.statusCode === 200) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            // token过期，重新登录
            console.log('Token已过期，需要重新登录');
            wx.removeStorageSync('token');
            wx.removeStorageSync('userInfo');
            wx.redirectTo({
              url: '/pages/login/login'
            });
            reject('登录已过期，请重新登录');
          } else {
            console.error('请求失败:', options.url, '状态码:', res.statusCode, '错误:', res.data);
            reject(res.data?.message || '请求失败');
          }
        },
        fail: function(err) {
          console.error('请求错误:', options.url, err);
          
          // 检查是否是网络错误
          if (err.errMsg && err.errMsg.indexOf('fail') >= 0) {
            console.log('网络错误，请检查网络连接');
            wx.showToast({
              title: '网络错误，请检查网络连接',
              icon: 'none'
            });
          }
          
          reject(err);
        },
        complete: function() {
          console.log('请求完成:', options.url);
        }
      });
    });
  },
  
  // 初始化位置权限 - 此方法保留但不再自动调用
  initLocationPermission: function() {
    // 获取位置权限状态
    wx.getSetting({
      success: (res) => {
        // 如果未授权位置权限，主动请求
        if (!res.authSetting['scope.userLocation']) {
          console.log('未授权位置权限，尝试请求授权');
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
              console.log('位置权限授权成功');
            },
            fail: (err) => {
              console.log('位置权限授权失败', err);
            }
          });
        } else {
          console.log('已有位置权限授权');
        }
      }
    });
  },
  
  // 检查登录状态
  checkLoginStatus: function() {
    // 不再在启动时自动跳转到登录页，改为先检查本地存储
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
      console.log('checkLoginStatus: 从存储恢复登录状态成功');
      return true;
    }
    
    // 仅当在非tabBar页面或非登录页面时，才跳转到登录页
    const pages = getCurrentPages();
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1];
      const isTabPage = ['pages/map/map', 'pages/treasure/treasure', 'pages/profile/profile'].includes(currentPage?.route);
      const isLoginPage = currentPage?.route === 'pages/login/login';
      
      if (!isTabPage && !isLoginPage) {
        console.log('checkLoginStatus: 非tabBar页面且未登录，跳转到登录页');
        wx.redirectTo({
          url: '/pages/login/login'
        });
        return false;
      }
    }
    
    return !!this.globalData.token;
  }
}); 