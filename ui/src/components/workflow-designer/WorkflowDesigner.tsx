import React, { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ReactFlow, {
	ReactFlowProvider,
	Controls,
	Background,
	MiniMap,
	useReactFlow,
	applyNodeChanges,
	applyEdgeChanges,
	type Node,
	type Edge,
	type Connection,
	type NodeChange,
	type EdgeChange,
	MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/ui/button";
import { Icon } from "@/components/icon";
import { toast } from "sonner";
import { Modal } from "antd";
import type { WorkflowInfo, WorkflowComponent, WorkflowNode, UIWorkflow } from "./types";
import {
	createNewNode,
	createNewEdge,
	validateWorkflow,
} from "./utils/workflow-util";
import NodeShell, { DeleteNodeContext } from "./nodes/NodeShell";
import SwitcherNode from "./nodes/SwitcherNode";
import SpecialEdge from "./edges/SpecialEdge";
import { LeftPanel } from "./panels/LeftPanel";
import { RightPanel } from "./panels/RightPanel";

interface WorkflowDesignerProps {
	workflow: WorkflowInfo;
	wfComponents: WorkflowComponent[];
	componentIdMap: Record<number, string>;
	saving?: boolean;
	onSave?: (workflow: WorkflowInfo) => void;
	onDeleteNode?: (nodeUuid: string) => void;
}

const nodeTypes = {
	start: NodeShell,
	end: NodeShell,
	llm: NodeShell,
	multimodalllm: NodeShell,
	answer: NodeShell,
	template: NodeShell,
	classifier: NodeShell,
	knowledgeretrieval: NodeShell,
	kgretrieval: NodeShell,
	documentextractor: NodeShell,
	keywordextractor: NodeShell,
	faqextractor: NodeShell,
	switcher: SwitcherNode,
	ifelse: SwitcherNode,
	dalle3: NodeShell,
	tongyiwanx: NodeShell,
	google: NodeShell,
	humanfeedback: NodeShell,
	mailsend: NodeShell,
	httprequest: NodeShell,
	datetimetool: NodeShell,
	websearchtool: NodeShell,
	httprequesttool: NodeShell,
	customtool: NodeShell,
	commandexectool: NodeShell,
};

const edgeTypes = {
	special: SpecialEdge,
};

function WorkflowDesignerInner({
	workflow,
	wfComponents,
	componentIdMap,
	saving = false,
	onSave,
	onDeleteNode,
}: WorkflowDesignerProps) {
	const { t } = useTranslation();
	const reactFlowWrapper = useRef<HTMLDivElement>(null);
	const { project, getNodes, setNodes, setEdges, fitView } = useReactFlow();

	const [uiWorkflow, setUiWorkflow] = useState<UIWorkflow>({
		nodes: [],
		edges: [],
	});
	const [hidePropertyPanel, setHidePropertyPanel] = useState(true);
	const [selectedWfNode, setSelectedWfNode] = useState<WorkflowNode | undefined>();

	// Render graph from workflow data
	const renderGraph = useCallback(() => {
		const initX = 10;
		const initY = 50;
		const validNodeIds = new Set<string>();
		const newNodes: Node[] = [];
		const newEdges: Edge[] = [];

		// Render all valid nodes
		for (let i = 0; i < workflow.nodes.length; i++) {
			const node = workflow.nodes[i];
			if (!node || !node.uuid) continue;

			let componentName = "";
			if (node.wfComponent && node.wfComponent.name) {
				componentName = node.wfComponent.name;
			} else if (node.workflowComponentId !== undefined) {
				componentName = componentIdMap[node.workflowComponentId] || "Unknown";
			} else {
				continue;
			}

			const px = node.positionX ? node.positionX : initX + 230 * i;
			const py = node.positionY ? node.positionY : initY;

			// Ensure wfComponent exists
			if (!node.wfComponent) {
				node.wfComponent = { name: componentName, title: componentName };
			}

			// Always re-translate title and remark based on component name
			node.wfComponent.name = componentName;
			node.wfComponent.title =
				componentName === "Start"
					? t("workflowDesigner.defaultStartTitle")
					: componentName === "End"
					? t("workflowDesigner.defaultEndTitle")
					: componentName;
			node.wfComponent.remark =
				componentName === "Start"
					? t("workflowDesigner.startNodeRemark")
					: componentName === "End"
					? t("workflowDesigner.endNodeRemark")
					: t("workflowDesigner.nodeRemark", { name: componentName });

			newNodes.push({
				id: node.uuid,
				type: componentName.toLowerCase(),
				data: node as any,
				position: { x: px, y: py },
			});
			validNodeIds.add(node.uuid);
		}

		// Render valid edges
		for (const wfEdge of workflow.edges) {
			if (
				!wfEdge ||
				!wfEdge.uuid ||
				!wfEdge.sourceNodeUuid ||
				!wfEdge.targetNodeUuid
			) {
				continue;
			}

			if (
				validNodeIds.has(wfEdge.sourceNodeUuid) &&
				validNodeIds.has(wfEdge.targetNodeUuid)
			) {
				newEdges.push({
					id: wfEdge.uuid,
					source: wfEdge.sourceNodeUuid,
					target: wfEdge.targetNodeUuid,
					sourceHandle: wfEdge.sourceHandle,
					type: "special",
					animated: true,
					markerEnd: { type: MarkerType.ArrowClosed },
					data: wfEdge,
				});
			}
		}

		setUiWorkflow({ nodes: newNodes, edges: newEdges });
		setNodes(newNodes);
		setEdges(newEdges);

		// Fit view after render
		setTimeout(() => fitView(), 100);
	}, [workflow, componentIdMap, setNodes, setEdges, fitView]);

	// Watch for workflow changes
	useEffect(() => {
		renderGraph();
	}, [workflow, renderGraph]);

	// Handle node changes (drag, select, etc.)
	const onNodesChange = useCallback(
		(changes: NodeChange[]) => {
			setUiWorkflow((prev) => ({
				...prev,
				nodes: applyNodeChanges(changes, prev.nodes),
			}));

			for (const change of changes) {
				if ("selected" in change) {
					if (!change.selected && selectedWfNode?.uuid === (change as any).id) {
						setHidePropertyPanel(true);
						setSelectedWfNode(undefined);
					}
				}
				if ((change as any).type === "position" && (change as any).position) {
					const wfNode = workflow.nodes.find(
						(n: WorkflowNode) => n.uuid === (change as any).id
					);
					if (wfNode) {
						wfNode.positionX = (change as any).position.x;
						wfNode.positionY = (change as any).position.y;
					}
				}
			}
		},
		[workflow, selectedWfNode]
	);

	// Handle edge changes
	const onEdgesChange = useCallback((changes: EdgeChange[]) => {
		setUiWorkflow((prev) => ({
			...prev,
			edges: applyEdgeChanges(changes, prev.edges),
		}));
	}, []);

	// Handle new connections
	const onConnect = useCallback(
		(connection: Connection) => {
			if (connection.source && connection.target) {
				createNewEdge({
					workflow,
					uiWorkflow,
					source: connection.source,
					sourceHandle: connection.sourceHandle || "",
					target: connection.target,
				});
				renderGraph();
			}
		},
		[workflow, uiWorkflow, renderGraph]
	);

	// Handle node click
	const onNodeClick = useCallback(
		(_event: React.MouseEvent, node: Node) => {
			if (node && node.data) {
				setSelectedWfNode(node.data as unknown as WorkflowNode);
				setHidePropertyPanel(false);
			}
		},
		[]
	);

	// Handle edge click (delete edge)
	const onEdgeClick = useCallback(
		(_event: React.MouseEvent, edge: Edge) => {
			const id = edge?.id;
			if (!id) return;

			const idx = workflow.edges.findIndex(
				(e: any) => e.uuid === id || e.id === id
			);
			if (idx > -1) {
				const removed = workflow.edges.splice(idx, 1)[0];
				if (removed) {
					if (!workflow.deleteEdges) workflow.deleteEdges = [];
					const removedId: string = (removed.uuid || removed.id || "") as string;
					if (removedId) workflow.deleteEdges.push(removedId);
				}
			}

			setUiWorkflow((prev) => ({
				...prev,
				edges: prev.edges.filter((e) => e.id !== id),
			}));
		},
		[workflow]
	);

	// Handle canvas click (deselect)
	const onPaneClick = useCallback(() => {
		setHidePropertyPanel(true);
		setSelectedWfNode(undefined);
	}, []);

	// Handle drop
	const onDrop = useCallback(
		(event: React.DragEvent) => {
			event.preventDefault();

			const componentName = event.dataTransfer.getData("application/reactflow");
			const component = wfComponents.find((c) => c.name === componentName);

			if (!component) {
				toast.warning(t("workflowDesigner.componentNotFound"));
				return;
			}

			if (
				componentName === "Start" &&
				workflow.nodes.some((n: WorkflowNode) => n.wfComponent?.name === "Start")
			) {
				toast.warning(t("workflowDesigner.startNodeOnlyOne"));
				return;
			}

			const bounds = reactFlowWrapper.current?.getBoundingClientRect();
			if (!bounds) return;

			const position = project({
				x: event.clientX - bounds.left,
				y: event.clientY - bounds.top,
			});

			createNewNode(workflow, uiWorkflow, component, position);
			renderGraph();
		},
		[workflow, uiWorkflow, wfComponents, project, renderGraph]
	);

	// Handle drag over
	const onDragOver = useCallback((event: React.DragEvent) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	}, []);

	// Sync positions before save
	const syncPositionsFromUi = useCallback(() => {
		const nodes = getNodes();
		for (const n of nodes) {
			const wfNode = workflow.nodes.find(
				(x: WorkflowNode) => x.uuid === n.id
			);
			if (wfNode) {
				wfNode.positionX = n.position?.x ?? wfNode.positionX;
				wfNode.positionY = n.position?.y ?? wfNode.positionY;
			}
		}
	}, [getNodes, workflow]);

	// Handle save
	const handleSave = useCallback(() => {
		if (saving) return;
		syncPositionsFromUi();

		// Validate workflow
		const errors = validateWorkflow(workflow);
		if (errors.length > 0) {
			Modal.error({
				title: t('workflowDesigner.validationErrors'),
				content: (
					<ul>
						{errors.map((error, index) => (
							<li key={index}>{error.message}</li>
						))}
					</ul>
				)
			});
			return;
		}

		// Deduplicate deleteEdges
		if (Array.isArray((workflow as any).deleteEdges)) {
			const dedup = Array.from(new Set((workflow as any).deleteEdges));
			(workflow as any).deleteEdges = dedup;
		}

		onSave?.(workflow);
	}, [saving, syncPositionsFromUi, workflow, onSave, t]);


	// Handle delete node
	const handleDeleteNode = useCallback(
		(nodeUuid: string) => {
			const idx = workflow.nodes.findIndex(
				(n: WorkflowNode) => n.uuid === nodeUuid
			);
			if (idx > -1) workflow.nodes.splice(idx, 1);

			// Remove connected edges
			const toRemove: any[] = [];
			for (let i = workflow.edges.length - 1; i >= 0; i--) {
				const e: any = workflow.edges[i];
				if (
					e.sourceNodeUuid === nodeUuid ||
					e.targetNodeUuid === nodeUuid
				) {
					const removed = workflow.edges.splice(i, 1)[0];
					if (removed) toRemove.push(removed);
				}
			}

			if (toRemove.length > 0) {
				if (!workflow.deleteEdges) (workflow as any).deleteEdges = [];
				toRemove.forEach((e) => {
					const id: string = (e.uuid || e.id || "") as string;
					if (id) (workflow as any).deleteEdges.push(id);
				});
			}

			// Clear selection
			if (selectedWfNode?.uuid === nodeUuid) {
				setSelectedWfNode(undefined);
				setHidePropertyPanel(true);
			}

			renderGraph();
			onDeleteNode?.(nodeUuid);
		},
		[workflow, selectedWfNode, renderGraph, onDeleteNode]
	);

	// Handle update node
	const handleUpdateNode = useCallback(() => {
		renderGraph();
	}, [renderGraph]);

	return (
		<DeleteNodeContext.Provider value={handleDeleteNode}>
			<div className="w-full flex overflow-hidden bg-gray-100" style={{ height: "100%" }}>
				{/* Left Panel */}
				<LeftPanel components={wfComponents} />

				{/* Canvas Area */}
				<div
					ref={reactFlowWrapper}
					className="flex-1 relative"
					style={{ height: "100%", minHeight: "500px" }}
					onDrop={onDrop}
					onDragOver={onDragOver}
				>
					<ReactFlow
						nodes={uiWorkflow.nodes}
						edges={uiWorkflow.edges}
						nodeTypes={nodeTypes}
						edgeTypes={edgeTypes}
						onNodesChange={onNodesChange}
						onEdgesChange={onEdgesChange}
						onConnect={onConnect}
						onNodeClick={onNodeClick}
						onEdgeClick={onEdgeClick}
						onPaneClick={onPaneClick}
						fitView
						snapToGrid
						snapGrid={[15, 15]}
						deleteKeyCode={null}
						selectionKeyCode={null}
						multiSelectionKeyCode={null}
						panActivationKeyCode={null}
						zoomActivationKeyCode={null}
						defaultEdgeOptions={{
							type: "special",
							animated: true,
						}}
						style={{ width: "100%", height: "100%" }}
					>
						<Background />
						<Controls />
						<MiniMap
							nodeStrokeWidth={3}
							zoomable
							pannable
						/>
					</ReactFlow>

				{/* Right Panel */}
				<RightPanel
					workflow={workflow}
					uiWorkflow={uiWorkflow}
					hidePropertyPanel={hidePropertyPanel}
					wfNode={selectedWfNode}
					onUpdateNode={handleUpdateNode}
					onDeleteNode={handleDeleteNode}
				/>

				{/* Toolbar */}
				<div className="absolute right-5 top-4 flex gap-3 z-10">
					<Button
						className="h-9 px-5 rounded-md text-sm font-medium shadow-md hover:shadow-lg transition-all"
						disabled={saving}
						onClick={handleSave}
					>
						{saving ? (
							<>
								<Icon
									icon="mdi:loading"
									size={16}
									className="mr-2 animate-spin"
								/>
								{t("workflowDesigner.saving")}
							</>
						) : (
							<>
								<Icon icon="mdi:content-save" size={16} className="mr-2" />
								{t("workflowDesigner.save")}
							</>
						)}
					</Button>
				</div>
			</div>
		</div>
		</DeleteNodeContext.Provider>
	);
}

export function WorkflowDesigner(props: WorkflowDesignerProps) {
	return (
		<ReactFlowProvider>
			<WorkflowDesignerInner {...props} />
		</ReactFlowProvider>
	);
}
