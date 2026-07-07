import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  EmbedStore,
  ProviderEnum,
  addEmbedStoreApi,
  updateEmbedStoreApi,
  getEmbedStoreApi
} from "@/api/services/llmEmbedStoreService";
import { EMBED_STORE_PROVIDERS, DIMENSION_OPTIONS, getProviderLabel } from "./constants";

interface EmbedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingStore: EmbedStore | null;
  defaultProvider: ProviderEnum;
  onSuccess: () => void;
}

interface EmbedFormData {
  id?: string;
  name: string;
  provider: ProviderEnum;
  host: string;
  port: number;
  username?: string;
  password?: string;
  databaseName?: string;
  tableName?: string;
  dimension: number;
}

export default function EmbedModal({
  open,
  onOpenChange,
  editingStore,
  defaultProvider,
  onSuccess
}: EmbedModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<ProviderEnum>(defaultProvider);

  const form = useForm<EmbedFormData>({
    defaultValues: {
      name: "",
      provider: defaultProvider,
      host: "",
      port: 6379,
      username: "",
      password: "",
      databaseName: "",
      tableName: "",
      dimension: 1024,
    },
  });

  useEffect(() => {
    if (open) {
      setCurrentProvider(defaultProvider);
      if (editingStore) {
        form.reset(editingStore);
        setCurrentProvider(editingStore.provider);
      } else {
        form.reset({
          name: "",
          provider: defaultProvider,
          host: "",
          port: defaultProvider === ProviderEnum.REDIS ? 6379 : 
                defaultProvider === ProviderEnum.PGVECTOR ? 5432 : 19530,
          username: "",
          password: "",
          databaseName: "",
          tableName: "",
          dimension: 1024,
        });
      }
    }
  }, [open, editingStore, defaultProvider, form]);

  const loadStoreDetail = async (id: string) => {
    try {
      const store = await getEmbedStoreApi(id);
      form.reset(store);
      setCurrentProvider(store.provider);
    } catch (error) {
      console.error("Failed to load embed store detail:", error);
      toast.error(t('llm.embeddingModal.loadDetailFailed'));
    }
  };

  useEffect(() => {
    if (editingStore?.id && open) {
      loadStoreDetail(editingStore.id);
    }
  }, [editingStore?.id, open]);

  const handleSubmit = async (data: EmbedFormData) => {
    setLoading(true);
    try {
      if (data.id) {
        await updateEmbedStoreApi(data);
        toast.success(t('llm.embeddingModal.updateSuccess'));
      } else {
        await addEmbedStoreApi(data);
        toast.success(t('llm.embeddingModal.addSuccess'));
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save embed store:", error);
      toast.error(data.id ? t('llm.embeddingModal.updateFailed') : t('llm.embeddingModal.addFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getFormFields = () => {
    const baseFields = (
      <>
        <FormField
          control={form.control}
          name="name"
          rules={{ required: t('llm.embeddingModal.aliasRequired') }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('llm.embeddingModal.alias')}</FormLabel>
              <FormControl>
                <Input placeholder={t('llm.embeddingModal.aliasPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('llm.embeddingModal.provider')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={(value) => {
                  field.onChange(value);
                  setCurrentProvider(value as ProviderEnum);
                  // 根据供应商设置默认端口
                  const port = value === ProviderEnum.REDIS ? 6379 : 
                              value === ProviderEnum.PGVECTOR ? 5432 : 19530;
                  form.setValue("port", port);
                }} disabled={true}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('llm.embeddingModal.providerPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {EMBED_STORE_PROVIDERS.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="host"
          rules={{ required: t('llm.embeddingModal.addressRequired') }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('llm.embeddingModal.address')}</FormLabel>
              <FormControl>
                <Input placeholder={t('llm.embeddingModal.addressPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="port"
          rules={{ required: t('llm.embeddingModal.portRequired') }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('llm.embeddingModal.port')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={t('llm.embeddingModal.portPlaceholder')}
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
          name="dimension"
          rules={{ required: t('llm.embeddingModal.dimensionRequired') }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('llm.embeddingModal.dimension')}</FormLabel>
              <FormControl>
                <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('llm.embeddingModal.dimensionPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {DIMENSION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </>
    );

    // 根据供应商显示不同的字段
    if (currentProvider === ProviderEnum.REDIS) {
      return (
        <>
          {baseFields}
          <FormField
            control={form.control}
            name="databaseName"
            rules={{ required: t('llm.embeddingModal.redisIndexRequired') }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('llm.embeddingModal.redisIndex')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('llm.embeddingModal.redisIndexPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('llm.embeddingModal.usernameOptional')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('llm.embeddingModal.usernamePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('llm.embeddingModal.passwordOptional')}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder={t('llm.embeddingModal.passwordPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      );
    }

    if (currentProvider === ProviderEnum.PGVECTOR) {
      return (
        <>
          {baseFields}
          <FormField
            control={form.control}
            name="username"
            rules={{ required: t('llm.embeddingModal.dbUsernameRequired') }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('llm.embeddingModal.dbUsername')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('llm.embeddingModal.dbUsernamePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            rules={{ required: t('llm.embeddingModal.dbPasswordRequired') }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('llm.embeddingModal.dbPassword')}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder={t('llm.embeddingModal.dbPasswordPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="databaseName"
            rules={{ required: t('llm.embeddingModal.databaseRequired') }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('llm.embeddingModal.database')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('llm.embeddingModal.databasePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tableName"
            rules={{ required: t('llm.embeddingModal.tableNameRequired') }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('llm.embeddingModal.tableName')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('llm.embeddingModal.tableNamePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      );
    }

    if (currentProvider === ProviderEnum.MILVUS) {
      return (
        <>
          {baseFields}
          <FormField
            control={form.control}
            name="databaseName"
            rules={{ required: t('llm.embeddingModal.databaseRequired') }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('llm.embeddingModal.database')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('llm.embeddingModal.databasePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tableName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('llm.embeddingModal.tableNameOptional')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('llm.embeddingModal.tableNamePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      );
    }

    return baseFields;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="ph:database" size={20} />
            {editingStore ? t('llm.embeddingModal.editTitle') : t('llm.embeddingModal.addTitle', { provider: getProviderLabel(currentProvider) })}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {getFormFields()}
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  {t('llm.embeddingModal.cancel')}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Icon icon="mdi:loading" className="animate-spin mr-2" size={16} />
                      {editingStore ? t('llm.embeddingModal.updating') : t('llm.embeddingModal.adding')}
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:check" size={16} className="mr-2" />
                      {editingStore ? t('llm.embeddingModal.update') : t('llm.embeddingModal.add')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
