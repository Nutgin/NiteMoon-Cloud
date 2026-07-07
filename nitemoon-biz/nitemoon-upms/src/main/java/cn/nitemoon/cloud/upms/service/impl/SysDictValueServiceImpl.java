package cn.nitemoon.cloud.upms.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import cn.nitemoon.cloud.common.core.constant.CacheConstants;
import cn.nitemoon.cloud.upms.api.entity.SysDict;
import cn.nitemoon.cloud.upms.api.entity.SysDictValue;
import cn.nitemoon.cloud.upms.mapper.SysDictMapper;
import cn.nitemoon.cloud.upms.mapper.SysDictValueMapper;
import cn.nitemoon.cloud.upms.service.ISysDictValueService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.util.Objects;

/**
 * 字典键值
 *
 * @author hetao
 * @date 2022/10/21
 */
@Service
@RequiredArgsConstructor
public class SysDictValueServiceImpl extends ServiceImpl<SysDictValueMapper, SysDictValue>
		implements ISysDictValueService {

	private final SysDictMapper sysDictMapper;

	@Override
	@CacheEvict(value = CacheConstants.DICT_CACHE, allEntries = true)
	public boolean saveDictValue(SysDictValue sysDictValue) {
		SysDict sysDict = sysDictMapper.selectById(sysDictValue.getDictId());
		if (Objects.isNull(sysDict)) {
			throw new IllegalArgumentException("字典不存在");
		}
		sysDictValue.setDictType(sysDict.getType());
		return this.save(sysDictValue);
	}

}
