FROM node:18-alpine as build

# 设置工作目录
WORKDIR /app

# 配置npm缓存和镜像
RUN npm config set registry https://registry.npmmirror.com
# 不清理npm缓存，改用缓存
# RUN npm cache clean --force
RUN npm config set cache /app/.npm-cache --global

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖，确保安装vite
RUN npm install
RUN npm install -g vite

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 使用nginx作为生产服务器
FROM nginx:stable-alpine

# 将构建结果复制到nginx目录
COPY --from=build /app/dist /usr/share/nginx/html

# 复制nginx配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露80端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]