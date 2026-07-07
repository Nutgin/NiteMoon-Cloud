import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  type AigcTool,
  createToolApi,
  updateToolApi,
  getToolByIdApi,
} from "@/api/services/llmToolService";

interface ToolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTool: AigcTool | null;
  onSuccess: () => void;
}

interface ToolFormData {
  id?: string;
  name: string;
  description: string;
  toolType: string;
  endpointUrl: string;
  httpMethod: string;
  headers: string;
  parametersSchema: string;
}

const TOOL_TYPE_OPTIONS = [
  { label: "HTTP", value: "HTTP" },
];

const HTTP_METHOD_OPTIONS = [
  { label: "POST", value: "POST" },
  { label: "GET", value: "GET" },
  { label: "PUT", value: "PUT" },
  { label: "DELETE", value: "DELETE" },
];

export default function ToolModal({
  open,
  onOpenChange,
  editingTool,
  onSuccess,
}: ToolModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useForm<ToolFormData>({
    defaultValues: {
      name: "",
      description: "",
      toolType: "HTTP",
      endpointUrl: "",
      httpMethod: "POST",
      headers: "",
      parametersSchema: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (editingTool?.id) {
        loadToolDetail(editingTool.id);
      } else {
        form.reset({
          name: "",
          description: "",
          toolType: "HTTP",
          endpointUrl: "",
          httpMethod: "POST",
          headers: "",
          parametersSchema: "",
        });
      }
    }
  }, [open, editingTool]);

  const loadToolDetail = async (id: string) => {
    try {
      const tool = await getToolByIdApi(id);
      form.reset(tool);
    } catch (error) {
      console.error("Failed to load tool detail:", error);
      toast.error(t('llm.toolModal.loadDetailFailed'));
    }
  };

  const handleSubmit = async (data: ToolFormData) => {
    setLoading(true);
    try {
      if (data.id) {
        await updateToolApi(data as AigcTool);
        toast.success(t('llm.toolModal.updateSuccess'));
      } else {
        await createToolApi(data as AigcTool);
        toast.success(t('llm.toolModal.addSuccess'));
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save tool:", error);
      toast.error(data.id ? t('llm.toolModal.updateFailed') : t('llm.toolModal.addFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="carbon:tools" size={20} />
            {editingTool ? t('llm.toolModal.editTitle') : t('llm.toolModal.addTitle')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: t('llm.toolModal.nameRequired') }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('llm.toolModal.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('llm.toolModal.namePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toolType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('llm.toolModal.type')}</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('llm.toolModal.typePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {TOOL_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
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
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t('llm.toolModal.description')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('llm.toolModal.descPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endpointUrl"
                rules={{ required: t('llm.toolModal.endpointUrlRequired') }}
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t('llm.toolModal.endpointUrl')}</FormLabel>
                    <FormControl>
                      <Input placeholder="https://api.example.com/tool" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="httpMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('llm.toolModal.httpMethod')}</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('llm.toolModal.httpMethodPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {HTTP_METHOD_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
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
                name="headers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('llm.toolModal.headers')}</FormLabel>
                    <FormControl>
                      <Input placeholder='{"Authorization":"Bearer xxx"}' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parametersSchema"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>{t('llm.toolModal.parametersSchema')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='{"type":"object","properties":{"city":{"type":"string"}}}'
                        className="min-h-[80px] max-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                {t('llm.toolModal.cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Icon icon="mdi:loading" className="animate-spin mr-2" size={16} />
                    {editingTool ? t('llm.toolModal.updating') : t('llm.toolModal.adding')}
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:check" size={16} className="mr-2" />
                    {editingTool ? t('llm.toolModal.update') : t('llm.toolModal.add')}
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
