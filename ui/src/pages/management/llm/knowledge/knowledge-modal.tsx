import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/ui/collapsible";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
	addKnowledgeApi,
	updateKnowledgeApi,
	getKnowledgeApi,
	type Knowledge
} from "@/api/services/llmKnowledgeService";
import {
	listModelsApi,
	type LLMModel,
	ModelTypeEnum
} from "@/api/services/llmModelService";
import {
	listEmbedStoreApi,
	type EmbedStore
} from "@/api/services/llmEmbedStoreService";

interface KnowledgeModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editingKnowledge?: Knowledge | null;
	onSuccess: () => void;
}

interface KnowledgeFormData {
	name: string;
	des: string;
	embedStoreId: string;
	embedModelId: string;
	chunkStrategy: string;
	chunkSize: number;
	chunkOverlap: number;
	chunkUnit: string;
	retrievalMode: string;
	retrievalTopK: number;
	retrievalThreshold: number;
}

export default function KnowledgeModal({
	open,
	onOpenChange,
	editingKnowledge,
	onSuccess
}: KnowledgeModalProps) {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [embedModelList, setEmbedModelList] = useState<LLMModel[]>([]);
	const [embedStoreList, setEmbedStoreList] = useState<EmbedStore[]>([]);
	const [chunkOpen, setChunkOpen] = useState(true);
	const [retrievalOpen, setRetrievalOpen] = useState(true);

	const CHUNK_STRATEGY_OPTIONS = [
		{ value: "RECURSIVE", label: t('llm.knowledgeModal.recursiveSplit'), desc: "按语义边界递归分割，适合通用文档" },
		{ value: "FIXED_SIZE", label: t('llm.knowledgeModal.fixedSize'), desc: "按固定长度分割，适合结构化数据" },
	];

	const CHUNK_UNIT_OPTIONS = [
		{ value: "TOKEN", label: "Token" },
		{ value: "CHAR", label: t('llm.knowledgeModal.character') },
	];

	const RETRIEVAL_MODE_OPTIONS = [
		{ value: "VECTOR", label: t('llm.knowledgeModal.vectorSearch'), desc: "纯语义相似度搜索" },
		{ value: "HYBRID", label: t('llm.knowledgeModal.hybridSearch'), desc: "向量 + 关键词双路召回" },
	];

	const CHUNK_PRESETS = [
		{ label: t('llm.knowledgeModal.generalDoc'), size: 512, overlap: 50 },
		{ label: t('llm.knowledgeModal.techDoc'), size: 1024, overlap: 100 },
		{ label: t('llm.knowledgeModal.faq'), size: 256, overlap: 30 },
	];

	const form = useForm<KnowledgeFormData>({
		defaultValues: {
			name: "",
			des: "",
			embedStoreId: "",
			embedModelId: "",
			chunkStrategy: "RECURSIVE",
			chunkSize: 512,
			chunkOverlap: 50,
			chunkUnit: "TOKEN",
			retrievalMode: "VECTOR",
			retrievalTopK: 5,
			retrievalThreshold: 0.7,
		},
	});

	const loadEmbedModels = async () => {
		try {
			const response = await listModelsApi({ type: ModelTypeEnum.EMBEDDING });
			setEmbedModelList(response || []);
		} catch (error) {
			console.error("Failed to load embed models:", error);
			toast.error(t('llm.knowledgeModal.loadModelFailed'));
		}
	};

	const loadEmbedStores = async () => {
		try {
			const response = await listEmbedStoreApi();
			setEmbedStoreList(response || []);
		} catch (error) {
			console.error("Failed to load embed stores:", error);
			toast.error(t('llm.knowledgeModal.loadDbFailed'));
		}
	};

	const parseRetrievalConfig = (configStr?: string) => {
		if (!configStr) return { mode: "VECTOR", topK: 5, threshold: 0.7 };
		try {
			const config = JSON.parse(configStr);
			return {
				mode: config.retrievalMode || "VECTOR",
				topK: config.topK || 5,
				threshold: config.similarityThreshold || 0.7,
			};
		} catch {
			return { mode: "VECTOR", topK: 5, threshold: 0.7 };
		}
	};

	const loadKnowledgeDetail = async (id: string) => {
		try {
			const response = await getKnowledgeApi(id);
			const retrievalConfig = parseRetrievalConfig(response.retrievalConfig);
			form.reset({
				name: response.name || "",
				des: response.des || "",
				embedStoreId: response.embedStoreId || "",
				embedModelId: response.embedModelId || "",
				chunkStrategy: response.chunkStrategy || "RECURSIVE",
				chunkSize: response.chunkSize || 512,
				chunkOverlap: response.chunkOverlap || 50,
				chunkUnit: response.chunkUnit || "TOKEN",
				retrievalMode: retrievalConfig.mode,
				retrievalTopK: retrievalConfig.topK,
				retrievalThreshold: retrievalConfig.threshold,
			});
		} catch (error) {
			console.error("Failed to load knowledge detail:", error);
			toast.error(t('llm.knowledgeModal.loadDetailFailed'));
		}
	};

	useEffect(() => {
		if (open) {
			loadEmbedModels();
			loadEmbedStores();
			if (editingKnowledge?.id) {
				loadKnowledgeDetail(editingKnowledge.id);
			} else {
				form.reset({
					name: "",
					des: "",
					embedStoreId: "",
					embedModelId: "",
					chunkStrategy: "RECURSIVE",
					chunkSize: 512,
					chunkOverlap: 50,
					chunkUnit: "TOKEN",
					retrievalMode: "VECTOR",
					retrievalTopK: 5,
					retrievalThreshold: 0.7,
				});
			}
		}
	}, [open, editingKnowledge]);

	const handleSubmit = async (data: KnowledgeFormData) => {
		try {
			setLoading(true);
			const retrievalConfig = JSON.stringify({
				retrievalMode: data.retrievalMode,
				topK: data.retrievalTopK,
				similarityThreshold: data.retrievalThreshold,
			});

			const knowledgeData: Knowledge = {
				name: data.name,
				des: data.des,
				embedStoreId: data.embedStoreId,
				embedModelId: data.embedModelId,
				chunkStrategy: data.chunkStrategy,
				chunkSize: data.chunkSize,
				chunkOverlap: data.chunkOverlap,
				chunkUnit: data.chunkUnit,
				retrievalConfig,
				id: editingKnowledge?.id,
			};

			if (editingKnowledge?.id) {
				await updateKnowledgeApi(knowledgeData);
				toast.success(t('llm.knowledgeModal.updateSuccess'));
			} else {
				await addKnowledgeApi(knowledgeData);
				toast.success(t('llm.knowledgeModal.addSuccess'));
			}

			onSuccess();
			onOpenChange(false);
		} catch (error) {
			console.error("Failed to save knowledge:", error);
			toast.error(editingKnowledge?.id ? t('llm.knowledgeModal.updateFailed') : t('llm.knowledgeModal.addFailed'));
		} finally {
			setLoading(false);
		}
	};

	const applyPreset = (preset: { size: number; overlap: number }) => {
		form.setValue("chunkSize", preset.size);
		form.setValue("chunkOverlap", preset.overlap);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{editingKnowledge?.id ? t('llm.knowledgeModal.editTitle') : t('llm.knowledgeModal.addTitle')}
					</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
						{/* 基本信息 */}
						<FormField
							control={form.control}
							name="name"
							rules={{ required: t('llm.knowledgeModal.namePlaceholder') }}
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('llm.knowledgeModal.name')}</FormLabel>
									<FormControl>
										<Input placeholder={t('llm.knowledgeModal.namePlaceholder')} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="des"
							rules={{ required: t('llm.knowledgeModal.descPlaceholder') }}
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('llm.knowledgeModal.description')}</FormLabel>
									<FormControl>
										<Input placeholder={t('llm.knowledgeModal.descPlaceholder')} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="embedStoreId"
								rules={{ required: t('llm.knowledgeModal.vectorDbPlaceholder') }}
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('llm.knowledgeModal.vectorDb')}</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={t('llm.knowledgeModal.vectorDbPlaceholder')} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{embedStoreList.map((store) => (
													<SelectItem key={store.id} value={store.id!}>
														{store.name} ({store.provider})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="embedModelId"
								rules={{ required: t('llm.knowledgeModal.vectorModelPlaceholder') }}
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('llm.knowledgeModal.vectorModel')}</FormLabel>
										<Select onValueChange={field.onChange} value={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={t('llm.knowledgeModal.vectorModelPlaceholder')} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{embedModelList.map((model) => (
													<SelectItem key={model.id} value={model.id!}>
														{model.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* 分块策略配置 */}
						<Collapsible open={chunkOpen} onOpenChange={setChunkOpen}>
							<CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
								<Icon icon={chunkOpen ? "mdi:chevron-down" : "mdi:chevron-right"} size={16} />
								<span className="text-sm font-medium">{t('llm.knowledgeModal.chunkConfig')}</span>
							</CollapsibleTrigger>
							<CollapsibleContent className="space-y-4 pt-4">
								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="chunkStrategy"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t('llm.knowledgeModal.chunkStrategy')}</FormLabel>
												<Select onValueChange={field.onChange} value={field.value}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder={t('llm.knowledgeModal.chunkStrategyPlaceholder')} />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{CHUNK_STRATEGY_OPTIONS.map((opt) => (
															<SelectItem key={opt.value} value={opt.value}>
																{opt.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<p className="text-xs text-muted-foreground mt-1">
													{CHUNK_STRATEGY_OPTIONS.find(o => o.value === field.value)?.desc}
												</p>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="chunkUnit"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t('llm.knowledgeModal.chunkUnit')}</FormLabel>
												<Select onValueChange={field.onChange} value={field.value}>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder={t('llm.knowledgeModal.unitPlaceholder')} />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
												{CHUNK_UNIT_OPTIONS.map((opt) => (
													<SelectItem key={opt.value} value={opt.value}>
														{opt.label}
													</SelectItem>
												))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="chunkSize"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t('llm.knowledgeModal.chunkSize')}</FormLabel>
												<FormControl>
													<Input
														type="number"
														min={64}
														max={8192}
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
										name="chunkOverlap"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t('llm.knowledgeModal.overlap')}</FormLabel>
												<FormControl>
													<Input
														type="number"
														min={0}
														max={2048}
														{...field}
														onChange={(e) => field.onChange(Number(e.target.value))}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="flex items-center gap-2 flex-wrap">
									<span className="text-xs text-muted-foreground">{t('llm.knowledgeModal.presets')}</span>
									{CHUNK_PRESETS.map((preset) => (
										<Button
											key={preset.label}
											type="button"
											variant="outline"
											size="sm"
											className="h-6 text-xs"
											onClick={() => applyPreset(preset)}
										>
											{preset.label} ({preset.size}/{preset.overlap})
										</Button>
									))}
								</div>
							</CollapsibleContent>
						</Collapsible>

						{/* 检索策略配置 */}
						<Collapsible open={retrievalOpen} onOpenChange={setRetrievalOpen}>
							<CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
								<Icon icon={retrievalOpen ? "mdi:chevron-down" : "mdi:chevron-right"} size={16} />
								<span className="text-sm font-medium">{t('llm.knowledgeModal.retrievalConfig')}</span>
							</CollapsibleTrigger>
							<CollapsibleContent className="space-y-4 pt-4">
								<FormField
									control={form.control}
									name="retrievalMode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t('llm.knowledgeModal.retrievalMode')}</FormLabel>
											<Select onValueChange={field.onChange} value={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder={t('llm.knowledgeModal.retrievalModePlaceholder')} />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{RETRIEVAL_MODE_OPTIONS.map((opt) => (
														<SelectItem key={opt.value} value={opt.value}>
															{opt.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<p className="text-xs text-muted-foreground mt-1">
												{RETRIEVAL_MODE_OPTIONS.find(o => o.value === field.value)?.desc}
											</p>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="retrievalTopK"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t('llm.knowledgeModal.topK')}</FormLabel>
												<FormControl>
													<Input
														type="number"
														min={1}
														max={50}
														{...field}
														onChange={(e) => field.onChange(Number(e.target.value))}
													/>
												</FormControl>
												<p className="text-xs text-muted-foreground mt-1">
													{t('llm.knowledgeModal.topKHint')}
												</p>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="retrievalThreshold"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t('llm.knowledgeModal.similarityThreshold')}</FormLabel>
												<FormControl>
													<Input
														type="number"
														min={0}
														max={1}
														step={0.05}
														{...field}
														onChange={(e) => field.onChange(Number(e.target.value))}
													/>
												</FormControl>
												<p className="text-xs text-muted-foreground mt-1">
													{t('llm.knowledgeModal.thresholdHint')}
												</p>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</CollapsibleContent>
						</Collapsible>

						<div className="flex justify-end space-x-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={loading}
							>
								{t('llm.knowledgeModal.cancel')}
							</Button>
							<Button type="submit" disabled={loading}>
								{loading ? (
									<>
										<Icon icon="mdi:loading" className="mr-2 h-4 w-4 animate-spin" />
										{t('llm.knowledgeModal.saving')}
									</>
								) : (
									editingKnowledge?.id ? t('llm.knowledgeModal.update') : t('llm.knowledgeModal.add')
								)}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
