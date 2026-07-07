import apiClient from "../apiClient";

export interface CarPlateDetectionResult {
  imageBase64: string;
  plateNo: string;
  plateColor: string;
}

const AiCarApi = {
  Car: "/onnx/car-detection",
};

/**
 * 车牌识别
 * @param image 图片文件
 */
export function plateDetectionApi(image: File) {
  const formData = new FormData();
  formData.append('file', image);

  return apiClient.post<CarPlateDetectionResult>({
    url: AiCarApi.Car + "/plate-detection",
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
