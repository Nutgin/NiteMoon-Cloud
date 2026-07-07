package cn.nitemoon.cloud.onnx.service;

import ai.onnxruntime.*;
import cn.nitemoon.cloud.onnx.config.ODConfig;
import cn.nitemoon.cloud.onnx.config.VideoConfig;
import cn.nitemoon.cloud.onnx.domain.Detection;
import cn.nitemoon.cloud.onnx.domain.VideoDetectionResult;
import cn.nitemoon.cloud.onnx.utils.ImageUtil;
import cn.nitemoon.cloud.onnx.utils.Letterbox;
import lombok.extern.slf4j.Slf4j;
import org.opencv.core.*;
import org.opencv.imgproc.Imgproc;
import org.opencv.videoio.VideoCapture;
import org.opencv.videoio.Videoio;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.FloatBuffer;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CameraDetectionService {

    // 注入模型会话
    private OrtSession session;
    private OrtEnvironment environment;

    // FFmpeg 进程和输出流
    private Process ffmpegProcess;
    private OutputStream ffmpegOutputStream;

    // 推流帧率控制
    private long lastFrameTime = 0;
    private final long frameIntervalMs = 33; // 约30fps
    private long frameCount = 0; // 帧计数器，用于批量刷新缓冲区

    // 进程管理Map：outputRtmpUrl -> FFmpeg进程信息
    private final Map<String, ProcessInfo> ffmpegProcessMap = new ConcurrentHashMap<>();

    // 进程信息内部类
    private static class ProcessInfo {
        Process process;
        OutputStream outputStream;
        String outputRtmpUrl;

        ProcessInfo(Process process, OutputStream outputStream, String outputRtmpUrl) {
            this.process = process;
            this.outputStream = outputStream;
            this.outputRtmpUrl = outputRtmpUrl;
        }
    }

    @Autowired
    private VideoConfig videoConfig;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    public CameraDetectionService(OrtSession yolov11Session, OrtEnvironment environment) {
        this.session = yolov11Session;
        this.environment = environment;
    }

    @PostConstruct
    public void init() {
        // 输出基本信息
        try {
            session.getInputInfo().keySet().forEach(x -> {
                try {
                    log.info("input name = {}", x);
                    log.info(session.getInputInfo().get(x).getInfo().toString());
                } catch (OrtException e) {
                    throw new RuntimeException(e);
                }
            });
        } catch (OrtException e) {
            throw new RuntimeException(e);
        }

        log.info("CameraDetectionService初始化完成");
    }

    /**
     * 处理RTMP视频流，进行目标检测并推送处理后的流到新的RTMP地址
     *
     * @param inputRtmpUrl  输入的RTMP流地址
     * @param outputRtmpUrl 输出的RTMP流地址
     * @throws Exception 可能抛出的异常
     */
    @Async("nitemoonAsyncExecutor")
    public void processRtmpStream(String inputRtmpUrl, String outputRtmpUrl) throws Exception {
        try {

            // 模型标签
            String[] labels = {
                    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train",
                    "truck", "boat", "traffic light", "fire hydrant", "stop sign", "parking meter",
                    "bench", "bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear",
                    "zebra", "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase",
                    "frisbee", "skis", "snowboard", "sports ball", "kite", "baseball bat",
                    "baseball glove", "skateboard", "surfboard", "tennis racket", "bottle",
                    "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
                    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut",
                    "cake", "chair", "couch", "potted plant", "bed", "dining table", "toilet",
                    "tv", "laptop", "mouse", "remote", "keyboard", "cell phone", "microwave",
                    "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase", "scissors",
                    "teddy bear", "hair drier", "toothbrush"};

            // 加载标签及颜色
            ODConfig odConfig = new ODConfig();
            VideoCapture video = new VideoCapture();
            video.open(inputRtmpUrl);

            if (!video.isOpened()) {
                log.error("打开视频流失败,未检测到监控,请先用vlc软件测试链接是否可以播放！inputRtmpUrl={}", inputRtmpUrl);
                throw new RuntimeException("无法打开视频流: " + inputRtmpUrl);
            }

            // 获取视频属性
            int width = (int) video.get(Videoio.CAP_PROP_FRAME_WIDTH);
            int height = (int) video.get(Videoio.CAP_PROP_FRAME_HEIGHT);
            double fps = video.get(Videoio.CAP_PROP_FPS) > 0 ? video.get(Videoio.CAP_PROP_FPS) : 15.0;

            // 启动FFmpeg进程
            startFFmpegProcess(width, height, fps, outputRtmpUrl);

            // 在这里先定义下框的粗细、字的大小、字的类型、字的颜色(按比例设置大小粗细比较好一些)
            int minDwDh = Math.min((int) video.get(Videoio.CAP_PROP_FRAME_WIDTH), (int) video.get(Videoio.CAP_PROP_FRAME_HEIGHT));
            int thickness = minDwDh / ODConfig.lineThicknessRatio;

            // 更改 image 尺寸
            Letterbox letterbox = new Letterbox();
            List<double[]> colors = new ArrayList<>();

            float confThreshold = 0.35F;
            float nmsThreshold = 0.55F;

            Mat img = new Mat();

            // 跳帧检测，一般设置为3，毫秒内视频画面变化是不大的，快了无意义，反而浪费性能
            int detectSkip = 4;
            // 跳帧计数
            int detectSkipIndex = 1;

            // 最新一帧也就是上一帧推理结果
            float[][] outputData = null;
            Map<Integer, List<float[]>> class2Bbox = new HashMap<>();

            // 当前最新一帧。上一帧也可以暂存一下
            Mat image;

            for (int i = 0; i < labels.length; i++) {
                Random random = new Random();
                double[] color = {random.nextDouble() * 256, random.nextDouble() * 256, random.nextDouble() * 256};
                colors.add(color);
            }

            OnnxTensor tensor = null;
            OrtSession.Result output = null;

            // 使用多线程和GPU可以提升帧率，线上项目必须多线程！！！
            // 一个线程拉流，将图像存到[定长]队列或数组或者集合，一个线程模型推理，中间通过变量或者队列交换数据
            // 代码示例仅仅使用单线程
            while (true) {
                // 添加重试机制处理VideoCapture.read()失败的情况
                boolean frameReadSuccess = false;
                int retryCount = 0;
                final int maxRetries = 3;
                final long retryDelayMs = 5000; // 5秒

                while (!frameReadSuccess && retryCount < maxRetries) {
                    if (retryCount > 0) {
                        log.warn("视频帧读取失败，{}秒后进行第{}次重试", retryDelayMs / 1000, retryCount);
                        try {
                            Thread.sleep(retryDelayMs);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw new RuntimeException("线程中断", ie);
                        }
                    }

                    frameReadSuccess = video.read(img);
                    if (!frameReadSuccess) {
                        // 检查视频流是否仍然打开
                        if (!video.isOpened()) {
                            log.error("视频流已关闭，无法继续读取帧");
                            break;
                        }

                        log.warn("视频帧读取失败，当前帧数据状态 - 宽度: {}, 高度: {}, 通道数: {}",
                                img.cols(), img.rows(), img.channels());
                        retryCount++;
                    }
                }

                // 如果读取帧失败，记录错误并跳出循环
                if (!frameReadSuccess) {
                    log.error("视频帧读取失败，已重试{}次仍未成功，结束视频处理", maxRetries);
                    break;
                }

                // 检查读取到的帧是否有效
                if (img.empty()) {
                    log.warn("读取到空帧，跳过当前帧处理");
                    continue;
                }

                if ((detectSkipIndex % detectSkip == 0) || outputData == null) {
                    try {
                        image = img.clone();
                        image = letterbox.letterbox(image);
                        Imgproc.cvtColor(image, image, Imgproc.COLOR_BGR2RGB);

                        image.convertTo(image, CvType.CV_32FC1, 1. / 255);
                        float[] whc = new float[3 * 640 * 640];
                        image.get(0, 0, whc);
                        float[] chw = ImageUtil.whc2cwh(whc);

                        detectSkipIndex = 1;

                        FloatBuffer inputBuffer = FloatBuffer.wrap(chw);
                        tensor = OnnxTensor.createTensor(environment, inputBuffer, new long[]{1, 3, 640, 640});

                        HashMap<String, OnnxTensor> stringOnnxTensorHashMap = new HashMap<>();
                        stringOnnxTensorHashMap.put(session.getInputInfo().keySet().iterator().next(), tensor);

                        // 运行推理
                        // 模型推理本质是多维矩阵运算，而GPU是专门用于矩阵运算，占用率低，
                        // 如果使用cpu也可以运行，可能占用率100%属于正常现象，不必纠结。
                        output = session.run(stringOnnxTensorHashMap);

                        // 得到结果,缓存结果
                        outputData = ((float[][][]) output.get(0).getValue())[0];
                        outputData = transposeMatrix(outputData);
                        class2Bbox.clear();
                        for (float[] bbox : outputData) {
                            float[] conditionalProbabilities = Arrays.copyOfRange(bbox, 4, bbox.length);
                            int label = argmax(conditionalProbabilities);
                            float conf = conditionalProbabilities[label];
                            if (conf < confThreshold) continue;

                            bbox[4] = conf;

                            // xywh to (x1, y1, x2, y2)
                            xywh2xyxy(bbox);

                            // skip invalid predictions
                            if (bbox[0] >= bbox[2] || bbox[1] >= bbox[3]) continue;

                            class2Bbox.putIfAbsent(label, new ArrayList<>());
                            class2Bbox.get(label).add(bbox);
                        }

                    } catch (Exception e) {
                        log.error("推理出错", e);
                    } finally {
                        if (output != null) {
                            output.close();
                        }
                        if (tensor != null) {
                            tensor.close();
                        }
                    }
                } else {
                    detectSkipIndex = detectSkipIndex + 1;
                }

                List<Detection> detections = new ArrayList<>();
                for (Map.Entry<Integer, List<float[]>> entry : class2Bbox.entrySet()) {
                    int label = entry.getKey();
                    List<float[]> bboxes = entry.getValue();
                    bboxes = nonMaxSuppression(bboxes, nmsThreshold);
                    for (float[] bbox : bboxes) {
                        String labelString = labels[label];
                        detections.add(new Detection(labelString, entry.getKey(), Arrays.copyOfRange(bbox, 0, 4), bbox[4]));
                    }
                }

                for (Detection detection : detections) {
                    float[] bbox = detection.getBbox();
                    // 画框
                    Point topLeft = new Point((bbox[0] - letterbox.getDw()) / letterbox.getRatio(), (bbox[1] - letterbox.getDh()) / letterbox.getRatio());
                    Point bottomRight = new Point((bbox[2] - letterbox.getDw()) / letterbox.getRatio(), (bbox[3] - letterbox.getDh()) / letterbox.getRatio());
                    Scalar color = new Scalar(colors.get(detection.getClsId()));
                    Imgproc.rectangle(img, topLeft, bottomRight, color, thickness);
                    // 框上写文字
                    Point boxNameLoc = new Point((bbox[0] - letterbox.getDw()) / letterbox.getRatio(), (bbox[1] - letterbox.getDh()) / letterbox.getRatio() - 3);

                    Imgproc.putText(img, detection.getLabel(), boxNameLoc, Imgproc.FONT_HERSHEY_SIMPLEX, 0.7, color, thickness);
                }

                // 推送处理后的帧到FFmpeg
                pushFrameToFFmpeg(img);

                // 控制台输出处理进度
                log.debug("处理视频帧完成");
            }

        } finally {
            // 清理资源
            stopFFmpegProcess();
            destroyAllWindows();
            if (ffmpegOutputStream != null) {
                try {
                    ffmpegOutputStream.close();
                } catch (IOException e) {
                    log.error("关闭FFmpeg输出流错误", e);
                }
            }
        }
    }

    /**
     * 启动FFmpeg进程
     */
    private void startFFmpegProcess(int width, int height, double fps, String rtmpUrl) throws IOException {
        // 检查FFmpeg版本以决定使用哪个命令集
        List<String> command = buildFFmpegCommand(width, height, fps, rtmpUrl);

        // 创建进程
        ProcessBuilder builder = new ProcessBuilder(command);
        builder.redirectErrorStream(true);
        ffmpegProcess = builder.start();

        // 获取输出流
        ffmpegOutputStream = ffmpegProcess.getOutputStream();

        // 将进程信息存入Map（使用最后一个斜杠后面的部分作为key，避免IP前缀变化影响）
        String processKey = rtmpUrl.substring(rtmpUrl.lastIndexOf("/") + 1);
        ProcessInfo processInfo = new ProcessInfo(ffmpegProcess, ffmpegOutputStream, rtmpUrl);
        ffmpegProcessMap.put(processKey, processInfo);

        // 启动线程读取FFmpeg输出
        new Thread(() -> {
            try {
                byte[] buffer = new byte[1024];
                int bytesRead;
                while ((bytesRead = ffmpegProcess.getInputStream().read(buffer)) != -1) {
                    System.out.write(buffer, 0, bytesRead);
                }
            } catch (IOException e) {
                log.error("FFmpeg输出读取错误: " + e.getMessage());
            }
        }).start();

        log.info("FFmpeg推流已启动: {}", String.join(" ", command));
    }

    /**
     * 根据FFmpeg版本构建合适的命令参数
     * @param width 视频宽度
     * @param height 视频高度
     * @param fps 帧率
     * @param rtmpUrl RTMP地址
     * @return FFmpeg命令参数列表
     */
    private List<String> buildFFmpegCommand(int width, int height, double fps, String rtmpUrl) throws IOException {
        // 获取FFmpeg版本信息
        String ffmpegVersion = getFFmpegVersion();
        boolean isNewVersion = isFFmpegNewVersion(ffmpegVersion);

        // 计算合适的码率：宽度 * 高度 * 帧率 * 0.1（系数），最小800kbps，最大4000kbps
        int bitrate = (int) Math.min(Math.max(width * height * fps * 0.1, 800000), 4000000);
        int maxrate = (int) (bitrate * 1.2);
        int bufsize = maxrate * 2;

        List<String> command = new ArrayList<>();
        command.add("ffmpeg");
        command.add("-y");
        // 禁用缓冲，减少延迟
        command.add("-fflags");
        command.add("nobuffer");
        command.add("-flags");
        command.add("low_delay");
        command.add("-f");
        command.add("rawvideo");
        command.add("-vcodec");
        command.add("rawvideo");
        command.add("-pix_fmt");
        command.add("bgr24");
        command.add("-s");
        command.add(width + "x" + height);
        command.add("-r");
        command.add(String.valueOf(fps));
        command.add("-i");
        command.add("-");
        command.add("-c:v");
        command.add("libx264");

        if (isNewVersion) {
            // 新版本FFmpeg参数
            command.add("-preset");
            command.add("veryfast");
            command.add("-tune");
            command.add("zerolatency");
        } else {
            // 老版本FFmpeg参数（针对2.8.15优化）
            command.add("-pix_fmt");
            command.add("yuv420p");
            command.add("-preset");
            command.add("ultrafast");
            command.add("-tune");
            command.add("zerolatency");
        }

        // 码率控制
        command.add("-b:v");
        command.add(String.valueOf(bitrate));
        command.add("-maxrate");
        command.add(String.valueOf(maxrate));
        command.add("-bufsize");
        command.add(String.valueOf(bufsize));

        // GOP设置：GOP大小 = 帧率 * 2，确保每2秒一个关键帧
        int gopSize = (int) (fps * 2);
        command.add("-g");
        command.add(String.valueOf(gopSize));

        // 实时推流优化
        command.add("-profile:v");
        command.add("baseline");
        command.add("-level");
        command.add("3.1");

        command.add("-f");
        command.add("flv");
        command.add(rtmpUrl);

        log.info("FFmpeg推流参数 - 码率: {}kbps, 最大码率: {}kbps, 缓冲区: {}kbps, GOP: {}",
                bitrate / 1000, maxrate / 1000, bufsize / 1000, gopSize);

        return command;
    }

    /**
     * 获取FFmpeg版本信息
     * @return FFmpeg版本字符串
     */
    private String getFFmpegVersion() throws IOException {
        try {
            ProcessBuilder builder = new ProcessBuilder("ffmpeg", "-version");
            Process process = builder.start();

            StringBuilder versionInfo = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    versionInfo.append(line).append("\n");
                    // 只读取第一行版本信息即可
                    break;
                }
            }

            process.destroy();
            return versionInfo.toString();
        } catch (Exception e) {
            log.warn("无法获取FFmpeg版本信息，将使用默认配置: {}", e.getMessage());
            return "";
        }
    }

    /**
     * 判断FFmpeg是否为新版本（>= 4.0）
     * @param versionInfo FFmpeg版本信息
     * @return 如果是新版本返回true，否则返回false
     */
    private boolean isFFmpegNewVersion(String versionInfo) {
        try {
            if (versionInfo.contains("ffmpeg version")) {
                // 提取版本号，例如从 "ffmpeg version 7.1.1" 中提取 "7.1.1"
                String[] parts = versionInfo.split(" ");
                for (int i = 2; i < parts.length; i++) {
                    if (parts[i].matches("\\d+\\.\\d+.*")) {
                        String version = parts[i];
                        // 提取主版本号
                        String[] versionParts = version.split("\\.");
                        int majorVersion = Integer.parseInt(versionParts[0]);
                        // 判断主版本号是否大于等于4
                        log.info("检测到FFmpeg主版本号: {}", majorVersion);
                        return majorVersion >= 4;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("解析FFmpeg版本时出错，将使用老版本配置: {}", e.getMessage());
        }

        // 默认假设是老版本（更安全的选择）
        log.info("无法确定FFmpeg版本，默认使用老版本参数");
        return false;
    }

    /**
     * 停止FFmpeg进程
     */
    public void stopFFmpegProcess() {
        if (ffmpegOutputStream != null) {
            try {
                ffmpegOutputStream.close();
            } catch (IOException e) {
                log.error("关闭FFmpeg输出流错误: " + e.getMessage());
            }
        }
        if (ffmpegProcess != null) {
            ffmpegProcess.destroy();
            try {
                ffmpegProcess.waitFor();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            log.info("FFmpeg推流已停止");
        }
        // 重置帧率控制变量
        lastFrameTime = 0;
    }

    /**
     * 根据outputRtmpUrl停止特定的FFmpeg进程
     * @param outputRtmpUrl 输出的RTMP流地址
     */
    public void stopFFmpegProcess(String outputRtmpUrl) {
        // 使用最后一个斜杠后面的部分作为key
        String processKey = outputRtmpUrl.substring(outputRtmpUrl.lastIndexOf("/") + 1);
        ProcessInfo processInfo = ffmpegProcessMap.get(processKey);
        if (processInfo != null) {
            try {
                if (processInfo.outputStream != null) {
                    processInfo.outputStream.close();
                }
                if (processInfo.process != null) {
                    processInfo.process.destroy();
                    try {
                        processInfo.process.waitFor();
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
                // 从Map中移除
                ffmpegProcessMap.remove(processKey);
                log.info("FFmpeg推流已停止，outputRtmpUrl: {}", outputRtmpUrl);
            } catch (IOException e) {
                log.error("关闭FFmpeg进程错误，outputRtmpUrl: {}", outputRtmpUrl, e);
            }
        } else {
            log.warn("未找到对应的FFmpeg进程，outputRtmpUrl: {}", outputRtmpUrl);
        }
    }

    /**
     * 推送帧到FFmpeg（带帧率控制）
     */
    private void pushFrameToFFmpeg(Mat img) {
        if (ffmpegProcess != null && ffmpegProcess.isAlive()) {
            // 帧率控制：确保不超过目标帧率，但不人为延迟
            long currentTime = System.currentTimeMillis();
            long elapsed = currentTime - lastFrameTime;
            if (elapsed < frameIntervalMs) {
                // 如果处理太快，适当延迟，但不要强制等待
                try {
                    Thread.sleep(Math.min(frameIntervalMs - elapsed, 10)); // 最多延迟10ms
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
            lastFrameTime = System.currentTimeMillis();

            // 验证推送帧的尺寸
            if (frameCount % 100 == 0) {
                log.info("推送帧尺寸 - 宽度: {}, 高度: {}, 字节数: {}", img.cols(), img.rows(), img.rows() * img.cols() * 3);
            }

            byte[] frameData = new byte[img.rows() * img.cols() * 3];
            img.get(0, 0, frameData);
            try {
                ffmpegOutputStream.write(frameData);
                // 移除每帧刷新，改为批量刷新以减少系统开销
                // 每10帧刷新一次缓冲区
                frameCount++;
                if (frameCount % 10 == 0) {
                    ffmpegOutputStream.flush();
                }
            } catch (IOException e) {
                log.error("推送帧到FFmpeg时出错", e);
                throw new RuntimeException(e);
            }
        }
    }

    /**
     * 转置矩阵
     */
    public static float[][] transposeMatrix(float[][] m) {
        float[][] temp = new float[m[0].length][m.length];
        for (int i = 0; i < m.length; i++)
            for (int j = 0; j < m[0].length; j++)
                temp[j][i] = m[i][j];
        return temp;
    }

    /**
     * 返回最大值的索引
     */
    public static int argmax(float[] a) {
        float re = -Float.MAX_VALUE;
        int arg = -1;
        for (int i = 0; i < a.length; i++) {
            if (a[i] >= re) {
                re = a[i];
                arg = i;
            }
        }
        return arg;
    }

    /**
     * xywh转xyxy
     */
    public static void xywh2xyxy(float[] bbox) {
        float x = bbox[0];
        float y = bbox[1];
        float w = bbox[2];
        float h = bbox[3];

        bbox[0] = x - w * 0.5f;
        bbox[1] = y - h * 0.5f;
        bbox[2] = x + w * 0.5f;
        bbox[3] = y + h * 0.5f;
    }

    /**
     * 非极大值抑制
     */
    public static List<float[]> nonMaxSuppression(List<float[]> bboxes, float iouThreshold) {
        List<float[]> bestBboxes = new ArrayList<>();
        bboxes.sort(Comparator.comparing(a -> a[4]));

        while (!bboxes.isEmpty()) {
            float[] bestBbox = bboxes.remove(bboxes.size() - 1);
            bestBboxes.add(bestBbox);
            bboxes = bboxes.stream().filter(a -> computeIOU(a, bestBbox) < iouThreshold).collect(Collectors.toList());
        }

        return bestBboxes;
    }

    /**
     * 计算IOU
     */
    public static float computeIOU(float[] box1, float[] box2) {
        float area1 = (box1[2] - box1[0]) * (box1[3] - box1[1]);
        float area2 = (box2[2] - box2[0]) * (box2[3] - box2[1]);

        float left = Math.max(box1[0], box2[0]);
        float top = Math.max(box1[1], box2[1]);
        float right = Math.min(box1[2], box2[2]);
        float bottom = Math.min(box1[3], box2[3]);

        float interArea = Math.max(right - left, 0) * Math.max(bottom - top, 0);
        float unionArea = area1 + area2 - interArea;
        return Math.max(interArea / unionArea, 1e-8f);
    }

    /**
     * 处理视频URL，进行目标检测
     *
     * @param videoUrl 视频URL（支持http、https、rtmp、rtsp、本地视频文件等）
     * @param outputRtmpUrl 输出的RTMP流地址（SRS服务器地址）
     * @throws Exception 可能抛出的异常
     */
    @Async("nitemoonAsyncExecutor")
    public void processVideoUrl(String videoUrl, String outputRtmpUrl) throws Exception {
        Process ffmpegProcess = null;
        OutputStream ffmpegOutputStream = null;
        String tempVideoPath = null;

        // 重置帧率控制变量
        lastFrameTime = 0;

        // 从outputRtmpUrl中提取唯一标识符（最后一个/后面的部分）
        String redisKeySuffix = outputRtmpUrl.substring(outputRtmpUrl.lastIndexOf("/") + 1);
        String redisKey = "nitemoon:videoDetection:" + redisKeySuffix;

        // 初始化检测结果
        VideoDetectionResult detectionResult = new VideoDetectionResult(LocalDateTime.now());
        redisTemplate.opsForValue().set(redisKey, detectionResult, 24, TimeUnit.HOURS);

        // 用于记录上一帧和当前帧的人数
        Map<String, Integer> lastPersonCount = new HashMap<>();
        Map<String, Integer> currentPersonCount = new HashMap<>();

        // 连续帧计数器，用于稳定判断
        int consecutiveFramesOverThreshold = 0;
        final int thresholdFrames = 3; // 连续3帧超过阈值才告警
        final int personThreshold = 3; // 人数阈值

        try {
            // 模型标签
            String[] labels = {
                    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train",
                    "truck", "boat", "traffic light", "fire hydrant", "stop sign", "parking meter",
                    "bench", "bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear",
                    "zebra", "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase",
                    "frisbee", "skis", "snowboard", "sports ball", "kite", "baseball bat",
                    "baseball glove", "skateboard", "surfboard", "tennis racket", "bottle",
                    "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
                    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut",
                    "cake", "chair", "couch", "potted plant", "bed", "dining table", "toilet",
                    "tv", "laptop", "mouse", "remote", "keyboard", "cell phone", "microwave",
                    "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase", "scissors",
                    "teddy bear", "hair drier", "toothbrush"};

            // 加载标签及颜色
            ODConfig odConfig = new ODConfig();
            VideoCapture video = new VideoCapture();

            // 判断是否为HTTP/HTTPS URL
            String actualVideoUrl = videoUrl;
            if (videoUrl.startsWith("http://") || videoUrl.startsWith("https://")) {
                // 对于HTTP/HTTPS URL，使用FFmpeg下载到临时文件
                log.info("检测到HTTP/HTTPS视频URL，使用FFmpeg下载到临时文件: {}", videoUrl);
                tempVideoPath = downloadHttpVideoToTempFile(videoUrl);
                actualVideoUrl = tempVideoPath;
            }

            video.open(actualVideoUrl);

            if (!video.isOpened()) {
                log.error("打开视频流失败,未检测到视频,请先用vlc软件测试链接是否可以播放！videoUrl={}", videoUrl);
                throw new RuntimeException("无法打开视频流: " + videoUrl);
            }

            // 获取视频属性
            int width = (int) video.get(Videoio.CAP_PROP_FRAME_WIDTH);
            int height = (int) video.get(Videoio.CAP_PROP_FRAME_HEIGHT);
            double fps = video.get(Videoio.CAP_PROP_FPS) > 0 ? video.get(Videoio.CAP_PROP_FPS) : 15.0;

            log.info("视频打开成功 - 宽度: {}, 高度: {}, 帧率: {}, 宽高比: {}", width, height, fps, String.format("%.2f", (double)width/height));

            // 启动FFmpeg推流进程
            startFFmpegProcess(width, height, fps, outputRtmpUrl);

            // 在这里先定义下框的粗细、字的大小、字的类型、字的颜色(按比例设置大小粗细比较好一些)
            int minDwDh = Math.min((int) video.get(Videoio.CAP_PROP_FRAME_WIDTH), (int) video.get(Videoio.CAP_PROP_FRAME_HEIGHT));
            int thickness = minDwDh / ODConfig.lineThicknessRatio;

            // 更改 image 尺寸
            Letterbox letterbox = new Letterbox();
            List<double[]> colors = new ArrayList<>();

            float confThreshold = 0.35F;
            float nmsThreshold = 0.55F;

            Mat img = new Mat();

            // 跳帧检测，一般设置为3，毫秒内视频画面变化是不大的，快了无意义，反而浪费性能
            int detectSkip = 4;
            // 跳帧计数
            int detectSkipIndex = 1;

            // 最新一帧也就是上一帧推理结果
            float[][] outputData = null;
            Map<Integer, List<float[]>> class2Bbox = new HashMap<>();

            // 当前最新一帧。上一帧也可以暂存一下
            Mat image;

            for (int i = 0; i < labels.length; i++) {
                Random random = new Random();
                double[] color = {random.nextDouble() * 256, random.nextDouble() * 256, random.nextDouble() * 256};
                colors.add(color);
            }

            OnnxTensor tensor = null;
            OrtSession.Result output = null;

            int frameCount = 0;

            // 使用多线程和GPU可以提升帧率，线上项目必须多线程！！！
            // 一个线程拉流，将图像存到[定长]队列或数组或者集合，一个线程模型推理，中间通过变量或者队列交换数据
            // 代码示例仅仅使用单线程
            while (true) {
                // 添加重试机制处理VideoCapture.read()失败的情况
                boolean frameReadSuccess = false;
                int retryCount = 0;
                final int maxRetries = 3;
                final long retryDelayMs = 5000; // 5秒

                while (!frameReadSuccess && retryCount < maxRetries) {
                    if (retryCount > 0) {
                        log.warn("视频帧读取失败，{}秒后进行第{}次重试", retryDelayMs / 1000, retryCount);
                        try {
                            Thread.sleep(retryDelayMs);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            throw new RuntimeException("线程中断", ie);
                        }
                    }

                    frameReadSuccess = video.read(img);
                    if (!frameReadSuccess) {
                        // 检查视频流是否仍然打开
                        if (!video.isOpened()) {
                            log.error("视频流已关闭，无法继续读取帧");
                            break;
                        }

                        log.warn("视频帧读取失败，当前帧数据状态 - 宽度: {}, 高度: {}, 通道数: {}",
                                img.cols(), img.rows(), img.channels());
                        retryCount++;
                    }
                }

                // 如果读取帧失败，记录错误并跳出循环
                if (!frameReadSuccess) {
                    log.error("视频帧读取失败，已重试{}次仍未成功，结束视频处理", maxRetries);
                    break;
                }

                // 检查读取到的帧是否有效
                if (img.empty()) {
                    log.warn("读取到空帧，跳过当前帧处理");
                    continue;
                }

                // 首帧日志：验证实际帧尺寸
                if (frameCount == 0) {
                    log.info("首帧尺寸 - 宽度: {}, 高度: {}, 通道数: {}, 宽高比: {}",
                            img.cols(), img.rows(), img.channels(), String.format("%.2f", (double)img.cols()/img.rows()));
                }

                frameCount++;

                if ((detectSkipIndex % detectSkip == 0) || outputData == null) {
                    try {
                        image = img.clone();
                        image = letterbox.letterbox(image);
                        Imgproc.cvtColor(image, image, Imgproc.COLOR_BGR2RGB);

                        image.convertTo(image, CvType.CV_32FC1, 1. / 255);
                        float[] whc = new float[3 * 640 * 640];
                        image.get(0, 0, whc);
                        float[] chw = ImageUtil.whc2cwh(whc);

                        detectSkipIndex = 1;

                        FloatBuffer inputBuffer = FloatBuffer.wrap(chw);
                        tensor = OnnxTensor.createTensor(environment, inputBuffer, new long[]{1, 3, 640, 640});

                        HashMap<String, OnnxTensor> stringOnnxTensorHashMap = new HashMap<>();
                        stringOnnxTensorHashMap.put(session.getInputInfo().keySet().iterator().next(), tensor);

                        // 运行推理
                        // 模型推理本质是多维矩阵运算，而GPU是专门用于矩阵运算，占用率低，
                        // 如果使用cpu也可以运行，可能占用率100%属于正常现象，不必纠结。
                        output = session.run(stringOnnxTensorHashMap);

                        // 得到结果,缓存结果
                        outputData = ((float[][][]) output.get(0).getValue())[0];
                        outputData = transposeMatrix(outputData);
                        class2Bbox.clear();
                        for (float[] bbox : outputData) {
                            float[] conditionalProbabilities = Arrays.copyOfRange(bbox, 4, bbox.length);
                            int label = argmax(conditionalProbabilities);
                            float conf = conditionalProbabilities[label];
                            if (conf < confThreshold) continue;

                            bbox[4] = conf;

                            // xywh to (x1, y1, x2, y2)
                            xywh2xyxy(bbox);

                            // skip invalid predictions
                            if (bbox[0] >= bbox[2] || bbox[1] >= bbox[3]) continue;

                            class2Bbox.putIfAbsent(label, new ArrayList<>());
                            class2Bbox.get(label).add(bbox);
                        }

                    } catch (Exception e) {
                        log.error("推理出错", e);
                    } finally {
                        if (output != null) {
                            output.close();
                        }
                        if (tensor != null) {
                            tensor.close();
                        }
                    }
                } else {
                    detectSkipIndex = detectSkipIndex + 1;
                }

                List<Detection> detections = new ArrayList<>();
                for (Map.Entry<Integer, List<float[]>> entry : class2Bbox.entrySet()) {
                    int label = entry.getKey();
                    List<float[]> bboxes = entry.getValue();
                    bboxes = nonMaxSuppression(bboxes, nmsThreshold);
                    for (float[] bbox : bboxes) {
                        String labelString = labels[label];
                        detections.add(new Detection(labelString, entry.getKey(), Arrays.copyOfRange(bbox, 0, 4), bbox[4]));
                    }
                }

                // 统计当前帧中person的数量
                currentPersonCount.clear();
                for (Detection detection : detections) {
                    if ("person".equals(detection.getLabel())) {
                        currentPersonCount.put("person", currentPersonCount.getOrDefault("person", 0) + 1);
                    }
                }
                int currentPersonNum = currentPersonCount.getOrDefault("person", 0);

                // 更新检测结果
                detectionResult.setCurrentPersonCount(currentPersonNum);
                detectionResult.setLastUpdateTime(LocalDateTime.now());
                detectionResult.setTotalFrames(frameCount);
                if (currentPersonNum > detectionResult.getMaxPersonCount()) {
                    detectionResult.setMaxPersonCount(currentPersonNum);
                }

                // 判断人数变化（参考参考代码的逻辑）
                for (Map.Entry<String, Integer> entry : lastPersonCount.entrySet()) {
                    if (!currentPersonCount.containsKey(entry.getKey())) {
                        log.info("{}个 {} 离开了", entry.getValue(), entry.getKey());
                    }
                }

                for (Map.Entry<String, Integer> entry : currentPersonCount.entrySet()) {
                    int lastCount = lastPersonCount.get(entry.getKey()) == null ? 0 : lastPersonCount.get(entry.getKey());
                    int currentCount = entry.getValue();
                    if (lastCount < currentCount) {
                        log.info("{}个 {} 出现了", (currentCount - lastCount), entry.getKey());
                    }
                }

                // 更新上一帧数据
                lastPersonCount.clear();
                lastPersonCount.putAll(currentPersonCount);

                // 人数超过3人告警逻辑
                if (currentPersonNum > personThreshold) {
                    consecutiveFramesOverThreshold++;
                    if (consecutiveFramesOverThreshold >= thresholdFrames) {
                        String alertMsg = String.format("[%s] 告警：检测到%d人，超过阈值%d人",
                            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                            currentPersonNum, personThreshold);
                        detectionResult.getAlertMessages().add(alertMsg);
                        log.warn(alertMsg);
                        consecutiveFramesOverThreshold = 0; // 重置计数器，避免重复告警
                    }
                } else {
                    consecutiveFramesOverThreshold = 0;
                }

                // 实时更新Redis
                redisTemplate.opsForValue().set(redisKey, detectionResult, 24, TimeUnit.HOURS);

                for (Detection detection : detections) {
                    float[] bbox = detection.getBbox();
                    // 画框
                    Point topLeft = new Point((bbox[0] - letterbox.getDw()) / letterbox.getRatio(), (bbox[1] - letterbox.getDh()) / letterbox.getRatio());
                    Point bottomRight = new Point((bbox[2] - letterbox.getDw()) / letterbox.getRatio(), (bbox[3] - letterbox.getDh()) / letterbox.getRatio());
                    Scalar color = new Scalar(colors.get(detection.getClsId()));
                    Imgproc.rectangle(img, topLeft, bottomRight, color, thickness);
                    // 框上写文字
                    Point boxNameLoc = new Point((bbox[0] - letterbox.getDw()) / letterbox.getRatio(), (bbox[1] - letterbox.getDh()) / letterbox.getRatio() - 3);

                    Imgproc.putText(img, detection.getLabel(), boxNameLoc, Imgproc.FONT_HERSHEY_SIMPLEX, 0.7, color, thickness);
                }

                // 推送处理后的帧到FFmpeg
                pushFrameToFFmpeg(img);

                // 控制台输出处理进度
                if (frameCount % 30 == 0) {
                    log.info("已处理视频帧数: {}, 检测到目标数量: {}", frameCount, detections.size());
                }
            }

            log.info("视频处理完成，共处理帧数: {}", frameCount);

            // 记录总结文本
            String summary = String.format(
                "视频检测完成。开始时间：%s，结束时间：%s，总帧数：%d，最大人数：%d，告警次数：%d",
                detectionResult.getStartTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                detectionResult.getTotalFrames(),
                detectionResult.getMaxPersonCount(),
                detectionResult.getAlertMessages().size()
            );
            detectionResult.setSummary(summary);
            detectionResult.setStatus("completed");

            // 最终更新Redis，设置24小时过期
            redisTemplate.opsForValue().set(redisKey, detectionResult, 24, TimeUnit.HOURS);
            log.info("检测结果已保存到Redis，key: {}, 过期时间: 24小时", redisKey);

        } finally {
            // 清理资源
            stopFFmpegProcess();
            // 从Map中移除进程信息（使用最后一个斜杠后面的部分作为key）
            String processKey = outputRtmpUrl.substring(outputRtmpUrl.lastIndexOf("/") + 1);
            ffmpegProcessMap.remove(processKey);
            destroyAllWindows();
            // 删除临时文件
            if (tempVideoPath != null) {
                try {
                    File tempFile = new File(tempVideoPath);
                    if (tempFile.exists()) {
                        tempFile.delete();
                        log.info("已删除临时视频文件: {}", tempVideoPath);
                    }
                } catch (Exception e) {
                    log.error("删除临时文件失败: {}", tempVideoPath, e);
                }
            }
        }
    }

    /**
     * 使用FFmpeg下载HTTP/HTTPS视频到临时文件
     *
     * @param httpUrl HTTP/HTTPS视频URL
     * @return 临时文件路径
     * @throws Exception 可能抛出的异常
     */
    private String downloadHttpVideoToTempFile(String httpUrl) throws Exception {
        // 创建临时文件
        File tempFile = File.createTempFile("video_", ".mp4");
        String tempFilePath = tempFile.getAbsolutePath();

        log.info("开始下载HTTP视频到临时文件: {}", tempFilePath);

        // 获取FFmpeg版本信息
        String ffmpegVersion = getFFmpegVersion();
        boolean isNewVersion = isFFmpegNewVersion(ffmpegVersion);

        // 使用FFmpeg下载视频
        List<String> command = new ArrayList<>();
        command.add("ffmpeg");
        command.add("-i");
        command.add(httpUrl);
        command.add("-c");
        command.add("copy");

        if (isNewVersion) {
            // 新版本FFmpeg参数
            command.add("-preset");
            command.add("veryfast");
        } else {
            // 老版本FFmpeg参数
            command.add("-preset");
            command.add("ultrafast");
        }

        command.add("-y");
        command.add(tempFilePath);

        ProcessBuilder builder = new ProcessBuilder(command);
        builder.redirectErrorStream(true);
        Process process = builder.start();

        // 读取FFmpeg输出
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                log.info("FFmpeg下载进度: {}", line);
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("FFmpeg下载视频失败，退出码: " + exitCode);
        }

        log.info("HTTP视频下载完成: {}", tempFilePath);
        return tempFilePath;
    }

    /**
     * 处理上传的视频文件，进行目标检测
     *
     * @param file 上传的视频文件
     * @param outputRtmpUrl 输出的RTMP流地址（SRS服务器地址）
     * @throws Exception 可能抛出的异常
     */
    @Async("nitemoonAsyncExecutor")
    public void processUploadedVideo(MultipartFile file, String outputRtmpUrl) throws Exception {
        String tempVideoPath = null;
        try {
            // 保存上传的文件到临时文件
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".mp4";
            File tempFile = File.createTempFile("uploaded_video_", extension);
            tempVideoPath = tempFile.getAbsolutePath();
            file.transferTo(tempFile);

            log.info("上传的视频文件已保存到临时文件: {}", tempVideoPath);

            // 处理临时文件
            processVideoUrl(tempVideoPath, outputRtmpUrl);

        } finally {
            // 删除临时文件
            if (tempVideoPath != null) {
                try {
                    File tempFile = new File(tempVideoPath);
                    if (tempFile.exists()) {
                        tempFile.delete();
                        log.info("已删除临时视频文件: {}", tempVideoPath);
                    }
                } catch (Exception e) {
                    log.error("删除临时文件失败: {}", tempVideoPath, e);
                }
            }
        }
    }

    /**
     * 处理已上传的视频文件路径，进行目标检测
     * 用于避免 Undertow 异步清理临时文件的问题
     *
     * @param tempVideoPath 临时视频文件路径
     * @param outputRtmpUrl 输出的RTMP流地址（SRS服务器地址）
     * @throws Exception 可能抛出的异常
     */
    @Async("nitemoonAsyncExecutor")
    public void processUploadedVideoPath(String tempVideoPath, String outputRtmpUrl) throws Exception {
        try {
            log.info("开始处理已上传的视频文件路径: {}", tempVideoPath);
            processVideoUrl(tempVideoPath, outputRtmpUrl);
        } finally {
            // 删除临时文件
            if (tempVideoPath != null) {
                try {
                    File tempFile = new File(tempVideoPath);
                    if (tempFile.exists()) {
                        tempFile.delete();
                        log.info("已删除临时视频文件: {}", tempVideoPath);
                    }
                } catch (Exception e) {
                    log.error("删除临时文件失败: {}", tempVideoPath, e);
                }
            }
        }
    }

    /**
     * 处理本地默认视频文件，进行目标检测
     *
     * @param outputRtmpUrl 输出的RTMP流地址（SRS服务器地址）
     * @throws Exception 可能抛出的异常
     */
    @Async("nitemoonAsyncExecutor")
    public void processDefaultVideo(String outputRtmpUrl) throws Exception {
        String defaultVideoPath = videoConfig.getDefaultVideoPath();
        if (defaultVideoPath == null || defaultVideoPath.trim().isEmpty()) {
            throw new RuntimeException("默认视频路径未配置，请在配置文件中设置 nitemoon.onnx.default-video-path");
        }

        File defaultFile = new File(defaultVideoPath);
        if (!defaultFile.exists()) {
            throw new RuntimeException("默认视频文件不存在: " + defaultVideoPath);
        }

        log.info("开始处理本地默认视频文件: {}", defaultVideoPath);
        processVideoUrl(defaultVideoPath, outputRtmpUrl);
    }

    /**
     * 销毁所有窗口
     */
    private void destroyAllWindows() {
        // 在服务中不需要显示窗口，此方法为空
    }
}
