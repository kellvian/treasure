const app = getApp();

Page({
  data: {
    favorites: [],
    loading: true,
    isEmpty: false
  },

  onLoad: function (options) {
    this.loadFavorites();
  },
  
  onShow: function() {
    // 每次显示页面时重新加载收藏列表，以便实时反映变化
    this.loadFavorites();
  },

  loadFavorites: function () {
    this.setData({ loading: true });
    
    // 从本地存储加载收藏列表
    const favorites = wx.getStorageSync('favoriteTreasures') || [];
    
    // 按收藏时间排序（最新收藏的在前面）
    favorites.sort((a, b) => b.timestamp - a.timestamp);
    
    this.setData({
      favorites: favorites,
      isEmpty: favorites.length === 0,
      loading: false
    });
  },

  removeFavorite: function (e) {
    const id = e.currentTarget.dataset.id;
    let favorites = wx.getStorageSync('favoriteTreasures') || [];
    
    // 过滤掉要删除的收藏
    favorites = favorites.filter(item => item.id !== id);
    
    // 更新本地存储
    wx.setStorageSync('favoriteTreasures', favorites);
    
    // 更新页面数据
    this.setData({
      favorites: favorites,
      isEmpty: favorites.length === 0
    });
    
    // 显示提示
    wx.showToast({
      title: '已移除收藏',
      icon: 'success'
    });
  },

  viewOnMap: function (e) {
    const id = e.currentTarget.dataset.id;
    const favorite = this.data.favorites.find(item => item.id === id);
    
    if (favorite) {
      // 导航到地图页面并传递宝藏坐标
      wx.switchTab({
        url: '/pages/map/map',
        success: function () {
          // 将坐标保存到全局数据，使地图页面可以访问
          app.globalData.navigateToLocation = {
            latitude: favorite.latitude,
            longitude: favorite.longitude,
            treasureId: favorite.id
          };
        }
      });
    }
  }
}); 