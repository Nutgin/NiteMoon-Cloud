package cn.nitemoon.cloud.common.core.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * @author hetao
 * @description 登录设备类型枚举
 * @date 2024/05/06 13:52
 */
@Getter
@AllArgsConstructor
public enum DeviceTypeEnum {

	TOB("TOB"), TOC("TOC");

	private final String device;

}
