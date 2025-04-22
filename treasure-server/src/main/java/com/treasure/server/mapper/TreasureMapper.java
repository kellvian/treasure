package com.treasure.server.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.treasure.server.entity.Treasure;
import org.apache.ibatis.annotations.Mapper;
import org.springframework.stereotype.Repository;

@Mapper
@Repository
public interface TreasureMapper extends BaseMapper<Treasure> {
} 