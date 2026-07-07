import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { plateDetectionApi, type CarPlateDetectionResult } from "@/api/services/aiCarService";
import { CarModal } from "./car-modal";

export default function CarPage() {
  const { t } = useTranslation();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [plateNo, setPlateNo] = useState<string>('');
  const [plateColor, setPlateColor] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerWidth = 600;
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
        setCurrentImage(e.target?.result as string);
        // 清空之前的结果
        setResultImage(null);
        setPlateNo('');
        setPlateColor('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setResultImage(null);
    setCurrentImage(null);
    setPlateNo('');
    setPlateColor('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartDetection = async () => {
    if (!selectedFile) {
      toast.error(t('ai.car.selectImage'));
      return;
    }

    try {
      setDetecting(true);

      // 调用后端识别接口
      const response = await plateDetectionApi(selectedFile);

      // 处理识别结果，将base64图片数据转换为图片显示
      const base64Image = response.imageBase64;
      setResultImage(`data:image/jpeg;base64,${base64Image}`);
      setCurrentImage(`data:image/jpeg;base64,${base64Image}`);

      // 保存车牌信息
      setPlateNo(response.plateNo || '');
      setPlateColor(response.plateColor || '');

      toast.success(t('ai.car.startDetection'));
    } catch (error) {
      console.error("车牌识别失败:", error);
      toast.error(`${t('ai.car.startDetection')}: ${(error as Error).message}`);
    } finally {
      setDetecting(false);
    }
  };

  const handleShowFullscreen = () => {
    if (resultImage) {
      setShowFullscreen(true);
    }
  };

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>{t('ai.car.title')}</div>
            <Button onClick={handleOpenModal}>
              <Icon icon="mdi:cog" size={18} className="mr-2" />
              {t('ai.car.configDetection')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 上方内容区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* 图片显示区域 */}
            <div className="lg:col-span-2">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h3 className="font-medium">{t('ai.car.imageDisplay')}</h3>
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
                  {currentImage ? (
                    <img
                      src={currentImage}
                      alt="图片显示"
                      className="max-w-full max-h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={resultImage ? handleShowFullscreen : undefined}
                      style={{ cursor: resultImage ? 'pointer' : 'default' }}
                    />
                  ) : (
                    <div className="text-center text-gray-500">
                      <Icon icon="mdi:image" size={48} className="mx-auto mb-2" />
                      <p>{t('ai.car.selectImageOrViewResult')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 识别结果区域 */}
            <div className="lg:col-span-1">
              <div className="border rounded-lg overflow-hidden h-full">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h3 className="font-medium">{t('ai.car.recognitionResult')}</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">{t('ai.car.plateColor')}</div>
                    <div className="p-3 bg-white border rounded-md min-h-[48px] flex items-center">
                      <span className="text-lg font-medium">
                        {plateColor || t('ai.car.noData')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">{t('ai.car.plateNumber')}</div>
                    <div className="p-3 bg-white border rounded-md min-h-[48px] flex items-center">
                      <span className="text-lg font-mono font-bold text-blue-600">
                        {plateNo || t('ai.car.noData')}
                      </span>
                    </div>
                  </div>
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
              {t('ai.car.selectImage')}
            </Button>
            <Button
              onClick={handleStartDetection}
              disabled={!originalImage || detecting}
            >
              <Icon icon="mdi:search" size={18} className="mr-2" />
              {detecting ? t('ai.car.detecting') : t('ai.car.startDetection')}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
            >
              <Icon icon="mdi:refresh" size={18} className="mr-2" />
              {t('ai.car.reset')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 识别详情弹窗 */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('ai.car.recognitionDetails')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">{t('ai.car.plateNumber')}</div>
              <div className="p-3 bg-gray-50 rounded-md">
                <span className="text-lg font-mono font-bold text-blue-600">
                  {plateNo || t('ai.car.noData')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">{t('ai.car.plateColor')}</div>
              <div className="p-3 bg-gray-50 rounded-md">
                <span className="text-lg font-medium">
                  {plateColor || t('ai.car.noData')}
                </span>
              </div>
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

      {/* 配置弹窗 */}
      <CarModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}
