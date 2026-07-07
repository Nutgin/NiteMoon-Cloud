import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  LLMModel, 
  ModelTypeEnum, 
  ProviderEnum,
  addModelApi,
  updateModelApi,
  testModelApi
} from "@/api/services/llmModelService";
import { LLM_PROVIDERS } from "./constants";

interface ModelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingModel?: LLMModel | null;
  defaultProvider?: string;
  defaultType?: ModelTypeEnum;
  onSuccess?: () => void;
}

interface ModelFormData {
  name: string;
  model: string;
  provider: string;
  type: ModelTypeEnum;
  apiKey?: string;
  baseUrl?: string;
  // Chat 模型字段
  responseLimit?: number;
  temperature?: number;
  topP?: number;
  // Embedding 模型字段
  dimension?: number; // 向量维度
  // Image 模型字段
  imageSize?: string; // 图片大小
  imageQuality?: string; // 图片质量
  imageStyle?: string; // 图片风格
  // MIMO 多模态字段
  fps?: number; // 视频抽帧率
  mediaResolution?: string; // 媒体分辨率档次
  // Provider 专用字段
  endpoint?: string; // Azure OpenAI 专用
  azureDeploymentName?: string; // Azure OpenAI 专用
  geminiLocation?: string; // Gemini 专用
  geminiProject?: string; // Gemini 专用
}

