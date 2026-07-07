package cn.nitemoon.cloud.onnx.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

/**
 * 标签映射配置类，维护英文标签到中文标签的映射关系
 */
@Configuration
public class LabelMapConfig {

    /**
     * 创建英文标签到中文标签的映射关系
     *
     * @return 标签映射表
     */
    @Bean
    public Map<String, String> labelMap() {
        Map<String, String> labelMap = new HashMap<>();

        // COCO数据集常见标签的中英文映射
        labelMap.put("person", "人");
        labelMap.put("bicycle", "自行车");
        labelMap.put("car", "汽车");
        labelMap.put("motorcycle", "摩托车");
        labelMap.put("airplane", "飞机");
        labelMap.put("bus", "公交车");
        labelMap.put("train", "火车");
        labelMap.put("truck", "卡车");
        labelMap.put("boat", "船");
        labelMap.put("traffic light", "交通灯");
        labelMap.put("fire hydrant", "消防栓");
        labelMap.put("stop sign", "停车标志");
        labelMap.put("parking meter", "停车计时器");
        labelMap.put("bench", "长椅");
        labelMap.put("bird", "鸟");
        labelMap.put("cat", "猫");
        labelMap.put("dog", "狗");
        labelMap.put("horse", "马");
        labelMap.put("sheep", "羊");
        labelMap.put("cow", "牛");
        labelMap.put("elephant", "大象");
        labelMap.put("bear", "熊");
        labelMap.put("zebra", "斑马");
        labelMap.put("giraffe", "长颈鹿");
        labelMap.put("backpack", "背包");
        labelMap.put("umbrella", "雨伞");
        labelMap.put("handbag", "手提包");
        labelMap.put("tie", "领带");
        labelMap.put("suitcase", "行李箱");
        labelMap.put("frisbee", "飞盘");
        labelMap.put("skis", "滑雪板");
        labelMap.put("snowboard", "滑雪板");
        labelMap.put("sports ball", "运动球");
        labelMap.put("kite", "风筝");
        labelMap.put("baseball bat", "棒球棒");
        labelMap.put("baseball glove", "棒球手套");
        labelMap.put("skateboard", "滑板");
        labelMap.put("surfboard", "冲浪板");
        labelMap.put("tennis racket", "网球拍");
        labelMap.put("bottle", "瓶子");
        labelMap.put("wine glass", "酒杯");
        labelMap.put("cup", "杯子");
        labelMap.put("fork", "叉子");
        labelMap.put("knife", "刀");
        labelMap.put("spoon", "勺子");
        labelMap.put("bowl", "碗");
        labelMap.put("banana", "香蕉");
        labelMap.put("apple", "苹果");
        labelMap.put("sandwich", "三明治");
        labelMap.put("orange", "橙子");
        labelMap.put("broccoli", "西兰花");
        labelMap.put("carrot", "胡萝卜");
        labelMap.put("hot dog", "热狗");
        labelMap.put("pizza", "披萨");
        labelMap.put("donut", "甜甜圈");
        labelMap.put("cake", "蛋糕");
        labelMap.put("chair", "椅子");
        labelMap.put("couch", "沙发");
        labelMap.put("potted plant", "盆栽");
        labelMap.put("bed", "床");
        labelMap.put("dining table", "餐桌");
        labelMap.put("toilet", "马桶");
        labelMap.put("tv", "电视");
        labelMap.put("laptop", "笔记本电脑");
        labelMap.put("mouse", "鼠标");
        labelMap.put("remote", "遥控器");
        labelMap.put("keyboard", "键盘");
        labelMap.put("cell phone", "手机");
        labelMap.put("microwave", "微波炉");
        labelMap.put("oven", "烤箱");
        labelMap.put("toaster", "烤面包机");
        labelMap.put("sink", "水槽");
        labelMap.put("refrigerator", "冰箱");
        labelMap.put("book", "书");
        labelMap.put("clock", "时钟");
        labelMap.put("vase", "花瓶");
        labelMap.put("scissors", "剪刀");
        labelMap.put("teddy bear", "泰迪熊");
        labelMap.put("hair drier", "吹风机");
        labelMap.put("toothbrush", "牙刷");

        // 其他可能的标签映射
        labelMap.put("no_helmet", "未戴头盔");
        labelMap.put("helmet", "头盔");
        labelMap.put("speedLimit", "限速标志");
        labelMap.put("crosswalk", "人行横道");
        labelMap.put("trafficLight", "交通信号灯");
        labelMap.put("stop", "停止标志");
        labelMap.put("roadsign", "路标");

        return labelMap;
    }
}
