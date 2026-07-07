import i18n from "@/locales/i18n";
import type { WorkflowInfo, WorkflowNode, WorkflowEdge, WorkflowComponent, UIWorkflow, OutputParamDefinition } from "../types";

function deepClone<T>(value: T): T {
	try {
		return structuredClone(value);
	} catch {
		return JSON.parse(JSON.stringify(value));
	}
}

function createUuid(): string {
	return "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".replace(/x/g, () =>
		Math.floor(Math.random() * 16).toString(16)
	);
}

export function emptyWorkflowInfo(): WorkflowInfo {
	return {
		uuid: "default",
		title: "",
		nodes: [],
		edges: [],
		deleteNodes: [],
		deleteEdges: [],
	};
}

export function emptyWorkflowNode(): WorkflowNode {
	return {
		uuid: createUuid(),
		title: "",
		workflowUuid: "default",
		wfComponent: { name: "Start", title: "开始" },
		inputConfig: { user_inputs: [], ref_inputs: [] },
		nodeConfig: {},
		outputConfig: {},
		positionX: 0,
		positionY: 0,
	};
}

export function getDefaultOutputConfig(name: string): { outputs: OutputParamDefinition[] } {
	const key = (name || "").toLowerCase();
	const t = i18n.t;
	const configs: Record<string, { outputs: OutputParamDefinition[] }> = {
		start: {
			outputs: [
				{ name: "text", type: "string", label: t("workflowDesigner.userInputText"), fixed: true },
				{ name: "files", type: "array", label: t("workflowDesigner.userUploadFiles"), fixed: true },
				{ name: "conversationId", type: "string", label: t("workflowDesigner.sessionId"), fixed: true },
				{ name: "appId", type: "string", label: t("workflowDesigner.appId"), fixed: true },
			],
		},
		llm: {
			outputs: [
				{ name: "llm_output", type: "string", label: t("workflowDesigner.modelOutput"), fixed: true },
				{ name: "input_tokens", type: "number", label: t("workflowDesigner.inputTokens"), fixed: true },
				{ name: "output_tokens", type: "number", label: t("workflowDesigner.outputTokens"), fixed: true },
			],
		},
		multimodalllm: {
			outputs: [
				{ name: "llm_output", type: "string", label: t("workflowDesigner.modelOutput"), fixed: true },
				{ name: "input_tokens", type: "number", label: t("workflowDesigner.inputTokens"), fixed: true },
				{ name: "output_tokens", type: "number", label: t("workflowDesigner.outputTokens"), fixed: true },
			],
		},
		knowledgeretrieval: {
			outputs: [
				{ name: "retrieval_result", type: "string", label: t("workflowDesigner.retrievalResult"), fixed: true },
				{ name: "doc_count", type: "number", label: t("workflowDesigner.docCount"), fixed: true },
			],
		},
		kgretrieval: {
			outputs: [
				{ name: "retrieval_result", type: "string", label: t("workflowDesigner.retrievalResult"), fixed: true },
			],
		},
		documentextractor: {
			outputs: [
				{ name: "tool_output", type: "string", label: t("workflowDesigner.extractResult"), fixed: true },
			],
		},
		ifelse: {
			outputs: [
				{ name: "branch_result", type: "string", label: t("workflowDesigner.branchResult"), fixed: true },
			],
		},
		end: {
			outputs: [
				{ name: "final_output", type: "string", label: t("workflowDesigner.finalOutput"), fixed: true },
			],
		},
	};

	return configs[key] || {
		outputs: [
			{ name: "tool_output", type: "string", label: t("workflowDesigner.execResult"), fixed: true },
			{ name: "status", type: "string", label: t("workflowDesigner.execStatus"), fixed: true },
		],
	};
}

