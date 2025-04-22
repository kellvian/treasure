const app = getApp();

Page({
  data: {
    rankingList: []
  },
  
  onLoad: function() {
    // 检查用户是否登录
    if (!app.checkLogin()) return;
  },
  
  onShow: function() {
    // 每次显示页面时获取排行榜
    this.getRankingList();
  },
  
  // 获取排行榜
  getRankingList: function() {
    wx.showLoading({ title: '加载排行榜...' });
    
    app.request({
      url: '/treasures/ranking',
      method: 'GET'
    }).then(res => {
      const rankingList = res.data || [];
      
      this.setData({ rankingList });
      
      wx.hideLoading();
    }).catch(err => {
      console.error('获取排行榜失败', err);
      wx.hideLoading();
      wx.showToast({
        title: '获取排行榜失败',
        icon: 'none'
      });
    });
  },
  
  // 查看用户详情
  viewUserDetail: function(e) {
    const userId = e.currentTarget.dataset.id;
    
    wx.showToast({
      title: '暂不支持查看用户详情',
      icon: 'none'
    });
  }
}); 