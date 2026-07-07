package cn.nitemoon.cloud.onnx.service;

import ai.onnxruntime.*;
import cn.nitemoon.cloud.onnx.domain.Detection;
import cn.nitemoon.cloud.onnx.domain.DetectionResult;
import cn.nitemoon.cloud.onnx.utils.Letterbox;
import lombok.extern.slf4j.Slf4j;
import org.opencv.core.CvType;
import org.opencv.core.Mat;
import org.opencv.core.MatOfByte;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.image.DataBufferByte;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.FloatBuffer;
import java.util.List;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 图像检测服务类
 */
@Slf4j
@Service
public class PictureDetectionService {

    // 注入标签映射配置
    @Autowired
    private Map<String, String> labelMap;

    // 注入模型会话
    private OrtSession session;
    private OrtEnvironment environment;

    private String[] labels;
    private Letterbox letterboxConfig;
    private List<double[]> colors;
    private Font chineseFont;

    public PictureDetectionService(OrtSession yolov8Session, OrtEnvironment environment) {
        this.session = yolov8Session;
        this.environment = environment;
    }

    @PostConstruct
    public void init() throws OrtException {
        // 初始化标签
        colors = new ArrayList<>();

        // 加载标签
        String meteStr = session.getMetadata().getCustomMetadata().get("names");
        labels = new String[meteStr.split(",").length];

        Pattern pattern = Pattern.compile("'([^']*)'");
        Matcher matcher = pattern.matcher(meteStr);

        int h = 0;
        while (matcher.find()) {
            labels[h] = matcher.group(1);
            Random random = new Random();
            // 保持与OpenCV颜色一致的格式（BGR）
            double[] color = {random.nextDouble() * 256, random.nextDouble() * 256, random.nextDouble() * 256};
            colors.add(color);
            h++;
        }

        // 加载标签及颜色
        letterboxConfig = new Letterbox();

        // 输出基本信息
        session.getInputInfo().keySet().forEach(x -> {
            try {
                System.out.println("input name = " + x);
                System.out.println(session.getInputInfo().get(x).getInfo().toString());
            } catch (OrtException e) {
                throw new RuntimeException(e);
            }
        });

        // 初始化中文字体
        initChineseFont();

        log.info("PictureDetectionService初始化完成");
    }

    /**
     * 初始化中文字体
     */
    private void initChineseFont() {
        try {
            // 尝试加载系统中支持中文的字体
            // 在Linux服务器上，通常需要确保安装了中文字体包
            String[] fontNames = {
                "Noto Sans CJK SC",     // Google和Adobe合作开发的开源中文字体
                "Source Han Sans SC",   // 思源黑体
                "WenQuanYi Micro Hei",  // 文泉驿微米黑
                "DejaVu Sans",          // 支持中文的DejaVu字体
                "SansSerif",            // 默认无衬线字体
                "Dialog",               // 对话框字体
                "Microsoft YaHei",      // 微软雅黑（Windows常用中文字体）
                "SimSun"                // 宋体（Windows常用中文字体）
            };

            for (String fontName : fontNames) {
                try {
                    chineseFont = new Font(fontName, Font.PLAIN, 12);
                    // 检查字体是否支持中文字符
                    if (chineseFont.canDisplayUpTo("测试中文") == -1) {
                        log.info("成功加载中文字体: {} (名称: {})",
                                chineseFont.getFontName(), fontName);
                        return;
                    }
                } catch (Exception e) {
                    log.debug("尝试加载字体 {} 失败: {}", fontName, e.getMessage());
                }
            }

            // 如果以上字体都无法加载，使用默认字体
            chineseFont = new Font(Font.SANS_SERIF, Font.PLAIN, 12);
            log.warn("无法加载专用中文字体，使用默认字体: {}", chineseFont.getFontName());
        } catch (Exception e) {
            log.error("中文字体加载失败，使用默认字体", e);
            chineseFont = new Font(Font.SANS_SERIF, Font.PLAIN, 12);
        }
    }

