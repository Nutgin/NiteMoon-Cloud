import apiClient from "../apiClient";

// 视频检测结果接口
export interface VideoDetectionResult {
  // 当前画面中的人数
  currentPersonCount?: number;
  // 检测开始时间
  startTime?: string; // LocalDateTime 格式
  // 最后更新时间
  lastUpdateTime?: string; // LocalDateTime 格式
  // 告警记录列表
  alertMessages?: string[];
  // 总结文本
  summary?: string;
  // 状态：running-运行中, completed-已完成
  status?: string;
  // 总检测帧数
  totalFrames?: number;
  // 最大人数
  maxPersonCount?: number;
}

const AiVideoApi = {
  Video: "/onnx/video-detection",
};

/**
 * 处理视频URL进行目标检测
 */
export function processVideoUrlApi(videoUrl: string, outputRtmpUrl: string) {
  const formData = new FormData();
  formData.append('videoUrl', videoUrl);
  formData.append('outputRtmpUrl', outputRtmpUrl);

  return apiClient.post<void>({
    url: AiVideoApi.Video + "/process-video-url",
    data: formData,
  });
}

/**
 * 处理上传的视频文件进行目标检测
 */
export function processUploadedVideoApi(file: File, outputRtmpUrl: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('outputRtmpUrl', outputRtmpUrl);

  return apiClient.post<void>({
    url: AiVideoApi.Video + "/process-uploaded-video",
    data: formData,
  });
}

/**
 * 处理本地默认视频文件进行目标检测
 */
export function processDefaultVideoApi(outputRtmpUrl: string) {
  const formData = new FormData();
  formData.append('outputRtmpUrl', outputRtmpUrl);

  return apiClient.post<void>({
    url: AiVideoApi.Video + "/process-default-video",
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 查询视频检测结果
 */
export function getDetectionResultApi(outputRtmpUrl: string) {
  return apiClient.get<VideoDetectionResult>({
    url: AiVideoApi.Video + "/get-detection-result",
    params: {
      outputRtmpUrl: outputRtmpUrl
    }
  });
}

/**
 * 停止视频推流
 */
export function stopStreamApi(outputRtmpUrl: string) {
  return apiClient.post<string>({
    url: AiVideoApi.Video + "/stop-stream",
    params: {
      outputRtmpUrl: outputRtmpUrl
    }
  });
}

/**
 * sendBeacon 请求结果
 */
export interface SendBeaconResult {
  success: boolean;
  message: string;
}

/**
 * 使用 sendBeacon 停止视频推流（用于页面卸载场景）
 * 
 * @param outputRtmpUrl 输出的RTMP流地址
 * @returns SendBeaconResult 请求结果
 */
export function stopStreamWithBeacon(outputRtmpUrl: string): SendBeaconResult {
  // 参数验证
  if (!outputRtmpUrl) {
    const message = '停止推流失败：outputRtmpUrl 为空';
    console.warn(message);
    return { success: false, message };
  }

  // 检查浏览器支持
  if (!navigator.sendBeacon) {
    const message = '浏览器不支持 sendBeacon API';
    console.warn(message);
    return { success: false, message };
  }

  try {
    // POST请求 + @RequestParam 参数作为查询参数传递
    const baseUrl = window.location.origin;
    const url = `${baseUrl}${AiVideoApi.Video}/stop-stream?outputRtmpUrl=${encodeURIComponent(outputRtmpUrl)}`;
    
    // sendBeacon 发送POST请求，参数在URL中
    const success = navigator.sendBeacon(url);
    
    return {
      success,
      message: success ? '请求已发送' : '请求发送失败'
    };
  } catch (error) {
    return {
      success: false,
      message: `异常: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
