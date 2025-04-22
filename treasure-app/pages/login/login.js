const app = getApp();

Page({
  data: {},

  onLoad: function() {
    // 检查是否已登录
    if (app.globalData.token) {
      wx.switchTab({
        url: '/pages/map/map'
      });
    }
  },

  // 微信登录
  onGetUserInfo: function(e) {
    if (e.detail.userInfo) {
      wx.showLoading({ title: '登录中...' });
      
      // 获取微信登录凭证
      wx.login({
        success: (res) => {
          if (res.code) {
            // 发送 code 到后台
            app.request({
              url: '/auth/wechat',
              method: 'POST',
              data: {
                code: res.code,
                userInfo: e.detail.userInfo
              }
            }).then(res => {
              wx.hideLoading();
              
              // 保存用户信息和token
              wx.setStorageSync('token', res.data.token);
              wx.setStorageSync('userInfo', res.data.userInfo);
              
              app.globalData.token = res.data.token;
              app.globalData.userInfo = res.data.userInfo;
              
              wx.switchTab({
                url: '/pages/map/map'
              });
            }).catch(err => {
              wx.hideLoading();
              wx.showToast({
                title: err || '微信登录失败',
                icon: 'none'
              });
            });
          } else {
            wx.hideLoading();
            wx.showToast({
              title: '获取微信登录凭证失败',
              icon: 'none'
            });
          }
        },
        fail: () => {
          wx.hideLoading();
          wx.showToast({
            title: '微信登录失败',
            icon: 'none'
          });
        }
      });
    }
  }
}); 