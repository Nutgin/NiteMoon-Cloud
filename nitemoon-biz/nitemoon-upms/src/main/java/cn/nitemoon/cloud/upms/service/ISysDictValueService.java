package cn.nitemoon.cloud.upms.service;

import com.baomidou.mybatisplus.extension.service.IService;
import cn.nitemoon.cloud.upms.api.entity.SysDictValue;

/**
 * 字典键值
 *
 * @author hetao
 * @date 2022/10/21
 */
public interface ISysDictValueService extends IService<SysDictValue> {

	/**
	 * 新增字典值
	 * @param sysDictValue
	 * @return
	 */
	boolean saveDictValue(SysDictValue sysDictValue);

}