export function getDefaultNodeConfig(name: string, _workflow: WorkflowInfo): Record<string, any> {
	const key = (name || "").toLowerCase();
	const defaults: Record<string, any> = {
		start: { prologue: "" },
		end: { result: "" },
		llm: { prompt: "", modelId: "", modelName: "" },
		multimodalllm: { prompt: "", modelId: "", modelName: "" },
		answer: { prompt: "", model_name: "", category: "" },
		template: { content: "" },
		switcher: { cases: [], default_target_node_uuid: "" },
		ifelse: { cases: [], default_target_node_uuid: "" },
		keywordextractor: { model_name: "", top_n: 5 },
		knowledgeretrieval: { knowledgeIds: [], topK: 5, similarityThreshold: 0.7 },
		documentextractor: { extractionMethod: "auto", inputVariable: "" },
		faqextractor: { model_name: "", top_n: 5 },
		classifier: { classes: [] },
		dalle3: { size: "", quality: "" },
		tongyiwanx: { model_name: "", size: "" },
		google: { country: "cn", language: "zh-cn", top_n: 5 },
		humanfeedback: { tip: "" },
		mailsend: { to_mails: "", subject: "" },
		httprequest: { method: "GET", url: "" },
		datetimetool: {},
		websearchtool: { resultCount: 5 },
		httprequesttool: { defaultUrl: "", defaultMethod: "GET", defaultHeaders: "", defaultBody: "" },
		customtool: { toolIds: [] },
		commandexectool: { command: "" },
	};
	return defaults[key] ?? {};
}

export function createNewNode(
	workflow: WorkflowInfo,
	uiWorkflow: UIWorkflow,
	component: WorkflowComponent,
	position: { x: number; y: number }
) {
	const newWfNode = emptyWorkflowNode();
	newWfNode.uuid = createUuid();
	newWfNode.title = component.title;
	newWfNode.workflowUuid = workflow.uuid;
	newWfNode.workflowId = workflow.id;
	newWfNode.wfComponent = component;
	newWfNode.workflowComponentId = component.id;
	newWfNode.inputConfig = { user_inputs: [], ref_inputs: [] };
	newWfNode.nodeConfig = deepClone(getDefaultNodeConfig(component.name, workflow) || {});
	newWfNode.outputConfig = getDefaultOutputConfig(component.name);
	newWfNode.positionX = position.x;
	newWfNode.positionY = position.y;

	workflow.nodes.push(newWfNode);
	uiWorkflow.nodes.push(wfNodeToUiNode(newWfNode));
}

export function createNewEdge(params: {
	workflow: WorkflowInfo;
	uiWorkflow: UIWorkflow;
	source: string;
	sourceHandle: string;
	target: string;
}) {
	const wfEdge: WorkflowEdge = {
		id: "",
		uuid: createUuid(),
		workflowUuid: params.workflow.uuid,
		sourceNodeUuid: params.source,
		sourceHandle: params.sourceHandle,
		targetNodeUuid: params.target,
	};
	params.workflow.edges.push(wfEdge);
	if (params.target) {
		const uiEdge = {
			id: wfEdge.uuid,
			source: wfEdge.sourceNodeUuid,
			target: wfEdge.targetNodeUuid,
			type: "special",
			animated: true,
			sourceHandle: params.sourceHandle ? params.sourceHandle : undefined,
			data: wfEdge,
		};
		params.uiWorkflow.edges.push(uiEdge);
	}
}

export function updateEdgeBySourceHandle(params: {
	workflow: WorkflowInfo;
	uiWorkflow: UIWorkflow;
	source: string;
	sourceHandle: string;
	target: string;
}) {
	const wfEdge = params.workflow.edges.find(
		(item) => item.sourceHandle === params.sourceHandle
	);
	if (!wfEdge) return;
	wfEdge.targetNodeUuid = params.target;
	const idx = (params.uiWorkflow.edges as any[]).findIndex(
		(item: any) =>
			item.source === params.source &&
			item.sourceHandle === params.sourceHandle
	);
	if (idx > -1) (params.uiWorkflow.edges as any[]).splice(idx, 1);
	const uiEdge = {
		id: wfEdge.uuid,
		source: wfEdge.sourceNodeUuid,
		target: wfEdge.targetNodeUuid,
		animated: true,
		sourceHandle: params.sourceHandle,
	};
	(params.uiWorkflow.edges as any[]).push(uiEdge);
}

