package cn.nitemoon.cloud.onnx.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * OpenCV配置类，用于在Spring容器启动时加载OpenCV库
 */
@Slf4j
@Configuration
public class OpenCVConfig {

    @PostConstruct
    public void loadOpenCV() {
        loadMacLibrary();
    }

    public static void loadMacLibrary() {
        try {
            // 首先尝试从指定路径加载OpenCV库
            String openCVLibPath = "/usr/local/opencv/share/java/opencv4";
            // 如果是mac，读取dylib文件，如果是linux，读取so文件
            String osName = System.getProperty("os.name").toLowerCase();
            String libFileName;
            if (osName.contains("mac")) {
                libFileName = "libopencv_java481.dylib";
            } else if (osName.contains("linux")) {
                libFileName = "libopencv_java481.so";
            } else {
                throw new RuntimeException("Unsupported operating system: " + osName);
            }

            Path libPath = Paths.get(openCVLibPath, libFileName);

            if (Files.exists(libPath)) {
                // 如果指定路径存在库文件，则直接加载
                System.load(libPath.toString());
                log.info("从指定路径加载OpenCV库成功: {}", libPath);
            } else {
                // 否则使用默认方式加载
                //nu.pattern.OpenCV.loadLocally();
                log.info("指定路径不存在opencv库");
                throw new RuntimeException("Failed to load OpenCV library");
            }
        } catch (Exception e) {
            log.error("OpenCV库加载失败", e);
            throw new RuntimeException("Failed to load OpenCV library", e);
        }
    }
}
