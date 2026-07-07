import { GLOBAL_CONFIG } from "@/global-config";
import { Icon } from "@/components/icon";
import { useState, useRef, forwardRef, useEffect } from "react";
import heic2any from "heic2any";

interface AppImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** 图片URL，支持相对路径和绝对路径 */
  src: string;
  /** 图片alt文本 */
  alt?: string;
  /** 图片加载失败时显示的占位符文本 */
  fallbackText?: string;
  /** 自定义样式类名 */
  className?: string;
  /** 是否启用懒加载 */
  lazy?: boolean;
  /** 是否显示加载状态（默认true） */
  showLoading?: boolean;
  /** 图片加载回调 */
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  /** 图片加载失败回调 */
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * 处理图片URL，根据环境变量和配置ID进行转换
 * @param url 原始图片URL
 * @returns 转换后的图片URL
 */
export const processImageUrl = (url: string): string => {
  if (!url) return url;

  // 如果不是云部署，替换指定的URL路径前缀（与 apiClient.ts 逻辑一致）
  if (!GLOBAL_CONFIG.isCloud && url) {
    const prefixesToReplace = ['/auth/', '/system/', '/blog/', '/exam/', '/flow/', '/job/', '/llm/', '/onnx/', '/training/', '/knowledgeGraph/', '/digital/','/gen/','/aiexcel/'];

    for (const prefix of prefixesToReplace) {
      if (url.includes(prefix)) {
        url = url.replace(prefix, '/boot/');
        break; // 只替换第一个匹配的前缀
      }
    }
  }

  return url;
};

/**
 * 判断URL是否为HEIC/HEIF格式
 */
const isHeicUrl = (url: string): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase().split("?")[0];
  return lower.endsWith(".heic") || lower.endsWith(".heif");
};

/**
 * 通用图片组件，自动处理URL转换和加载状态
 */
export const AppImage = forwardRef<HTMLImageElement, AppImageProps>(
  (
    {
      src,
      alt,
      fallbackText = "",
      className,
      lazy = false,
      showLoading = true,
      onLoad,
      onError,
      ...props
    },
    ref
  ) => {
    const blobUrlRef = useRef<string | null>(null);
    const [imageState, setImageState] = useState<{
      isLoading: boolean;
      hasError: boolean;
      processedSrc: string;
    }>({
      isLoading: showLoading, // 根据 showLoading 决定初始状态
      hasError: false,
      processedSrc: processImageUrl(src),
    });

    // 当src变化时重新处理URL
    useEffect(() => {
      // 清理上一个blob URL
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }

      const newProcessedSrc = processImageUrl(src);

      if (isHeicUrl(src)) {
        setImageState(prev => ({ ...prev, isLoading: true, hasError: false, processedSrc: "" }));
        fetch(newProcessedSrc)
          .then(res => {
            if (!res.ok) throw new Error("fetch failed");
            return res.blob();
          })
          .then(blob => heic2any({ blob, toType: "image/jpeg", quality: 0.8 }))
          .then(result => {
            const blob = Array.isArray(result) ? result[0] : result;
            const url = URL.createObjectURL(blob);
            blobUrlRef.current = url;
            setImageState(prev => ({ ...prev, processedSrc: url, isLoading: false, hasError: false }));
          })
          .catch(() => {
            setImageState(prev => ({ ...prev, processedSrc: newProcessedSrc, isLoading: false, hasError: true }));
          });
      } else {
        setImageState(prev => ({
          ...prev,
          processedSrc: newProcessedSrc,
          // 只有当 showLoading 为 true 时才显示加载状态
          isLoading: showLoading,
          hasError: false,
        }));
      }

      return () => {
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
      };
    }, [src, showLoading]);

    // 检测图片是否已经加载完成（解决缓存图片不触发 onLoad 的问题）
    useEffect(() => {
      if (!showLoading || !imageState.processedSrc) return;

      const img = new Image();
      img.onload = () => {
        setImageState(prev => ({
          ...prev,
          isLoading: false,
          hasError: false,
        }));
      };
      img.onerror = () => {
        setImageState(prev => ({
          ...prev,
          isLoading: false,
          hasError: true,
        }));
      };
      img.src = imageState.processedSrc;

      // 如果图片已经完成加载，onload会立即触发
      if (img.complete) {
        setImageState(prev => ({
          ...prev,
          isLoading: false,
          hasError: false,
        }));
      }
    }, [imageState.processedSrc, showLoading]);

    const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
      setImageState(prev => ({
        ...prev,
        isLoading: false,
        hasError: false,
      }));
      onLoad?.(event);
    };

    const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
      setImageState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true,
      }));
      onError?.(event);
    };

    // 渲染加载状态
    if (imageState.isLoading) {
      return (
        <div
          className={`flex items-center justify-center bg-gray-100 ${className}`}
          {...props}
        >
          <div className="flex flex-col items-center justify-center text-gray-400">
            <Icon icon="mdi:image" size={24} className="mb-1" />
            <span className="text-xs">加载中...</span>
          </div>
        </div>
      );
    }

    // 渲染错误状态
    if (imageState.hasError) {
      return (
        <div
          className={`flex items-center justify-center bg-gray-100 ${className}`}
          {...props}
        >
          <div className="flex flex-col items-center justify-center text-gray-400">
            <Icon icon="mdi:image-broken" size={24} className="mb-1" />
            <span className="text-xs">{fallbackText}</span>
          </div>
        </div>
      );
    }

    // 渲染正常图片
    return (
      <img
        ref={ref}
        src={imageState.processedSrc}
        alt={alt}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    );
  }
);

AppImage.displayName = "AppImage";

export default AppImage;
