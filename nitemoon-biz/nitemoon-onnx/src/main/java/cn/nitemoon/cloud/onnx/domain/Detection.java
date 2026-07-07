package cn.nitemoon.cloud.onnx.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 检测对象DTO
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Detection {

    /**
     * 标签（中文）
     */
    private String label;

    /**
     * 类别ID
     */
    private Integer clsId;

    /**
     * 边界框坐标 [x1, y1, x2, y2]
     */
    private float[] bbox;

    /**
     * 置信度
     */
    private float confidence;
}
