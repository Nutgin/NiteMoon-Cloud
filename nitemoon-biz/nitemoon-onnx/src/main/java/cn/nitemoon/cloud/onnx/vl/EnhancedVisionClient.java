package cn.nitemoon.cloud.onnx.vl;

import com.google.gson.*;
import okhttp3.*;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.lang.reflect.Type;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * 大模型自动标注数据集
 */
public class EnhancedVisionClient {
    private final String API_URL;
    private final OkHttpClient httpClient;
    public static final Gson gson = new GsonBuilder()
            .registerTypeAdapter(VisionResponse.Annotation.class, new VisionResponse.AnnotationDeserializer())
            .create();
    private final String apiKey;
    private final SceneStrategyFactory strategyFactory;

    public EnhancedVisionClient(String apiKey, String apiUrl) {
        this.API_URL=apiUrl;
        this.apiKey = apiKey;
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(300, TimeUnit.SECONDS)  // 连接超时时间
                .readTimeout(600, TimeUnit.SECONDS)     // 读取超时时间
                .writeTimeout(600, TimeUnit.SECONDS)    // 写入超时时间
                .build();        this.strategyFactory = new SceneStrategyFactory();
        initializeStrategies();
    }
    public EnhancedVisionClient(String apiKey) {
        this.API_URL="https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
        this.apiKey = apiKey;
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)  // 连接超时时间
                .readTimeout(60, TimeUnit.SECONDS)     // 读取超时时间
                .writeTimeout(60, TimeUnit.SECONDS)    // 写入超时时间
                .build();        this.strategyFactory = new SceneStrategyFactory();
        initializeStrategies();
    }

    // 在策略工厂注册新策略
    private void initializeStrategies() {
        strategyFactory.register(SceneType.OBJECT_DETECTION, new ObjectDetectionStrategy());
        strategyFactory.register(SceneType.OCR, new OcrStrategy());
        strategyFactory.register(SceneType.VISUAL_GROUNDING, new VisualGroundingStrategy());
        strategyFactory.register(SceneType.DOCUMENT_PARSING, new DocumentParsingStrategy());
    }

    public VisionResponse analyzeImage(String imagePath, SceneContext context){
        SceneStrategy strategy = strategyFactory.getStrategy(context.getSceneType());
        try {
            JsonObject requestBody = buildRequest(imagePath, context, strategy);
            Request request = new Request.Builder()
                    .url(API_URL)
                    .post(RequestBody.create(requestBody.toString(), MediaType.get("application/json")))
                    .addHeader("Authorization", "Bearer " + apiKey)
                    .build();
            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    assert response.body() != null;
                    throw new IOException("API Error: " + response.body().string());
                }
                assert response.body() != null;
                JsonObject responseJson = gson.fromJson(response.body().charStream(), JsonObject.class);
                VisionResponse visionResponse = parseResponse(responseJson);

                if (context.isRender()) {
                    renderAnnotations(imagePath, visionResponse);
                }
                return visionResponse;
            }
        }catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private JsonObject buildRequest(String imagePath, SceneContext context, SceneStrategy strategy) throws IOException {
        String base64Image = encodeImage(imagePath);
        JsonObject systemMsg = strategy.buildMessage(context);
        JsonObject userMsg = new JsonObject();
        userMsg.addProperty("role", "user");
        userMsg.add("content", buildImageContent(base64Image));
        JsonArray messages = new JsonArray();
        messages.add(systemMsg);
        messages.add(userMsg);
        JsonObject requestBody = new JsonObject();
        requestBody.addProperty("model", context.getModel());
        requestBody.add("messages",messages);
        requestBody.add("response_format", strategy.buildResponseFormat());

        return requestBody;
    }
    private JsonArray buildImageContent(String base64Image) {
        JsonArray content = new JsonArray();
        JsonObject imageObj = new JsonObject();
        imageObj.addProperty("type", "image_url");
        JsonObject imageUrl = new JsonObject();
        imageUrl.addProperty("url", "data:image/jpeg;base64," + base64Image);
        imageObj.add("image_url", imageUrl);
        content.add(imageObj);
        return content;
    }

    private String encodeImage(String imagePath) throws IOException {
        byte[] imageBytes = Files.readAllBytes(Paths.get(imagePath));
        return Base64.getEncoder().encodeToString(imageBytes);
    }

    public static BufferedImage base64ToBufferedImage(String base64) {
        try {
            byte[] decodedBytes = Base64.getDecoder().decode(base64);
            InputStream inputStream = new ByteArrayInputStream(decodedBytes);
            BufferedImage image = ImageIO.read(inputStream);
            return image;
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    private VisionResponse parseResponse(JsonObject responseJson) {
        String content = responseJson.getAsJsonArray("choices")
                .get(0).getAsJsonObject()
                .get("message").getAsJsonObject()
                .get("content").getAsString();
        return gson.fromJson(content, VisionResponse.class);
    }

    private void renderAnnotations(String imagePath, VisionResponse response) throws IOException {
        BufferedImage image = ImageIO.read(new File(imagePath));
        int width = image.getWidth();
        int height = image.getHeight();
        response.getMeta().setImageSize(new int[]{width, height});
        Visualizer.drawAnnotations(response, image);
    }


    // Scene Strategy Pattern Implementation
    private interface SceneStrategy {
        JsonObject buildMessage(SceneContext context);
        JsonObject buildResponseFormat();
    }
    // 新增文档解析策略实现
    private static class DocumentParsingStrategy implements SceneStrategy {
        @Override
        public JsonObject buildMessage(SceneContext context) {
            JsonObject systemMsg = new JsonObject();
            systemMsg.addProperty("role", "system");
            systemMsg.addProperty("content", "你是一个专业的文档解析系统，需要严格遵循以下规则：\n" +
                    "1. 解析文档中的所有元素（文本、图片、表格、标题等）\n" +
                    "2. 使用QwenVL HTML格式还原版面布局\n" +
                    "3. 包含元素位置和层级关系\n" +
                    "4. 输出必须为有效的HTML结构");
            return systemMsg;
        }

        @Override
        public JsonObject buildResponseFormat() {
            JsonObject format = new JsonObject();
            format.addProperty("type", "text");
            return format;
        }
    }

    private static class ObjectDetectionStrategy implements SceneStrategy {
        @Override
        public JsonObject buildMessage(SceneContext context) {
            JsonObject systemMsg = new JsonObject();
            systemMsg.addProperty("role", "system");
            systemMsg.addProperty("content", String.format(
                    "你是一个通用物体识别系统，需要识别：\n" +
                            "- %s\n" +
                            "- 输出格式：%s\n" +
                            "- 坐标系统[x1, y1, x2, y2]：%s\n" +
                            "- 响应结构：%s",
                    context.getTargets().isEmpty() ? "动植物种类/地标建筑/商品型号/IP形象等":String.join(", ", context.targets),
                    context.getOutputType().name(),
                    context.isNormalized() ? "归一化坐标" : "绝对坐标",
                    VisionResponse.SCHEMA
            ));
            return systemMsg;
        }
        @Override
        public JsonObject buildResponseFormat() {
            JsonObject format = new JsonObject();
            format.addProperty("type", "json_object");
            format.add("schema", VisionResponse.SCHEMA_JSON);
            return format;
        }
    }

    private static class OcrStrategy implements SceneStrategy {
        @Override
        public JsonObject buildMessage(SceneContext context) {
            JsonObject systemMsg = new JsonObject();
            systemMsg.addProperty("role", "system");
            systemMsg.addProperty("content", String.format(
                    "你是一个多语言OCR系统，需要：\n" +
                            "- 识别任意方向文本（横向/纵向/倾斜）\n" +
                            "- 支持中英日韩等20+语言\n" +
                            "- %s\n" +
                            "- 输出格式：%s\n" +
                            "- 坐标系统[x1, y1, x2, y2]：%s\n" +
                            "- 响应结构：%s",
                    context.getTargets().isEmpty() ? "抽取所有文本内容" : "结构化严格提取下面以及其对应的内容（比如金额，返回 label：金额，subLabel：10 ，坐标是 label和 subLabel数据共同的范围）: "+String.join(", ", context.targets),
                    context.getOutputType().name(),
                    context.isNormalized() ? "归一化坐标" : "绝对坐标",
                    VisionResponse.SCHEMA
            ));

            return systemMsg;
        }

        @Override
        public JsonObject buildResponseFormat() {
            JsonObject format = new JsonObject();
            format.addProperty("type", "json_object");
            format.add("schema", VisionResponse.SCHEMA_JSON);
            return format;
        }
    }

    private static class VisualGroundingStrategy implements SceneStrategy {
        @Override
        public JsonObject buildMessage(SceneContext context) {
            JsonObject systemMsg = new JsonObject();
            systemMsg.addProperty("role", "system");
            systemMsg.addProperty("content", String.format(
                    "你是一个精准视觉定位系统，需要：\n" +
                            "- 层级化标签（主标签+子标签）\n" +
                            "- 检测目标：%s\n" +
                            "- 输出格式：%s\n" +
                            "- 坐标系统[x1, y1, x2, y2]：%s\n" +
                            "- 响应结构：%s",
                    context.getTargets().isEmpty() ? "动植物种类/地标建筑/商品型号/IP形象等":String.join(", ", context.targets),
                    context.getOutputType().name(),
                    context.isNormalized() ? "归一化坐标" : "绝对坐标",
                    VisionResponse.SCHEMA
            ));
            return systemMsg;
        }

        @Override
        public JsonObject buildResponseFormat() {
            JsonObject format = new JsonObject();
            format.addProperty("type", "json_object");
            format.add("schema", VisionResponse.SCHEMA_JSON);
            return format;
        }
    }

    // Factory Pattern Implementation
    private static class SceneStrategyFactory {
        private final Map<SceneType, SceneStrategy> strategies = new ConcurrentHashMap<>();

        public void register(SceneType sceneType, SceneStrategy strategy) {
            strategies.put(sceneType, strategy);
        }

        public SceneStrategy getStrategy(SceneType sceneType) {
            return strategies.getOrDefault(sceneType, new ObjectDetectionStrategy());
        }
    }

    public enum SceneType {
        OBJECT_DETECTION, OCR, VISUAL_GROUNDING, DOCUMENT_PARSING
    }

    public enum OutputType {
        BBOX, POINTS, POLYGON
    }


    public static class SceneContext {
        private SceneType sceneType = SceneType.OBJECT_DETECTION;
        private OutputType outputType = OutputType.BBOX;
        private boolean normalized = true;
        private boolean render;
        private String model = "qwen2.5-vl-72b-instruct";
        private List<String> targets=new ArrayList<>();

        public SceneType getSceneType() {
            return sceneType;
        }

        public void setSceneType(SceneType sceneType) {
            this.sceneType = sceneType;
        }

        public OutputType getOutputType() {
            return outputType;
        }

        public void setOutputType(OutputType outputType) {
            this.outputType = outputType;
        }

        public boolean isNormalized() {
            return normalized;
        }

        public void setNormalized(boolean normalized) {
            this.normalized = normalized;
        }

        public boolean isRender() {
            return render;
        }

        public void setRender(boolean render) {
            this.render = render;
        }

        public String getModel() {
            return model;
        }

        public void setModel(String model) {
            this.model = model;
        }

        public List<String> getTargets() {
            return targets;
        }

        public void setTargets(List<String> targets) {
            this.targets = targets;
        }
    }

    public static class VisionResponse {
        private String status;
        private Meta meta;
        private List<Annotation> annotations;
        private String renderedImage;

        public static final String SCHEMA = gson.toJson(new VisionResponseSchema());
        public static final JsonObject SCHEMA_JSON = gson.fromJson(SCHEMA, JsonObject.class);

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public Meta getMeta() {
            return meta;
        }

        public void setMeta(Meta meta) {
            this.meta = meta;
        }

        public List<Annotation> getAnnotations() {
            return annotations;
        }

        public void setAnnotations(List<Annotation> annotations) {
            this.annotations = annotations;
        }

        public String getRenderedImage() {
            return renderedImage;
        }

        public void setRenderedImage(String renderedImage) {
            this.renderedImage = renderedImage;
        }


        public static class VisionResponseSchema {
            public String status = "string";
            public MetaSchema meta = new MetaSchema();

            public List<AnnotationSchema> annotations = Collections.singletonList(new AnnotationSchema());

            public String getStatus() {
                return status;
            }

            public void setStatus(String status) {
                this.status = status;
            }

            public MetaSchema getMeta() {
                return meta;
            }

            public void setMeta(MetaSchema meta) {
                this.meta = meta;
            }

            public List<AnnotationSchema> getAnnotations() {
                return annotations;
            }

            public void setAnnotations(List<AnnotationSchema> annotations) {
                this.annotations = annotations;
            }
        }

        public static class MetaSchema {
            public String model = "string";
            public int[] image_size = new int[0];

            public String getModel() {
                return model;
            }

            public void setModel(String model) {
                this.model = model;
            }

            public int[] getImage_size() {
                return image_size;
            }

            public void setImage_size(int[] image_size) {
                this.image_size = image_size;
            }
        }

        public static class AnnotationSchema {
            public String label = "string";
            public String subLabel = "string";

            public String type = "string";
            public double[] coordinates = new double[0];
            public double confidence = 0.0;
            public String position = "string";

            public String color = "string";

            public String getLabel() {
                return label;
            }

            public void setLabel(String label) {
                this.label = label;
            }

            public String getSubLabel() {
                return subLabel;
            }

            public void setSubLabel(String subLabel) {
                this.subLabel = subLabel;
            }

            public String getType() {
                return type;
            }

            public void setType(String type) {
                this.type = type;
            }

            public double[] getCoordinates() {
                return coordinates;
            }

            public void setCoordinates(double[] coordinates) {
                this.coordinates = coordinates;
            }

            public double getConfidence() {
                return confidence;
            }

            public void setConfidence(double confidence) {
                this.confidence = confidence;
            }

            public String getPosition() {
                return position;
            }

            public void setPosition(String position) {
                this.position = position;
            }

            public String getColor() {
                return color;
            }

            public void setColor(String color) {
                this.color = color;
            }
        }


        public static class Meta {
            private String model;
            private int[] imageSize;

            public String getModel() {
                return model;
            }

            public void setModel(String model) {
                this.model = model;
            }

            public int[] getImageSize() {
                return imageSize;
            }

            public void setImageSize(int[] imageSize) {
                this.imageSize = imageSize;
            }
        }


        public static class Annotation {
            private String label;
            private String subLabel;
            private String type;
            private List<List<Double>> coordinates;
            private double confidence;
            private String position;
            private String color;

            public String getLabel() {
                return label;
            }

            public void setLabel(String label) {
                this.label = label;
            }

            public String getSubLabel() {
                return subLabel;
            }

            public void setSubLabel(String subLabel) {
                this.subLabel = subLabel;
            }

            public String getType() {
                return type;
            }

            public void setType(String type) {
                this.type = type;
            }

            public List<List<Double>> getCoordinates() {
                return coordinates;
            }

            public void setCoordinates(List<List<Double>> coordinates) {
                this.coordinates = coordinates;
            }

            public double getConfidence() {
                return confidence;
            }

            public void setConfidence(double confidence) {
                this.confidence = confidence;
            }

            public String getPosition() {
                return position;
            }

            public void setPosition(String position) {
                this.position = position;
            }

            public String getColor() {
                return color;
            }

            public void setColor(String color) {
                this.color = color;
            }
        }
        // 自定义反序列化器，用于处理 coordinates
        public static class AnnotationDeserializer implements JsonDeserializer<Annotation> {
            @Override
            public Annotation deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) throws JsonParseException {
                JsonObject jsonObject = json.getAsJsonObject();
                Annotation annotation = new Annotation();

                // 处理 label，检查是否为空
                annotation.label = jsonObject.has("label") ? jsonObject.get("label").getAsString() : "";

                // 处理 subLabel，检查是否为空
                annotation.subLabel = jsonObject.has("subLabel") ? jsonObject.get("subLabel").getAsString() : "";

                // 处理 type，检查是否为空
                annotation.type = jsonObject.has("type") ? jsonObject.get("type").getAsString() : "";

                // 处理 confidence，检查是否为空
                annotation.confidence = jsonObject.has("confidence") ? jsonObject.get("confidence").getAsDouble() : 0.0;

                // 处理 position，检查是否为空
                annotation.position = jsonObject.has("position") ? jsonObject.get("position").getAsString() : "";

                // 处理 color，检查是否为空
                annotation.color = jsonObject.has("color") ? jsonObject.get("color").getAsString() : "";

                // 处理 coordinates，检查是否为空
                if (jsonObject.has("coordinates")) {
                    JsonElement coordinatesElement = jsonObject.get("coordinates");
                    if (coordinatesElement != null && coordinatesElement.isJsonArray()) {
                        JsonArray coordinatesArray = coordinatesElement.getAsJsonArray();
                        annotation.coordinates = new ArrayList<>();

                        if (!coordinatesArray.isJsonNull()) {
                            JsonElement firstElement = coordinatesArray.get(0);
                            if (firstElement.isJsonArray()) {
                                List<Double> coordinatesBak = new ArrayList<>();
                                for (JsonElement element : coordinatesArray) {
                                    JsonArray asJsonArray = element.getAsJsonArray();
                                    for (JsonElement jsonElement : asJsonArray) {
                                        coordinatesBak.add(jsonElement.getAsDouble());
                                    }
                                    if(coordinatesBak.size()==4){
                                        //复制一份coordinate
                                        List<Double> coordinate = new ArrayList<>();
                                        coordinate.addAll(coordinatesBak);
                                        annotation.coordinates.add(coordinate);
                                        coordinatesBak.clear();
                                    }
                                }
                            } else {
                                List<Double> coordinate = new ArrayList<>();
                                for (JsonElement element : coordinatesArray) {
                                    coordinate.add(element.getAsDouble());
                                }
                                annotation.coordinates.add(coordinate);
                            }
                        }
                    }
                } else {
                    // 如果 coordinates 字段不存在，设置为空列表
                    annotation.coordinates = new ArrayList<>();
                }

                return annotation;
            }
        }
    }

    public static class Visualizer {
        public static void drawAnnotations(VisionResponse response, BufferedImage image) {
            Graphics2D g = image.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setStroke(new BasicStroke(2));

            int[] dimensions = response.getMeta().getImageSize();
            int width = dimensions[0];
            int height = dimensions[1];

            for (VisionResponse.Annotation ann : response.getAnnotations()) {
                Color color = ann.getColor()==null ? Color.RED :parseColor(ann.getColor());
                g.setColor(color);

                List<List<Double>> coordss = ann.getCoordinates();

                for (List<Double> coords : coordss) {
                    if(coordss.size()==2){
                        //补足
                        coords.add(coords.get(0)+0.1*width);
                        coords.add(coords.get(1)+0.1*height);
                    }
                    boolean isNormalized = coords.stream().allMatch(c -> c >= 0.0 && c <= 1.0);
                    switch (ann.getType().toLowerCase()) {
                        case "bbox":
                            drawBoundingBox(g, coords, width, height, isNormalized);
                            break;
                        case "point":
                            drawPoint(g, coords, width, height, isNormalized);
                            break;
                        case "polygon":
                            drawPolygon(g, coords, width, height, isNormalized);
                            break;
                        default:
                            drawBoundingBox(g, coords, width, height, isNormalized);
                            break;
                    }
                }

                drawLabel(g, ann, width, height);
            }
            g.dispose();
            response.setRenderedImage(bufferedImageToBase64(image));
        }

        private static void drawBoundingBox(Graphics2D g, List<Double> coords,
                                           int width, int height, boolean isNormalized) {
            double x1 = normalize(coords.get(0), width, isNormalized);
            double y1 = normalize(coords.get(1), height, isNormalized);
            double x2 = normalize(coords.get(2), width, isNormalized);
            double y2 = normalize(coords.get(3), height, isNormalized);
            g.drawRect((int)x1, (int)y1, (int)(x2 - x1), (int)(y2 - y1));
        }

        private static void drawPoint(Graphics2D g, List<Double> coords,
                                     int width, int height, boolean isNormalized) {
            int x = (int) normalize(coords.get(0), width, isNormalized);
            int y = (int) normalize(coords.get(1), height, isNormalized);
            g.fillOval(x - 3, y - 3, 6, 6);
        }

        private static void drawPolygon(Graphics2D g, List<Double> coords,
                                       int width, int height, boolean isNormalized) {
            int[] xPoints = new int[coords.size()/2];
            int[] yPoints = new int[coords.size()/2];

            for (int i = 0; i < coords.size(); i += 2) {
                xPoints[i/2] = (int) normalize(coords.get(i), width, isNormalized);
                yPoints[i/2] = (int) normalize(coords.get(i+1), height, isNormalized);
            }
            g.drawPolygon(xPoints, yPoints, xPoints.length);
        }

        private static double normalize(double value, int dimension, boolean isNormalized) {
            return isNormalized ? value * dimension : value;
        }

        private static Color parseColor(String hex) {
            try {
                return Color.decode(hex.startsWith("#") ? hex : "#" + hex);
            } catch (NumberFormatException e) {
                return Color.RED;
            }
        }

        private static void drawLabel(Graphics2D g, VisionResponse.Annotation ann,
                                     int width, int height) {
            FontMetrics metrics = g.getFontMetrics();
            String label = String.format("%s (%.2f)", (ann.getSubLabel()==null||ann.getSubLabel().equals(""))?ann.getLabel():(Objects.equals(ann.getSubLabel(), ann.getLabel())?ann.getSubLabel():ann.getLabel()+ann.getSubLabel()), ann.getConfidence());
            int textWidth = metrics.stringWidth(label);
            List<List<Double>> baseCoordss = ann.getCoordinates();
            for (List<Double> baseCoords : baseCoordss) {
                boolean isNormalized = baseCoords.stream().allMatch(c -> c >= 0.0 && c <= 1.0);
                int baseX = (int) normalize(baseCoords.get(0), width, isNormalized);
                int baseY = (int) normalize(baseCoords.get(1), height, isNormalized);

                // Draw background
                g.setColor(new Color(0, 0, 0, 150));
                g.fillRect(baseX, baseY - metrics.getHeight(),
                        textWidth + 10, metrics.getHeight());
                // Draw text
                g.setColor(Color.WHITE);
                g.drawString(label, baseX + 5, baseY - metrics.getDescent());
            }
        }

        private static String bufferedImageToBase64(BufferedImage image) {
            try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                ImageIO.write(image, "png", baos);
                return Base64.getEncoder().encodeToString(baos.toByteArray());
            } catch (IOException e) {
                throw new RuntimeException("Image conversion failed", e);
            }
        }
    }
}
