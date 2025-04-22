# 构建阶段
FROM node:18-alpine AS build

# 接收NPM镜像URL参数
ARG NPM_REGISTRY=https://registry.npmjs.org/

# 设置工作目录
WORKDIR /app

# 配置npm使用镜像源和网络参数
RUN npm config set registry $NPM_REGISTRY && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 3 && \
    npm config set network-timeout 600000

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖 (使用npm install替代npm ci，并添加--no-fund --no-audit参数)
RUN npm install --no-fund --no-audit --prefer-offline --network-timeout=600000

# 复制项目文件
COPY . .

# 构建应用
RUN npm run build

# 运行阶段
FROM nginx:alpine

# 将构建输出复制到 Nginx 的服务目录
COPY --from=build /app/dist /usr/share/nginx/html

# 创建 Nginx 配置文件
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d

# 暴露端口
EXPOSE 80

# 启动 Nginx 服务
CMD ["nginx", "-g", "daemon off;"] 