export function deleteEdgesBySourceHandle(
	workflow: WorkflowInfo,
	uiWorkflow: UIWorkflow,
	source: string,
	sourceHandle: string
) {
	const edgeIndex = workflow.edges.findIndex((edge) => {
		const hit =
			edge.sourceNodeUuid === source && edge.sourceHandle === sourceHandle;
		if (hit && !workflow.deleteEdges) workflow.deleteEdges = [];
		if (hit) workflow.deleteEdges!.push(edge.uuid);
		return hit;
	});
	if (edgeIndex !== -1) workflow.edges.splice(edgeIndex, 1);
	const uiEdgeIndex = (uiWorkflow.edges as any[]).findIndex(
		(edge: any) =>
			edge.sourceNodeUuid === source && edge.sourceHandle === sourceHandle
	);
	if (uiEdgeIndex !== -1)
		(uiWorkflow.edges as any[]).splice(uiEdgeIndex, 1);
}

function wfNodeToUiNode(node: WorkflowNode) {
	return {
		id: node.uuid,
		type: node.wfComponent?.name.toLowerCase() ?? "",
		data: node,
		position: { x: node.positionX, y: node.positionY },
	};
}

export function getIconByComponentName(name: string): string {
	switch (name.toLowerCase()) {
		case "llm":
			return "carbon:chat-bot";
		case "multimodalllm":
			return "mdi:brain";
		case "answer":
			return "carbon:question-answering";
		case "classifier":
			return "carbon:type-pattern";
		case "knowledgeretrieval":
			return "carbon:connect-target";
		case "kgretrieval":
			return "carbon:network-4";
		case "documentextractor":
			return "carbon:ibm-knowledge-catalog-standard";
		case "keywordextractor":
			return "carbon:api-key";
		case "faqextractor":
			return "fluent-mdl2:book-answers";
		case "switcher":
			return "oui:logstash-if";
		case "ifelse":
			return "oui:logstash-if";
		case "template":
			return "carbon:prompt-template";
		case "dalle3":
			return "solar:pallete-2-linear";
		case "tongyiwanx":
			return "solar:pallete-2-linear";
		case "google":
			return "ri:google-line";
		case "humanfeedback":
			return "covid:transmission-virus-human-transmit-2";
		case "mailsend":
			return "carbon:mail-all";
		case "httprequest":
			return "carbon:http";
		case "datetimetool":
			return "carbon:time";
		case "websearchtool":
			return "carbon:search";
		case "httprequesttool":
			return "carbon:http";
		case "customtool":
			return "carbon:tools";
		case "commandexectool":
			return "carbon:terminal";
		case "end":
			return "carbon:closed-caption";
		case "start":
			return "carbon:play-outline";
		default:
			return "carbon:circle-filled";
	}
}

export interface WorkflowValidationError {
	nodeUuid: string;
	message: string;
	severity: 'error' | 'warning';
}

export function validateWorkflow(workflow: WorkflowInfo): WorkflowValidationError[] {
	const errors: WorkflowValidationError[] = [];

	// Build edge maps
	const edgesBySource = new Map<string, typeof workflow.edges>();
	const edgesByTarget = new Map<string, typeof workflow.edges>();

	workflow.edges.forEach(edge => {
		if (!edgesBySource.has(edge.sourceNodeUuid)) {
			edgesBySource.set(edge.sourceNodeUuid, []);
		}
		edgesBySource.get(edge.sourceNodeUuid)!.push(edge);

		if (!edgesByTarget.has(edge.targetNodeUuid)) {
			edgesByTarget.set(edge.targetNodeUuid, []);
		}
		edgesByTarget.get(edge.targetNodeUuid)!.push(edge);
	});

	// Check each node
	workflow.nodes.forEach(node => {
		const outEdges = edgesBySource.get(node.uuid) || [];

		// Check for parallel branches (multiple outgoing edges)
		if (outEdges.length > 1) {
			// Check if this is an IfElse node (allowed to have multiple edges)
			const isIfElse = node.wfComponent.name.toLowerCase() === 'ifelse';
			if (!isIfElse) {
				// This node has parallel branches - check if all paths lead to valid end nodes
				const hasEndNode = checkPathsToEnd(node.uuid, workflow.nodes, edgesBySource);
				if (!hasEndNode) {
					errors.push({
						nodeUuid: node.uuid,
						message: i18n.t('workflowDesigner.parallelBranchNoEnd'),
						severity: 'error'
					});
				}
			}
		}

		// Check end node configuration
		if (node.wfComponent.name.toLowerCase() === 'end') {
			const config = node.nodeConfig?.output_config;
			if (!config || !config.mode) {
				errors.push({
					nodeUuid: node.uuid,
					message: i18n.t('workflowDesigner.endNodeRequiresConfig'),
					severity: 'error'
				});
			}
		}
	});

	return errors;
}

