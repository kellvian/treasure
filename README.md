# 宝藏猎人 (Treasure Hunt)

一个互动宝藏寻宝应用，包含微信小程序、管理后台和服务器端。

## 项目结构

项目由三个主要部分组成：

- **treasure-app**: 微信小程序客户端，用户可以查看地图、寻找宝藏并收藏自己喜欢的宝藏
- **treasure-admin**: 基于Vue.js的管理后台，用于管理用户、宝藏和系统设置
- **treasure-server**: Java后端服务器，提供API接口和数据存储

## 功能特点

- 实时地图显示和导航功能
- 宝藏收集与积分系统
- 用户管理和权限控制
- 宝藏管理和数据分析
- 收藏夹功能

## 快速开始

### 小程序端 (treasure-app)

1. 使用微信开发者工具打开`treasure-app`目录
2. 编译并运行项目

### 管理后台 (treasure-admin)

```bash
cd treasure-admin
npm install
npm run dev
```

### 服务器端 (treasure-server)

```bash
cd treasure-server
mvn clean install
java -jar target/treasure-server.jar
```

## 技术栈

- 前端：WeChat Mini Program, Vue.js, Element Plus
- 后端：Spring Boot, MyBatis
- 数据库：MySQL
- 地图：高德地图API 