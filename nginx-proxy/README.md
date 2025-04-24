# Nginx 反向代理服务

这是一个简单的Nginx反向代理配置，用于将特定域名的流量转发到指定IP和端口。

## 特性

- 支持HTTP自动跳转HTTPS
- 使用SSL证书提供安全连接
- 纯转发模式，无内容修改
- 支持WebSocket连接（如需要）

## 快速开始

### 1. 准备工作

确保系统已安装Docker和Docker Compose。

### 2. 设置证书和配置

运行设置脚本复制证书文件：

```bash
chmod +x setup.sh
./setup.sh
```

### 3. 配置转发目标

编辑nginx.conf文件，替换TARGET_IP和TARGET_PORT为实际转发目标：

```bash
# 例如将流量转发到192.168.1.100:8080
sed -i 's/TARGET_IP:TARGET_PORT/192.168.1.100:8080/g' nginx.conf
```

### 4. 启动服务

```bash
docker-compose up -d
```

### 5. 查看日志

```bash
docker-compose logs -f
```

## 自定义配置

### 修改域名

如需监听不同域名，编辑nginx.conf中的server_name部分。

### 添加更多转发规则

可在nginx.conf中添加更多location块以支持不同路径的转发规则。

## 注意事项

- 确保80和443端口未被其他服务占用
- 确保证书文件权限正确
- 定期更新证书以保持SSL连接安全 