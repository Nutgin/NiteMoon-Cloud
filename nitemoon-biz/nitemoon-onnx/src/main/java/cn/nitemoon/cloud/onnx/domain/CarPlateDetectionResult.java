package cn.nitemoon.cloud.onnx.domain;

import lombok.Data;

/**
 * 车牌识别结果DTO
 */
@Data
public class CarPlateDetectionResult {
    /**
     * 处理后的图片Base64编码
     */
    private String imageBase64;

    /**
     * 车牌号码
     */
    private String plateNo;

    /**
     * 车牌颜色
     */
    private String plateColor;
}
