/**
 * 坐标转换工具
 * 提供WGS-84与GCJ-02之间的坐标转换
 * 以及浏览器定位与高德地图坐标系统之间的转换
 */

const PI = Math.PI;
const X_PI = PI * 3000.0 / 180.0;
const EARTH_RADIUS = 6371000; // 地球半径，单位：米
const a = 6378245.0; // 长半轴
const ee = 0.00669342162296594323; // 偏心率平方

/**
 * 判断是否在中国境内
 * @param {number} lat - 纬度
 * @param {number} lng - 经度
 * @returns {boolean} 是否在中国境内
 */
function outOfChina(lat, lng) {
  if (lng < 72.004 || lng > 137.8347) return true;
  if (lat < 0.8293 || lat > 55.8271) return true;
  return false;
}

/**
 * WGS-84 转 GCJ-02
 * 将GPS坐标转换为高德坐标
 * @param {number} wgsLat - WGS-84纬度
 * @param {number} wgsLng - WGS-84经度
 * @returns {object} GCJ-02坐标
 */
function wgs84ToGcj02(wgsLat, wgsLng) {
  wgsLat = parseFloat(wgsLat);
  wgsLng = parseFloat(wgsLng);
  
  if (outOfChina(wgsLat, wgsLng)) {
    return { latitude: wgsLat, longitude: wgsLng };
  }
  
  let dLat = transformLat(wgsLng - 105.0, wgsLat - 35.0);
  let dLng = transformLng(wgsLng - 105.0, wgsLat - 35.0);
  
  const radLat = wgsLat / 180.0 * PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
  dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);
  
  return { 
    latitude: wgsLat + dLat, 
    longitude: wgsLng + dLng 
  };
}

/**
 * GCJ-02 转 WGS-84
 * 将高德坐标转换为GPS坐标
 * @param {number} gcjLat - GCJ-02纬度
 * @param {number} gcjLng - GCJ-02经度
 * @returns {object} WGS-84坐标
 */
function gcj02ToWgs84(gcjLat, gcjLng) {
  gcjLat = parseFloat(gcjLat);
  gcjLng = parseFloat(gcjLng);
  
  if (outOfChina(gcjLat, gcjLng)) {
    return { latitude: gcjLat, longitude: gcjLng };
  }
  
  let dLat = transformLat(gcjLng - 105.0, gcjLat - 35.0);
  let dLng = transformLng(gcjLng - 105.0, gcjLat - 35.0);
  
  const radLat = gcjLat / 180.0 * PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
  dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);
  
  return { 
    latitude: gcjLat - dLat, 
    longitude: gcjLng - dLng 
  };
}

/**
 * 计算两点之间的距离（米）
 * @param {number} lat1 - 第一点纬度
 * @param {number} lng1 - 第一点经度
 * @param {number} lat2 - 第二点纬度
 * @param {number} lng2 - 第二点经度
 * @returns {number} 距离，单位：米
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  // 确保输入为数值
  lat1 = parseFloat(lat1);
  lng1 = parseFloat(lng1);
  lat2 = parseFloat(lat2);
  lng2 = parseFloat(lng2);
  
  if ([lat1, lng1, lat2, lng2].some(isNaN)) {
    console.error('距离计算失败：无效的坐标输入');
    return 0;
  }

  // 转换为弧度
  const toRadians = (degree) => degree * PI / 180;
  
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = Math.round(EARTH_RADIUS * c);
  
  return distance;
}

/**
 * 转换纬度偏移
 * @param {number} x - 经度偏移
 * @param {number} y - 纬度偏移
 * @returns {number} 转换后的纬度偏移
 */
function transformLat(x, y) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
  return ret;
}

/**
 * 转换经度偏移
 * @param {number} x - 经度偏移
 * @param {number} y - 纬度偏移
 * @returns {number} 转换后的经度偏移
 */
function transformLng(x, y) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
  return ret;
}

export default {
  wgs84ToGcj02,
  gcj02ToWgs84,
  calculateDistance
}; 