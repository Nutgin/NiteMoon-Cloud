package cn.nitemoon.cloud.onnx.service;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import cn.nitemoon.cloud.onnx.domain.CarDetection;
import cn.nitemoon.cloud.onnx.domain.CarPlateDetectionResult;
import cn.nitemoon.cloud.onnx.utils.ImageUtil;
import cn.nitemoon.cloud.onnx.utils.Letterbox;
import lombok.extern.slf4j.Slf4j;
import org.opencv.core.*;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.awt.image.DataBufferByte;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.FloatBuffer;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 车牌识别服务类
 *
 * @author LOVEROSE
 * @date 2024/8/19 15:25
 */
@Slf4j
@Service
public class CarPlateDetectionService {


    private static final String[] PLATE_COLOR = new String[]{"黑牌", "蓝牌", "绿牌", "白牌", "黄牌"};
    private static final String PLATE_NAME = "#京沪津渝冀晋蒙辽吉黑苏浙皖闽赣鲁豫鄂湘粤桂琼川贵云藏陕甘青宁新学警港澳挂使领民航危0123456789ABCDEFGHJKLMNPQRSTUVWXYZ险品";

    // 1.单行蓝牌 2.单行黄牌 3.新能源车牌 4.白色警用车牌 5.教练车牌 6.武警车牌 7.双层黄牌 8.双层白牌 9.使馆车牌 10.港澳粤Z牌 11.双层绿牌 12.民航车牌
    private static final String[] LABELS = {"1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"};

    // 注入模型会话
    private OrtSession session1; // 车牌检测模型
    private OrtSession session2; // 车牌识别模型
    private OrtEnvironment environment;

    public CarPlateDetectionService(OrtSession plateDetectSession, OrtSession plateRecColorSession, OrtEnvironment environment) {
        this.session1 = plateDetectSession;
        this.session2 = plateRecColorSession;
        this.environment = environment;
    }

