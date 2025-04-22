const app = getApp();

Page({
  data: {
    userInfo: {}
  },
  
  onLoad: function () {
    // 检查用户是否登录
    if (!app.checkLogin()) return;
  },
  
  onShow: function () {
    // 获取用户信息
    this.getUserInfo();
  },
  
  // 获取用户信息
  getUserInfo: function () {
    // 从全局获取用户信息
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
    this.setData({ userInfo });
  },
  
  // 微信头像选择回调
  onChooseAvatar: function(e) {
    const { avatarUrl } = e.detail;
    
    if (avatarUrl) {
      wx.showLoading({ title: '更新头像中...' });
      
      // 只在本地保存头像URL，不发送到服务器
      // 更新本地数据
      const userInfo = this.data.userInfo;
      userInfo.avatar = avatarUrl;
      this.setData({ userInfo });
      
      // 更新全局数据
      app.globalData.userInfo = userInfo;
      wx.setStorageSync('userInfo', userInfo);
      
      wx.hideLoading();
      wx.showToast({
        title: '头像更新成功',
        icon: 'success'
      });
    }
  },
  
  // 微信昵称输入回调
  onNicknameChange: function(e) {
    const { nickname } = e.detail;
    
    if (nickname) {
      wx.showLoading({ title: '更新昵称中...' });
      
      // 只在本地保存昵称，不发送到服务器
      // 更新本地数据
      const userInfo = this.data.userInfo;
      userInfo.nickname = nickname;
      this.setData({ userInfo });
      
      // 更新全局数据
      app.globalData.userInfo = userInfo;
      wx.setStorageSync('userInfo', userInfo);
      
      wx.hideLoading();
      wx.showToast({
        title: '昵称更新成功',
        icon: 'success'
      });
    }
  },
  
  // 查看我的收藏
  showMyTreasures: function() {
    wx.navigateTo({
      url: '/pages/favorites/favorites'
    });
  },
  
  // 显示排行榜
  showRanking: function () {
    wx.switchTab({
      url: '/pages/treasure/treasure'
    });
  },
  
  // 显示关于我们
  showAbout: function () {
    wx.showModal({
      title: '关于寻宝小程序',
      content: '寻宝小程序是一款基于地理位置的趣味寻宝游戏，通过定位和地图功能，引导用户找到隐藏在现实世界中的虚拟宝藏，获得积分奖励。版本1.0.0',
      showCancel: false
    });
  }
}); 