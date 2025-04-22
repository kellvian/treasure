FROM node:18-alpine as build

# 设置工作目录
WORKDIR /app

# 配置npm使用淘宝镜像
RUN npm config set registry https://registry.npmmirror.com

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

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