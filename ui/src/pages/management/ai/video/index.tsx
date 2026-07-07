import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Input } from "@/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  processVideoUrlApi,
  processUploadedVideoApi,
  processDefaultVideoApi,
  getDetectionResultApi,
  stopStreamApi,
  stopStreamWithBeacon,
  type SendBeaconResult,
  type VideoDetectionResult
} from "@/api/services/aiVideoService";

export default function VideoPage() {
  const { t } = useTranslation();
  // 视频元素引用
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const player = useRef<any>(null);

  // 生成8位随机字母数字
  const generateRandomStreamId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // 初始化随机流ID
  const initialStreamId = generateRandomStreamId();
  const defaultRtmpUrl = `rtmp://live.nitemoon.cn/live/${initialStreamId}`;

  // 表单数据
  const [urlForm, setUrlForm] = useState({
    videoUrl: '',
    outputRtmpUrl: defaultRtmpUrl
  });

  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    outputRtmpUrl: defaultRtmpUrl
  });

  const [defaultForm, setDefaultForm] = useState({
    outputRtmpUrl: defaultRtmpUrl
  });

  // 处理状态
  const [processing, setProcessing] = useState({
    url: false,
    upload: false,
    default: false
  });

  const [playing, setPlaying] = useState({
    url: false,
    upload: false,
    default: false
  });

  const [status, setStatus] = useState({
    url: { message: '', type: 'normal' as 'normal' | 'success' | 'warning' | 'error' },
    upload: { message: '', type: 'normal' as 'normal' | 'success' | 'warning' | 'error' },
    default: { message: '', type: 'normal' as 'normal' | 'success' | 'warning' | 'error' }
  });

  // 检测结果相关状态
  const [detectionResult, setDetectionResult] = useState<VideoDetectionResult | null>(null);
  const [currentRtmpUrl, setCurrentRtmpUrl] = useState<string>('');
  const [detectionInterval, setDetectionInterval] = useState<NodeJS.Timeout | null>(null);
  
  // 当前播放的推流地址缓存
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>('');

  // WebRTC播放器实现
  class WebRtcPlayerImpl {
    pc: RTCPeerConnection | null = null;
    stream: MediaStream | null = null;

    constructor() {
      this.pc = new RTCPeerConnection(null);
      this.stream = new MediaStream();

      this.pc.ontrack = (event) => {
        this.stream!.addTrack(event.track);
        if (videoRef.current) {
          videoRef.current.srcObject = this.stream;
        }
      };
    }

    async play(url: string) {
      try {
        const parsedUrl = this.parseUrl(url);
        this.pc!.addTransceiver("audio", { direction: "recvonly" });
        this.pc!.addTransceiver("video", { direction: "recvonly" });

        const offer = await this.pc!.createOffer();
        await this.pc!.setLocalDescription(offer);

        const apiUrl = this.buildApiUrl(parsedUrl);
        const response = await this.sendOffer(apiUrl, parsedUrl.fullUrl, offer.sdp);

        await this.pc!.setRemoteDescription(
          new RTCSessionDescription({ type: 'answer', sdp: response.sdp })
        );

        return response;
      } catch (error) {
        console.error("播放失败:", error);
        throw error;
      }
    }

    parseUrl(url: string) {
      const fullUrl = url;
      const httpUrl = url.replace("rtmp://", "http://")
        .replace("webrtc://", "http://")
        .replace("rtc://", "http://");

      const a = document.createElement("a");
      a.href = httpUrl;

      let vhost = a.hostname;
      let app = a.pathname.substring(1, a.pathname.lastIndexOf("/"));
      let stream = a.pathname.slice(a.pathname.lastIndexOf("/") + 1);

      app = app.replace("...vhost...", "?vhost=");
      if (app.indexOf("?") >= 0) {
        const params = app.slice(app.indexOf("?"));
        app = app.slice(0, app.indexOf("?"));

        if (params.indexOf("vhost=") > 0) {
          vhost = params.slice(params.indexOf("vhost=") + "vhost=".length);
          if (vhost.indexOf("&") > 0) {
            vhost = vhost.slice(0, vhost.indexOf("&"));
          }
        }
      }

      if (a.hostname === vhost) {
        const re = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
        if (re.test(a.hostname)) {
          vhost = "__defaultVhost__";
        }
      }

      let schema = "rtmp";
      if (url.indexOf("://") > 0) {
        schema = url.slice(0, url.indexOf("://"));
      }

      let port = a.port;
      if (!port) {
        port = 1985;
      }

      const ret = {
        fullUrl: fullUrl,
        url: httpUrl,
        schema: schema,
        server: a.hostname,
        port: port,
        vhost: vhost,
        app: app,
        stream: stream,
        user_query: {} as Record<string, string>
      };

      this.fillQuery(a.search, ret);
      return ret;
    }

    fillQuery(queryString: string, obj: any) {
      if (queryString.length === 0) {
        return;
      }

      if (queryString.indexOf("?") >= 0) {
        queryString = queryString.split("?")[1];
      }

      const queries = queryString.split("&");
      for (let i = 0; i < queries.length; i++) {
        const elem = queries[i];
        const query = elem.split("=");
        obj.user_query[query[0]] = query[1];
      }
    }

    buildApiUrl(parsedUrl: any) {
      let schema = 'http:';
      if (window.location.protocol === 'https:') {
        schema = 'https:';
      }

      let port = parsedUrl.port || 1985;
      if (schema === 'https:') {
        port = parsedUrl.port || 443;
      }

      let api = parsedUrl.user_query?.play || '/rtc/v1/play/';
      if (api.lastIndexOf('/') !== api.length - 1) {
        api += '/';
      }

      /**
       * 线上处理使用第一行
       */
      let apiUrl = schema + '//' + parsedUrl.server + api;
      // let apiUrl = "https://live.nitemoon.cn/rtc/v1/play/"

      let first = true;
      for (const key in parsedUrl.user_query) {
        if (key !== 'api' && key !== 'play') {
          apiUrl += (first ? '?' : '&') + key + '=' + parsedUrl.user_query[key];
          first = false;
        }
      }

      console.log("构建的API URL:", apiUrl);
      return apiUrl;
    }

    sendOffer(apiUrl: string, streamUrl: string, sdp: string | undefined) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open('POST', apiUrl, true);
        xhr.setRequestHeader('Content-type', 'application/json');

        xhr.onload = function () {
          if (xhr.readyState !== xhr.DONE) return;
          if (xhr.status !== 200 && xhr.status !== 201) {
            reject(new Error("HTTP错误: " + xhr.status));
            return;
          }

          try {
            const data = JSON.parse(xhr.responseText);
            if (data.code) {
              reject(new Error("服务器返回错误: " + data.code));
            } else {
              resolve(data);
            }
          } catch (e: any) {
            reject(new Error("解析服务器响应失败: " + e.message));
          }
        };

        xhr.onerror = function () {
          reject(new Error("网络请求失败"));
        };

        const data = {
          api: apiUrl,
          streamurl: streamUrl,
          clientip: null,
          sdp: sdp
        };

        try {
          xhr.send(JSON.stringify(data));
        } catch (e: any) {
          reject(new Error("发送请求失败: " + e.message));
        }
      });
    }

    close() {
      if (this.pc) {
        this.pc.close();
        this.pc = null;
      }
      if (this.stream) {
        this.stream = null;
      }
    }
  }

  // 更新状态显示
  const updateStatus = (tab: 'url' | 'upload' | 'default', message: string, type: 'normal' | 'success' | 'warning' | 'error') => {
    setStatus(prev => ({
      ...prev,
      [tab]: { message, type }
    }));
  };

  // 查询检测结果
  const fetchDetectionResult = useCallback(async (rtmpUrl: string) => {
    try {
      const result = await getDetectionResultApi(rtmpUrl);
      setDetectionResult(result);
      console.log('检测结果:', result);
      
      // 如果检测完成，停止轮询
      if (result && result.status === 'completed') {
        console.log('视频检测已完成，停止轮询');
        // 直接清除定时器，避免循环依赖
        if (detectionInterval) {
          clearInterval(detectionInterval);
          setDetectionInterval(null);
        }
      }
    } catch (error) {
      console.error('查询检测结果失败:', error);
      // 如果查询失败，不更新状态，保持定时器继续
    }
  }, [detectionInterval]);

  // 开始检测结果定时查询
  const startDetectionPolling = useCallback((rtmpUrl: string) => {
    // 清除之前的定时器
    if (detectionInterval) {
      clearInterval(detectionInterval);
    }

    // 重置检测结果状态
    setDetectionResult(null);
    setCurrentRtmpUrl('');

    // 定义查询函数（避免循环依赖）
    const queryResult = async () => {
      try {
        const result = await getDetectionResultApi(rtmpUrl);
        setDetectionResult(result);
        console.log('检测结果:', result);
        
        // 如果检测完成，停止轮询
        if (result && result.status === 'completed') {
          console.log('视频检测已完成，停止轮询');
          // 清除当前定时器
          clearInterval(interval);
          setDetectionInterval(null);
        }
      } catch (error) {
        console.error('查询检测结果失败:', error);
      }
    };

    // 立即查询一次
    queryResult();

    // 设置定时查询，每1秒查询一次
    const interval = setInterval(queryResult, 1000);

    setDetectionInterval(interval);
    setCurrentRtmpUrl(rtmpUrl);
  }, [detectionInterval]);

  // 停止检测结果查询
  const stopDetectionPolling = useCallback(() => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
      setDetectionInterval(null);
    }
    setDetectionResult(null);
    setCurrentRtmpUrl('');
  }, [detectionInterval]);

  // 停止推流
  const stopStreamServer = useCallback(async (rtmpUrl: string) => {
    if (!rtmpUrl) return;
    
    try {
      console.log('停止推流，URL:', rtmpUrl);
      await stopStreamApi(rtmpUrl);
      console.log('推流已停止');
    } catch (error) {
      console.error('停止推流失败:', error);
      // 即使失败也继续执行清理逻辑
    }
  }, []);

  // 停止当前播放的推流
  const stopCurrentStream = useCallback(async () => {
    // 只有当有缓存的推流地址时才停止推流
    if (!activeStreamUrl) {
      console.log('没有活跃的推流，无需停止');
      return;
    }

    console.log('停止当前推流:', activeStreamUrl);
    
    // 停止检测查询
    stopDetectionPolling();
    
    // 停止推流服务器
    await stopStreamServer(activeStreamUrl);
    
    // 清空缓存的推流地址
    setActiveStreamUrl('');
  }, [activeStreamUrl, stopDetectionPolling, stopStreamServer]);

  
  // 处理视频URL
  const handleProcessVideoUrl = async () => {
    if (!urlForm.videoUrl.trim()) {
      updateStatus('url', '请输入视频URL', 'warning');
      return;
    }
    if (!urlForm.outputRtmpUrl.trim()) {
      updateStatus('url', '请输入推流地址', 'warning');
      return;
    }

    try {
      setProcessing(prev => ({ ...prev, url: true }));
      updateStatus('url', '正在处理视频URL...', 'normal');

      // 每次请求生成新的随机流ID
      const newStreamId = generateRandomStreamId();
      const newRtmpUrl = `rtmp://live.nitemoon.cn/live/${newStreamId}`;
      setUrlForm(prev => ({ ...prev, outputRtmpUrl: newRtmpUrl }));

      // 发送给后端时替换为localhost地址
      const backendRtmpUrl = newRtmpUrl.replace('rtmp://live.nitemoon.cn/live/', 'rtmp://localhost/live/');
      console.log('视频URL处理 - 发送给后端的地址:', backendRtmpUrl);
      console.log('视频URL处理 - 原始视频URL:', urlForm.videoUrl);

      // 不等待API返回，直接继续（与摄像头页面保持一致）
      processVideoUrlApi(urlForm.videoUrl, backendRtmpUrl).catch(err => {
        console.error('API调用失败:', err);
      });

      updateStatus('url', '视频处理已启动，准备播放...', 'success');

      // 缓存当前播放的推流地址
      setActiveStreamUrl(newRtmpUrl);

      // 开始检测结果定时查询
      startDetectionPolling(newRtmpUrl);

      // 等待几秒后开始播放，使用原始的nitemoon地址
      setTimeout(async () => {
        await playStream(newRtmpUrl, 'url');
      }, 3000);
    } catch (error: any) {
      console.error('处理视频URL失败:', error);
      updateStatus('url', '处理失败: ' + error.message, 'error');
    } finally {
      setProcessing(prev => ({ ...prev, url: false }));
    }
  };

  // 处理上传视频
  const handleProcessUploadedVideo = async () => {
    if (!uploadForm.file) {
      updateStatus('upload', '请选择视频文件', 'warning');
      return;
    }
    if (!uploadForm.outputRtmpUrl.trim()) {
      updateStatus('upload', '请输入推流地址', 'warning');
      return;
    }

    try {
      setProcessing(prev => ({ ...prev, upload: true }));
      updateStatus('upload', '正在处理上传的视频...', 'normal');

      // 每次请求生成新的随机流ID
      const newStreamId = generateRandomStreamId();
      const newRtmpUrl = `rtmp://live.nitemoon.cn/live/${newStreamId}`;
      setUploadForm(prev => ({ ...prev, outputRtmpUrl: newRtmpUrl }));

      // 发送给后端时替换为localhost地址
      const backendRtmpUrl = newRtmpUrl.replace('rtmp://live.nitemoon.cn/live/', 'rtmp://localhost/live/');
      console.log('上传视频处理 - 发送给后端的地址:', backendRtmpUrl);
      console.log('上传视频处理 - 文件名:', uploadForm.file?.name);

      // 不等待API返回，直接继续（与摄像头页面保持一致）
      processUploadedVideoApi(uploadForm.file, backendRtmpUrl).catch(err => {
        console.error('API调用失败:', err);
      });

      updateStatus('upload', '视频处理已启动，准备播放...', 'success');

      // 缓存当前播放的推流地址
      setActiveStreamUrl(newRtmpUrl);

      // 开始检测结果定时查询
      startDetectionPolling(newRtmpUrl);

      // 等待几秒后开始播放，使用原始的nitemoon地址
      setTimeout(async () => {
        await playStream(newRtmpUrl, 'upload');
      }, 3000);
    } catch (error: any) {
      console.error('处理上传视频失败:', error);
      updateStatus('upload', '处理失败: ' + error.message, 'error');
    } finally {
      setProcessing(prev => ({ ...prev, upload: false }));
    }
  };

  // 处理默认视频
  const handleProcessDefaultVideo = async () => {
    if (!defaultForm.outputRtmpUrl.trim()) {
      updateStatus('default', '请输入推流地址', 'warning');
      return;
    }

    try {
      setProcessing(prev => ({ ...prev, default: true }));
      updateStatus('default', '正在处理默认视频...', 'normal');

      // 每次请求生成新的随机流ID
      const newStreamId = generateRandomStreamId();
      const newRtmpUrl = `rtmp://live.nitemoon.cn/live/${newStreamId}`;
      setDefaultForm(prev => ({ ...prev, outputRtmpUrl: newRtmpUrl }));

      // 发送给后端时替换为localhost地址
      const backendRtmpUrl = newRtmpUrl.replace('rtmp://live.nitemoon.cn/live/', 'rtmp://localhost/live/');
      console.log('默认视频处理 - 发送给后端的地址:', backendRtmpUrl);
      console.log('默认视频处理 - 原始地址:', newRtmpUrl);
      console.log('默认视频处理 - 开始调用API');

      // 不等待API返回，直接继续（与摄像头页面保持一致）
      processDefaultVideoApi(backendRtmpUrl).catch(err => {
        console.error('API调用失败:', err);
      });

      console.log('默认视频处理 - API调用已发送');
      updateStatus('default', '视频处理已启动，准备播放...', 'success');

      // 缓存当前播放的推流地址
      setActiveStreamUrl(newRtmpUrl);

      // 开始检测结果定时查询
      startDetectionPolling(newRtmpUrl);

      // 等待几秒后开始播放，使用原始的nitemoon地址
      setTimeout(async () => {
        await playStream(newRtmpUrl, 'default');
      }, 3000);
    } catch (error: any) {
      console.error('处理默认视频失败:', error);
      updateStatus('default', '处理失败: ' + error.message, 'error');
    } finally {
      setProcessing(prev => ({ ...prev, default: false }));
    }
  };

  // 播放流
  const playStream = async (rtmpUrl: string, tab: 'url' | 'upload' | 'default') => {
    try {
      if (player.current) {
        player.current.close();
      }

      const webrtcUrl = rtmpUrl.replace('rtmp://', 'webrtc://');
      player.current = new WebRtcPlayerImpl();

      await player.current.play(webrtcUrl);
      setPlaying(prev => ({ ...prev, [tab]: true }));
      updateStatus(tab, '播放成功', 'success');

      if (videoRef.current) {
        videoRef.current.play().catch(error => {
          console.warn('自动播放失败:', error);
        });
      }
    } catch (error: any) {
      console.error('播放失败:', error);
      updateStatus(tab, '播放失败: ' + error.message, 'error');
      if (player.current) {
        player.current.close();
        player.current = null;
      }
    }
  };

  // 停止播放
  const stopStream = async (tab: 'url' | 'upload' | 'default') => {
    if (player.current) {
      player.current.close();
      player.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setPlaying(prev => ({ ...prev, [tab]: false }));
    updateStatus(tab, '已停止播放', 'normal');
    
    // 停止当前推流（使用正常接口调用）
    if (activeStreamUrl) {
      try {
        await stopStreamApi(activeStreamUrl);
        console.log('正常停止推流成功:', activeStreamUrl);
      } catch (error) {
        console.error('正常停止推流失败:', error);
      }
      // 清理状态
      stopDetectionPolling();
      setActiveStreamUrl('');
    }
  };

  // Tab切换时停止所有播放
  const handleTabChange = async (value: string) => {
    // 停止所有tab的播放
    ['url', 'upload', 'default'].forEach(tab => {
      if (playing[tab as 'url' | 'upload' | 'default']) {
        stopStream(tab as 'url' | 'upload' | 'default');
      }
    });
  };

  // 组件卸载时清理所有服务
  useEffect(() => {
    return () => {
      // 清理定时器
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
      
      // 停止当前推流（如果有活跃的推流）
      if (activeStreamUrl) {
        stopStreamWithBeacon(activeStreamUrl);
      }
    };
  }, [detectionInterval, activeStreamUrl]);

  // 页面卸载时停止推流 - 简化实现
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeStreamUrl) {
        stopStreamWithBeacon(activeStreamUrl);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // 组件卸载时也停止推流
      if (activeStreamUrl) {
        stopStreamWithBeacon(activeStreamUrl);
      }
    };
  }, [activeStreamUrl]);

  
  // 文件选择处理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="text-lg font-semibold">{t('ai.video.title')}</div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="url" className="w-full" onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="url">{t('ai.video.url')}</TabsTrigger>
              <TabsTrigger value="upload">{t('ai.video.upload')}</TabsTrigger>
              <TabsTrigger value="default">{t('ai.video.defaultVideo')}</TabsTrigger>
            </TabsList>

            {/* 视频URL Tab */}
            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('ai.video.url')}:</label>
                  <Input
                    placeholder="https://platform.nitemoon.cn/api/boot/file/1/get/xxx.mov"
                    value={urlForm.videoUrl}
                    onChange={(e) => setUrlForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleProcessVideoUrl}
                    disabled={processing.url}
                  >
                    <Icon icon="mdi:play" size={18} className="mr-2" />
                    {processing.url ? t('ai.video.processing') : t('ai.video.startProcessing')}
                  </Button>
                  {playing.url && (
                    <Button variant="secondary" onClick={() => stopStream('url')}>
                      <Icon icon="mdi:stop" size={18} className="mr-2" />
                      {t('ai.video.stopPlay')}
                    </Button>
                  )}
                </div>
                {status.url.message && (
                  <div className={`p-4 border rounded-lg ${
                    status.url.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                    status.url.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                    status.url.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                    'bg-blue-50 border-blue-200 text-blue-800'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <Icon
                        icon={
                          status.url.type === 'error' ? 'mdi:alert-circle' :
                          status.url.type === 'warning' ? 'mdi:alert' :
                          status.url.type === 'success' ? 'mdi:check-circle' :
                          'mdi:information'
                        }
                        size={20}
                        className="mr-2"
                      />
                      {status.url.message}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* 上传视频 Tab */}
            <TabsContent value="upload" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('ai.video.selectFile')}:</label>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                  />
                  {uploadForm.file && (
                    <p className="text-sm text-gray-500 mt-1">{t('ai.video.selected')}: {uploadForm.file.name}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleProcessUploadedVideo}
                    disabled={processing.upload}
                  >
                    <Icon icon="mdi:play" size={18} className="mr-2" />
                    {processing.upload ? t('ai.video.processing') : t('ai.video.startProcessing')}
                  </Button>
                  {playing.upload && (
                    <Button variant="secondary" onClick={() => stopStream('upload')}>
                      <Icon icon="mdi:stop" size={18} className="mr-2" />
                      {t('ai.video.stopPlay')}
                    </Button>
                  )}
                </div>
                {status.upload.message && (
                  <div className={`p-4 border rounded-lg ${
                    status.upload.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                    status.upload.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                    status.upload.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                    'bg-blue-50 border-blue-200 text-blue-800'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <Icon
                        icon={
                          status.upload.type === 'error' ? 'mdi:alert-circle' :
                          status.upload.type === 'warning' ? 'mdi:alert' :
                          status.upload.type === 'success' ? 'mdi:check-circle' :
                          'mdi:information'
                        }
                        size={20}
                        className="mr-2"
                      />
                      {status.upload.message}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* 默认视频 Tab */}
            <TabsContent value="default" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={handleProcessDefaultVideo}
                    disabled={processing.default}
                  >
                    <Icon icon="mdi:play" size={18} className="mr-2" />
                    {processing.default ? t('ai.video.processing') : t('ai.video.startProcessing')}
                  </Button>
                  {playing.default && (
                    <Button variant="secondary" onClick={() => stopStream('default')}>
                      <Icon icon="mdi:stop" size={18} className="mr-2" />
                      {t('ai.video.stopPlay')}
                    </Button>
                  )}
                </div>
                {status.default.message && (
                  <div className={`p-4 border rounded-lg ${
                    status.default.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                    status.default.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                    status.default.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                    'bg-blue-50 border-blue-200 text-blue-800'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <Icon
                        icon={
                          status.default.type === 'error' ? 'mdi:alert-circle' :
                          status.default.type === 'warning' ? 'mdi:alert' :
                          status.default.type === 'success' ? 'mdi:check-circle' :
                          'mdi:information'
                        }
                        size={20}
                        className="mr-2"
                      />
                      {status.default.message}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 视频播放和检测结果区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 视频播放区域 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="text-lg font-semibold">{t('ai.video.aiVideo')}</div>
          </CardHeader>
          <CardContent>
            <div className="bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                controls
                className="w-full object-contain"
                style={{ minHeight: "500px" }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 检测结果卡片 */}
        <Card>
          <CardHeader>
            <div className="text-lg font-semibold">{t('ai.video.detectionResult')}</div>
          </CardHeader>
          <CardContent>
            {detectionResult ? (
              <div className="space-y-4">
                {/* 检测状态 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('ai.video.detectionStatus')}:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      detectionResult.status === 'completed' ? 'bg-green-100 text-green-800' :
                      detectionResult.status === 'running' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {detectionResult.status === 'completed' ? t('ai.video.completed') :
                       detectionResult.status === 'running' ? t('ai.video.running') :
                       detectionResult.status || t('ai.video.unknown')}
                    </span>
                  </div>
                </div>

                {/* 当前人数 */}
                {detectionResult.currentPersonCount !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('ai.video.currentPersonCount')}:</span>
                      <span className="text-lg font-bold text-blue-600">{t('ai.video.persons', { count: detectionResult.currentPersonCount })}</span>
                    </div>
                  </div>
                )}

                {/* 最大人数 */}
                {detectionResult.maxPersonCount !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('ai.video.maxPersonCount')}:</span>
                      <span className="text-sm text-gray-600">{t('ai.video.persons', { count: detectionResult.maxPersonCount })}</span>
                    </div>
                  </div>
                )}

                {/* 总检测帧数 */}
                {detectionResult.totalFrames !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('ai.video.totalFrames')}:</span>
                      <span className="text-sm text-gray-600">{t('ai.video.frames', { count: detectionResult.totalFrames.toLocaleString() })}</span>
                    </div>
                  </div>
                )}

                {/* 告警记录 */}
                {detectionResult.alertMessages && detectionResult.alertMessages.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">{t('ai.video.alertRecords')}:</span>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {detectionResult.alertMessages.map((message, index) => (
                        <div key={index} className="text-xs p-2 bg-red-50 rounded border border-red-200">
                          <span className="text-red-700">{message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 总结文本 */}
                {detectionResult.summary && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">{t('ai.video.summary')}:</span>
                    <div className="text-xs p-3 bg-gray-50 rounded border">
                      <span className="text-gray-700">{detectionResult.summary}</span>
                    </div>
                  </div>
                )}

                {/* 开始时间 */}
                {detectionResult.startTime && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('ai.video.startTime')}:</span>
                      <span className="text-xs text-gray-500">{detectionResult.startTime}</span>
                    </div>
                  </div>
                )}

                {/* 最后更新时间 */}
                {detectionResult.lastUpdateTime && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('ai.video.lastUpdate')}:</span>
                      <span className="text-xs text-gray-500">{detectionResult.lastUpdateTime}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon icon="mdi:video-off" size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">
                  {currentRtmpUrl ? t('ai.video.waitingResult') : t('ai.video.startProcessingFirst')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
