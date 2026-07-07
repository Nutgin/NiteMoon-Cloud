package cn.nitemoon.cloud.onnx.controller;

import cn.nitemoon.cloud.onnx.domain.DetectionResult;
import cn.nitemoon.cloud.onnx.service.PictureDetectionService;
import cn.nitemoon.cloud.common.core.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("pic-detection")
@Tag(name = "图片识别管理")
public class PictureDetectionController {

    private final PictureDetectionService pictureDetectionService;

    @PostMapping("/detection")
    @Operation(summary = "图片目标检测")
    public Result<DetectionResult> detection(@RequestParam("image") MultipartFile image) {
        try {
            DetectionResult result = pictureDetectionService.detectImage(image);
            return Result.success(result);
        } catch (Exception e) {
            log.error("图片检测失败", e);
            return Result.fail("图片检测失败: " + e.getMessage());
        }
    }
}
