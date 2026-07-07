import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { detectionApi, type Detection, type PictureDetectionResponse } from "@/api/services/aiPictureService";

export default function PicturePage() {
  const { t } = useTranslation();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [detectionResults, setDetectionResults] = useState<Detection[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [imageInfo, setImageInfo] = useState({
    width: 0,
    height: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerWidth = 500;
  const containerHeight = 400;

  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // 显示原始图片
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string);
        // 清空之前的结果
        setResultImage(null);
        setDetectionResults([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartDetection = async () => {
    if (!selectedFile) {
      toast.error(t('ai.picture.selectImage'));
      return;
    }

    try {
      setDetecting(true);

      // 调用后端识别接口
      const response = await detectionApi(selectedFile);

      // 处理识别结果，将base64图片数据转换为图片显示
      const base64Image = response.image;
      setResultImage(`data:image/jpeg;base64,${base64Image}`);

      // 保存检测结果
      setDetectionResults(response.detections || []);

      // 保存图像信息
      setImageInfo({
        width: response.imageWidth || 0,
        height: response.imageHeight || 0,
      });

      toast.success(t('ai.picture.startDetection'));
    } catch (error) {
      console.error("图片识别失败:", error);
      toast.error(`${t('ai.picture.startDetection')}: ${(error as Error).message}`);
    } finally {
      setDetecting(false);
    }
  };

  const handleShowFullscreen = () => {
    if (resultImage) {
      setShowFullscreen(true);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setResultImage(null);
    setDetectionResults([]);
    setSelectedFile(null);
    setImageInfo({ width: 0, height: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 定义表格列
  const columns: ColumnsType<Detection> = [
    {
      title: "#",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: t('ai.picture.label'),
      dataIndex: "label",
      width: 120,
      render: (label: string) => (
        <Badge variant="secondary" className="font-medium">
          {label}
        </Badge>
      ),
    },
    {
      title: t('ai.picture.classId'),
      dataIndex: "clsId",
      width: 80,
      align: "center",
    },
    {
      title: t('ai.picture.confidence'),
      dataIndex: "confidence",
      width: 100,
      align: "center",
      render: (confidence: number) => (
        <div className="text-right">
          <div className="font-medium">{(confidence * 100).toFixed(2)}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      title: t('ai.picture.bbox'),
      dataIndex: "bbox",
      width: 200,
      render: (bbox: number[]) => (
        <div className="text-sm font-mono">
          [{bbox?.[0]?.toFixed(0) || 0}, {bbox?.[1]?.toFixed(0) || 0}, {bbox?.[2]?.toFixed(0) || 0}, {bbox?.[3]?.toFixed(0) || 0}]
        </div>
      ),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>{t('ai.picture.title')}</div>
            {detectionResults.length > 0 && (
              <Badge variant="default" className="text-sm">
                {t('ai.picture.objectsCount', { count: detectionResults.length })}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* 上方图片显示区域 */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 原始图片 */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h3 className="font-medium">{t('ai.picture.originalImage')}</h3>
                  {selectedFile && (
                    <div className="text-sm text-gray-600">
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
                <div
                  className="flex items-center justify-center bg-gray-100"
                  style={{ height: `${containerHeight}px` }}
                >
                  {originalImage ? (
                    <img
                      src={originalImage}
                      alt="原始图片"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-gray-500">
                      <Icon icon="mdi:image" size={48} className="mx-auto mb-2" />
                      <p>{t('ai.picture.selectImage')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 识别结果 */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h3 className="font-medium">{t('ai.picture.recognitionResult')}</h3>
                  {imageInfo.width > 0 && (
                    <div className="text-sm text-gray-600">
                      {t('ai.picture.imageSize', { width: imageInfo.width, height: imageInfo.height })}
                    </div>
                  )}
                </div>
                <div
                  className="flex items-center justify-center bg-gray-100 relative"
                  style={{ height: `${containerHeight}px` }}
                >
                  {resultImage ? (
                    <>
                      <img
                        src={resultImage}
                        alt="识别结果"
                        className="max-w-full max-h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={handleShowFullscreen}
                      />
                      {detectionResults.length > 0 && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                          <Badge variant="default" className="text-sm">
                            {t('ai.picture.objectsCount', { count: detectionResults.length })}
                          </Badge>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-gray-500">
                      <Icon icon="mdi:image" size={48} className="mx-auto mb-2" />
                      <p>{t('ai.picture.resultPlaceholder')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-center space-x-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              onClick={handleSelectImage}
              variant="outline"
            >
              <Icon icon="mdi:upload" size={18} className="mr-2" />
              {t('ai.picture.selectImage')}
            </Button>
            <Button
              onClick={handleStartDetection}
              disabled={!originalImage || detecting}
            >
              <Icon icon="mdi:search" size={18} className="mr-2" />
              {detecting ? t('ai.picture.detecting') : t('ai.picture.startDetection')}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
            >
              <Icon icon="mdi:refresh" size={18} className="mr-2" />
              {t('ai.picture.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 识别结果表格 */}
      {detectionResults.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div>{t('ai.picture.resultDetails')}</div>
                <Badge variant="default">
                  {t('ai.picture.objectsCount', { count: detectionResults.length })}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 统计信息 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{detectionResults.length}</div>
                <div className="text-sm text-gray-600">{t('ai.picture.detectedObjects')}</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {detectionResults.filter(d => d.confidence > 0.8).length}
                </div>
                <div className="text-sm text-gray-600">{t('ai.picture.highConfidence')} (&gt;80%)</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {detectionResults.filter(d => d.confidence > 0.5 && d.confidence <= 0.8).length}
                </div>
                <div className="text-sm text-gray-600">{t('ai.picture.mediumConfidence')} (50-80%)</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {detectionResults.filter(d => d.confidence <= 0.5).length}
                </div>
                <div className="text-sm text-gray-600">{t('ai.picture.lowConfidence')} (&le;50%)</div>
              </div>
            </div>

            {/* 详细数据表格 */}
            <div className="border rounded-lg overflow-hidden">
              <Table
                rowKey={(record, index) => `${record.clsId}-${index}`}
                size="small"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => t('pagination', { start: range[0], end: range[1], total }),
                }}
                scroll={{ x: 'max-content' }}
                columns={columns}
                dataSource={detectionResults}
                locale={{
                  emptyText: t('ai.picture.noResults')
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 识别详情弹窗 */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('ai.picture.resultDetails')}
              {detectionResults.length > 0 && (
                <Badge variant="default" className="ml-2">
                  {t('ai.picture.objectsCount', { count: detectionResults.length })}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* 统计信息 */}
            {detectionResults.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{detectionResults.length}</div>
                  <div className="text-sm text-gray-600">{t('ai.picture.detectedObjects')}</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {detectionResults.filter(d => d.confidence > 0.8).length}
                  </div>
                  <div className="text-sm text-gray-600">{t('ai.picture.highConfidence')} (&gt;80%)</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {detectionResults.filter(d => d.confidence > 0.5 && d.confidence <= 0.8).length}
                  </div>
                  <div className="text-sm text-gray-600">{t('ai.picture.mediumConfidence')} (50-80%)</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {detectionResults.filter(d => d.confidence <= 0.5).length}
                  </div>
                  <div className="text-sm text-gray-600">{t('ai.picture.lowConfidence')} (&le;50%)</div>
                </div>
              </div>
            )}

            {/* 详细数据表格 */}
            <div className="border rounded-lg overflow-hidden">
              <Table
                rowKey={(record, index) => `${record.clsId}-${index}`}
                size="small"
                pagination={false}
                scroll={{ y: 400, x: 'max-content' }}
                columns={columns}
                dataSource={detectionResults}
                locale={{
                  emptyText: t('ai.picture.noResults')
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 全屏图片查看器 */}
      {showFullscreen && resultImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 cursor-pointer"
          onClick={() => setShowFullscreen(false)}
        >
          <img
            src={resultImage}
            alt="识别结果"
            className="max-w-full max-h-full object-contain"
          />
          <Button
            className="absolute top-4 right-4"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setShowFullscreen(false);
            }}
          >
            <Icon icon="mdi:close" size={18} />
          </Button>
        </div>
      )}
    </>
  );
}
