import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "@/routes/hooks/use-router";
import { Icon } from "@/components/icon";
import { AppImage } from "@/components/app-image";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";
import { Input } from "@/ui/input";
import { Switch } from "@/ui/switch";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
	getApplicationPageApi,
	deleteApplicationApi,
	getLlmWorkflowDetailApi,
	toggleWebPageApi,
	type LlmApplication,
	type LlmWorkflowResp,
} from "@/api/services/llmApplicationService";
import { ApplicationModal } from "./application-modal";

// ─── Workflow Thumbnail Component ────────────────────────────────────────

interface WorkflowThumbnailProps {
	workflow: LlmWorkflowResp | null;
	loading: boolean;
}

function WorkflowThumbnail({ workflow, loading }: WorkflowThumbnailProps) {
	if (loading) {
		return (
			<div className="w-full h-full flex items-center justify-center">
				<Skeleton className="w-full h-full rounded-md" />
			</div>
		);
	}

	if (!workflow || !workflow.nodes || workflow.nodes.length === 0) {
		return (
			<div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
				<Icon icon="mdi:workflow" size={24} className="mb-1 opacity-40" />
				<span className="text-[10px]">No workflow</span>
			</div>
		);
	}

	const { nodes, edges } = workflow;

	// Layout constants
	const padding = 16;
	const nodeW = 48;
	const nodeH = 24;
	const gapX = 20;
	const gapY = 10;

	// Build adjacency maps
	const outEdges = new Map<string, typeof edges>();
	const inEdges = new Map<string, typeof edges>();
	for (const n of nodes) { outEdges.set(n.uuid, []); inEdges.set(n.uuid, []); }
	for (const e of edges) {
		outEdges.get(e.sourceNodeUuid)?.push(e);
		inEdges.get(e.targetNodeUuid)?.push(e);
	}

	// Assign layers via topological sort (longest path)
	const layerMap = new Map<string, number>();
	const inDeg = new Map<string, number>();
	for (const n of nodes) inDeg.set(n.uuid, 0);
	for (const e of edges) inDeg.set(e.targetNodeUuid, (inDeg.get(e.targetNodeUuid) || 0) + 1);

	const queue: string[] = [];
	for (const [id, deg] of inDeg) { if (deg === 0) { queue.push(id); layerMap.set(id, 0); } }
	while (queue.length > 0) {
		const cur = queue.shift()!;
		const curLayer = layerMap.get(cur)!;
		for (const e of edges) {
			if (e.sourceNodeUuid === cur) {
				const next = e.targetNodeUuid;
				layerMap.set(next, Math.max(layerMap.get(next) || 0, curLayer + 1));
				inDeg.set(next, inDeg.get(next)! - 1);
				if (inDeg.get(next) === 0) queue.push(next);
			}
		}
	}

	// Assign rows: branch targets each get their own row, merge nodes center under parents
	const rowMap = new Map<string, number>();
	const visited = new Set<string>();

	// Find start node
	const startNode = nodes.find((n) => n.nodeType === "Start") || nodes[0];

	function assignRows(nodeId: string, startRow: number): number {
		if (visited.has(nodeId)) return startRow;
		visited.add(nodeId);

		const out = outEdges.get(nodeId) || [];
		if (out.length === 0) {
			rowMap.set(nodeId, startRow);
			return startRow + 1;
		}

		if (out.length === 1) {
			// Single edge: stay on same row
			rowMap.set(nodeId, startRow);
			return assignRows(out[0].targetNodeUuid, startRow);
		}

		// Multiple edges (branch): each target gets its own row
		rowMap.set(nodeId, startRow);
		let nextRow = startRow + 1;
		const targetRows: number[] = [];

		for (const e of out) {
			const target = e.targetNodeUuid;
			const targetIn = inEdges.get(target) || [];
			if (targetIn.length > 1) {
				// Merge node: will be placed after all branches
				targetRows.push(-1); // placeholder
			} else {
				const branchStart = nextRow;
				nextRow = assignRows(target, branchStart);
				targetRows.push(branchStart);
			}
		}

		// Place merge nodes (nodes with multiple incoming edges)
		for (let i = 0; i < out.length; i++) {
			const target = out[i].targetNodeUuid;
			const targetIn = inEdges.get(target) || [];
			if (targetIn.length > 1 && !visited.has(target)) {
				visited.add(target);
				// Center the merge node under its branch rows
				const validRows = targetRows.filter((r) => r >= 0);
				const mergeRow = validRows.length > 0
					? Math.round((Math.min(...validRows) + Math.max(...validRows)) / 2)
					: nextRow;
				rowMap.set(target, mergeRow);
				nextRow = Math.max(nextRow, mergeRow + 1);
				// Continue from merge node
				nextRow = assignRows(target, mergeRow);
			}
		}

		return nextRow;
	}

	if (startNode) assignRows(startNode.uuid, 0);

	// Assign positions based on layer (x) and row (y)
	const positions = new Map<string, { x: number; y: number }>();
	for (const n of nodes) {
		const layer = layerMap.get(n.uuid) ?? 0;
		const row = rowMap.get(n.uuid) ?? 0;
		positions.set(n.uuid, {
			x: padding + layer * (nodeW + gapX),
			y: padding + row * (nodeH + gapY),
		});
	}

	const maxX = Math.max(...[...positions.values()].map((p) => p.x + nodeW)) + padding;
	const maxY = Math.max(...[...positions.values()].map((p) => p.y + nodeH)) + padding;

	// Truncate node title for thumbnail: CJK max 4 chars, others max 8 chars
	const truncateTitle = (title: string): string => {
		if (!title) return "";
		// Detect if first char is CJK (Chinese/Japanese/Korean)
		const isCJK = /[一-鿿㐀-䶿豈-﫿]/.test(title.charAt(0));
		const maxLen = isCJK ? 4 : 8;
		const truncLen = isCJK ? 3 : 6;
		if (title.length <= maxLen) return title;
		return title.slice(0, truncLen) + "…";
	};

	// Node type colors — monochrome grayscale palette
	// Three tiers: dark (Start/End), medium (LLM/Knowledge), light (Tools/Logic)
	const nodeColors: Record<string, string> = {
		Start: "#404040",
		End: "#171717",
		LLM: "#525252",
		MultimodalLlm: "#525252",
		KnowledgeRetrieval: "#737373",
		KgRetrieval: "#737373",
		IfElse: "#8a8a8a",
		DateTimeTool: "#a3a3a3",
		HttpRequestTool: "#a3a3a3",
		CustomTool: "#a3a3a3",
		WebSearchTool: "#a3a3a3",
		CommandExecTool: "#a3a3a3",
		DocExtractor: "#737373",
	};

	return (
		<div className="relative w-full h-full">
			<span className="absolute top-1 left-1.5 text-[10px] text-gray-400 opacity-70 z-10 pointer-events-none select-none">
				缩略图
			</span>
			<svg
				viewBox={`0 0 ${maxX} ${maxY}`}
				className="w-full h-full"
				preserveAspectRatio="xMidYMid meet"
			>
			<defs>
				<marker id="arrow-thumb" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto" markerUnits="userSpaceOnUse">
					<polygon points="0,0 6,2 0,4" fill="#000" />
				</marker>
			</defs>
			{/* Edges */}
			{edges.map((e) => {
				const from = positions.get(e.sourceNodeUuid);
				const to = positions.get(e.targetNodeUuid);
				if (!from || !to) return null;
				const x1 = from.x + nodeW;
				const y1 = from.y + nodeH / 2;
				const x2 = to.x;
				const y2 = to.y + nodeH / 2;
				const cx = (x1 + x2) / 2;
				return (
					<path
						key={e.uuid}
						d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
						fill="none"
						stroke="#000"
						strokeWidth="1.5"
						markerEnd="url(#arrow-thumb)"
					/>
				);
			})}

			{/* Nodes */}
			{nodes.map((n) => {
				const pos = positions.get(n.uuid);
				if (!pos) return null;
				const color = nodeColors[n.nodeType] || "#6b7280";
				return (
					<g key={n.uuid}>
						<rect
							x={pos.x}
							y={pos.y}
							width={nodeW}
							height={nodeH}
							rx={4}
							fill={color}
							opacity="0.15"
							stroke={color}
							strokeWidth="1.5"
						/>
						<text
							x={pos.x + nodeW / 2}
							y={pos.y + nodeH / 2 + 1}
							textAnchor="middle"
							dominantBaseline="middle"
							fontSize="8"
							fontWeight="500"
							fill="currentColor"
							className="fill-foreground"
						>
							{truncateTitle(n.title) || truncateTitle(n.nodeType || "")}
						</text>
					</g>
				);
			})}
		</svg>
		</div>
	);
}

