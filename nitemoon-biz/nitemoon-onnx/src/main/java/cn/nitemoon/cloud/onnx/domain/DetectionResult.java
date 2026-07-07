package cn.nitemoon.cloud.onnx.domain;

import lombok.Data;

import java.util.List;

/**
 * 图片检测结果DTO
 */
@Data
public class DetectionResult {

    /**
     * Base64编码的标记图像
     */
    private String image;

    /**
     * 检测到的对象列表
     */
    private List<Detection> detections;

    /**
     * 图像宽度
     */
    private int imageWidth;

    /**
     * 图像高度
     */
    private int imageHeight;
}
