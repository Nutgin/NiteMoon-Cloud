package cn.nitemoon.cloud.onnx.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 视频检测结果
 * 用于存储到Redis中
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VideoDetectionResult implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 当前画面中的人数
     */
    private int currentPersonCount;
    
    /**
     * 检测开始时间
     */
    private LocalDateTime startTime;
    
    /**
     * 最后更新时间
     */
    private LocalDateTime lastUpdateTime;
    
    /**
     * 告警记录列表
     */
    private List<String> alertMessages;
    
    /**
     * 总结文本
     */
    private String summary;
    
    /**
     * 状态：running-运行中, completed-已完成
     */
    private String status;
    
    /**
     * 总检测帧数
     */
    private long totalFrames;
    
    /**
     * 最大人数
     */
    private int maxPersonCount;
    
    public VideoDetectionResult(LocalDateTime startTime) {
        this.startTime = startTime;
        this.lastUpdateTime = startTime;
        this.currentPersonCount = 0;
        this.alertMessages = new ArrayList<>();
        this.status = "running";
        this.totalFrames = 0;
        this.maxPersonCount = 0;
    }
}