function checkPathsToEnd(
	startNodeUuid: string,
	nodes: WorkflowNode[],
	edgesBySource: Map<string, WorkflowEdge[]>
): boolean {
	const visited = new Set<string>();
	const queue = [startNodeUuid];

	while (queue.length > 0) {
		const currentUuid = queue.shift()!;

		if (visited.has(currentUuid)) {
			continue;
		}
		visited.add(currentUuid);

		const node = nodes.find(n => n.uuid === currentUuid);
		if (!node) continue;

		// Check if this is an end node
		if (node.wfComponent.name.toLowerCase() === 'end') {
			return true;
		}

		// Add next nodes to queue
		const outEdges = edgesBySource.get(currentUuid) || [];
		outEdges.forEach(edge => {
			if (!visited.has(edge.targetNodeUuid)) {
				queue.push(edge.targetNodeUuid);
			}
		});
	}

	return false;
}

export function getIconColorByComponentName(name: string): string {
	switch (name.toLowerCase()) {
		case "llm":
			return "#7c3aed";
		case "multimodalllm":
			return "#2563eb";
		case "answer":
			return "#16a34a";
		case "classifier":
			return "#7c3aed";
		case "knowledgeretrieval":
			return "#292524";
		case "kgretrieval":
			return "#0d9488";
		case "documentextractor":
			return "#be123c";
		case "keywordextractor":
			return "#0e7490";
		case "faqextractor":
			return "#0d9488";
		case "switcher":
			return "#854d0e";
		case "ifelse":
			return "#854d0e";
		case "template":
			return "#0369a1";
		case "dalle3":
			return "#a21caf";
		case "tongyiwanx":
			return "#a21caf";
		case "google":
			return "#065f46";
		case "humanfeedback":
			return "#3f3f46";
		case "mailsend":
			return "#92400e";
		case "httprequest":
			return "#334155";
		case "datetimetool":
			return "#0d9488";
		case "websearchtool":
			return "#2563eb";
		case "httprequesttool":
			return "#334155";
		case "customtool":
			return "#722ed1";
		case "commandexectool":
			return "#dc2626";
		case "end":
			return "#9a3412";
		case "start":
			return "#1e40af";
		default:
			return "#6b7280";
	}
}

export function getComponentNameByWorkflowComponentId(
	workflowComponentId: number | string
): string {
	const id = Number(workflowComponentId);
	switch (id) {
		case 1: return "Start";
		case 2: return "End";
		case 3: return "Answer";
		case 4: return "Classifier";
		case 5: return "KeywordExtractor";
		case 6: return "KnowledgeRetrieval";
		case 7: return "DocumentExtractor";
		case 8: return "FaqExtractor";
		case 9: return "Switcher";
		case 10: return "Template";
		case 11: return "Dalle3";
		case 12: return "TongyiWanx";
		case 13: return "Google";
		case 14: return "HumanFeedback";
		case 15: return "MailSend";
		case 16: return "HttpRequest";
		case 17: return "KgRetrieval";
		default: return "Unknown";
	}
}

export function getNameByInputType(type: number): string {
	const t = i18n.t;
	switch (type) {
		case 1:
			return t("workflowDesigner.text");
		case 2:
			return t("workflowDesigner.number");
		case 3:
			return t("workflowDesigner.dropdown");
		case 4:
			return t("workflowDesigner.fileList");
		case 5:
			return t("workflowDesigner.boolean");
		default:
			return "Unknown";
	}
}
