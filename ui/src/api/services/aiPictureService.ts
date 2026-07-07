import apiClient from "../apiClient";

export interface Detection {
  label: string;
  clsId: number;
  bbox: number[];
  confidence: number;
}

export interface PictureDetectionResponse {
  image: string; // base64 encoded image
  detections: Detection[];
  imageWidth: number;
  imageHeight: number;
}

const AiPictureApi = {
  Picture: "/onnx/pic-detection",
};

/**
 * 图片目标检测
 * @param image 图片文件
 */
export function detectionApi(image: File) {
  const formData = new FormData();
  formData.append('image', image);

  return apiClient.post<PictureDetectionResponse>({
    url: AiPictureApi.Picture + "/detection",
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