    /**
     * 对上传的图片进行目标检测
     *
     * @param image 上传的图片文件
     * @return 检测结果，包含标记框的图片和检测到的对象列表
     */
    public DetectionResult detectImage(MultipartFile image) throws Exception {
        // 确保OpenCV库已加载
        try {
            Class.forName("org.opencv.core.Mat");
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("OpenCV库未正确加载", e);
        }

        // 将MultipartFile转换为OpenCV的Mat对象
        byte[] imageBytes = image.getBytes();
        Mat img = Imgcodecs.imdecode(new MatOfByte(imageBytes), Imgcodecs.IMREAD_COLOR);

        try {
            // 克隆图像并转换颜色空间（仅用于处理，不改变原始图像）
            Mat processedImage = img.clone();
            try {
                Imgproc.cvtColor(processedImage, processedImage, Imgproc.COLOR_BGR2RGB);

                // 定义框的粗细等参数
                int minDwDh = Math.min(img.width(), img.height());
                int thickness = minDwDh / 300; // 使用固定值替代ODConfig.lineThicknessRatio
                long startTime = System.currentTimeMillis();

                // 更改图像尺寸
                Letterbox letterbox = new Letterbox();
                processedImage = letterbox.letterbox(processedImage);

                double ratio = letterbox.getRatio();
                double dw = letterbox.getDw();
                double dh = letterbox.getDh();
                int rows = letterbox.getHeight();
                int cols = letterbox.getWidth();
                int channels = processedImage.channels();

                // 将Mat对象的像素值赋值给Float[]对象
                float[] pixels = new float[channels * rows * cols];
                for (int i = 0; i < rows; i++) {
                    for (int j = 0; j < cols; j++) {
                        double[] pixel = processedImage.get(j, i);
                        for (int k = 0; k < channels; k++) {
                            // 这样设置相当于同时做了image.transpose((2, 0, 1))操作
                            pixels[rows * cols * k + j * cols + i] = (float) pixel[k] / 255.0f;
                        }
                    }
                }

                // 创建OnnxTensor对象
                long[] shape = {1L, (long) channels, (long) rows, (long) cols};
                OnnxTensor tensor = null;
                OrtSession.Result output = null;

                try {
                    tensor = OnnxTensor.createTensor(environment, FloatBuffer.wrap(pixels), shape);
                    HashMap<String, OnnxTensor> stringOnnxTensorHashMap = new HashMap<>();
                    stringOnnxTensorHashMap.put(session.getInputInfo().keySet().iterator().next(), tensor);

                    // 运行推理
                    output = session.run(stringOnnxTensorHashMap);
                    float[][] outputData = ((float[][][]) output.get(0).getValue())[0];

                    outputData = transposeMatrix(outputData);

                    float confThreshold = 0.35F;
                    float nmsThreshold = 0.55F;

                    Map<Integer, List<float[]>> class2Bbox = new HashMap<>();

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

                    List<Detection> detections = new ArrayList<>();
                    for (Map.Entry<Integer, List<float[]>> entry : class2Bbox.entrySet()) {
                        int label = entry.getKey();
                        List<float[]> bboxes = entry.getValue();
                        bboxes = nonMaxSuppression(bboxes, nmsThreshold);
                        for (float[] bbox : bboxes) {
                            // 直接使用中文标签
                            String labelString = labelMap.getOrDefault(labels[label], labels[label]);
                            detections.add(new Detection(labelString, entry.getKey(), Arrays.copyOfRange(bbox, 0, 4), bbox[4]));
                        }
                    }

                    // 在图像上绘制检测框（使用原始图像，保持颜色不变）
                    img = drawDetectionsOnImage(img, detections, ratio, dw, dh, thickness);

                    log.info("检测耗时：{} ms", (System.currentTimeMillis() - startTime));

                    // 将处理后的图像转换为Base64编码
                    String base64Image = matToBase64(img);

                    DetectionResult result = new DetectionResult();
                    result.setImage(base64Image);
                    result.setDetections(detections);
                    result.setImageWidth(img.width());
                    result.setImageHeight(img.height());

                    return result;
                } finally {
                    // 释放ONNX资源
                    if (output != null) {
                        output.close();
                    }
                    if (tensor != null) {
                        tensor.close();
                    }
                }
            } finally {
                // 释放处理图像资源
                processedImage.release();
            }
        } finally {
            // 释放原始图像资源
            img.release();
        }
    }

