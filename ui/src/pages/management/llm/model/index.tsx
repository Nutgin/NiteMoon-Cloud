import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  LLMModel,
  ModelTypeEnum,
  ProviderEnum,
  listModelsApi,
  deleteModelApi
} from "@/api/services/llmModelService";
import { LLM_PROVIDERS } from "./constants";
import ModelModal from "./model-modal";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";

const TYPE_TABS = [
  { value: ModelTypeEnum.CHAT, labelKey: "llm.model.chatModel", icon: "mdi:chat-outline" },
  { value: ModelTypeEnum.EMBEDDING, labelKey: "llm.model.embeddingModel", icon: "mdi:database-outline" },
  { value: ModelTypeEnum.IMAGE, labelKey: "llm.model.multimodalModel", icon: "mdi:image-outline" },
];

export default function ModelPage() {
  const { t } = useTranslation();
  const [activeType, setActiveType] = useState<ModelTypeEnum>(ModelTypeEnum.CHAT);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<LLMModel | null>(null);
  const [defaultProvider, setDefaultProvider] = useState<string>(ProviderEnum.OPENAI);
  const [defaultType, setDefaultType] = useState<ModelTypeEnum>(ModelTypeEnum.CHAT);
  const [deleteTarget, setDeleteTarget] = useState<LLMModel | null>(null);

  const [loading, setLoading] = useState(false);
  const [allModels, setAllModels] = useState<LLMModel[]>([]);
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());

  const loadAllModels = async () => {
    setLoading(true);
    try {
      const response = await listModelsApi({ type: activeType });
      setAllModels(response || []);
    } catch (error) {
      console.error("Failed to load models:", error);
      toast.error(t('llm.model.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllModels();
  }, [activeType]);

  const getFilteredProviders = () => {
    if (activeType === ModelTypeEnum.EMBEDDING) {
      const embeddingProviders = [ProviderEnum.OPENAI, ProviderEnum.Q_FAN, ProviderEnum.Q_WEN, ProviderEnum.ZHIPU, ProviderEnum.DOUYIN, ProviderEnum.OLLAMA];
      return LLM_PROVIDERS.filter(p => embeddingProviders.includes(p.model));
    } else if (activeType === ModelTypeEnum.IMAGE) {
      const imageProviders = [ProviderEnum.OPENAI, ProviderEnum.AZURE_OPENAI, ProviderEnum.ZHIPU, ProviderEnum.MIMO];
      return LLM_PROVIDERS.filter(p => imageProviders.includes(p.model));
    }
    return LLM_PROVIDERS;
  };

  const getProviderModels = (provider: string) => {
    return allModels.filter(m => m.provider === provider);
  };

  const handleAdd = (provider: string) => {
    setDefaultProvider(provider);
    setDefaultType(activeType);
    setEditingModel(null);
    setModalOpen(true);
  };

  const handleEdit = (model: LLMModel) => {
    setEditingModel(model);
    setDefaultProvider(model.provider);
    setDefaultType(model.type);
    setModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteModelApi(deleteTarget.id!).then(() => {
      toast.success(t('llm.model.deleteSuccess'));
      setDeleteTarget(null);
      loadAllModels();
    }).catch(() => {
      toast.error(t('llm.model.deleteFailed'));
    });
  };

  const toggleExpand = (provider: string) => {
    setExpandedProviders(prev => {
      const next = new Set(prev);
      if (next.has(provider)) {
        next.delete(provider);
      } else {
        next.add(provider);
      }
      return next;
    });
  };

  const handleSuccess = () => {
    loadAllModels();
  };

  const providers = getFilteredProviders();

  return (
    <>
      <PageHeader
        title={t('llm.model.title')}
        description={t('llm.model.description')}
      />

      {/* Type switcher */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-6">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
              activeType === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveType(tab.value)}
          >
            <Icon icon={tab.icon} size={16} />
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Provider cards grid */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {providers.map((provider) => {
            const models = getProviderModels(provider.model);
            const isExpanded = expandedProviders.has(provider.model);

            return (
              <div key={provider.model} className="space-y-0">
                {/* Provider card */}
                <div
                  className={`group border rounded-xl p-5 cursor-pointer transition-all hover:shadow-sm ${
                    isExpanded
                      ? "border-primary/20 shadow-sm rounded-b-none border-b-0 bg-muted/30"
                      : "hover:border-primary/15 hover:bg-muted/20"
                  }`}
                  onClick={() => toggleExpand(provider.model)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{provider.name}</h3>
                        {models.length > 0 && (
                          <Badge variant="default" className="text-xs font-normal">
                            {models.length}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {models.length === 0 ? t('llm.model.notConfigured') : t('llm.model.configuredCount', { count: models.length })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdd(provider.model);
                        }}
                        title={t('llm.model.add')}
                      >
                        <Icon icon="mdi:plus" size={16} />
                      </Button>
                      <Icon
                        icon="mdi:chevron-down"
                        size={18}
                        className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded model list */}
                {isExpanded && (
                  <div className="border border-t-0 rounded-b-xl overflow-hidden bg-muted/10">
                    {models.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-sm text-muted-foreground mb-3">{t('llm.model.notConfigured')}</p>
                        <Button variant="outline" size="sm" onClick={() => handleAdd(provider.model)}>
                          <Icon icon="mdi:plus" size={14} className="mr-1" />
                          {t('llm.model.add')}
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {models.map((model) => (
                          <div
                            key={model.id}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors group/row"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">{model.name}</span>
                                {model.apiKey && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground">
                                    {t('llm.model.keyConfigured')}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground font-mono">{model.model}</span>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleEdit(model)}
                                title={t('llm.model.edit')}
                              >
                                <Icon icon="solar:pen-bold-duotone" size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => setDeleteTarget(model)}
                                title={t('llm.model.delete')}
                              >
                                <Icon icon="mingcute:delete-2-fill" size={14} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && allModels.length === 0 && (
        <div className="text-center py-16 mt-4">
          <Icon icon="mdi:robot" size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-medium text-foreground mb-1">{t('llm.model.noModels', { type: t(TYPE_TABS.find(tab => tab.value === activeType)?.labelKey || '') })}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t('llm.model.addFirstModel')}</p>
        </div>
      )}

      <ModelModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingModel={editingModel}
        defaultProvider={defaultProvider}
        defaultType={defaultType}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
        resourceName={deleteTarget?.name || ""}
        resourceType={t('llm.model.deleteConfirm')}
      />
    </>
  );
}
