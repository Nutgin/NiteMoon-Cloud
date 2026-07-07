package cn.nitemoon.cloud.onnx.vl;


import com.google.gson.Gson;

import javax.imageio.ImageIO;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * 大模型自动标注数据集
 */
public class VLDemo {
    public static void main(String[] args) throws IOException {
        Gson gson = new Gson();
        //EnhancedVisionClient client = new EnhancedVisionClient("sk-mirbmecepsveakcixxxsxsxsxxegdxpeohmdlumlhjcgzlsfzuhst","https://api.siliconflow.cn/v1/chat/completions");
        EnhancedVisionClient client = new EnhancedVisionClient("sk-6a58b14a01ba4adda8ad25d318b21da8");
        EnhancedVisionClient.SceneContext context = new EnhancedVisionClient.SceneContext();
        context.setModel("qwen2.5-vl-72b-instruct");
        context.setSceneType(EnhancedVisionClient.SceneType.VISUAL_GROUNDING);
        List<String> targets = new ArrayList<>();
        targets.add("安全帽");
        context.setTargets(targets);
        context.setRender(true);
        EnhancedVisionClient.VisionResponse response = client.analyzeImage("images/hard_hat_workers33.png", context);
        response.getAnnotations().forEach(obj ->
                System.out.printf("%s - 置信度: %.2f, 位置: %s%n",
                    obj.getLabel()+obj.getSubLabel(),
                    obj.getConfidence(),
                        gson.toJson(obj.getCoordinates()))
            );
        // 2. 可视化结果
        if(context.isRender()){
            String image = response.getRenderedImage();
            response.setRenderedImage(null);
            System.out.println(gson.toJson(response));
            ImageIO.write(EnhancedVisionClient.base64ToBufferedImage(image), "PNG", new File("output.png"));
        }
    }
}
