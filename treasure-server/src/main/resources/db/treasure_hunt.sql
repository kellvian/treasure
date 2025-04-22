create table treasure_hunt.treasure
(
    id          bigint auto_increment comment '宝藏ID'
        primary key,
    name        varchar(100)                 not null comment '宝藏名称',
    description text                         null comment '宝藏描述',
    longitude   double                       not null comment '经度',
    latitude    double                       not null comment '纬度',
    points      int         default 10       not null comment '奖励积分',
    status      varchar(20) default 'active' not null comment '状态：active-激活，inactive-未激活',
    create_time datetime                     not null comment '创建时间',
    update_time datetime                     not null comment '更新时间',
    deleted     tinyint(1)  default 0        not null comment '是否删除：0-未删除，1-已删除'
)
    comment '宝藏表' charset = utf8mb4;

create table treasure_hunt.treasure_record
(
    id          bigint auto_increment comment '记录ID'
        primary key,
    user_id     bigint   not null comment '用户ID',
    treasure_id bigint   not null comment '宝藏ID',
    longitude   double   not null comment '发现时经度',
    latitude    double   not null comment '发现时纬度',
    points      int      not null comment '获得积分',
    find_time   datetime not null comment '发现时间',
    constraint uk_user_treasure
        unique (user_id, treasure_id)
)
    comment '寻宝记录表' charset = utf8mb4;

create table treasure_hunt.user
(
    id          bigint auto_increment comment '用户ID'
        primary key,
    username    varchar(50)                  not null comment '用户名',
    password    varchar(100)                 not null comment '密码',
    nickname    varchar(50)                  null comment '昵称',
    avatar      varchar(255)                 null comment '头像',
    open_id     varchar(50)                  null comment '微信OpenID',
    phone       varchar(20)                  null comment '手机号',
    email       varchar(100)                 null comment '邮箱',
    points      int         default 0        null comment '积分',
    status      varchar(20) default 'active' not null comment '状态：active-激活，inactive-未激活',
    create_time datetime                     not null comment '创建时间',
    update_time datetime                     not null comment '更新时间',
    deleted     tinyint(1)  default 0        not null comment '是否删除：0-未删除，1-已删除',
    role        varchar(10) default ''       null,
    constraint uk_username
        unique (username)
)
    comment '用户表' charset = utf8mb4;