export default function ModelModal({ open, onOpenChange, editingModel, defaultProvider, defaultType, onSuccess }: ModelModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const form = useForm<ModelFormData>({
    defaultValues: {
      name: "",
      model: "",
      provider: ProviderEnum.OPENAI,
      type: ModelTypeEnum.CHAT,
      apiKey: "",
      baseUrl: "",
      responseLimit: 2000,
      temperature: 0.2,
      topP: 0.8,
      dimension: 1536, // 默认向量维度
      imageSize: "1024x1024", // 默认图片大小
      imageQuality: "standard", // 默认图片质量
      imageStyle: "vivid", // 默认图片风格
      fps: 2.0, // MIMO 默认抽帧率
      mediaResolution: "default", // MIMO 默认媒体分辨率
      endpoint: "", // Azure OpenAI endpoint
      azureDeploymentName: "", // Azure OpenAI deployment name
      geminiLocation: "", // Gemini location
      geminiProject: "", // Gemini project
    },
  });

  const isEdit = !!editingModel;

  // 根据供应商获取默认 baseUrl
  const getDefaultBaseUrl = (provider: string, type?: ModelTypeEnum): string => {
    switch (provider) {
      case ProviderEnum.DEEPSEEK:
        return "https://api.deepseek.com/v1";
      case ProviderEnum.MIMO:
        return "https://api.xiaomimimo.com/v1";
      case ProviderEnum.Q_FAN:
        return "https://qianfan.baidubce.com/v2";
      case ProviderEnum.DOUYIN:
        return type === ModelTypeEnum.EMBEDDING ? "https://ark.cn-beijing.volces.com/api/v3" : "";
      default:
        return "";
    }
  };

  useEffect(() => {
    if (open) {
      if (editingModel) {
        form.reset({
          name: editingModel.name || "",
          model: editingModel.model || "",
          provider: editingModel.provider || ProviderEnum.OPENAI,
          type: editingModel.type || ModelTypeEnum.CHAT,
          apiKey: editingModel.apiKey || "",
          baseUrl: editingModel.baseUrl || getDefaultBaseUrl(editingModel.provider || ProviderEnum.OPENAI, editingModel.type),
          responseLimit: editingModel.responseLimit || 2000,
          temperature: editingModel.temperature || 0.2,
          topP: editingModel.topP || 0.8,
          dimension: editingModel.dimension || undefined,
          imageSize: editingModel.imageSize || "1024x1024",
          imageQuality: editingModel.imageQuality || "standard",
          imageStyle: editingModel.imageStyle || "vivid",
          fps: editingModel.fps || 2.0,
          mediaResolution: editingModel.mediaResolution || "default",
          endpoint: editingModel.endpoint || "",
          azureDeploymentName: editingModel.azureDeploymentName || "",
          geminiLocation: editingModel.geminiLocation || "",
          geminiProject: editingModel.geminiProject || "",
        });
      } else {
        const provider = defaultProvider || ProviderEnum.OPENAI;
        form.reset({
          name: "",
          model: "",
          provider,
          type: defaultType || ModelTypeEnum.CHAT,
          apiKey: "",
          baseUrl: getDefaultBaseUrl(provider, defaultType),
          responseLimit: 2000,
          temperature: 0.2,
          topP: 0.8,
          dimension: undefined,
          imageSize: "1024x1024",
          imageQuality: "standard",
          imageStyle: "vivid",
          fps: 2.0,
          mediaResolution: "default",
          endpoint: "",
          azureDeploymentName: "",
          geminiLocation: "",
          geminiProject: "",
        });
      }
    }
  }, [open, editingModel, form, defaultProvider, defaultType]);

  useEffect(() => {
    const selectedProvider = form.watch("provider");
    const selectedType = form.watch("type");
    const provider = LLM_PROVIDERS.find(p => p.model === selectedProvider);

    if (provider) {
      // 根据模型类型选择对应的模型列表
      let rawModels: (string | { label: string; value: string })[] = [];
      if (selectedType === ModelTypeEnum.EMBEDDING) {
        rawModels = provider.embeddingModels || [];
      } else if (selectedType === ModelTypeEnum.IMAGE) {
        rawModels = provider.imageModels || [];
      } else {
        rawModels = provider.chatModels || [];
      }

      const modelValues = rawModels.map(m =>
        typeof m === 'string' ? m : m.value
      );
      setAvailableModels(modelValues);

      // 仅在新建模式下自动填充默认 baseUrl，编辑模式下保留后端返回的值
      if (!isEdit) {
        const defaultUrl = getDefaultBaseUrl(selectedProvider, selectedType);
        if (defaultUrl) {
          form.setValue("baseUrl", defaultUrl);
        }
      }
    } else {
      setAvailableModels([]);
    }
  }, [form.watch("provider"), form.watch("type")]);

  // 获取当前选中的供应商和类型
  const selectedProvider = form.watch("provider");
  const selectedType = form.watch("type");
  const isGemini = selectedProvider === ProviderEnum.GEMINI;
  const isEmbeddingModel = selectedType === ModelTypeEnum.EMBEDDING;
  const isImageModel = selectedType === ModelTypeEnum.IMAGE;
  const isOpenAI = selectedProvider === ProviderEnum.OPENAI;
  const isAzureOpenAI = selectedProvider === ProviderEnum.AZURE_OPENAI;
  const isMimo = selectedProvider === ProviderEnum.MIMO;

  const handleTest = async () => {
    try {
      setTesting(true);
      const formData = form.getValues();
      const testData: LLMModel = {
        ...formData,
        id: editingModel?.id,
      };
      
      await testModelApi(testData.id || '');
      toast.success(t('llm.modelModal.testSuccess'));
    } catch (error) {
      console.error("Failed to test model:", error);
      toast.error(t('llm.modelModal.testFailed'));
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (data: ModelFormData) => {
    try {
      setLoading(true);
      const modelData: LLMModel = {
        ...data,
        id: isEdit ? editingModel?.id : undefined,
      };

      if (isEdit) {
        await updateModelApi(modelData);
        toast.success(t('llm.modelModal.updateSuccess'));
      } else {
        await addModelApi(modelData);
        toast.success(t('llm.modelModal.addSuccess'));
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save model:", error);
      toast.error(isEdit ? t('llm.modelModal.updateFailed') : t('llm.modelModal.addFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('llm.modelModal.editTitle') : t('llm.modelModal.addTitle')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            {/* Basic info */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: t('llm.modelModal.nameRequired') }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('llm.modelModal.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('llm.modelModal.namePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                rules={{ required: t('llm.modelModal.modelIdRequired') }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('llm.modelModal.modelId')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('llm.modelModal.modelIdPlaceholder')} {...field} />
                    </FormControl>
                    {availableModels.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {availableModels.map((m) => (
                          <button
                            key={m}
                            type="button"
                            className={`px-2.5 py-1 text-xs rounded-md border transition-colors font-mono ${
                              field.value === m
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                            }`}
                            onClick={() => form.setValue("model", m)}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Credentials */}
            <div className="border-t pt-5 space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">{t('llm.modelModal.connectionConfig')}</h4>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="apiKey"
                  rules={{ required: t('llm.modelModal.apiKeyRequired') }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('llm.modelModal.apiKey')}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder={t('llm.modelModal.apiKeyPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="baseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('llm.modelModal.baseUrl')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('llm.modelModal.baseUrlPlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Provider-specific fields */}
            {isGemini && (
              <div className="border-t pt-5 space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">{t('llm.modelModal.geminiConfig')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="geminiLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. us-central1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="geminiProject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project ID</FormLabel>
                        <FormControl>
                          <Input placeholder={t('llm.modelModal.geminiProjectPlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {isAzureOpenAI && (
              <div className="border-t pt-5 space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">{t('llm.modelModal.azureConfig')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="endpoint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endpoint</FormLabel>
                        <FormControl>
                          <Input placeholder="https://xxx.openai.azure.com/" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="azureDeploymentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deployment Name</FormLabel>
                        <FormControl>
                          <Input placeholder={t('llm.modelModal.deploymentNamePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Chat model params */}
            {!isEmbeddingModel && !isImageModel && (
              <div className="border-t pt-5 space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">{t('llm.modelModal.generationParams')}</h4>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="responseLimit"
                    rules={{ required: t('llm.modelModal.responseLimitRequired') }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('llm.modelModal.responseLimit')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="2000"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperature</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="0.2"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="topP"
                    rules={{ required: t('llm.modelModal.topPRequired') }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('llm.modelModal.topP')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="0.8"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Embedding model params */}
            {isEmbeddingModel && (
              <div className="border-t pt-5 space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">{t('llm.modelModal.embeddingParams')}</h4>
                <FormField
                  control={form.control}
                  name="dimension"
                  rules={{ required: t('llm.modelModal.dimensionRequired') }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('llm.modelModal.dimension')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1536"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Image model params */}
            {isImageModel && (isOpenAI || isAzureOpenAI) && (
              <div className="border-t pt-5 space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">{t('llm.modelModal.multimodalParams')}</h4>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="imageSize"
                    rules={{ required: t('llm.modelModal.imageSizeRequired') }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('llm.modelModal.imageSize')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('llm.modelModal.imageSizePlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1024x1024">1024x1024</SelectItem>
                            <SelectItem value="1024x1792">1024x1792</SelectItem>
                            <SelectItem value="1792x1024">1792x1024</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imageQuality"
                    rules={{ required: t('llm.modelModal.imageQualityRequired') }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('llm.modelModal.imageQuality')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('llm.modelModal.imageQualityPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="hd">HD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imageStyle"
                    rules={{ required: t('llm.modelModal.imageStyleRequired') }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('llm.modelModal.imageStyle')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('llm.modelModal.imageStylePlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vivid">Vivid</SelectItem>
                            <SelectItem value="natural">Natural</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* MIMO multimodal params */}
            {isMimo && isImageModel && (
              <div className="border-t pt-5 space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">MIMO 视频理解参数</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fps"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>抽帧率 (FPS)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="10"
                            placeholder="2"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          每秒抽帧数，范围 0.1-10，默认 2。越高越精细，Token 消耗越多
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mediaResolution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>媒体分辨率</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择分辨率档次" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="default">默认 (平衡效果与效率)</SelectItem>
                            <SelectItem value="max">最高 (提升细节识别)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          视频帧的解析分辨率档次
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              {isEdit && (
                <Button type="button" variant="outline" onClick={handleTest} disabled={testing}>
                  <Icon icon="mdi:connection" size={16} className="mr-1.5" />
                  {testing ? t('llm.modelModal.testing') : t('llm.modelModal.testConnection')}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('llm.modelModal.cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('llm.modelModal.saving') : (isEdit ? t('llm.modelModal.update') : t('llm.modelModal.add'))}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
