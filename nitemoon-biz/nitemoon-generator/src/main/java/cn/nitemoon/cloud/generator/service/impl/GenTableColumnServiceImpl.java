package cn.nitemoon.cloud.generator.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import cn.nitemoon.cloud.generator.entity.GenTableColumn;
import cn.nitemoon.cloud.generator.mapper.GenTableColumnMapper;
import cn.nitemoon.cloud.generator.service.IGenTableColumnService;
import org.springframework.stereotype.Service;

@Service
public class GenTableColumnServiceImpl extends ServiceImpl<GenTableColumnMapper, GenTableColumn>
		implements IGenTableColumnService {

}