    /**
     * 在图像上绘制检测结果
     *
     * @param img         原始图像
     * @param detections  检测结果
     * @param ratio       缩放比例
     * @param dw          宽度偏移
     * @param dh          高度偏移
     * @param thickness   线条粗细
     * @return 绘制了检测框的图像
     */
    private Mat drawDetectionsOnImage(Mat img, List<Detection> detections, double ratio, double dw, double dh, int thickness) {
        // 将OpenCV的Mat转换为Java的BufferedImage以支持中文绘制（保持BGR格式）
        BufferedImage bufferedImage = matToBufferedImageBGR(img);

        // 获取Graphics2D对象用于绘制
        Graphics2D g2d = bufferedImage.createGraphics();

        try {
            // 设置渲染提示
            g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

            // 在图像上绘制检测框
            for (Detection detection : detections) {
                float[] bbox = detection.getBbox();

                // 计算实际坐标
                int x1 = (int) ((bbox[0] - dw) / ratio);
                int y1 = (int) ((bbox[1] - dh) / ratio);
                int x2 = (int) ((bbox[2] - dw) / ratio);
                int y2 = (int) ((bbox[3] - dh) / ratio);

                // 获取颜色（BGR格式）
                double[] colorArray = colors.get(detection.getClsId());
                // 保持BGR格式（BufferedImage TYPE_3BYTE_BGR 使用 BGR）
                Color color = new Color(
                        (int) colorArray[2], // R (但在BGR格式中这是B)
                        (int) colorArray[1], // G
                        (int) colorArray[0]  // B (但在BGR格式中这是R)
                );

                // 设置绘图属性
                g2d.setColor(color);
                g2d.setStroke(new BasicStroke(Math.max(thickness, 2)));

                // 绘制矩形框
                g2d.drawRect(x1, y1, x2 - x1, y2 - y1);

                // 获取显示标签（中文）
                String displayLabel = detection.getLabel();

                // 设置字体（增大到原来的2倍）
                g2d.setFont(chineseFont.deriveFont(32.0f));

                // 计算文本尺寸
                FontMetrics fm = g2d.getFontMetrics();
                int textWidth = fm.stringWidth(displayLabel);
                int textHeight = fm.getHeight();

                // 绘制标签背景
                g2d.setColor(color);
                g2d.fillRect(x1, y1 - textHeight, textWidth, textHeight);

                // 绘制标签文字
                g2d.setColor(Color.WHITE);
                g2d.drawString(displayLabel, x1, y1 - 5);
            }
        } finally {
            // 释放Graphics2D资源
            g2d.dispose();
        }

        // 将BufferedImage转换回OpenCV的Mat（保持BGR格式）
        return bufferedImageToMatBGR(bufferedImage);
    }

    /**
     * 将BufferedImage转换为OpenCV的Mat对象（保持BGR格式）
     *
     * @param bufferedImage BufferedImage对象
     * @return OpenCV的Mat对象
     */
    private Mat bufferedImageToMatBGR(BufferedImage bufferedImage) {
        Mat mat = new Mat(bufferedImage.getHeight(), bufferedImage.getWidth(), CvType.CV_8UC3);
        try {
            byte[] data = ((DataBufferByte) bufferedImage.getRaster().getDataBuffer()).getData();
            mat.put(0, 0, data);
            return mat;
        } finally {
            // 注意：bufferedImage不需要手动释放，Java垃圾回收会处理它
        }
    }

    /**
     * 将OpenCV的Mat对象转换为Base64编码的JPEG图像
     *
     * @param mat OpenCV的Mat对象
     * @return Base64编码的JPEG图像
     */
    private String matToBase64(Mat mat) throws IOException {
        // 将Mat转换为BufferedImage（保持BGR格式）
        BufferedImage bufferedImage = matToBufferedImageBGR(mat);

        try {
            // 将BufferedImage转换为字节数组
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try {
                ImageIO.write(bufferedImage, "jpeg", baos);
                byte[] imageBytes = baos.toByteArray();

                // 转换为Base64编码
                return Base64.getEncoder().encodeToString(imageBytes);
            } finally {
                baos.close();
            }
        } finally {
            // 注意：bufferedImage不需要手动释放，Java垃圾回收会处理它
        }
    }

    /**
     * 将OpenCV的Mat对象转换为BufferedImage（保持BGR格式）
     *
     * @param mat OpenCV的Mat对象
     * @return BufferedImage对象
     */
    private BufferedImage matToBufferedImageBGR(Mat mat) {
        // 直接使用BGR格式，不需要转换
        int type = BufferedImage.TYPE_3BYTE_BGR;
        int bufferSize = mat.channels() * mat.cols() * mat.rows();
        byte[] b = new byte[bufferSize];
        mat.get(0, 0, b); // get all the pixels
        BufferedImage bufferedImage = new BufferedImage(mat.cols(), mat.rows(), type);
        final byte[] targetPixels = ((DataBufferByte) bufferedImage.getRaster().getDataBuffer()).getData();
        System.arraycopy(b, 0, targetPixels, 0, b.length);
        return bufferedImage;
    }

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

    public static float[][] transposeMatrix(float[][] m) {
        float[][] temp = new float[m[0].length][m.length];
        for (int i = 0; i < m.length; i++)
            for (int j = 0; j < m[0].length; j++)
                temp[j][i] = m[i][j];
        return temp;
    }

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

    // 返回最大值的索引
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
}