// ─── Main Page ───────────────────────────────────────────────────────────

export default function LlmApplicationPage() {
	const { t } = useTranslation();
	const router = useRouter();

	// State
	const [applications, setApplications] = useState<LlmApplication[]>([]);
	const [loading, setLoading] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingApp, setEditingApp] = useState<LlmApplication | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize] = useState(12);
	const [total, setTotal] = useState(0);
	const [search, setSearch] = useState("");

	// Workflow details cache
	const [workflowCache, setWorkflowCache] = useState<Map<string, LlmWorkflowResp | null>>(new Map());
	const [workflowLoading, setWorkflowLoading] = useState<Set<string>>(new Set());

	const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

	// Fetch applications
	const fetchApplications = useCallback(async () => {
		try {
			setLoading(true);
			const data = await getApplicationPageApi({
				pageNum: currentPage,
				pageSize,
				name: search || undefined,
			});
			setApplications(data?.rows || data?.records || []);
			setTotal(data?.total || 0);
		} catch {
			toast.error(t('llm.application.loadFailed'));
		} finally {
			setLoading(false);
		}
	}, [currentPage, pageSize, search, t]);

	useEffect(() => {
		fetchApplications();
	}, [fetchApplications]);

	// Fetch workflow details for current page apps
	useEffect(() => {
		const appsToFetch = applications.filter(
			(app) => app.id && !workflowCache.has(app.id) && !workflowLoading.has(app.id!)
		);

		if (appsToFetch.length === 0) return;

		const ids = appsToFetch.map((a) => a.id!);
		setWorkflowLoading((prev) => {
			const next = new Set(prev);
			for (const id of ids) next.add(id);
			return next;
		});

		Promise.allSettled(
			appsToFetch.map((app) => getLlmWorkflowDetailApi(app.id!))
		).then((results) => {
			setWorkflowCache((prev) => {
				const next = new Map(prev);
				results.forEach((result, i) => {
					const appId = appsToFetch[i].id!;
					if (result.status === "fulfilled") {
						next.set(appId, result.value);
					} else {
						next.set(appId, null);
					}
				});
				return next;
			});
			setWorkflowLoading((prev) => {
				const next = new Set(prev);
				for (const id of ids) next.delete(id);
				return next;
			});
		});
	}, [applications, workflowCache, workflowLoading]);

	// Handlers
	const handleCreateApp = () => {
		setEditingApp(null);
		setModalOpen(true);
	};

	const handleEditApp = (app: LlmApplication) => {
		setEditingApp(app);
		setModalOpen(true);
	};

	const handleDeleteApp = async () => {
		if (!deleteConfirmId) return;
		try {
			await deleteApplicationApi(deleteConfirmId);
			toast.success(t('llm.application.deleteSuccess'));
			setDeleteConfirmId(null);
			fetchApplications();
		} catch {
			toast.error(t('llm.application.deleteFailed'));
		}
	};

	const handleViewInfo = (app: LlmApplication) => {
		router.push(`/aigc/application/detail?id=${app.id}`);
	};

	const handleDesignWorkflow = (app: LlmApplication) => {
		router.push(`/aigc/application/detail?id=${app.id}&tab=workflow`);
	};

	const handleToggleWebPage = async (app: LlmApplication) => {
		try {
			const webPageKey = await toggleWebPageApi(app.id!);
			if (webPageKey) {
				toast.success(t('llm.application.webPageEnabled'));
				const url = `${window.location.origin}/chat/${webPageKey}`;
				toast.info(`${t('llm.application.accessUrl')}${url}`, { duration: 10000 });
			} else {
				toast.success(t('llm.application.webPageDisabled'));
			}
			fetchApplications();
		} catch {
			toast.error(t('llm.application.operationFailed'));
		}
	};

	const handleCopyUrl = async (webPageKey: string) => {
		const url = `${window.location.origin}/chat/${webPageKey}`;
		try {
			await navigator.clipboard.writeText(url);
			toast.success(t('llm.application.linkCopied'));
		} catch {
			toast.error(t('llm.application.copyFailed'));
		}
	};

	const handleModalSuccess = () => {
		setModalOpen(false);
		setEditingApp(null);
		fetchApplications();
	};

	// ─── Render: Header ──────────────────────────────────────────────

	const renderHeader = () => (
		<div className="flex items-center justify-between gap-4">
			<div>
				<h1 className="text-xl font-semibold tracking-tight">{t('llm.application.title')}</h1>
				<p className="text-sm text-muted-foreground mt-0.5">
					{t('llm.application.subtitle')}
				</p>
			</div>
			<div className="flex items-center gap-3">
				<Input
					placeholder={t('llm.application.searchPlaceholder')}
					value={search}
					onChange={(e) => {
						setSearch(e.target.value);
						setCurrentPage(1);
					}}
					className="w-56"
				/>
				<Button onClick={handleCreateApp}>
					<Icon icon="mdi:plus" size={18} className="mr-1" />
					{t('llm.application.add')}
				</Button>
			</div>
		</div>
	);

	// ─── Render: Skeleton ────────────────────────────────────────────

	const renderSkeleton = () => (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{Array.from({ length: 4 }).map((_, i) => (
				<Card key={i}>
					<CardContent className="p-4 space-y-3">
						<Skeleton className="w-full h-28 rounded-md" />
						<div className="flex items-center gap-2">
							<Skeleton className="w-8 h-8 rounded-lg shrink-0" />
							<Skeleton className="h-4 flex-1" />
						</div>
						<Skeleton className="h-3 w-2/3" />
					</CardContent>
				</Card>
			))}
		</div>
	);

	// ─── Render: Empty State ─────────────────────────────────────────

	const renderEmpty = () => (
		<Card>
			<CardContent className="flex flex-col items-center justify-center py-20">
				<div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
					<Icon icon="mdi:robot-outline" size={28} className="text-muted-foreground" />
				</div>
				<h3 className="text-base font-medium mb-1">{t('llm.application.noApplications')}</h3>
				<p className="text-sm text-muted-foreground mb-4">
					{t('llm.application.createFirst')}
				</p>
				<Button onClick={handleCreateApp}>
					<Icon icon="mdi:plus" size={18} className="mr-1" />
					{t('llm.application.add')}
				</Button>
			</CardContent>
		</Card>
	);

	// ─── Render: Grid View (Thumbnails) ──────────────────────────────

	const renderGridView = () => (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{/* Create Card */}
			<Card
				className="cursor-pointer border-dashed hover:border-primary/40 transition-colors group"
				onClick={handleCreateApp}
			>
				<CardContent className="p-4 flex flex-col items-center justify-center min-h-[180px]">
					<div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-2 group-hover:bg-primary/10 transition-colors">
						<Icon icon="mdi:plus" size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
					</div>
					<span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
						{t('llm.application.createBlank')}
					</span>
				</CardContent>
			</Card>

			{/* App Cards */}
			{applications.map((app) => {
				const wf = app.id ? workflowCache.get(app.id) : undefined;
				const isLoadingWf = app.id ? workflowLoading.has(app.id) : false;
				const nodeCount = wf?.nodes?.length || 0;

				return (
					<Card
						key={app.id}
						className="group cursor-pointer hover:border-primary/30 transition-colors"
						onClick={() => handleViewInfo(app)}
					>
						<CardContent className="p-4">
							{/* Row 1: Cover + Title + Actions */}
							<div className="flex items-center gap-2 mb-1.5">
								{app.cover ? (
									<div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
										<AppImage
											src={app.cover}
											alt={app.name}
											className="w-full h-full object-cover"
											showLoading={false}
										/>
									</div>
								) : (
									<div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
										<Icon icon="mdi:robot" size={16} className="text-primary" />
									</div>
								)}
								<div className="flex-1 min-w-0">
									<h3 className="font-medium text-sm leading-snug truncate">
										{app.name}
									</h3>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="ghost"
											size="sm"
											className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
											onClick={(e) => e.stopPropagation()}
										>
											<Icon icon="mdi:dots-horizontal" size={14} />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-40">
										<DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditApp(app); }}>
											<Icon icon="mdi:pencil" size={15} className="mr-2" />
											{t('llm.application.edit')}
										</DropdownMenuItem>
										<DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDesignWorkflow(app); }}>
											<Icon icon="mdi:workflow" size={15} className="mr-2" />
											{t('llm.application.designWorkflow')}
										</DropdownMenuItem>
										<DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleWebPage(app); }}>
											<Icon icon="mdi:web" size={15} className="mr-2" />
											<span className="flex-1">{t('llm.application.webPage')}</span>
											<Switch checked={app.enableWebPage} className="ml-2" />
										</DropdownMenuItem>
										{app.enableWebPage && app.webPageKey && (
											<DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyUrl(app.webPageKey!); }}>
												<Icon icon="mdi:content-copy" size={15} className="mr-2" />
												{t('llm.application.copyLink')}
											</DropdownMenuItem>
										)}
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="text-destructive"
											onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(app.id || ""); }}
										>
											<Icon icon="mdi:delete-outline" size={15} className="mr-2" />
											{t('llm.application.delete')}
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>

							{/* Row 2: Description */}
							<p className="text-xs text-muted-foreground line-clamp-1 mb-2">
								{app.des || t('llm.application.noDescription')}
							</p>

							{/* Row 3: Thumbnail */}
							<div className="w-full h-28 rounded-md bg-muted/50 mb-2 overflow-hidden border border-border/50">
								<WorkflowThumbnail workflow={wf ?? null} loading={isLoadingWf} />
							</div>

							{/* Row 4: Node count + Date */}
							<div className="flex items-center justify-between text-xs text-muted-foreground">
								<span className="flex items-center gap-1">
									<Icon icon="mdi:workflow" size={12} />
									{nodeCount > 0
										? t('llm.application.nodeCount', { count: nodeCount })
										: t('llm.application.noWorkflow')
									}
								</span>
								<span>{app.createTime ? new Date(app.createTime).toLocaleDateString() : ""}</span>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);

	// ─── Render: Pagination ──────────────────────────────────────────

	const renderPagination = () => {
		if (total <= pageSize) return null;

		return (
			<div className="flex items-center justify-center gap-4 mt-6">
				<Button
					variant="outline"
					size="sm"
					onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
					disabled={currentPage === 1}
				>
					<Icon icon="mdi:chevron-left" size={16} className="mr-1" />
					{t('llm.application.prevPage')}
				</Button>
				<span className="text-sm text-muted-foreground">
					{t('llm.application.pageInfo', { current: currentPage, total: totalPages })}
				</span>
				<Button
					variant="outline"
					size="sm"
					onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
					disabled={currentPage >= totalPages}
				>
					{t('llm.application.nextPage')}
					<Icon icon="mdi:chevron-right" size={16} className="ml-1" />
				</Button>
			</div>
		);
	};

	// ─── Main Render ─────────────────────────────────────────────────

	return (
		<div className="space-y-4">
			{renderHeader()}

			{loading ? (
				renderSkeleton()
			) : applications.length === 0 ? (
				renderEmpty()
			) : (
				<>
					{renderGridView()}
					{renderPagination()}
				</>
			)}

			{/* Create / Edit Modal */}
			<ApplicationModal
				open={modalOpen}
				onOpenChange={setModalOpen}
				application={editingApp}
				onSuccess={handleModalSuccess}
			/>

			{/* Delete Confirm Dialog */}
			<Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>{t('llm.application.confirmDeleteTitle')}</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground">
						{t('llm.application.confirmDeleteMessage')}
					</p>
					<div className="flex justify-end gap-2 mt-4">
						<Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
							{t('llm.application.cancel')}
						</Button>
						<Button variant="destructive" onClick={handleDeleteApp}>
							{t('llm.application.delete')}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