    /**
     * 处理上传的图片文件，进行车牌识别
     *
     * @param file 上传的图片文件
     * @return 车牌识别结果
     */
    public CarPlateDetectionResult detectCarPlate(MultipartFile file) {
        float confThreshold = 0.35F;
        float nmsThreshold = 0.45F;

        // 将MultipartFile转换为OpenCV的Mat对象
        Mat img = null;
        try {
            img = convertMultipartFileToMat(file);
        } catch (IOException e) {
            throw new RuntimeException("图片转换opencv mat对象出错");
        }

        OrtSession.Result output2 = null;
        Mat image = img.clone();
        Imgproc.cvtColor(image, image, Imgproc.COLOR_BGR2RGB);

        // 定义框的粗细、字的大小等参数
        int minDwDh = Math.min(img.width(), img.height());
        int thickness = minDwDh / 300; // Use a reasonable default value

        long start_time = System.currentTimeMillis();

        // 更改 image 尺寸
        Letterbox letterbox = new Letterbox();
        image = letterbox.letterbox(image);

        double ratio = letterbox.getRatio();
        double dw = letterbox.getDw();
        double dh = letterbox.getDh();
        int rows = letterbox.getHeight();
        int cols = letterbox.getWidth();
        int channels = image.channels();

        image.convertTo(image, CvType.CV_32FC1, 1. / 255);
        float[] whc = new float[3 * 640 * 640];
        image.get(0, 0, whc);
        float[] chw = ImageUtil.whc2cwh(whc);

        // 创建OnnxTensor对象
        long[] shape = {1L, (long) channels, (long) rows, (long) cols};
        OnnxTensor tensor = null;
        try {
            tensor = OnnxTensor.createTensor(environment, FloatBuffer.wrap(chw), shape);
        } catch (OrtException e) {
            throw new RuntimeException("创建OnnxTensor对象失败1");
        }
        HashMap<String, OnnxTensor> stringOnnxTensorHashMap = new HashMap<>();
        try {
            stringOnnxTensorHashMap.put(session1.getInputInfo().keySet().iterator().next(), tensor);
        } catch (OrtException e) {
            throw new RuntimeException("创建OnnxTensor对象失败2");
        }

        // 运行推理
        OrtSession.Result output = null;
        try {
            try {
                output = session1.run(stringOnnxTensorHashMap);
            } catch (OrtException e) {
                throw new RuntimeException("运行推理失败1");
            }
            float[][] outputData = null;
            try {
                outputData = ((float[][][]) output.get(0).getValue())[0];
            } catch (OrtException e) {
                throw new RuntimeException("运行推理失败2");
            }
            Map<Integer, List<float[]>> class2Bbox = new HashMap<>();
            for (float[] bbox : outputData) {
                float score = bbox[4];
                if (score < confThreshold) continue;

                float[] conditionalProbabilities = Arrays.copyOfRange(bbox, 5, bbox.length);
                int label = argmax(conditionalProbabilities);

                // xywh to (x1, y1, x2, y2)
                xywh2xyxy(bbox);

                // 去除无效结果
                if (bbox[0] >= bbox[2] || bbox[1] >= bbox[3]) continue;

                class2Bbox.putIfAbsent(label, new ArrayList<>());
                class2Bbox.get(label).add(bbox);
            }

            List<CarDetection> carDetections = new ArrayList<>();
            for (Map.Entry<Integer, List<float[]>> entry : class2Bbox.entrySet()) {
                List<float[]> bboxes = entry.getValue();
                bboxes = nonMaxSuppression(bboxes, nmsThreshold);
                for (float[] bbox : bboxes) {
                    String labelString = LABELS[entry.getKey()];
                    carDetections.add(new CarDetection(labelString, entry.getKey(), Arrays.copyOfRange(bbox, 0, 4), bbox[4], bbox[13] == 0, 0.0f, null, null));
                }
            }

            // 处理第一个检测到的车牌（如果有）
            CarPlateDetectionResult result = new CarPlateDetectionResult();
            if (!carDetections.isEmpty()) {
                CarDetection carDetection = carDetections.get(0);
                float[] bbox = carDetection.getBbox();

                Rect rect = new Rect(new org.opencv.core.Point((bbox[0] - dw) / ratio, (bbox[1] - dh) / ratio), new org.opencv.core.Point((bbox[2] - dw) / ratio, (bbox[3] - dh) / ratio));
                // img.submat(rect)
                Mat image2 = new Mat(img.clone(), rect);
                Imgproc.cvtColor(image2, image2, Imgproc.COLOR_BGR2RGB);
                Letterbox letterbox2 = new Letterbox(168, 48);
                image2 = letterbox2.letterbox(image2);

                double ratio2 = letterbox2.getRatio();
                double dw2 = letterbox2.getDw();
                double dh2 = letterbox2.getDh();
                int rows2 = letterbox2.getHeight();
                int cols2 = letterbox2.getWidth();
                int channels2 = image2.channels();

                image2.convertTo(image2, CvType.CV_32FC1, 1. / 255);
                float[] whc2 = new float[3 * 168 * 48];
                image2.get(0, 0, whc2);
                float[] chw2 = ImageUtil.whc2cwh(whc2);

                // 创建OnnxTensor对象
                long[] shape2 = {1L, (long) channels2, (long) rows2, (long) cols2};
                OnnxTensor tensor2 = null;
                try {
                    tensor2 = OnnxTensor.createTensor(environment, FloatBuffer.wrap(chw2), shape2);
                } catch (OrtException e) {
                    throw new RuntimeException("创建OnnxTensor对象失败3");
                }
                HashMap<String, OnnxTensor> stringOnnxTensorHashMap2 = new HashMap<>();
                try {
                    stringOnnxTensorHashMap2.put(session2.getInputInfo().keySet().iterator().next(), tensor2);
                } catch (OrtException e) {
                    throw new RuntimeException("创建OnnxTensor对象失败4");
                }

                // 运行推理
                try {
                    output2 = session2.run(stringOnnxTensorHashMap2);
                } catch (OrtException e) {
                    throw new RuntimeException("运行推理失败3");
                }
                float[][][] resultArray = null;
                try {
                    resultArray = (float[][][]) output2.get(0).getValue();
                } catch (OrtException e) {
                    throw new RuntimeException("运行推理失败4");
                }
                String plateNo = decodePlate(maxScoreIndex(resultArray[0]));

                // 车牌颜色识别
                float[][] color = null;
                try {
                    color = (float[][]) output2.get(1).getValue();
                } catch (OrtException e) {
                    throw new RuntimeException("车牌颜色识别失败");
                }
                double[] colorSoftMax = softMax(floatToDouble(color[0]));
                Double[] colorRResult = decodeColor(colorSoftMax);

                carDetection.setPlateNo(plateNo);
                carDetection.setPlateColor(PLATE_COLOR[colorRResult[0].intValue()]);

                result.setPlateNo(plateNo);
                result.setPlateColor(PLATE_COLOR[colorRResult[0].intValue()]);

                // 在原图上绘制检测框和车牌信息
                org.opencv.core.Point topLeft = new org.opencv.core.Point((bbox[0] - dw) / ratio, (bbox[1] - dh) / ratio);
                org.opencv.core.Point bottomRight = new org.opencv.core.Point((bbox[2] - dw) / ratio, (bbox[3] - dh) / ratio);
                Imgproc.rectangle(img, topLeft, bottomRight, new Scalar(0, 255, 0), thickness);

                // 框上写文字
                BufferedImage bufferedImage = matToBufferedImage(img);
                Graphics2D g2d = bufferedImage.createGraphics();
                g2d.setFont(new Font("微软雅黑", Font.PLAIN, 20));
                g2d.setColor(Color.RED);
                g2d.drawString(PLATE_COLOR[colorRResult[0].intValue()] + "-" + plateNo, (int) ((bbox[0] - dw) / ratio), (int) ((bbox[1] - dh) / ratio - 3));
                g2d.dispose();

                // 转换为Base64
                String base64Image = null;
                try {
                    base64Image = bufferedImageToBase64(bufferedImage, "jpg");
                } catch (IOException e) {
                    throw new RuntimeException("转换为base64失败1");
                }
                result.setImageBase64(base64Image);
            } else {
                // 没有检测到车牌，返回原图
                BufferedImage bufferedImage = matToBufferedImage(img);
                String base64Image = null;
                try {
                    base64Image = bufferedImageToBase64(bufferedImage, "jpg");
                } catch (IOException e) {
                    throw new RuntimeException("转换为base64失败2");
                }
                result.setImageBase64(base64Image);
            }

            log.info("车牌识别耗时：{} ms", (System.currentTimeMillis() - start_time));
            return result;
        } finally {
            // 释放资源
            if (output != null) {
                output.close();
            }
            if (tensor != null) {
                tensor.close();
            }
            if (output2 != null) {
                output2.close();
            }
        }
    }

