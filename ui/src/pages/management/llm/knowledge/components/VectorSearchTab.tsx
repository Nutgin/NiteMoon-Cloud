import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Textarea } from "@/ui/textarea";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Input } from "@/ui/input";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
	embeddingAdvancedSearchApi,
	type EmbeddingSearchParams,
	type EmbeddingSearchResult
} from "@/api/services/llmEmbeddingService";

interface VectorSearchTabProps {
	knowledgeId: string;
}

export default function VectorSearchTab({ knowledgeId }: VectorSearchTabProps) {
	const { t } = useTranslation();
	const [searchContent, setSearchContent] = useState("");
	const [loading, setLoading] = useState(false);
	const [searchResults, setSearchResults] = useState<EmbeddingSearchResult[]>([]);
	const [topK, setTopK] = useState(5);
	const [threshold, setThreshold] = useState(0.7);
	const [retrievalMode, setRetrievalMode] = useState("VECTOR");
	const [elapsed, setElapsed] = useState<number | null>(null);

	const handleSearch = async () => {
		if (!searchContent.trim()) {
			toast.warning(t('llm.vectorSearch.inputRequired'));
			return;
		}

		setLoading(true);
		setElapsed(null);
		const startTime = Date.now();

		try {
			const params: EmbeddingSearchParams = {
				content: searchContent.trim(),
				knowledgeId,
				topK,
				similarityThreshold: threshold,
				retrievalMode,
			};

			const results = await embeddingAdvancedSearchApi(params);
			setSearchResults(results || []);
			setElapsed(Date.now() - startTime);

			if (results && results.length > 0) {
				toast.success(t('llm.vectorSearch.foundResults', { count: results.length }));
			} else {
				toast.info(t('llm.vectorSearch.noResults'));
			}
		} catch (error) {
			console.error("搜索失败:", error);
			toast.error(t('llm.vectorSearch.searchFailed'));
		} finally {
			setLoading(false);
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && e.ctrlKey) {
			e.preventDefault();
			handleSearch();
		}
	};

	return (
		<div className="flex gap-6 h-full">
			{/* Left: Search Controls */}
			<div className="w-72 shrink-0 space-y-4">
				<div className="rounded-lg border border-border/60 bg-card">
					<div className="px-5 py-3 border-b border-border/40">
						<h3 className="text-sm font-medium flex items-center gap-2">
							<Icon icon="mdi:magnify" size={16} className="text-muted-foreground" />
							{t('llm.vectorSearch.title')}
						</h3>
					</div>
					<div className="p-5 space-y-4">
						<Textarea
							value={searchContent}
							onChange={(e) => setSearchContent(e.target.value)}
							onKeyDown={handleKeyPress}
							placeholder={t('llm.vectorSearch.searchPlaceholder')}
							rows={5}
							className="min-h-[120px] text-sm resize-none"
						/>

						<div className="space-y-3">
							<div className="space-y-1.5">
								<Label className="text-xs text-muted-foreground">{t('llm.vectorSearch.retrievalMode')}</Label>
								<Select value={retrievalMode} onValueChange={setRetrievalMode}>
									<SelectTrigger className="h-8 text-sm">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="VECTOR">{t('llm.vectorSearch.vectorSearch')}</SelectItem>
										<SelectItem value="HYBRID">{t('llm.vectorSearch.hybridSearch')}</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="grid grid-cols-2 gap-2">
								<div className="space-y-1.5">
									<Label className="text-xs text-muted-foreground">{t('llm.vectorSearch.topK')}</Label>
									<Input
										type="number"
										min={1}
										max={50}
										value={topK}
										onChange={(e) => setTopK(Number(e.target.value))}
										className="h-8 text-sm"
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-xs text-muted-foreground">{t('llm.vectorSearch.threshold')}</Label>
									<Input
										type="number"
										min={0}
										max={1}
										step={0.05}
										value={threshold}
										onChange={(e) => setThreshold(Number(e.target.value))}
										className="h-8 text-sm"
									/>
								</div>
							</div>
						</div>

						<Button
							onClick={handleSearch}
							disabled={loading}
							className="w-full"
							size="sm"
						>
							{loading ? (
								<>
									<Icon icon="mdi:loading" size={15} className="mr-1.5 animate-spin" />
									{t('llm.vectorSearch.searching')}
								</>
							) : (
								<>
									<Icon icon="mdi:magnify" size={15} className="mr-1.5" />
									{t('llm.vectorSearch.search')}
								</>
							)}
						</Button>
					</div>
				</div>
			</div>

			{/* Right: Results */}
			<div className="flex-1 min-w-0">
				{loading ? (
					<div className="flex items-center justify-center h-64">
						<Icon icon="mdi:loading" size={28} className="animate-spin text-muted-foreground/50" />
					</div>
				) : searchResults.length > 0 ? (
					<div className="space-y-4">
						<div className="flex items-center gap-4 text-xs text-muted-foreground">
							<span>{t('llm.vectorSearch.resultCount', { count: searchResults.length })}</span>
							{elapsed !== null && <span>{t('llm.vectorSearch.elapsed', { time: elapsed })}</span>}
						</div>
						<div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
							{searchResults.map((result, index) => (
								<div
									key={index}
									className="rounded-lg border border-border/60 bg-card hover:border-primary/30 transition-colors"
								>
									<div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
										<div className="flex items-center gap-2 min-w-0">
											<Icon icon="mdi:file-document" size={14} className="text-primary shrink-0" />
											<span
												className="text-sm font-medium truncate"
												title={result.docsName}
											>
												{result.docsName}
											</span>
										</div>
										{result.score !== undefined && (
											<span className="text-[11px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded shrink-0 ml-2">
												{Math.round(result.score * 100)}%
											</span>
										)}
									</div>
									<div className="px-4 py-3 text-sm text-muted-foreground max-h-[180px] overflow-y-auto leading-relaxed">
										{result.text}
									</div>
								</div>
							))}
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center h-64 text-center">
						<Icon icon="mdi:file-search" size={40} className="mb-3 text-muted-foreground/30" />
						<p className="text-sm text-muted-foreground mb-1">
							{searchContent ? t('llm.vectorSearch.noResult') : t('llm.vectorSearch.inputHint')}
						</p>
						<p className="text-xs text-muted-foreground/60">
							{searchContent ? t('llm.vectorSearch.adjustHint') : t('llm.vectorSearch.enterHint')}
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
