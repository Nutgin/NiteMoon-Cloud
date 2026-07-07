package cn.nitemoon.cloud.onnx.controller;

import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import cn.nitemoon.cloud.common.demo.annotation.DemoTrail;
import cn.nitemoon.cloud.onnx.domain.DetectionResult;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.onnx.service.DynamicYoloModelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;

/**
 * 动态YOLO模型控制器
 * 提供用户上传自定义YOLOv8 ONNX模型并进行目标检测的API接口
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/dynamic-yolo")
@Tag(name = "动态YOLO模型管理")
public class DynamicYoloModelController {

    private final DynamicYoloModelService dynamicYoloModelService;

    /**
     * 使用用户上传的模型进行目标检测
     *
     * @param modelFile 用户上传的ONNX模型文件
     * @param image 待检测的图片文件
     * @return 检测结果
     */
    @PostMapping("/detect")
    @Operation(summary = "使用用户上传的模型进行目标检测")
    @DemoTrail(onlyView = true)
    public Result<DetectionResult> detectWithCustomModel(
            @RequestParam("modelFile") MultipartFile modelFile,
            @RequestParam("image") MultipartFile image) {
        OrtSession session = null;
        try {
            // 加载用户上传的模型
            session = dynamicYoloModelService.loadModel(modelFile);

            // 使用模型进行目标检测
            DetectionResult result = dynamicYoloModelService.detectImage(session, image);

            return Result.success(result);
        } catch (IOException e) {
            log.error("文件读取失败", e);
            return Result.fail("文件读取失败: " + e.getMessage());
        } catch (OrtException e) {
            log.error("ONNX模型处理失败", e);
            return Result.fail("ONNX模型处理失败: " + e.getMessage());
        } catch (Exception e) {
            log.error("目标检测失败", e);
            return Result.fail("目标检测失败: " + e.getMessage());
        } finally {
            // 释放资源
            if (session != null) {
                try {
                    session.close();
                } catch (Exception e) {
                    log.warn("关闭ONNX会话时出错", e);
                }
            }
        }
    }

    /**
     * 通过模型URL进行目标检测
     *
     * @param modelUrl ONNX模型的远程URL
     * @param image    待检测的图片文件
     * @return 检测结果
     */
    @PostMapping("/detect-by-url")
    @Operation(summary = "通过模型URL进行目标检测")
    @DemoTrail(onlyView = true)
    public Result<DetectionResult> detectByUrl(
            @RequestParam("modelUrl") String modelUrl,
            @RequestParam("image") MultipartFile image) {
        OrtSession session = null;
        try {
            // 下载ONNX模型文件
            log.info("开始下载ONNX模型: {}", modelUrl);
            byte[] modelBytes;
            try (InputStream in = new URL(modelUrl).openStream();
                 ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = in.read(buffer)) != -1) {
                    baos.write(buffer, 0, bytesRead);
                }
                modelBytes = baos.toByteArray();
            }
            log.info("ONNX模型下载完成，大小: {} bytes", modelBytes.length);

            // 加载模型
            session = dynamicYoloModelService.loadModel(modelBytes);

            // 推理
            DetectionResult result = dynamicYoloModelService.detectImage(session, image);
            return Result.success(result);
        } catch (IOException e) {
            log.error("模型下载或文件读取失败", e);
            return Result.fail("模型下载失败: " + e.getMessage());
        } catch (OrtException e) {
            log.error("ONNX模型处理失败", e);
            return Result.fail("ONNX模型处理失败: " + e.getMessage());
        } catch (Exception e) {
            log.error("目标检测失败", e);
            return Result.fail("目标检测失败: " + e.getMessage());
        } finally {
            if (session != null) {
                try {
                    session.close();
                } catch (Exception e) {
                    log.warn("关闭ONNX会话时出错", e);
                }
            }
        }
    }
}