    /**
     * 将MultipartFile转换为OpenCV的Mat对象
     */
    private Mat convertMultipartFileToMat(MultipartFile file) throws IOException {
        byte[] bytes = file.getBytes();
        Mat mat = new Mat(1, bytes.length, CvType.CV_8UC1);
        mat.put(0, 0, bytes);
        Mat image = Imgcodecs.imdecode(mat, Imgcodecs.IMREAD_COLOR);
        return image;
    }

    /**
     * 将BufferedImage转换为Base64编码字符串
     */
    private String bufferedImageToBase64(BufferedImage image, String format) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, format, baos);
        byte[] imageBytes = baos.toByteArray();
        baos.close();
        return Base64.getEncoder().encodeToString(imageBytes);
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

    // 单纯为了显示中文演示使用，实际项目中用不到这个
    public static BufferedImage matToBufferedImage(Mat mat) {
        int type = BufferedImage.TYPE_BYTE_GRAY;
        if (mat.channels() > 1) {
            type = BufferedImage.TYPE_3BYTE_BGR;
        }
        int bufferSize = mat.channels() * mat.cols() * mat.rows();
        byte[] b = new byte[bufferSize];
        mat.get(0, 0, b); // 获取所有像素数据
        BufferedImage image = new BufferedImage(mat.cols(), mat.rows(), type);
        final byte[] targetPixels = ((DataBufferByte) image.getRaster().getDataBuffer()).getData();
        System.arraycopy(b, 0, targetPixels, 0, b.length);
        return image;
    }

    private static int[] maxScoreIndex(float[][] result) {
        int[] indexes = new int[result.length];
        for (int i = 0; i < result.length; i++) {
            int index = 0;
            float max = Float.MIN_VALUE;
            for (int j = 0; j < result[i].length; j++) {
                if (max < result[i][j]) {
                    max = result[i][j];
                    index = j;
                }
            }
            indexes[i] = index;
        }
        return indexes;
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

    private static Double[] decodeColor(double[] indexes) {
        double index = -1;
        double max = Double.MIN_VALUE;
        for (int i = 0; i < indexes.length; i++) {
            if (max < indexes[i]) {
                max = indexes[i];
                index = i;
            }
        }
        return new Double[]{index, max};
    }

    public static double[] floatToDouble(float[] input) {
        if (input == null) {
            return null;
        }
        double[] output = new double[input.length];
        for (int i = 0; i < input.length; i++) {
            output[i] = input[i];
        }
        return output;
    }

    private static String decodePlate(int[] indexes) {
        int pre = 0;
        StringBuffer sb = new StringBuffer();
        for (int index : indexes) {
            if (index != 0 && pre != index) {
                sb.append(PLATE_NAME.charAt(index));
            }
            pre = index;
        }
        return sb.toString();
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

    public static double[] softMax(double[] tensor) {
        if (Arrays.stream(tensor).max().isPresent()) {
            double maxValue = Arrays.stream(tensor).max().getAsDouble();
            double[] value = Arrays.stream(tensor).map(y -> Math.exp(y - maxValue)).toArray();
            double total = Arrays.stream(value).sum();
            return Arrays.stream(value).map(p -> p / total).toArray();
        } else {
            throw new NoSuchElementException("No value present");
        }
    }
}
