package cn.nitemoon.cloud.onnx.config;

import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * ONNX模型配置类，用于管理OrtSession对象的单例Bean
 */
@Slf4j
@Configuration
public class OnnxModelConfig {

    private OrtEnvironment ortEnvironment;

    @PostConstruct
    public void init() throws OrtException {
        // 初始化ONNX环境
        ortEnvironment = OrtEnvironment.getEnvironment();
        log.info("ONNX环境初始化完成");
    }

    @PreDestroy
    public void destroy() {
        try {
            if (ortEnvironment != null) {
                ortEnvironment.close();
                log.info("ONNX环境已关闭");
            }
        } catch (Exception e) {
            log.error("关闭ONNX环境时出错", e);
        }
    }

    /**
     * 创建车牌检测模型会话Bean
     *
     * @return 车牌检测模型会话
     * @throws OrtException ONNX运行时异常
     */
    @Bean
    public OrtSession plateDetectSession() throws OrtException, IOException {
        InputStream modelStream = new ClassPathResource("model/plate_detect.onnx").getInputStream();
        byte[] modelBytes = readAllBytes(modelStream);
        OrtSession.SessionOptions sessionOptions = new OrtSession.SessionOptions();
        OrtSession session = ortEnvironment.createSession(modelBytes, sessionOptions);
        log.info("车牌检测模型加载完成");
        return session;
    }

    /**
     * 创建车牌识别模型会话Bean
     *
     * @return 车牌识别模型会话
     * @throws OrtException ONNX运行时异常
     */
    @Bean
    public OrtSession plateRecColorSession() throws OrtException, IOException {
        InputStream modelStream = new ClassPathResource("model/plate_rec_color.onnx").getInputStream();
        byte[] modelBytes = readAllBytes(modelStream);
        OrtSession.SessionOptions sessionOptions = new OrtSession.SessionOptions();
        OrtSession session = ortEnvironment.createSession(modelBytes, sessionOptions);
        log.info("车牌识别模型加载完成");
        return session;
    }

    /**
     * 创建YOLOv8目标检测模型会话Bean
     *
     * @return YOLOv8目标检测模型会话
     * @throws OrtException ONNX运行时异常
     */
    @Bean
    public OrtSession yolov8Session() throws OrtException, IOException {
        InputStream modelStream = new ClassPathResource("model/yolov8s.onnx").getInputStream();
        byte[] modelBytes = readAllBytes(modelStream);
        OrtSession.SessionOptions sessionOptions = new OrtSession.SessionOptions();
        OrtSession session = ortEnvironment.createSession(modelBytes, sessionOptions);
        log.info("YOLOv8目标检测模型加载完成");
        return session;
    }

    /**
     * 创建YOLOv11目标检测模型会话Bean
     *
     * @return YOLOv11目标检测模型会话
     * @throws OrtException ONNX运行时异常
     */
    @Bean
    public OrtSession yolov11Session() throws OrtException, IOException {
        InputStream modelStream = new ClassPathResource("model/yolo11n.onnx").getInputStream();
        byte[] modelBytes = readAllBytes(modelStream);
        OrtSession.SessionOptions sessionOptions = new OrtSession.SessionOptions();
        OrtSession session = ortEnvironment.createSession(modelBytes, sessionOptions);
        log.info("YOLOv11目标检测模型加载完成");
        return session;
    }

    /**
     * 创建YOLOv7-tiny目标检测模型会话Bean
     *
     * @return YOLOv7-tiny目标检测模型会话
     * @throws OrtException ONNX运行时异常
     */
    @Bean
    public OrtSession yolov7TinySession() throws OrtException, IOException {
        InputStream modelStream = new ClassPathResource("model/yolov7-tiny.onnx").getInputStream();
        byte[] modelBytes = readAllBytes(modelStream);
        OrtSession.SessionOptions sessionOptions = new OrtSession.SessionOptions();
        OrtSession session = ortEnvironment.createSession(modelBytes, sessionOptions);
        log.info("YOLOv7-tiny目标检测模型加载完成");
        return session;
    }

    /**
     * 从InputStream读取所有字节数据
     *
     * @param inputStream 输入流
     * @return 字节数组
     * @throws IOException IO异常
     */
    private byte[] readAllBytes(InputStream inputStream) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        int nRead;
        byte[] data = new byte[1024];
        while ((nRead = inputStream.read(data, 0, data.length)) != -1) {
            buffer.write(data, 0, nRead);
        }
        return buffer.toByteArray();
    }

    /**
     * 获取ONNX环境
     *
     * @return ONNX环境
     */
    @Bean
    public OrtEnvironment ortEnvironment() {
        return ortEnvironment;
    }
}
