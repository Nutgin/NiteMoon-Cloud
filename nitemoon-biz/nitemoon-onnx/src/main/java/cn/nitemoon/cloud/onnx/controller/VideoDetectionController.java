package cn.nitemoon.cloud.onnx.controller;

import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.common.demo.annotation.DemoTrail;
import cn.nitemoon.cloud.onnx.domain.VideoDetectionResult;
import cn.nitemoon.cloud.onnx.service.CameraDetectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;

/**
 * 视频检测控制器
 * 提供视频识别相关的REST API
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("video-detection")
@Tag(name = "视频识别管理")
public class VideoDetectionController {

    @Resource
    private CameraDetectionService cameraDetectionService;

    @Resource
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * 处理视频URL，进行目标检测
     *
     * @param videoUrl 视频URL（支持http、https、rtmp、rtsp、本地视频文件等）
     *                 示例：
     *                 - HTTP/HTTPS: https://platform.nitemoon.cn/api/boot/file/1/get/xxx.mov
     *                 - rtmp流: rtmp://192.168.1.100/live/test
     *                 - rtsp流: rtsp://192.168.1.100/live/test
     *                 - 本地文件: video/car3.mp4
     *                 注意：不支持h265视频编码，如果无法播放或者程序卡住，请修改视频编码格式
     * @param outputRtmpUrl 输出的RTMP流地址（SRS服务器地址）
     * @throws Exception 可能抛出的异常
     */
    @Operation(summary = "处理视频URL进行目标检测")
    @PostMapping("/process-video-url")
    @DemoTrail
    public void processVideoUrl(
            @Parameter(description = "视频URL，支持http/https/rtmp/rtsp/本地文件路径")
            @RequestParam String videoUrl,
            @Parameter(description = "输出的RTMP流地址（SRS服务器地址）")
            @RequestParam String outputRtmpUrl) throws Exception {
        log.info("开始处理视频URL: {}, 输出到: {}", videoUrl, outputRtmpUrl);
        cameraDetectionService.processVideoUrl(videoUrl, outputRtmpUrl);
    }

    /**
     * 处理上传的视频文件，进行目标检测
     *
     * @param file 上传的视频文件
     * @param outputRtmpUrl 输出的RTMP流地址（SRS服务器地址）
     * @throws Exception 可能抛出的异常
     */
    @Operation(summary = "处理上传的视频文件进行目标检测")
    @PostMapping("/process-uploaded-video")
    @DemoTrail
    public void processUploadedVideo(
            @Parameter(description = "上传的视频文件")
            @RequestParam("file") MultipartFile file,
            @Parameter(description = "输出的RTMP流地址（SRS服务器地址）")
            @RequestParam String outputRtmpUrl) throws Exception {
        log.info("开始处理上传的视频文件: {}, 输出到: {}", file.getOriginalFilename(), outputRtmpUrl);

        // 在 Controller 层先保存文件，避免 Undertow 异步清理临时文件
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".mp4";
        java.io.File tempFile = java.io.File.createTempFile("uploaded_video_", extension);
        String tempVideoPath = tempFile.getAbsolutePath();
        file.transferTo(tempFile);

        log.info("上传的视频文件已保存到临时文件: {}", tempVideoPath);

        // 调用异步方法处理文件路径
        cameraDetectionService.processUploadedVideoPath(tempVideoPath, outputRtmpUrl);
    }

    /**
     * 处理本地默认视频文件，进行目标检测
     *
     * @param outputRtmpUrl 输出的RTMP流地址（SRS服务器地址）
     * @throws Exception 可能抛出的异常
     */
    @Operation(summary = "处理本地默认视频文件进行目标检测")
    @PostMapping("/process-default-video")
    @DemoTrail
    public void processDefaultVideo(
            @Parameter(description = "输出的RTMP流地址（SRS服务器地址）")
            @RequestParam String outputRtmpUrl) throws Exception {
        log.info("开始处理本地默认视频文件, 输出到: {}", outputRtmpUrl);
        cameraDetectionService.processDefaultVideo(outputRtmpUrl);
    }

    /**
     * 查询视频检测结果
     *
     * @param outputRtmpUrl 输出的RTMP流地址（SRS服务器地址）
     * @return 视频检测结果
     */
    @Operation(summary = "查询视频检测结果")
    @GetMapping("/get-detection-result")
    public Result<VideoDetectionResult> getDetectionResult(
            @Parameter(description = "输出的RTMP流地址（SRS服务器地址）")
            @RequestParam String outputRtmpUrl) {
        // 从outputRtmpUrl中提取唯一标识符（最后一个/后面的部分）
        String redisKeySuffix = outputRtmpUrl.substring(outputRtmpUrl.lastIndexOf("/") + 1);
        String redisKey = "nitemoon:videoDetection:" + redisKeySuffix;

        log.info("查询视频检测结果，redisKey: {}", redisKey);

        VideoDetectionResult result = (VideoDetectionResult) redisTemplate.opsForValue().get(redisKey);
        if (result == null) {
            log.warn("未找到检测结果，redisKey: {}", redisKey);
            return null;
        }

        return Result.success(result);
    }

    /**
     * 停止视频推流
     *
     * @param outputRtmpUrl 输出的RTMP流地址（SRS服务器地址）
     * @return 操作结果
     */
    @Operation(summary = "停止视频推流")
    @PostMapping("/stop-stream")
    public Result<String> stopStream(
            @Parameter(description = "输出的RTMP流地址（SRS服务器地址）")
            @RequestParam String outputRtmpUrl) {
        log.info("停止视频推流，outputRtmpUrl: {}", outputRtmpUrl);
        cameraDetectionService.stopFFmpegProcess(outputRtmpUrl);
        return Result.success("推流已停止");
    }
}
