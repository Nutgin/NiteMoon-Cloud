import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Skeleton } from "@/ui/skeleton";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
	getKnowledgeApi,
	type Knowledge
} from "@/api/services/llmKnowledgeService";
import DocumentManageTab from "./components/DocumentManageTab";
import SliceManageTab from "./components/SliceManageTab";
import VectorSearchTab from "./components/VectorSearchTab";

type SectionKey = "documents" | "slices" | "search";

export default function KnowledgeSettingPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [knowledge, setKnowledge] = useState<Knowledge | null>(null);
	const [activeSection, setActiveSection] = useState<SectionKey>("documents");

	const getKnowledgeId = () => {
		const urlParams = new URLSearchParams(window.location.search);
		return urlParams.get('id');
	};

	const knowledgeId = getKnowledgeId();

	const loadKnowledge = async () => {
		if (!knowledgeId) {
			toast.error(t('llm.knowledgeSetting.missingId'));
			navigate('/aigc/knowledge');
			return;
		}

		setLoading(true);
		try {
			const response = await getKnowledgeApi(knowledgeId);
			setKnowledge(response);
		} catch (error) {
			console.error("Failed to load knowledge:", error);
			toast.error(t('llm.knowledgeSetting.loadFailed'));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadKnowledge();
	}, [knowledgeId]);

	const handleBack = () => {
		navigate('/aigc/knowledge');
	};

	const formatSize = (size?: number) => {
		if (!size) return "0 KB";
		if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
		return `${(size / (1024 * 1024)).toFixed(2)} MB`;
	};

	const sections = useMemo(() => [
		{ key: "documents" as SectionKey, icon: "mdi:file-document-multiple", label: t('llm.knowledgeSetting.docManagement') },
		{ key: "slices" as SectionKey, icon: "mdi:view-array", label: t('llm.knowledgeSetting.sliceManagement') },
		{ key: "search" as SectionKey, icon: "mdi:magnify", label: t('llm.knowledgeSetting.vectorSearchTab') },
	], [t]);

	// Loading state
	if (loading) {
		return (
			<div className="space-y-4 p-6">
				<Skeleton className="h-14 w-full rounded-lg" />
				<div className="flex gap-6">
					<Skeleton className="w-44 h-64 rounded-lg shrink-0" />
					<Skeleton className="flex-1 h-96 rounded-lg" />
				</div>
			</div>
		);
	}

	// Not found state
	if (!knowledge) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-center">
					<Icon icon="mdi:database-off" className="h-12 w-12 mx-auto mb-4 text-gray-400" />
					<p className="text-gray-500">{t('llm.knowledgeSetting.notFound')}</p>
					<Button onClick={handleBack} className="mt-4">
						{t('llm.knowledgeSetting.backToList')}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			{/* ─── Top Banner ──────────────────────────────────────────── */}
			<div className="shrink-0 flex items-center justify-between px-6 h-12 border-b border-border/50 bg-background">
				<div className="flex items-center gap-3">
					<button onClick={handleBack}
						className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
						title={t('llm.knowledgeSetting.back')}>
						<Icon icon="mdi:arrow-left" size={16} className="text-muted-foreground" />
					</button>
					<div className="flex items-baseline gap-2">
						<h1 className="text-[15px] font-semibold tracking-tight text-foreground">{knowledge.name}</h1>
						<span className="text-[10px] text-muted-foreground/50 font-mono">{knowledge.id}</span>
					</div>
				</div>
				<div className="flex items-center gap-4 text-[11px] text-muted-foreground/70">
					<span className="flex items-center gap-1.5">
						<Icon icon="mdi:file-document-outline" size={13} />
						{t('llm.knowledgeSetting.docCountLabel', { count: knowledge.docsNum || 0 })}
					</span>
					<span className="w-px h-3 bg-border/50" />
					<span className="flex items-center gap-1.5">
						<Icon icon="mdi:harddisk" size={13} />
						{formatSize(knowledge.totalSize)}
					</span>
					<span className="w-px h-3 bg-border/50" />
					<span className="flex items-center gap-1.5">
						<Icon icon="mdi:cube-scan" size={13} />
						{knowledge.embedStore?.dimension || "-"}d
					</span>
				</div>
			</div>

			{/* ─── Config Card ─────────────────────────────────────────── */}
			<div className="shrink-0 px-6 pt-4 pb-2">
				<div className="flex items-center gap-0 px-5 py-3 rounded-lg border border-border/50 bg-card">
					{[
						{ label: t('llm.knowledgeSetting.vectorDb'), value: `${knowledge.embedStore?.name || "-"}${knowledge.embedStore?.provider ? ` (${knowledge.embedStore.provider})` : ""}` },
						{ label: t('llm.knowledgeSetting.embeddingModel'), value: knowledge.embedModel?.name || "-" },
						{ label: t('llm.knowledgeSetting.chunkStrategy'), value: knowledge.chunkStrategy === "RECURSIVE" ? t('llm.knowledgeSetting.recursiveSplit') : knowledge.chunkStrategy === "FIXED_SIZE" ? t('llm.knowledgeSetting.fixedSize') : knowledge.chunkStrategy || t('llm.knowledgeSetting.recursiveSplitDefault') },
						{ label: t('llm.knowledgeSetting.chunkSize'), value: `${knowledge.chunkSize || 512} ${knowledge.chunkUnit === "CHAR" ? t('llm.knowledgeSetting.character') : t('llm.knowledgeSetting.token')}` },
						{ label: t('llm.knowledgeSetting.retrievalMode'), value: (() => { try { const c = knowledge.retrievalConfig ? JSON.parse(knowledge.retrievalConfig) : {}; return c.retrievalMode === "HYBRID" ? t('llm.knowledgeSetting.hybridSearch') : t('llm.knowledgeSetting.vectorSearch'); } catch { return t('llm.knowledgeSetting.vectorSearch'); } })() },
					].map((item, i, arr) => (
						<div key={item.label} className="flex items-center gap-6">
							<div>
								<p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">{item.label}</p>
								<p className="text-[13px] text-foreground font-medium leading-tight">{item.value}</p>
							</div>
							{i < arr.length - 1 && <div className="w-px h-7 bg-border/40" />}
						</div>
					))}
				</div>
			</div>

			{/* ─── Main Content Area ───────────────────────────────────── */}
			<div className="flex flex-1 min-h-0">
				{/* Left Sidebar Navigation */}
				<nav className="w-44 shrink-0 border-r border-border/60 bg-muted/30 py-4">
					{sections.map((section) => (
						<button
							key={section.key}
							onClick={() => setActiveSection(section.key)}
							className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left ${
								activeSection === section.key
									? "text-foreground font-medium border-l-2 border-primary bg-background"
									: "text-muted-foreground hover:text-foreground hover:bg-muted/50 border-l-2 border-transparent"
							}`}
						>
							<Icon icon={section.icon} size={16} />
							{section.label}
						</button>
					))}
				</nav>

				{/* Right Content Area */}
				<main className="flex-1 overflow-auto p-6">
					{activeSection === "documents" && <DocumentManageTab knowledgeId={knowledge.id!} />}
					{activeSection === "slices" && <SliceManageTab knowledgeId={knowledge.id!} />}
					{activeSection === "search" && <VectorSearchTab knowledgeId={knowledge.id!} />}
				</main>
			</div>
		</div>
	);
}
