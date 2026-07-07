package cn.nitemoon.cloud.upms.mapper;

import cn.nitemoon.cloud.upms.api.entity.File;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

/**
 * 文件操作 Mapper
 */
@Mapper
public interface FileMapper extends BaseMapper<File> {

}
