const app = getApp();
const AMapWX = require('../../utils/amap-wx.130.js').AMapWX;
const coordTransform = require('../../utils/coord-transform.js');
let amapInst;


Page({
  data: {
    longitude: null,  
    latitude: null,
    scale: 16,
    markers: [],
    selectedTreasure: null,
    distance: 0,
    polyline: [],  // 导航路线
    isNavigating: false,  // 是否正在导航
    locationChangeListener: null,  // 位置变化监听器
    canCollect: false, // 是否可以领取宝藏
    loadingTreasures: false, // 加载宝藏状态，默认为false
    loadingLocation: true, // 加载位置状态
    isDebugMode: false,  // 调试模式开关
    isFavorite: false,  // 是否已收藏当前宝藏
    mapSetting: {
      // 地图配置，使用GCJ-02坐标系
      enableRotate: false,
      enableOverlooking: false,
      enableZoom: true,
      showCompass: false,
      enable3D: false,
      showScale: true,
      skew: 0,
      rotate: 0,
      enableTraffic: false,
      enableBuilding: false,
      enableSatellite: false
    },
    userMarkerVisible: true, // 控制用户位置标记的显示和隐藏
    hasShownLocationTip: false, // 标记是否已经显示过位置提示
    mapInitialized: false, // 记录地图是否已初始化
    pageId: Date.now() // 用于跟踪页面实例ID，帮助调试
  },

  onLoad: function () {
    const pageId = this.data.pageId;
    console.log(`[页面${pageId}] 地图页面加载开始`);
    
    // 初始化变量
    this.hasShownLocationTip = false; // 记录是否已显示过位置提示
    this.mapInitialized = false; // 记录地图是否已初始化
    
    try {
      // 实例化高德地图SDK
      amapInst = new AMapWX({
        key: app.globalData.mapKey
      });
      
      console.log(`[页面${pageId}] 高德地图SDK初始化成功`);
      
      // 检查用户是否登录 - 先检查缓存
      const token = wx.getStorageSync('token');
      const userInfo = wx.getStorageSync('userInfo');
      
      if (token && userInfo) {
        if (!app.globalData.token) {
          app.globalData.token = token;
          app.globalData.userInfo = userInfo;
          console.log(`[页面${pageId}] 从缓存恢复登录状态成功`);
        }
      } else if (!app.checkLogin()) {
        console.log(`[页面${pageId}] 用户未登录，跳转登录页`);
        return;
      }

      // 主动获取位置权限
      this.checkLocationPermission();
    } catch (err) {
      console.error(`[页面${pageId}] 地图初始化错误:`, err);
      wx.showToast({
        title: '地图初始化失败，请重试',
        icon: 'none'
      });
    }
    
    // 初始化调试模式点击计数器
    this.debugClickCount = 0;

    // 设置更短的超时保护，防止页面卡死
    this.initTimeout = setTimeout(() => {
      // 如果页面加载超过5秒还未完成，强制使用默认位置
      if (this.data.loadingLocation) {
        console.log(`[页面${pageId}] 位置获取超时，使用默认位置`);
        this.setData({
          latitude: 39.909200,
          longitude: 116.397390,
          loadingLocation: false,
          mapInitialized: true
        }, () => {
          console.log(`[页面${pageId}] 设置默认位置，准备初始化地图`);
          setTimeout(() => {
            this.fixMapDisplay();
          }, 300);
        });
      }
    }, 5000);
  },

  // 检查并请求位置权限
  checkLocationPermission: function() {
    const pageId = this.data.pageId;
    console.log(`[页面${pageId}] 检查位置权限`);
    
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.userLocation']) {
          // 未授权，直接调用系统权限请求，移除自定义弹窗
          console.log(`[页面${pageId}] 未授权位置权限，直接请求权限`);
          
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
              console.log(`[页面${pageId}] 位置授权成功`);
              // 授权成功后获取位置
              this.getUserLocation();
            },
            fail: (err) => {
              console.error(`[页面${pageId}] 位置授权失败`, err);
              // 授权失败，提示用户手动开启
              this.showOpenSettingModal();
            }
          });
        } else {
          console.log(`[页面${pageId}] 已有位置权限，直接获取位置`);
          // 已授权，直接获取位置
          this.getUserLocation();
        }
      },
      fail: (err) => {
        console.error(`[页面${pageId}] 检查位置权限失败`, err);
        // 检查失败，使用默认位置
        this.useDefaultLocation('检查位置权限失败');
      }
    });
  },

  // 显示引导用户打开设置的弹窗
  showOpenSettingModal: function() {
    const pageId = this.data.pageId;
    console.log(`[页面${pageId}] 显示打开设置引导`);
    
    wx.showModal({
      title: '位置权限已被拒绝',
      content: '请在设置中开启位置权限，否则无法正常使用寻宝功能。',
      confirmText: '去设置',
      cancelText: '暂不',
      success: (res) => {
        if (res.confirm) {
          console.log(`[页面${pageId}] 用户选择前往设置页`);
          wx.openSetting({
            success: (settingRes) => {
              if (settingRes.authSetting['scope.userLocation']) {
                console.log(`[页面${pageId}] 用户已在设置中开启位置权限`);
                // 用户在设置中授权了，获取位置
                this.getUserLocation();
              } else {
                console.log(`[页面${pageId}] 用户在设置中未开启位置权限`);
                // 用户仍未授权，使用默认位置
                this.handleLocationAuthDenied();
              }
            },
            fail: (err) => {
              console.error(`[页面${pageId}] 打开设置页失败`, err);
              this.handleLocationAuthDenied();
            }
          });
        } else {
          console.log(`[页面${pageId}] 用户拒绝前往设置页`);
          // 用户取消，使用默认位置
          this.handleLocationAuthDenied();
        }
      }
    });
  },

  // 处理位置授权被拒绝的情况
  handleLocationAuthDenied: function() {
    const pageId = this.data.pageId;
    console.log(`[页面${pageId}] 处理位置授权被拒绝情况`);
    
    // 使用默认位置
    this.useDefaultLocation('位置权限被拒绝，使用默认位置');
    
    // 显示引导提示按钮
    this.setData({
      showLocationGuide: true
    });
  },

  // 使用默认位置
  useDefaultLocation: function(message) {
    const pageId = this.data.pageId;
    console.log(`[页面${pageId}] 使用默认位置:`, message);
    
    this.setData({
      latitude: 39.909200,
      longitude: 116.397390,
      loadingLocation: false,
      mapInitialized: true
    }, () => {
      wx.showToast({
        title: message || '使用默认位置',
        icon: 'none',
        duration: 3000
      });
      
      setTimeout(() => {
        this.fixMapDisplay();
        
        // 尝试获取宝藏数据
        this.getTreasures();
      }, 300);
    });
  },

  onShow: function () {
    const pageId = this.data.pageId;
    console.log(`[页面${pageId}] 地图页面显示，当前位置:`, this.data.latitude, this.data.longitude);
    
    // 页面显示时总是重新获取位置，确保实时性
    this.getUserLocation();
    
    // 如果正在导航，重新开始位置监听
    if (this.data.isNavigating) {
      this.startLocationTracking();
    }
    
    // 检查是否有从收藏页面跳转过来的宝藏位置
    if (app.globalData.navigateToLocation) {
      const location = app.globalData.navigateToLocation;
      console.log(`[页面${pageId}] 检测到导航请求:`, location);
      
      // 延迟执行，确保地图已加载
      setTimeout(() => {
        // 移动到目标位置
        this.setData({
          latitude: location.latitude,
          longitude: location.longitude,
          scale: 18  // 放大地图以便查看详情
        }, () => {
          // 等地图移动后，查找并选中对应宝藏
          if (location.treasureId && app.globalData.treasures) {
            const treasure = app.globalData.treasures.find(t => t.id === location.treasureId);
            if (treasure) {
              // 检查该宝藏是否已被收藏
              const favorites = wx.getStorageSync('favoriteTreasures') || [];
              const isFavorite = favorites.some(fav => fav.id === treasure.id);
              
              this.setData({ 
                selectedTreasure: treasure,
                isFavorite: isFavorite 
              });
              this.calculateDistance(location.latitude, location.longitude);
              
              wx.showToast({
                title: '已定位到宝藏',
                icon: 'success'
              });
            }
          }
          
          // 刷新地图显示
          this.fixMapDisplay();
        });
      }, 1000);
      
      // 清除导航数据，防止重复处理
      app.globalData.navigateToLocation = null;
    }
  },

  // 获取用户当前位置 - 使用高德地图API
  getUserLocation: function () {
    const pageId = this.data.pageId;
    console.log(`[页面${pageId}] 开始获取用户位置 (使用高德API)`);
    this.setData({ loadingLocation: true });
    
    // 使用高德地图SDK获取位置及周边信息
    amapInst.getPoiAround({
      iconPathSelected: '../../images/marker_checked.png',
      iconPath: '../../images/marker.png',
      success: (data) => {
        console.log(`[页面${pageId}] 高德API位置获取成功:`, data);
        
        if (data && data.markers && data.markers.length > 0) {
          // 使用高德API返回的第一个标记点作为用户位置
          const marker = data.markers[0];
          const { latitude, longitude } = marker;
          
          // 移除位置缓存代码，始终使用实时位置
          
          // 获取当前的宝藏标记
          const treasureMarkers = this.data.markers.filter(m => m.id !== 999999);
          
          // 创建用户位置标记
          const userMarker = {
            id: 999999,
            latitude,
            longitude,
            width: 30,
            height: 30,
            // iconPath: '../../images/marker.png',
            anchor: {x: 0.5, y: 0.5},
            callout: {
              content: '我的位置',
              color: '#FFFFFF',
              fontSize: 12,
              borderRadius: 4,
              bgColor: '#1296db',
              padding: 6,
              display: 'BYCLICK'
            }
          };
          
          // 组合标记，确保用户标记在最上层
          const markers = [...treasureMarkers, userMarker];
          
          // 更新用户位置和标记
          this.setData({ 
            longitude, 
            latitude,
            markers,
            loadingLocation: false,
            mapInitialized: true
          }, () => {
            console.log(`[页面${pageId}] 位置数据已设置 (高德API)，准备更新地图视图...`);
            
            // 如果有选中的宝藏，计算距离
            if (this.data.selectedTreasure) {
              this.calculateDistance(latitude, longitude);
            }
            
            // 在setData回调中执行，确保数据已更新
            setTimeout(() => {
              console.log(`[页面${pageId}] 延迟执行地图修复`);
              this.fixMapDisplay();
              
              // 位置获取成功后，获取宝藏列表
              if (!this.data.loadingTreasures && treasureMarkers.length === 0) {
                console.log(`[页面${pageId}] 位置获取成功，开始获取宝藏`);
                this.getTreasures();
              }
            }, 300);
          });
        } else {
          console.warn(`[页面${pageId}] 高德API返回的位置数据格式不正确，使用备用方法`);
          this.getLocationFallback();
        }
      },
      fail: (err) => {
        console.error(`[页面${pageId}] 高德API位置获取失败:`, err);
        // 回退到wx.getLocation
        this.getLocationFallback();
      }
    });
  },
  
  // 备用位置获取方法 - 使用微信原生API
  getLocationFallback: function() {
    const pageId = this.data.pageId;
    console.log(`[页面${pageId}] 使用备用方法获取位置`);
    
    // 先检查位置权限
    wx.getSetting({
      success: (res) => {
        console.log(`[页面${pageId}] 获取设置成功:`, res.authSetting);
        if (!res.authSetting['scope.userLocation']) {
          // 未授权，引导用户开启权限
          console.log(`[页面${pageId}] 未授权位置权限`);
          this.showOpenSettingModal();
          return;
        }
        
        // 已授权，获取位置信息
        console.log(`[页面${pageId}] 已授权位置权限，获取位置`);
        wx.getLocation({
          type: 'gcj02', // 使用GCJ-02坐标系
          isHighAccuracy: true, // 使用高精度定位
          highAccuracyExpireTime: 3000, // 高精度定位超时时间
          success: res => {
            const { longitude, latitude } = res;
            
            console.log(`[页面${pageId}] 备用方法获取位置成功:`, latitude, longitude);
            
            // 移除位置缓存代码，始终使用实时位置
            
            // 获取当前的宝藏标记
            const treasureMarkers = this.data.markers.filter(marker => marker.id !== 999999);
            
            // 创建用户位置标记
            const userMarker = {
              id: 999999,
              latitude,
              longitude,
              width: 30,
              height: 30,
              // iconPath: '../../images/marker.png',
              anchor: {x: 0.5, y: 0.5},
              callout: {
                content: '我的位置',
                color: '#FFFFFF',
                fontSize: 12,
                borderRadius: 4,
                bgColor: '#1296db',
                padding: 6,
                display: 'BYCLICK'
              }
            };
            
            // 组合标记，确保用户标记在最上层
            const markers = [...treasureMarkers, userMarker];
            
            // 更新用户位置和标记
            this.setData({ 
              longitude, 
              latitude,
              markers,
              loadingLocation: false,
              mapInitialized: true
            }, () => {
              console.log(`[页面${pageId}] 位置数据已设置 (备用方法)，准备更新地图视图...`);
              
              // 如果有选中的宝藏，计算距离
              if (this.data.selectedTreasure) {
                this.calculateDistance(latitude, longitude);
              }
              
              // 在setData回调中执行，确保数据已更新
              setTimeout(() => {
                console.log(`[页面${pageId}] 延迟执行地图修复`);
                this.fixMapDisplay();
                
                // 位置获取成功后，获取宝藏列表
                if (!this.data.loadingTreasures && treasureMarkers.length === 0) {
                  console.log(`[页面${pageId}] 位置获取成功，开始获取宝藏`);
                  this.getTreasures();
                }
              }, 300);
            });
          },
          fail: err => {
            console.error(`[页面${pageId}] 备用方法获取位置失败`, err);
            
            // 位置获取失败时，确保不会出现白屏
            // 如果当前没有有效的位置数据，使用默认位置
            if (!this.data.latitude || !this.data.longitude) {
              console.log(`[页面${pageId}] 获取位置失败，使用默认位置`);
              this.useDefaultLocation('获取位置失败，使用默认位置');
            } else {
              // 已有位置数据，仅更新状态
              this.setData({ loadingLocation: false });
            }
            
            // 检查是否是权限问题导致的失败
            if (err.errMsg && err.errMsg.indexOf('auth deny') >= 0) {
              console.log(`[页面${pageId}] 位置权限被拒绝`);
              this.showOpenSettingModal();
            }
          }
        });
      },
      fail: (err) => {
        console.error(`[页面${pageId}] 获取设置失败:`, err);
        
        // 确保不会出现白屏
        if (!this.data.latitude || !this.data.longitude) {
          console.log(`[页面${pageId}] 获取设置失败，使用默认位置`);
          this.useDefaultLocation('获取设置失败，使用默认位置');
        } else {
          this.setData({ loadingLocation: false });
        }
      }
    });
  },

  // 已授权引导用户开启权限的方法
  openLocationSettings: function() {
    const pageId = this.data.pageId;
    console.log(`[页面${pageId}] 引导用户打开设置页面`);
    
    wx.openSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation']) {
          console.log(`[页面${pageId}] 用户已在设置中开启位置权限`);
          // 设置页面返回后重新获取位置
          this.getUserLocation();
        } else {
          console.log(`[页面${pageId}] 用户在设置中仍未开启位置权限`);
          wx.showToast({
            title: '需要位置权限才能显示附近宝藏',
            icon: 'none',
            duration: 3000
          });
        }
      }
    });
  },

  onReady: function() {
    const pageId = this.data.pageId;
    console.log(`[页面${pageId}] 地图页面准备完成`);
  },

  // 修复地图显示问题
  fixMapDisplay: function() {
    const pageId = this.data.pageId;
    console.log(`[页面${pageId}] 尝试修复地图显示...`);
    
    // 再次检查位置信息
    if (!this.data.latitude || !this.data.longitude) {
      console.warn(`[页面${pageId}] fixMapDisplay: 位置未获取，无法修复地图`);
      return;
    }
    
    console.log(`[页面${pageId}] fixMapDisplay: 当前位置数据`, this.data.latitude, this.data.longitude);
    
    // 延迟触发一次缩放操作，刷新地图渲染
    setTimeout(() => {
      try {
        console.log(`[页面${pageId}] 创建地图上下文...`);
        const mapCtx = wx.createMapContext('map');
        if (!mapCtx) {
          console.error(`[页面${pageId}] 无法获取地图上下文，map组件可能未正确渲染`);
          return;
        }
        
        console.log(`[页面${pageId}] 尝试调整地图缩放级别...`);
        // 先尝试简单缩放操作
        this.setData({
          scale: this.data.scale === 16 ? 15 : 16
        });
        
        console.log(`[页面${pageId}] 移动地图到当前位置...`);
        // 确保地图中心点正确
        mapCtx.moveToLocation({
          success: () => {
            console.log(`[页面${pageId}] 地图移动到当前位置成功`);
            this.mapInitialized = true;
          },
          fail: (err) => {
            console.error(`[页面${pageId}] 地图移动到当前位置失败`, err);
            // 如果moveToLocation失败，手动设置地图中心
            console.log(`[页面${pageId}] 手动更新地图中心点...`);
            this.setData({
              longitude: this.data.longitude,
              latitude: this.data.latitude
            });
          },
          complete: () => {
            console.log(`[页面${pageId}] moveToLocation操作完成`);
          }
        });
        
        // 如果有标记点，尝试包含所有点
        if (this.data.markers && this.data.markers.length > 0) {
          console.log(`[页面${pageId}] 尝试包含所有标记点...`);
          const points = this.data.markers.map(marker => ({
            latitude: marker.latitude,
            longitude: marker.longitude
          }));
              
          mapCtx.includePoints({
            points: points,
            padding: [80, 80, 80, 80],
            success: () => {
              console.log(`[页面${pageId}] 地图包含所有点成功`);
            },
            fail: (err) => {
              console.error(`[页面${pageId}] 地图包含所有点失败`, err);
            },
            complete: () => {
              console.log(`[页面${pageId}] includePoints操作完成`);
            }
          });
        } else {
          console.log(`[页面${pageId}] 没有标记点，仅居中显示用户位置`);
        }
      } catch (err) {
        console.error(`[页面${pageId}] 修复地图显示时出错:`, err);
      }
    }, 300);
  },
  
  onHide: function() {
    const pageId = this.data.pageId;
    console.log(`[页面${pageId}] 地图页面隐藏`);
    // 页面隐藏时停止位置监听
    this.stopLocationTracking();
    
    // 清除超时
    if (this.initTimeout) {
      clearTimeout(this.initTimeout);
    }
  },
  
  onUnload: function() {
    const pageId = this.data.pageId;
    console.log(`[页面${pageId}] 地图页面卸载`);
    // 页面卸载时停止位置监听
    this.stopLocationTracking();
    
    // 清除超时
    if (this.initTimeout) {
      clearTimeout(this.initTimeout);
    }
  },

  // 创建用户位置标记
  createUserMarker: function(latitude, longitude) {
    return {
      id: 999999, // 使用固定ID方便识别
      latitude: latitude,
      longitude: longitude,
      width: 30,
      height: 30,
      // iconPath: '../../images/marker.png',
      anchor: {x: 0.5, y: 0.5},
      callout: {
        content: '我的位置',
        color: '#FFFFFF',
        fontSize: 12,
        borderRadius: 4,
        bgColor: '#1296db',
        padding: 6,
        display: 'BYCLICK'
      }
    };
  },

  // 更新标记，确保用户标记和宝藏标记不会混淆
  updateMarkers: function(treasureMarkers, userLatitude, userLongitude) {
    let markers = [...treasureMarkers];
    
    // 只有当用户位置标记可见且有位置数据时才添加用户标记
    if (this.data.userMarkerVisible && userLatitude && userLongitude) {
      const userMarker = this.createUserMarker(userLatitude, userLongitude);
      markers.push(userMarker);
    }
    
    this.setData({ markers });
  },
  
  // 计算用户与宝藏之间的距离
  calculateDistance: function (userLat, userLng) {
    const treasure = this.data.selectedTreasure;
    if (!treasure) return;
    
    // 确保使用数值类型
    userLat = parseFloat(userLat);
    userLng = parseFloat(userLng);
    const treasureLat = parseFloat(treasure.latitude);
    const treasureLng = parseFloat(treasure.longitude);
    
    console.log('计算距离 - 用户位置:', userLat, userLng);
    console.log('计算距离 - 宝藏位置:', treasureLat, treasureLng);
    
    // 优先使用高德计算的距离
    if (this.data.polyline && this.data.polyline.length > 0) {
      console.log('使用高德路线规划的距离:', this.data.distance);
      return;
    }
    
    // 使用工具函数计算距离
    // 注意：此处使用原始坐标计算距离，确保距离计算准确
    const distance = coordTransform.calculateDistance(
      userLat, userLng, treasureLat, treasureLng
    );
    
    // 判断是否可以领取（距离小于50米）
    const canCollect = distance <= 50;
    
    console.log('最终距离计算结果:', distance, '米, 可领取:', canCollect);
    
    this.setData({ 
      distance,
      canCollect
    });
  },
  
  // 角度转弧度
  _toRadians: function(degrees) {
    return degrees * Math.PI / 180;
  },

  // 获取宝藏列表
  getTreasures: function () {
    const pageId = this.data.pageId;
    console.log(`[页面${pageId}] 开始获取宝藏列表`);
    this.setData({ loadingTreasures: true });
    
    // 宝藏获取超时保护
    const treasureTimeout = setTimeout(() => {
      if (this.data.loadingTreasures) {
        console.warn(`[页面${pageId}] 宝藏获取超时`);
        this.setData({ 
          loadingTreasures: false,
          markers: this.data.markers.filter(marker => marker.id === 999999) // 只保留用户位置标记
        });
        
        wx.showToast({
          title: '获取宝藏超时，请刷新重试',
          icon: 'none'
        });
        
        // 异常情况下，使用测试数据确保UI能显示
        console.log(`[页面${pageId}] 使用测试数据`);
        this.useTestData();
      }
    }, 10000); // 10秒超时
    
    // 打印请求配置
    console.log(`[页面${pageId}] 请求配置:`, {
      url: '/treasures?status=active',
      baseUrl: app.globalData.baseUrl,
      token: app.globalData.token ? '已设置' : '未设置'
    });
    
    // 检查网络状态
    wx.getNetworkType({
      success: (res) => {
        console.log(`[页面${pageId}] 当前网络类型:`, res.networkType);
      }
    });
    
    app.request({
      url: '/treasures?status=active',
      method: 'GET'
    }).then(res => {
      clearTimeout(treasureTimeout);
      console.log(`[页面${pageId}] 宝藏获取成功，数量:`, res.data.length);
      const treasures = res.data;
      
      // 过滤掉已收集的宝藏，只显示未收集的
      const uncollectedTreasures = treasures.filter(item => !item.collected);
      console.log(`[页面${pageId}] 未收集宝藏数量:`, uncollectedTreasures.length);
      
      // 保留用户位置标记
      const userMarker = this.data.markers.find(marker => marker.id === 999999);
      
      // 转换为地图标记 - 不进行坐标转换，直接使用原始坐标
      const treasureMarkers = uncollectedTreasures.map((item, index) => {
        return {
          id: item.id,
          latitude: item.latitude,
          longitude: item.longitude,
          title: item.name,
          width: 40,
          height: 40,
          callout: {
            content: item.name,
            color: '#FF9800',
            fontSize: 14,
            borderRadius: 4,
            padding: 8,
            display: 'BYCLICK'
          },
          // 使用logo作为标记图标
          iconPath: '../../images/logo.png'
        };
      });
      
      // 组合标记，确保用户标记在最上层（如果存在）
      let markers = [...treasureMarkers];
      if (userMarker) {
        markers.push(userMarker);
      }
      
      this.setData({ 
        markers,
        loadingTreasures: false
      }, () => {
        console.log(`[页面${pageId}] 宝藏标记已更新，总数:`, markers.length);
      });
      
      // 存储原始宝藏数据 - 仍然保存所有宝藏，但在地图上只显示未收集的
      app.globalData.treasures = treasures;
      
      // 如果有选中的宝藏，重新计算距离
      if (this.data.selectedTreasure) {
        // 检查选中的宝藏是否已被收集
        const selectedId = this.data.selectedTreasure.id;
        const selectedTreasure = treasures.find(t => t.id === selectedId);
        
        if (selectedTreasure && selectedTreasure.collected) {
          // 如果已收集，清除选中状态
          this.setData({ selectedTreasure: null });
        } else {
          this.calculateDistance(this.data.latitude, this.data.longitude);
        }
      }
      
      // 地图标记更新后刷新地图显示
      console.log(`[页面${pageId}] 宝藏获取完成，刷新地图显示`);
      setTimeout(() => this.fixMapDisplay(), 300);
    }).catch(err => {
      clearTimeout(treasureTimeout);
      console.error(`[页面${pageId}] 获取宝藏失败`, err);
      
      // 输出更多错误信息
      if (typeof err === 'object') {
        console.error(`[页面${pageId}] 错误详情:`, JSON.stringify(err));
      }
      
      this.setData({ loadingTreasures: false });
      
      // 保留用户位置标记
      const userMarker = this.data.markers.find(marker => marker.id === 999999);
      if (userMarker) {
        this.setData({ markers: [userMarker] });
      }
      
      wx.showToast({
        title: '获取宝藏失败，请检查网络',
        icon: 'none'
      });
      
      // 异常情况下，使用测试数据确保UI能显示
      console.log(`[页面${pageId}] 使用测试数据`);
      this.useTestData();
    });
  },
  
  // 使用测试数据 - 在API请求失败时提供基本的UI显示
  useTestData: function() {
    const pageId = this.data.pageId;
    console.log(`[页面${pageId}] 加载测试数据`);
    
    // 获取当前位置
    const { latitude, longitude } = this.data;
    if (!latitude || !longitude) {
      console.log(`[页面${pageId}] 没有位置数据，无法加载测试数据`);
      return;
    }
    
    // 创建测试数据 - 在当前位置附近创建几个测试宝藏
    const testTreasures = [
      {
        id: 10001,
        name: "测试宝藏1",
        description: "这是一个测试宝藏，用于调试",
        latitude: latitude + 0.001,
        longitude: longitude + 0.001,
        points: 10,
        collected: false
      },
      {
        id: 10002,
        name: "测试宝藏2",
        description: "这是另一个测试宝藏，用于调试",
        latitude: latitude - 0.001,
        longitude: longitude - 0.001,
        points: 20,
        collected: false
      },
      {
        id: 10003,
        name: "测试宝藏3",
        description: "这是第三个测试宝藏，用于调试",
        latitude: latitude + 0.002,
        longitude: longitude - 0.002,
        points: 30,
        collected: false
      }
    ];
    
    // 保留用户位置标记
    const userMarker = this.data.markers.find(marker => marker.id === 999999);
    
    // 转换为地图标记
    const treasureMarkers = testTreasures.map((item) => {
      return {
        id: item.id,
        latitude: item.latitude,
        longitude: item.longitude,
        title: item.name,
        width: 40,
        height: 40,
        callout: {
          content: item.name,
          color: '#FF9800',
          fontSize: 14,
          borderRadius: 4,
          padding: 8,
          display: 'BYCLICK'
        },
        iconPath: '../../images/logo.png'
      };
    });
    
    // 组合标记
    let markers = [...treasureMarkers];
    if (userMarker) {
      markers.push(userMarker);
    }
    
    this.setData({ 
      markers,
      loadingTreasures: false
    }, () => {
      console.log(`[页面${pageId}] 测试宝藏标记已更新，总数:`, markers.length);
    });
    
    // 存储原始宝藏数据
    app.globalData.treasures = testTreasures;
    
    // 刷新地图显示
    setTimeout(() => this.fixMapDisplay(), 300);
  },

  // 点击标记事件
  onMarkerTap: function (e) {
    const markerId = e.markerId;
    const treasures = app.globalData.treasures;
    const treasure = treasures.find(item => item.id === markerId);
    
    if (treasure) {
      // 停止之前的导航
      if (this.data.isNavigating) {
        this.stopLocationTracking();
        this.setData({
          polyline: [],
          isNavigating: false
        });
      }
      
      // 检查该宝藏是否已被收藏
      const favorites = wx.getStorageSync('favoriteTreasures') || [];
      const isFavorite = favorites.some(fav => fav.id === treasure.id);
      
      this.setData({ 
        selectedTreasure: treasure,
        isFavorite: isFavorite
      });
      this.calculateDistance(this.data.latitude, this.data.longitude);
    }
  },

  // 开始位置监听
  startLocationTracking: function() {
    // 先停止之前的监听
    this.stopLocationTracking();
    
    // 开启新的位置监听
    wx.startLocationUpdate({
      success: (res) => {
        console.log('开始位置监听成功');
        
        // 注册位置变化监听器
        const locationChangeListener = wx.onLocationChange(res => {
          const { latitude, longitude } = res;
          
          // 获取当前的宝藏标记
          const treasureMarkers = this.data.markers.filter(marker => marker.id !== 999999);
          
          // 更新所有标记，确保用户标记和宝藏标记不混淆
          this.updateMarkers(treasureMarkers, latitude, longitude);
          
          // 更新当前位置
          this.setData({ 
            latitude, 
            longitude
          });
          
          // 计算与宝藏的距离
          this.calculateDistance(latitude, longitude);
        });
        
        this.setData({ locationChangeListener });
      },
      fail: (err) => {
        console.error('开始位置监听失败:', err);
        wx.showToast({
          title: '位置监听失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 停止位置监听
  stopLocationTracking: function() {
    if (this.data.locationChangeListener) {
      wx.offLocationChange(this.data.locationChangeListener);
      wx.stopLocationUpdate(); // 停止位置更新
      this.setData({ locationChangeListener: null });
    }
  },

  // 开始导航
  startNavigation: function () {
    const treasure = this.data.selectedTreasure;
    if (!treasure) return;
    
    // 获取导航路线
    this.getRoute();
    
    // 开始位置监听
    this.startLocationTracking();
    
    // 更新导航状态
    this.setData({ isNavigating: true });
    
    wx.showToast({
      title: '导航开始',
      icon: 'success'
    });
  },
  
  // 结束导航
  stopNavigation: function() {
    // 停止位置监听
    this.stopLocationTracking();
    
    // 清除导航路线
    this.setData({
      polyline: [],
      isNavigating: false
    });
    
    wx.showToast({
      title: '导航结束',
      icon: 'success'
    });
  },
  
  // 获取导航路线 - 使用高德步行路线规划
  getRoute: function() {
    const { latitude, longitude, selectedTreasure } = this.data;
    
    wx.showLoading({ title: '规划路线中...' });
    
    // 使用高德地图步行路线规划 - 使用原始坐标
    amapInst.getWalkingRoute({
      origin: `${longitude},${latitude}`,
      destination: `${selectedTreasure.longitude},${selectedTreasure.latitude}`,
      success: (data) => {
        wx.hideLoading();
        
        if (data && data.paths && data.paths[0]) {
          // 处理路线数据
          const path = data.paths[0];
          const points = [];
          
          // 解析路线坐标
          if (path.steps) {
            path.steps.forEach(step => {
              if (step.polyline) {
                const polylinePoints = step.polyline.split(';');
                polylinePoints.forEach(point => {
                  const [lng, lat] = point.split(',');
                  points.push({
                    longitude: parseFloat(lng),
                    latitude: parseFloat(lat)
                  });
                });
              }
            });
          }
          
          // 设置路线
          this.setData({
            polyline: [{
              points: points,
              color: '#FF9800',
              width: 6,
              arrowLine: true
            }]
          });
          
          // 使用高德返回的距离更新应用内距离
          if (path.distance) {
            const distance = parseInt(path.distance);
            const canCollect = distance <= 50; // 50米内可以领取
            console.log('高德路线规划返回的距离:', distance, '米');
            
            this.setData({
              distance: distance,
              canCollect: canCollect
            });
          }
          
          console.log('路线规划成功，距离:', path.distance, '米，预计时间:', path.duration, '秒');
        } else {
          console.error('路线数据异常:', data);
          wx.showToast({
            title: '获取路线失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('获取路线失败', err);
        wx.showToast({
          title: '获取导航路线失败',
          icon: 'none'
        });
      }
    });
  },

  // 显示路线（使用微信自带导航）
  showExternalRoute: function () {
    const treasure = this.data.selectedTreasure;
    wx.openLocation({
      latitude: treasure.latitude,
      longitude: treasure.longitude,
      name: treasure.name,
      address: treasure.description,
      scale: 18
    });
  },

  // 地图更新完成事件处理
  onMapUpdated: function(e) {
    const pageId = this.data.pageId;
    console.log(`[页面${pageId}] 地图更新完成`);
  },
  
  // 地图错误处理
  onMapError: function(e) {
    const pageId = this.data.pageId;
    console.error(`[页面${pageId}] 地图加载错误:`, e.detail);
    
    // 检查是否是因为位置未获取导致的错误
    if (!this.data.latitude || !this.data.longitude) {
      console.log(`[页面${pageId}] 地图错误可能是由于位置数据不存在导致，使用默认位置`);
      // 设置默认位置确保地图能显示
      this.setData({
        latitude: 39.909200,
        longitude: 116.397390,
        loadingLocation: false,
        mapInitialized: true
      }, () => {
        setTimeout(() => {
          this.fixMapDisplay();
          this.getUserLocation(); // 尝试获取真实位置
        }, 500);
      });
      return;
    }
    
    wx.showToast({
      title: '地图加载失败，正在重试',
      icon: 'none'
    });
    
    // 检查当前页面堆栈和路径
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    console.log(`[页面${pageId}] 当前页面路径:`, currentPage.route);
    
    // 如果不在tabBar页面中，重新导航到tabBar页面
    if (currentPage.route !== 'pages/map/map' || pages.length > 1) {
      console.log(`[页面${pageId}] 检测到当前不在tabBar上下文中，尝试重新导航`);
      
      // 延迟执行，确保UI不会阻塞
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/map/map',
          success: () => {
            console.log(`[页面${pageId}] 重新切换到地图页面成功`);
            // 延迟后重新初始化
            setTimeout(() => {
              this.resetMap();
            }, 500);
          },
          fail: (err) => {
            console.error(`[页面${pageId}] 重新切换到地图页面失败:`, err);
            
            // 如果switchTab失败，尝试使用reLaunch
            wx.reLaunch({
              url: '/pages/map/map',
              success: () => {
                console.log(`[页面${pageId}] 使用reLaunch重新加载成功`);
              },
              fail: (switchErr) => {
                console.error(`[页面${pageId}] 所有导航方法均失败:`, switchErr);
              }
            });
          }
        });
      }, 1000);
      return;
    }
    
    // 先检查缓存中是否有位置
    try {
      const savedLocation = wx.getStorageSync(LOCATION_CACHE_KEY);
      if (savedLocation && (!this.data.latitude || !this.data.longitude)) {
        console.log(`[页面${pageId}] 从缓存恢复位置修复地图:`, savedLocation);
        this.setData({
          latitude: savedLocation.latitude, 
          longitude: savedLocation.longitude,
          mapInitialized: true
        }, () => {
          setTimeout(() => this.fixMapDisplay(), 500);
        });
      }
    } catch (e) {
      console.error(`[页面${pageId}] 读取缓存位置失败:`, e);
    }
    
    // 尝试重新初始化地图，延迟1秒执行
    setTimeout(() => {
      console.log(`[页面${pageId}] 尝试恢复地图显示`);
      this.fixMapDisplay();
    }, 1000);
  },

  // 领取宝藏
  collectTreasure: function () {
    const { selectedTreasure, distance } = this.data;
    
    if (distance <= 50) {  // 距离小于50米，考虑到GPS定位误差
      wx.showLoading({ title: '正在验证...' });
      
      app.request({
        url: `/treasures/${selectedTreasure.id}/find`,
        method: 'POST',
        data: {
          latitude: this.data.latitude,
          longitude: this.data.longitude
        }
      }).then(res => {
        wx.hideLoading();
        
        // 停止导航
        if (this.data.isNavigating) {
          this.stopLocationTracking();
          this.setData({
            polyline: [],
            isNavigating: false
          });
        }
        
        wx.showModal({
          title: '恭喜你',
          content: `你找到了宝藏【${selectedTreasure.name}】，获得${res.data.points}积分奖励！`,
          showCancel: false,
          success: () => {
            // 重新获取宝藏列表
            this.getTreasures();
            this.setData({ selectedTreasure: null });
          }
        });
      }).catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: err || '验证失败',
          icon: 'none'
        });
      });
    } else {
      wx.showToast({
        title: '距离太远，无法找到宝藏',
        icon: 'none'
      });
    }
  },

  // 移动到用户位置
  moveToUserLocation: function() {
    if (!this.data.latitude || !this.data.longitude) {
      wx.showToast({
        title: '位置未获取，请稍候',
        icon: 'none'
      });
      this.getUserLocation();
      return;
    }
    
    const mapCtx = wx.createMapContext('map');
    
    // 设置地图中心为用户当前位置
    mapCtx.moveToLocation({
      success: () => {
        // 调整缩放级别为较大值，以便看清周围环境
        this.setData({ scale: 18 });
        console.log('已定位到用户位置');
        
        wx.showToast({
          title: '已定位到当前位置',
          icon: 'success',
          duration: 1500
        });
      },
      fail: (err) => {
        console.error('定位失败:', err);
        
        // 如果微信原生moveToLocation失败，尝试手动移动地图中心
        this.setData({
          longitude: this.data.longitude,
          latitude: this.data.latitude,
          scale: 18
        });
      }
    });
  },

  // 处理标题点击，连续点击5次激活调试模式
  handleTitleClick: function() {
    this.debugClickCount++;
    
    if (this.debugClickCount >= 5) {
      const newDebugMode = !this.data.isDebugMode;
      this.setData({ isDebugMode: newDebugMode });
      
      wx.showToast({
        title: newDebugMode ? '已激活调试模式' : '已关闭调试模式',
        icon: 'none'
      });
      
      this.debugClickCount = 0;
    } else if (this.debugClickCount === 1) {
      // 设置重置计数器的定时器
      setTimeout(() => {
        this.debugClickCount = 0;
      }, 3000);
    }
  },

  // 重置地图
  resetMap: function() {
    const pageId = this.data.pageId;
    console.log(`[页面${pageId}] 重置地图`);
    try {
      // 清除所有现有标记
      this.setData({
        markers: [],
        polyline: [],
        selectedTreasure: null,
        isNavigating: false
      }, () => {
        console.log(`[页面${pageId}] 地图状态已重置，准备重新加载位置和宝藏`);
      });
      
      // 停止位置监听
      this.stopLocationTracking();
      
      // 重新获取位置和宝藏
      console.log(`[页面${pageId}] 开始重新获取位置`);
      this.getUserLocation();
      
      wx.showToast({
        title: '地图已重置',
        icon: 'success'
      });
    } catch (err) {
      console.error(`[页面${pageId}] 重置地图失败:`, err);
    }
  },

  // 添加刷新按钮处理函数
  handleRefresh: function() {
    const pageId = this.data.pageId;
    console.log(`[页面${pageId}] 刷新页面`);
    this.resetMap();
  },

  // 添加收藏/取消收藏功能
  toggleFavorite: function() {
    if (!this.data.selectedTreasure) return;
    
    const treasure = this.data.selectedTreasure;
    const favorites = wx.getStorageSync('favoriteTreasures') || [];
    
    // 判断是收藏还是取消收藏
    const isFavorited = favorites.some(fav => fav.id === treasure.id);
    
    if (isFavorited) {
      // 取消收藏
      const newFavorites = favorites.filter(fav => fav.id !== treasure.id);
      wx.setStorageSync('favoriteTreasures', newFavorites);
      
      wx.showToast({
        title: '已取消收藏',
        icon: 'success',
        duration: 1500
      });
      
      this.setData({ isFavorite: false });
    } else {
      // 添加收藏
      const favoriteItem = {
        id: treasure.id,
        name: treasure.name,
        description: treasure.description,
        points: treasure.points,
        latitude: treasure.latitude,
        longitude: treasure.longitude,
        timestamp: new Date().getTime()
      };
      
      favorites.push(favoriteItem);
      wx.setStorageSync('favoriteTreasures', favorites);
      
      wx.showToast({
        title: '收藏成功',
        icon: 'success',
        duration: 1500
      });
      
      this.setData({ isFavorite: true });
    }
  },
}); 