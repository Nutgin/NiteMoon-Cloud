package cn.nitemoon.cloud.onnx.controller;

import cn.nitemoon.cloud.onnx.domain.CarPlateDetectionResult;
import cn.nitemoon.cloud.onnx.service.CarPlateDetectionService;
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
@RequestMapping("car-detection")
@Tag(name = "车牌识别管理")
public class CarPlateDetectionController {

    private final CarPlateDetectionService carPlateDetectionService;

    /**
     * 上传图片进行车牌识别
     *
     * @param file 上传的图片文件
     * @return 车牌识别结果，包括标记框的图片Base64编码、车牌号和车牌颜色
     */
    @PostMapping("/plate-detection")
    @Operation(summary = "上传图片进行车牌识别")
    public Result<CarPlateDetectionResult> detectCarPlate(@RequestParam("file") MultipartFile file) {
        CarPlateDetectionResult detectionResult = carPlateDetectionService.detectCarPlate(file);
        return Result.success(detectionResult);
    }
}
