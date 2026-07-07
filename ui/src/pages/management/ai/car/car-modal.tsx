import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Slider } from "@/ui/slider";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/icon";
import { useTranslation } from "react-i18next";

interface CarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface CarFormData {
  modelType: string;
  confidence: number;
  nmsThreshold: number;
}

export function CarModal({ open, onOpenChange, onSuccess }: CarModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useForm<CarFormData>({
    defaultValues: {
      modelType: "yolov8n",
      confidence: 0.5,
      nmsThreshold: 0.4,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        modelType: "yolov8n",
        confidence: 0.5,
        nmsThreshold: 0.4,
      });
    }
  }, [open]);

  const handleSubmit = async (data: CarFormData) => {
    try {
      setLoading(true);
      
      // 这里可以调用配置保存API，目前只是模拟
      console.log("保存配置:", data);
      
      toast.success(t('ai.car.configSaveSuccess'));
      onSuccess();
    } catch (error) {
      console.error("Failed to save config:", error);
      toast.error(t('ai.car.configSaveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('ai.car.configPlateDetection')}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="modelType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('ai.car.detectionModel')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('ai.car.selectDetectionModel')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="yolov8n">YOLOv8n (轻量级)</SelectItem>
                      <SelectItem value="yolov8s">YOLOv8s (小型)</SelectItem>
                      <SelectItem value="yolov8m">YOLOv8m (中型)</SelectItem>
                      <SelectItem value="yolov8l">YOLOv8l (大型)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confidence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('ai.car.confidenceThreshold')}</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={0}
                        max={1}
                        step={0.1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>0</span>
                        <span className="font-medium">{(field.value * 100).toFixed(0)}%</span>
                        <span>1</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nmsThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('ai.car.nmsThreshold')}</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={0}
                        max={1}
                        step={0.1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>0</span>
                        <span className="font-medium">{(field.value * 100).toFixed(0)}%</span>
                        <span>1</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                {t('ai.car.cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Icon icon="mdi:loading" className="animate-spin mr-2" size={18} />
                    {t('ai.car.saving')}
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:content-save" size={18} className="mr-2" />
                    {t('ai.car.saveConfig')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
