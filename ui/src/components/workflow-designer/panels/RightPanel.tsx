import { useState, useEffect } from "react";
import { Input, Switch, Select, Table, Button, Modal, InputNumber, Collapse, Checkbox, Tag } from "antd";
import Editor from "@monaco-editor/react";
import type { ColumnsType } from "antd/es/table";
import i18n from "@/locales/i18n";
import { Icon } from "@/components/icon";
import { listModelsApi, ModelTypeEnum } from "@/api/services/llmModelService";
import { listKnowledgeApi } from "@/api/services/llmKnowledgeService";
import { getToolListApi, type AigcTool } from "@/api/services/llmToolService";
import type { WorkflowInfo, WorkflowNode, UIWorkflow, NodeIODefinition, OutputParamDefinition, EndNodeOutputConfig, BranchOutputConfig } from "../types";
import {
	getIconByComponentName,
	getIconColorByComponentName,
	getNameByInputType,
	createNewEdge,
	updateEdgeBySourceHandle,
	deleteEdgesBySourceHandle,
	getDefaultOutputConfig,
} from "../utils/workflow-util";
import { getConditionOperators, getLogicOperators } from "../utils/operators";

const t = i18n.t;

function createUuid(): string {
	return "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".replace(/x/g, () =>
		Math.floor(Math.random() * 16).toString(16)
	);
}

interface RightPanelProps {
	workflow: WorkflowInfo;
	uiWorkflow: UIWorkflow;
	hidePropertyPanel: boolean;
	wfNode?: WorkflowNode;
	onUpdateNode?: (node: WorkflowNode) => void;
	onDeleteNode?: (nodeUuid: string) => void;
}

function GenericNodeProperty({ workflow, wfNode }: { workflow: WorkflowInfo; wfNode: WorkflowNode }) {
	const entries = Object.entries(wfNode.nodeConfig || {});
	const getVal = (key: string) => (wfNode.nodeConfig as any)[key];
	const setVal = (key: string, value: any) => { (wfNode.nodeConfig as any)[key] = value; };
	const toJson = (val: any) => { try { return JSON.stringify(val, null, 2); } catch { return ""; } };
	const setFromJson = (key: string, json: string) => { try { (wfNode.nodeConfig as any)[key] = JSON.parse(json); } catch {} };

	return (
		<div className="px-2 space-y-3">
			<WfVariableSelector workflow={workflow} wfNode={wfNode} excludeNodes={[wfNode.uuid]} />
			<div className="text-base font-bold">{t("workflowDesigner.nodeParameters")}</div>
			{entries.length === 0 && <div className="text-neutral-400">{t("workflowDesigner.noEditableParams")}</div>}
			{entries.map(([k, v]) => (
				<div key={k} className="space-y-1">
					<div className="text-xs text-neutral-500">{k}</div>
					{typeof v === "boolean" ? (
						<Switch checked={getVal(k)} onChange={(val) => setVal(k, val)} />
					) : typeof v === "number" ? (
						<InputNumber value={getVal(k)} onChange={(val) => setVal(k, val)} className="w-full" />
					) : typeof v === "string" ? (
						<Input value={getVal(k)} onChange={(e) => setVal(k, e.target.value)} />
					) : Array.isArray(v) || (typeof v === "object" && v !== null) ? (
						<Input.TextArea value={toJson(getVal(k))} autoSize={{ minRows: 3, maxRows: 12 }} onChange={(e) => setFromJson(k, e.target.value)} />
					) : (
						<div className="text-neutral-400">Unsupported</div>
					)}
				</div>
			))}
		</div>
	);
}

function StartNodeProperty({ wfNode }: { workflow: WorkflowInfo; wfNode: WorkflowNode }) {
	const [showModal, setShowModal] = useState(false);
	const [tmpItem, setTmpItem] = useState<NodeIODefinition>({ uuid: "", type: 1, name: "", title: "", required: false, multiple: false, limit: 10 });
	const [, forceUpdate] = useState(0);

	if (!wfNode.inputConfig) (wfNode as any).inputConfig = { user_inputs: [], ref_inputs: [] };
	if (!Array.isArray(wfNode.inputConfig.user_inputs)) (wfNode as any).inputConfig.user_inputs = [];
	if (!wfNode.nodeConfig) (wfNode as any).nodeConfig = {};
	if ((wfNode.nodeConfig as any).prologue === undefined) (wfNode.nodeConfig as any).prologue = "";

	const userInputs = wfNode.inputConfig.user_inputs || [];
	const typeOptions = [{ label: t("workflowDesigner.text"), value: 1 }, { label: t("workflowDesigner.number"), value: 2 }, { label: t("workflowDesigner.file"), value: 4 }, { label: t("workflowDesigner.boolean"), value: 5 }];

	const handleEdit = (row: NodeIODefinition) => { setShowModal(true); setTmpItem({ ...row }); };
	const handleDelete = (row: NodeIODefinition) => {
		const idx = userInputs.findIndex((item: NodeIODefinition) => item.uuid === row.uuid);
		if (idx > -1) { userInputs.splice(idx, 1); (wfNode as any).inputConfig = { ...wfNode.inputConfig, user_inputs: [...userInputs] }; }
	};
	const handleShowModal = () => { setShowModal(true); setTmpItem({ uuid: createUuid(), type: 1, name: "", title: "", required: false, multiple: false, limit: 10 }); };
	const handleSubmit = () => {
		setShowModal(false);
		const idx = userInputs.findIndex((item: NodeIODefinition) => item.uuid === tmpItem.uuid);
		if (idx > -1) { userInputs.splice(idx, 1, { ...tmpItem }); } else { userInputs.push({ ...tmpItem }); }
		(wfNode as any).inputConfig = { ...wfNode.inputConfig, user_inputs: [...userInputs] };
		setTmpItem({ uuid: "", type: 1, name: "", title: "", required: false, multiple: false, limit: 10 });
	};

	const columns: ColumnsType<NodeIODefinition> = [
		{ title: t("workflowDesigner.variableName"), dataIndex: "name", key: "name" },
		{ title: t("workflowDesigner.title"), dataIndex: "title", key: "title" },
		{ title: t("workflowDesigner.typeLabel"), dataIndex: "type", key: "type", render: (type: number) => getNameByInputType(type) },
		{ title: t("workflowDesigner.requiredLabel"), dataIndex: "required", key: "required", render: (r: boolean) => (r ? t("workflowDesigner.yes") : t("workflowDesigner.no")) },
		{ title: t("workflowDesigner.actions"), key: "actions", render: (_, record) => (
			<div className="flex gap-2">
				<Icon icon="carbon:edit" className="cursor-pointer text-base" onClick={() => handleEdit(record)} />
				<Icon icon="carbon:delete" className="cursor-pointer text-base" onClick={() => handleDelete(record)} />
			</div>
		)},
	];

	return (
		<div className="flex flex-col w-full space-y-1">
			<div>
				<div className="text-xl mb-1">{t("workflowDesigner.prologue")}</div>
				<Input.TextArea value={(wfNode.nodeConfig as any).prologue} onChange={(e) => { (wfNode.nodeConfig as any).prologue = e.target.value; forceUpdate((n) => n + 1); }} autoSize={{ minRows: 2, maxRows: 6 }} />
			</div>
			<br />
			<Collapse defaultActiveKey={["1"]} items={[{ key: "1", label: t("workflowDesigner.input"), children: <Table columns={columns} dataSource={userInputs} pagination={false} rowKey="uuid" size="small" /> }]} />
			<br />
			<Button onClick={handleShowModal}>{t("workflowDesigner.add")}</Button>
			<Modal open={showModal} title={t("workflowDesigner.variableSettings")} width="600px" onOk={handleSubmit} onCancel={() => setShowModal(false)} okButtonProps={{ disabled: !tmpItem.name || !tmpItem.title }}>
				<div className="flex flex-col w-full justify-between space-y-4">
					<div>{t("workflowDesigner.type")}<Select value={tmpItem.type} onChange={(val) => setTmpItem({ ...tmpItem, type: val })} options={typeOptions} className="w-full" /></div>
					<div>{t("workflowDesigner.name")}<Input value={tmpItem.name} maxLength={50} showCount onChange={(e) => setTmpItem({ ...tmpItem, name: e.target.value })} /></div>
					<div>{t("workflowDesigner.displayName")}<Input value={tmpItem.title} maxLength={50} showCount onChange={(e) => setTmpItem({ ...tmpItem, title: e.target.value })} /></div>
					<div className="flex items-center gap-2">{t("workflowDesigner.required")}<Switch checked={tmpItem.required} onChange={(val) => setTmpItem({ ...tmpItem, required: val })} size="small" /></div>
					{tmpItem.type === 3 && <div className="flex items-center gap-2">{t("workflowDesigner.multiple")}<Switch checked={tmpItem.multiple} onChange={(val) => setTmpItem({ ...tmpItem, multiple: val })} /></div>}
					{tmpItem.type === 4 && <div>{t("workflowDesigner.maxFileCount")}<InputNumber value={tmpItem.limit} onChange={(val) => setTmpItem({ ...tmpItem, limit: val || 10 })} className="w-full" /></div>}
				</div>
			</Modal>
			<br />
			<OutputParamsTable wfNode={wfNode} />
		</div>
	);
}

function WfVariableSelector({ workflow, wfNode, excludeNodes = [] }: { workflow: WorkflowInfo; wfNode: WorkflowNode; excludeNodes?: string[] }) {
	if (!wfNode.inputConfig) (wfNode as any).inputConfig = { user_inputs: [], ref_inputs: [] };
	if (!Array.isArray(wfNode.inputConfig.ref_inputs)) (wfNode as any).inputConfig.ref_inputs = [];

	const [, forceUpdate] = useState(0);
	const refInputs = wfNode.inputConfig.ref_inputs || [];

	// Collect upstream nodes and their output params
	const upstreamOptions: Array<{ label: string; value: string; nodeUuid: string; paramName: string }> = [];
	for (const node of workflow.nodes) {
		if (!node.uuid || !node.wfComponent) continue;
		if (excludeNodes.includes(node.uuid) || node.wfComponent.name === "End") continue;
		// Get outputs from outputConfig
		const outputs: OutputParamDefinition[] = (node as any).outputConfig?.outputs || getDefaultOutputConfig(node.wfComponent.name).outputs;
		for (const out of outputs) {
			upstreamOptions.push({
				label: `${node.title || node.wfComponent.name} → ${out.label || out.name}`,
				value: `${node.uuid}::${out.name}`,
				nodeUuid: node.uuid,
				paramName: out.name,
			});
		}
	}

	const handleAdd = (val: string) => {
		const option = upstreamOptions.find((o) => o.value === val);
		if (!option) return;
		if (refInputs.some((r: any) => r.source_node_uuid === option.nodeUuid && r.source_param === option.paramName)) return;
		refInputs.push({
			name: option.paramName,
			source_node_uuid: option.nodeUuid,
			source_param: option.paramName,
		});
		(wfNode as any).inputConfig = { ...wfNode.inputConfig, ref_inputs: [...refInputs] };
		forceUpdate((n) => n + 1);
	};

	const handleRemove = (idx: number) => {
		refInputs.splice(idx, 1);
		(wfNode as any).inputConfig = { ...wfNode.inputConfig, ref_inputs: [...refInputs] };
		forceUpdate((n) => n + 1);
	};

	return (
		<Collapse defaultActiveKey={["vars"]} items={[{
			key: "vars",
			label: t("workflowDesigner.inputParameters"),
			children: (
				<div className="flex flex-col gap-1.5">
					{refInputs.map((ref: any, idx: number) => (
						<div key={idx} className="flex items-center gap-2">
							<span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono">{ref.name}</span>
							<span className="text-xs text-gray-400">← {ref.source_param}</span>
							<Icon icon="carbon:close" size={12} className="cursor-pointer text-red-400 ml-auto" onClick={() => handleRemove(idx)} />
						</div>
					))}
					<Select
						placeholder={t("workflowDesigner.addUpstreamParam")}
						options={upstreamOptions.map((o) => ({ label: o.label, value: o.value }))}
						onChange={handleAdd}
						className="w-full mt-1"
						size="small"
						showSearch
						optionFilterProp="label"
						allowClear
						value={undefined}
					/>
				</div>
			),
		}]} />
	);
}

function OutputParamsTable({ wfNode }: { wfNode: WorkflowNode }) {
	const [, forceUpdate] = useState(0);
	if (!wfNode.outputConfig || !wfNode.outputConfig.outputs || wfNode.outputConfig.outputs.length === 0) {
		(wfNode as any).outputConfig = getDefaultOutputConfig(wfNode.wfComponent?.name || "");
	}

	// Re-translate fixed output labels based on component name
	const componentName = wfNode.wfComponent?.name || "";
	const defaultOutputs = getDefaultOutputConfig(componentName).outputs;
	const defaultLabelMap = new Map(defaultOutputs.map((o) => [o.name, o.label]));
	const outputs: OutputParamDefinition[] = (wfNode.outputConfig?.outputs || []).map((out) =>
		out.fixed && defaultLabelMap.has(out.name) ? { ...out, label: defaultLabelMap.get(out.name)! } : out
	);

	const handleAddCustom = () => {
		outputs.push({ name: "", type: "string", label: "", fixed: false });
		(wfNode as any).outputConfig = { outputs: [...outputs] };
		forceUpdate((n) => n + 1);
	};

	const handleRemove = (idx: number) => {
		if (outputs[idx].fixed) return;
		outputs.splice(idx, 1);
		(wfNode as any).outputConfig = { outputs: [...outputs] };
		forceUpdate((n) => n + 1);
	};

	const handleUpdate = (idx: number, field: string, value: string) => {
		(outputs[idx] as any)[field] = value;
		(wfNode as any).outputConfig = { outputs: [...outputs] };
		forceUpdate((n) => n + 1);
	};

	return (
		<Collapse defaultActiveKey={[]} items={[{
			key: "outputs",
			label: t("workflowDesigner.outputParameters"),
			children: (
				<div>
					{outputs.map((out, idx) => (
						<div key={idx} className="flex items-center gap-2 mb-1.5">
							<Input
								value={out.name}
								onChange={(e) => handleUpdate(idx, "name", e.target.value)}
								placeholder={t("workflowDesigner.paramName")}
								className="flex-1"
								size="small"
								disabled={out.fixed}
							/>
							<Input
								value={out.label}
								onChange={(e) => handleUpdate(idx, "label", e.target.value)}
								placeholder={t("workflowDesigner.displayName")}
								className="flex-1"
								size="small"
								disabled={out.fixed}
							/>
							<Select
								value={out.type}
								onChange={(val) => handleUpdate(idx, "type", val)}
								options={[
									{ label: "string", value: "string" },
									{ label: "number", value: "number" },
									{ label: "array", value: "array" },
									{ label: "object", value: "object" },
								]}
								className="w-24"
								size="small"
								disabled={out.fixed}
							/>
							{!out.fixed && (
								<Icon icon="carbon:close" size={14} className="cursor-pointer text-red-500" onClick={() => handleRemove(idx)} />
							)}
							{out.fixed && <span className="text-[10px] text-gray-400">{t("workflowDesigner.fixed")}</span>}
						</div>
					))}
					<Button size="small" type="dashed" onClick={handleAddCustom} className="mt-1">
						{t("workflowDesigner.addCustomOutput")}
					</Button>
				</div>
			),
		}]} />
	);
}

function AnswerNodeProperty({ workflow, wfNode }: { workflow: WorkflowInfo; wfNode: WorkflowNode }) {
	const nodeConfig = wfNode.nodeConfig as any;
	if (nodeConfig.category === undefined) nodeConfig.category = "";
	const [modelOptions, setModelOptions] = useState<Array<{ label: string; value: string }>>([]);
	const [, forceUpdate] = useState(0);

	useEffect(() => {
		listModelsApi({ type: ModelTypeEnum.CHAT })
			.then((res) => {
				const records = res || [];
				setModelOptions(records.map((m: any) => ({
					label: m.name || m.model,
					value: m.model,
				})));
			})
			.catch(() => setModelOptions([]));
	}, []);

	return (
		<div className="flex flex-col w-full">
			<WfVariableSelector workflow={workflow} wfNode={wfNode} excludeNodes={[wfNode.uuid]} />
			<div className="mt-2">
				<div className="text-sm mb-1">{t("workflowDesigner.modelName")}</div>
				<Select
					value={nodeConfig.model_name || undefined}
					onChange={(val) => { nodeConfig.model_name = val; forceUpdate((n) => n + 1); }}
					options={modelOptions}
					showSearch
					allowClear
					placeholder={t("workflowDesigner.selectModel")}
					className="w-full"
				/>
			</div>
			<div className="mt-4">
				<div className="text-sm mb-1">{t("workflowDesigner.prompt")}<span className="text-red-500">*</span></div>
				<Input.TextArea value={nodeConfig.prompt || ""} onChange={(e) => { nodeConfig.prompt = e.target.value; forceUpdate((n) => n + 1); }} autoSize={{ minRows: 3, maxRows: 8 }} />
			</div>
		</div>
	);
}

function KeywordExtractorNodeProperty({ workflow, wfNode }: { workflow: WorkflowInfo; wfNode: WorkflowNode }) {
	const nodeConfig = wfNode.nodeConfig as any;
	const [modelOptions, setModelOptions] = useState<Array<{ label: string; value: string }>>([]);
	const [, forceUpdate] = useState(0);

	useEffect(() => {
		listModelsApi({ type: ModelTypeEnum.CHAT })
			.then((res) => {
				const records = res || [];
				setModelOptions(records.map((m: any) => ({
					label: m.name || m.model,
					value: m.model,
				})));
			})
			.catch(() => setModelOptions([]));
	}, []);

	return (
		<div className="flex flex-col w-full">
			<WfVariableSelector workflow={workflow} wfNode={wfNode} excludeNodes={[wfNode.uuid]} />
			<div className="mt-2">
				<div className="text-sm mb-1">{t("workflowDesigner.modelName")}</div>
				<Select
					value={nodeConfig.model_name || undefined}
					onChange={(val) => { nodeConfig.model_name = val; forceUpdate((n) => n + 1); }}
					options={modelOptions}
					showSearch
					allowClear
					placeholder={t("workflowDesigner.selectModel")}
					className="w-full"
				/>
			</div>
			<div className="mt-4">
				<div className="text-sm mb-1">{t("workflowDesigner.keywordCount")}</div>
				<InputNumber value={nodeConfig.top_n ?? 5} min={1} max={50} onChange={(val) => { nodeConfig.top_n = val; forceUpdate((n) => n + 1); }} className="w-full" />
			</div>
		</div>
	);
}

interface Condition { node_uuid: string; node_param_name: string; operator: string; value: string; }
interface Case { uuid: string; operator: "and" | "or"; target_node_uuid: string; conditions: Condition[]; }

function SwitcherNodeProperty({ workflow, uiWorkflow, wfNode, onUpdateNode }: { workflow: WorkflowInfo; uiWorkflow: UIWorkflow; wfNode: WorkflowNode; onUpdateNode?: (node: WorkflowNode) => void }) {
	const nodeConfig = wfNode.nodeConfig as any;
	if (!nodeConfig.cases) nodeConfig.cases = [];
	if (nodeConfig.default_target_node_uuid === undefined) nodeConfig.default_target_node_uuid = "";
	const cases: Case[] = nodeConfig.cases;
	const [, forceUpdate] = useState(0);

	const availableNodes = workflow.nodes.filter((n) => n.uuid !== wfNode.uuid && n.wfComponent?.name !== "Start").map((n) => ({ label: n.title || n.wfComponent?.title || n.uuid, value: n.uuid }));

	const sourceNodeOptions = (() => {
		const opts: Array<{ label: string; value: string }> = [];
		const startNode = workflow.nodes.find((n) => n.wfComponent?.name === "Start");
		if (startNode) opts.push({ label: `${startNode.title || t("workflowDesigner.defaultStartTitle")} (${t("workflowDesigner.startUserInput")})`, value: startNode.uuid });
		workflow.nodes.filter((n) => n.uuid !== wfNode.uuid && n.wfComponent?.name !== "Start").forEach((n) => { opts.push({ label: n.title || n.wfComponent?.title || n.uuid, value: n.uuid }); });
		return opts;
	})();

	function getParamsForNode(nodeUuid: string) {
		const node = workflow.nodes.find((n) => n.uuid === nodeUuid);
		if (!node) return [];
		if (node.wfComponent?.name === "Start") return node.inputConfig?.user_inputs?.map((input) => ({ label: input.title || input.name, value: input.name })) || [];
		return [{ label: t("workflowDesigner.outputResult"), value: "output" }, { label: t("workflowDesigner.status"), value: "status" }];
	}

	function onAddCase() {
		const uuid = createUuid();
		const startNode = workflow.nodes.find((n) => n.wfComponent?.name === "Start");
		const firstParam = startNode?.inputConfig?.user_inputs?.[0]?.name || "";
		cases.push({ uuid, operator: "and", target_node_uuid: "", conditions: [{ node_uuid: startNode?.uuid || "", node_param_name: firstParam, operator: "contains", value: "" }] });
		createNewEdge({ workflow, uiWorkflow, source: wfNode.uuid, sourceHandle: uuid, target: "" });
		forceUpdate((n) => n + 1);
		onUpdateNode?.(wfNode);
	}

	function onDeleteCase(caseItem: Case) {
		const idx = cases.findIndex((item) => item.uuid === caseItem.uuid);
		if (idx >= 0) { deleteEdgesBySourceHandle(workflow, uiWorkflow, wfNode.uuid, caseItem.uuid); cases.splice(idx, 1); forceUpdate((n) => n + 1); onUpdateNode?.(wfNode); }
	}

	function onCaseTargetSelected(caseItem: Case, nodeUuid: string) {
		caseItem.target_node_uuid = nodeUuid;
		const existingEdge = workflow.edges.find((e) => e.sourceNodeUuid === wfNode.uuid && e.sourceHandle === caseItem.uuid);
		if (existingEdge) {
			updateEdgeBySourceHandle({ workflow, uiWorkflow, source: wfNode.uuid, sourceHandle: caseItem.uuid, target: nodeUuid });
		} else {
			createNewEdge({ workflow, uiWorkflow, source: wfNode.uuid, sourceHandle: caseItem.uuid, target: nodeUuid });
		}
		onUpdateNode?.(wfNode);
	}

	function onDefaultTargetSelected(nodeUuid: string) {
		nodeConfig.default_target_node_uuid = nodeUuid;
		const existingEdge = workflow.edges.find((e) => e.sourceNodeUuid === wfNode.uuid && e.sourceHandle === "default");
		if (existingEdge) {
			updateEdgeBySourceHandle({ workflow, uiWorkflow, source: wfNode.uuid, sourceHandle: "default", target: nodeUuid });
		} else if (nodeUuid) {
			createNewEdge({ workflow, uiWorkflow, source: wfNode.uuid, sourceHandle: "default", target: nodeUuid });
		}
		onUpdateNode?.(wfNode);
	}

	function onAddCondition(caseItem: Case) {
		const startNode = workflow.nodes.find((n) => n.wfComponent?.name === "Start");
		const firstParam = startNode?.inputConfig?.user_inputs?.[0]?.name || "";
		caseItem.conditions.push({ node_uuid: startNode?.uuid || "", node_param_name: firstParam, operator: "contains", value: "" });
		forceUpdate((n) => n + 1);
		onUpdateNode?.(wfNode);
	}

	function onDeleteCondition(caseItem: Case, conditionIndex: number) {
		if (caseItem.conditions.length > 1) { caseItem.conditions.splice(conditionIndex, 1); forceUpdate((n) => n + 1); onUpdateNode?.(wfNode); }
	}

	function onSourceNodeChange(condition: Condition, nodeUuid: string) {
		condition.node_uuid = nodeUuid;
		const params = getParamsForNode(nodeUuid);
		condition.node_param_name = params[0]?.value || "";
		forceUpdate((n) => n + 1);
		onUpdateNode?.(wfNode);
	}

	function hasInvalidConfig(caseItem: Case): boolean {
		return !caseItem.target_node_uuid || caseItem.conditions.some((c) => !c.node_uuid || !c.node_param_name || (!["empty", "not empty"].includes(c.operator) && !c.value));
	}

	const collapseItems = cases.map((caseItem, caseIdx) => ({
		key: caseItem.uuid,
		label: (
			<div className="flex justify-between items-center w-full pr-2">
				<div className="flex items-center gap-2.5">
					<span className={`inline-flex items-center justify-center min-w-[24px] h-6 rounded-md text-xs font-semibold px-1.5 text-white ${hasInvalidConfig(caseItem) ? "bg-gradient-to-br from-red-500 to-red-600" : "bg-gradient-to-br from-blue-500 to-blue-600"}`}>
						{caseIdx + 1}{hasInvalidConfig(caseItem) && <span className="ml-0.5 text-[10px]">⚠</span>}
					</span>
					<span className="text-sm font-semibold text-gray-700">{t("workflowDesigner.branch", { index: caseIdx + 1 })}</span>
				</div>
				<span className="text-xs text-gray-500">{t("workflowDesigner.conditionCount", { count: caseItem.conditions.length, operator: caseItem.operator.toUpperCase() })}</span>
			</div>
		),
		extra: <Icon icon="carbon:delete" className="cursor-pointer text-red-500 hover:text-red-700" size={16} onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDeleteCase(caseItem); }} />,
		children: (
			<div className="flex flex-col gap-4 p-1">
				<div>
					<label className="text-xs font-semibold text-gray-700 mb-1 block">{t("workflowDesigner.conditionCombination")}</label>
					<Select value={caseItem.operator} onChange={(val) => { caseItem.operator = val; forceUpdate((n) => n + 1); onUpdateNode?.(wfNode); }} options={getLogicOperators() as any} size="small" className="w-full" />
				</div>
				<div>
					<label className="text-xs font-semibold text-gray-700 mb-2 block">{t("workflowDesigner.conditionList")}</label>
					<div className="flex flex-col gap-3">
						{caseItem.conditions.map((condition, condIdx) => (
							<div key={condIdx} className="border border-gray-200 rounded-lg p-3 relative hover:border-blue-300 hover:shadow-sm transition-all">
								<div className="mb-2">
									<label className="text-[11px] text-gray-500 font-medium mb-1 block">{t("workflowDesigner.sourceNode")}</label>
									<Select value={condition.node_uuid || undefined} options={sourceNodeOptions} size="small" placeholder={t("workflowDesigner.selectNode")} onChange={(val: string) => onSourceNodeChange(condition, val)} className="w-full" />
								</div>
								<div className="mb-2">
									<label className="text-[11px] text-gray-500 font-medium mb-1 block">{t("workflowDesigner.parameter")}</label>
									<Select value={condition.node_param_name || undefined} options={getParamsForNode(condition.node_uuid)} size="small" placeholder={t("workflowDesigner.selectParam")} onChange={(val: string) => { condition.node_param_name = val; forceUpdate((n) => n + 1); onUpdateNode?.(wfNode); }} className="w-full" />
								</div>
								<div className="mb-2">
									<label className="text-[11px] text-gray-500 font-medium mb-1 block">{t("workflowDesigner.operator")}</label>
									<Select value={condition.operator} options={getConditionOperators() as any} size="small" onChange={(val: string) => { condition.operator = val; forceUpdate((n) => n + 1); onUpdateNode?.(wfNode); }} className="w-full" />
								</div>
								{!["empty", "not empty"].includes(condition.operator) && (
									<div className="mb-1">
										<label className="text-[11px] text-gray-500 font-medium mb-1 block">{t("workflowDesigner.comparisonValue")}{!condition.value && <span className="text-red-500 ml-1">*</span>}</label>
										<Input value={condition.value} size="small" placeholder={t("workflowDesigner.inputComparisonValue")} onChange={(e) => { condition.value = e.target.value; forceUpdate((n) => n + 1); onUpdateNode?.(wfNode); }} />
									</div>
								)}
								{caseItem.conditions.length > 1 && (
									<div className="flex justify-end mt-1">
										<Button size="small" type="text" danger onClick={() => onDeleteCondition(caseItem, condIdx)}>{t("workflowDesigner.deleteCondition")}</Button>
									</div>
								)}
							</div>
						))}
					</div>
					<Button size="small" type="dashed" block className="mt-2" onClick={() => onAddCondition(caseItem)}>{t("workflowDesigner.addCondition")}</Button>
				</div>
				<div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
				<div>
					<label className="text-xs font-semibold text-gray-700 mb-1 block">{t("workflowDesigner.jumpToNode")}{!caseItem.target_node_uuid && <span className="text-red-500 ml-1">*</span>}</label>
					<Select value={caseItem.target_node_uuid || undefined} options={availableNodes} size="small" placeholder={t("workflowDesigner.selectTargetNode")} allowClear onChange={(val: string) => onCaseTargetSelected(caseItem, val || "")} className="w-full" />
					{!caseItem.target_node_uuid && <div className="text-xs text-red-500 mt-1.5 px-2 py-1.5 bg-red-50 rounded border-l-3 border-red-500">{t("workflowDesigner.targetNodeRequired")}</div>}
				</div>
			</div>
		),
	}));

	return (
		<div className="flex flex-col w-full gap-5 px-1">
			<WfVariableSelector workflow={workflow} wfNode={wfNode} excludeNodes={[wfNode.uuid]} />
			<div className="rounded-lg p-4">
				<div className="flex items-center gap-2 mb-3"><span className="text-lg font-semibold">{t("workflowDesigner.conditionBranchDesc")}</span></div>
				<ul className="list-none p-0 m-0 flex flex-col gap-1.5">
					<li className="text-[13px] pl-4 relative before:content-['•'] before:absolute before:left-2 before:font-bold">{t("workflowDesigner.conditionDesc1")}</li>
					<li className="text-[13px] pl-4 relative before:content-['•'] before:absolute before:left-2 before:font-bold">{t("workflowDesigner.conditionDesc2")}</li>
					<li className="text-[13px] pl-4 relative before:content-['•'] before:absolute before:left-2 before:font-bold">{t("workflowDesigner.conditionDesc3")}</li>
					<li className="text-[13px] pl-4 relative before:content-['•'] before:absolute before:left-2 before:font-bold">{t("workflowDesigner.conditionDesc4")}</li>
				</ul>
			</div>
			<div>
				<div className="flex justify-between items-center mb-3">
					<h3 className="text-base font-semibold m-0">{t("workflowDesigner.conditionBranch")}</h3>
					<Button size="small" type="dashed" onClick={onAddCase}>{t("workflowDesigner.addBranch")}</Button>
				</div>
				{cases.length > 0 ? (
					<Collapse defaultActiveKey={["0"]} items={collapseItems} />
				) : (
					<div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 text-gray-400">
						<Icon icon="carbon:checkbox-checked" size={40} className="mb-3 opacity-50" />
						<p className="text-sm font-semibold text-gray-500 m-0">{t("workflowDesigner.noBranch")}</p>
						<span className="text-xs">{t("workflowDesigner.addBranchHint")}</span>
					</div>
				)}
			</div>
			<div>
				<div className="border-2 border-gray-200 rounded-lg p-4 bg-white hover:border-gray-400 transition-all">
					<div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
						<div className="flex items-center gap-2 text-[15px] font-semibold text-gray-700"><span>🔄</span><span>{t("workflowDesigner.defaultBranch")}</span></div>
						<span className="text-xs text-gray-500">{t("workflowDesigner.defaultBranchDesc")}</span>
					</div>
					<div>
						<label className="text-xs font-semibold text-gray-700 mb-1 block">{t("workflowDesigner.jumpToNode")}{!nodeConfig.default_target_node_uuid && <span className="text-red-500 ml-1">*</span>}</label>
						<Select value={nodeConfig.default_target_node_uuid || undefined} options={availableNodes} size="small" placeholder={t("workflowDesigner.selectDefaultTargetNode")} allowClear onChange={(val: string) => onDefaultTargetSelected(val || "")} className="w-full" />
						{!nodeConfig.default_target_node_uuid && <div className="text-xs text-red-500 mt-1.5 px-2 py-1.5 bg-red-50 rounded border-l-3 border-red-500">{t("workflowDesigner.defaultBranchTargetRequired")}</div>}
					</div>
				</div>
			</div>
		</div>
	);
}

function DateTimeToolNodeProperty({ workflow, wfNode }: { workflow: WorkflowInfo; wfNode: WorkflowNode }) {
	return (
		<div className="px-2">
			<WfVariableSelector workflow={workflow} wfNode={wfNode} excludeNodes={[wfNode.uuid]} />
			<div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
				<div className="flex items-center gap-2 mb-2">
					<Icon icon="carbon:time" size={18} className="text-teal-600" />
					<span className="text-sm font-semibold text-teal-700">{t("workflowDesigner.dateTimeTool")}</span>
				</div>
				<p className="text-xs text-gray-500 m-0">{t("workflowDesigner.dateTimeToolDesc")}</p>
			</div>
		</div>
	);
}

function WebSearchToolNodeProperty({ workflow, wfNode }: { workflow: WorkflowInfo; wfNode: WorkflowNode }) {
	const nodeConfig = wfNode.nodeConfig as any;
	if (nodeConfig.resultCount === undefined) nodeConfig.resultCount = 5;
	const [, forceUpdate] = useState(0);

	return (
		<div className="flex flex-col w-full px-2 space-y-4">
			<WfVariableSelector workflow={workflow} wfNode={wfNode} excludeNodes={[wfNode.uuid]} />
			<div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
				<div className="flex items-center gap-2 mb-2">
					<Icon icon="carbon:search" size={18} className="text-blue-600" />
					<span className="text-sm font-semibold text-blue-700">{t("workflowDesigner.webSearch")}</span>
				</div>
				<p className="text-xs text-gray-500 m-0">{t("workflowDesigner.webSearchDesc")}</p>
			</div>
			<div>
				<div className="text-sm mb-1">{t("workflowDesigner.resultCount")}</div>
				<InputNumber
					value={nodeConfig.resultCount ?? 5}
					min={1}
					max={20}
					onChange={(val) => { nodeConfig.resultCount = val; forceUpdate((n) => n + 1); }}
					className="w-full"
				/>
			</div>
		</div>
	);
}

function HttpRequestToolNodeProperty({ workflow, wfNode }: { workflow: WorkflowInfo; wfNode: WorkflowNode }) {
	const nodeConfig = wfNode.nodeConfig as any;
	if (nodeConfig.defaultUrl === undefined) nodeConfig.defaultUrl = "";
	if (nodeConfig.defaultMethod === undefined) nodeConfig.defaultMethod = "GET";
	if (nodeConfig.defaultHeaders === undefined) nodeConfig.defaultHeaders = "";
	if (nodeConfig.defaultBody === undefined) nodeConfig.defaultBody = "";
	const [, forceUpdate] = useState(0);

	return (
		<div className="flex flex-col w-full px-2 space-y-4">
			<WfVariableSelector workflow={workflow} wfNode={wfNode} excludeNodes={[wfNode.uuid]} />
			<div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
				<div className="flex items-center gap-2 mb-2">
					<Icon icon="carbon:http" size={18} className="text-slate-600" />
					<span className="text-sm font-semibold text-slate-700">{t("workflowDesigner.httpRequest")}</span>
				</div>
				<p className="text-xs text-gray-500 m-0">{t("workflowDesigner.httpRequestDesc")}</p>
			</div>
			<div>
				<div className="text-sm mb-1">{t("workflowDesigner.defaultUrl")}</div>
				<Input
					value={nodeConfig.defaultUrl}
					placeholder="https://api.example.com/..."
					onChange={(e) => { nodeConfig.defaultUrl = e.target.value; forceUpdate((n) => n + 1); }}
				/>
			</div>
			<div>
				<div className="text-sm mb-1">{t("workflowDesigner.defaultMethod")}</div>
				<Select
					value={nodeConfig.defaultMethod}
					onChange={(val) => { nodeConfig.defaultMethod = val; forceUpdate((n) => n + 1); }}
					options={[
						{ label: "GET", value: "GET" },
						{ label: "POST", value: "POST" },
						{ label: "PUT", value: "PUT" },
						{ label: "DELETE", value: "DELETE" },
					]}
					className="w-full"
				/>
			</div>
			<div>
				<div className="text-sm mb-1">{t("workflowDesigner.defaultHeaders")}</div>
				<Input.TextArea
					value={nodeConfig.defaultHeaders}
					placeholder='{"Content-Type": "application/json"}'
					autoSize={{ minRows: 2, maxRows: 4 }}
					onChange={(e) => { nodeConfig.defaultHeaders = e.target.value; forceUpdate((n) => n + 1); }}
				/>
			</div>
			<div>
				<div className="text-sm mb-1">{t("workflowDesigner.defaultBody")}</div>
				<Input.TextArea
					value={nodeConfig.defaultBody}
					placeholder='{"key": "value"}'
					autoSize={{ minRows: 2, maxRows: 6 }}
					onChange={(e) => { nodeConfig.defaultBody = e.target.value; forceUpdate((n) => n + 1); }}
				/>
			</div>
		</div>
	);
}

function CustomToolNodeProperty({ workflow, wfNode }: { workflow: WorkflowInfo; wfNode: WorkflowNode }) {
	const nodeConfig = wfNode.nodeConfig as any;
	if (!Array.isArray(nodeConfig.toolIds)) nodeConfig.toolIds = [];
	const [customTools, setCustomTools] = useState<AigcTool[]>([]);
	const [, forceUpdate] = useState(0);

	useEffect(() => {
		getToolListApi()
			.then((res) => setCustomTools(res || []))
			.catch(() => setCustomTools([]));
	}, []);

	const toggleTool = (id: string) => {
		const idx = nodeConfig.toolIds.indexOf(id);
		if (idx > -1) {
			nodeConfig.toolIds.splice(idx, 1);
		} else {
			nodeConfig.toolIds.push(id);
		}
		forceUpdate((n) => n + 1);
	};

	const columns: ColumnsType<AigcTool> = [
		{ title: t("workflowDesigner.toolName"), dataIndex: "name", key: "name", width: 120 },
		{ title: t("workflowDesigner.toolDesc"), dataIndex: "description", key: "description", ellipsis: true },
		{ title: t("workflowDesigner.toolType"), dataIndex: "toolType", key: "toolType", width: 80, render: (v: string) => <Tag>{v}</Tag> },
		{
			title: t("workflowDesigner.enabled"), key: "enabled", width: 60, render: (_, record) => (
				<Checkbox checked={nodeConfig.toolIds.includes(record.id)} onChange={() => toggleTool(record.id!)} />
			),
		},
	];

	return (
		<div className="flex flex-col w-full px-2 space-y-4">
			<WfVariableSelector workflow={workflow} wfNode={wfNode} excludeNodes={[wfNode.uuid]} />
			<div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
				<div className="flex items-center gap-2 mb-2">
					<Icon icon="carbon:tools" size={18} className="text-purple-600" />
					<span className="text-sm font-semibold text-purple-700">{t("workflowDesigner.customTool")}</span>
				</div>
				<p className="text-xs text-gray-500 m-0">{t("workflowDesigner.customToolDesc")}</p>
			</div>
			{customTools.length > 0 ? (
				<Table columns={columns} dataSource={customTools} pagination={false} rowKey="id" size="small" />
			) : (
				<div className="text-center text-gray-400 py-4 text-sm">{t("workflowDesigner.customToolEmpty")}</div>
			)}
		</div>
	);
}

function CommandExecToolNodeProperty({ workflow, wfNode }: { workflow: WorkflowInfo; wfNode: WorkflowNode }) {
	const nodeConfig = wfNode.nodeConfig as any;
	if (nodeConfig.command === undefined) nodeConfig.command = "";
	const [lang, setLang] = useState("shell");
	const [, forceUpdate] = useState(0);

	const langOptions = [
		{ label: "Shell / Bash", value: "shell" },
		{ label: "Python", value: "python" },
		{ label: "JavaScript", value: "javascript" },
		{ label: "PowerShell", value: "powershell" },
	];

	return (
		<div className="flex flex-col w-full px-2 space-y-4">
			<WfVariableSelector workflow={workflow} wfNode={wfNode} excludeNodes={[wfNode.uuid]} />
			<div className="rounded-lg border border-red-200 bg-red-50 p-4">
				<div className="flex items-center gap-2 mb-2">
					<Icon icon="carbon:terminal" size={18} className="text-red-600" />
					<span className="text-sm font-semibold text-red-700">{t("workflowDesigner.commandExec")}</span>
				</div>
				<p className="text-xs text-gray-500 m-0">{t("workflowDesigner.commandExecDesc")}</p>
			</div>
			<div>
				<div className="text-sm mb-1">{t("workflowDesigner.scriptLanguage")}</div>
				<Select value={lang} onChange={setLang} options={langOptions} className="w-full" />
			</div>
			<div>
				<div className="flex items-center justify-between mb-1">
					<div className="text-sm">{t("workflowDesigner.commandOrScript")}<span className="text-red-500">*</span></div>
					<span className="text-xs text-gray-400">{t("workflowDesigner.useInputHint")}</span>
				</div>
				<div className="border border-gray-200 rounded-md overflow-hidden" style={{ height: "300px" }}>
					<Editor
						height="100%"
						language={lang}
						value={nodeConfig.command}
						onChange={(val) => { nodeConfig.command = val || ""; forceUpdate((n) => n + 1); }}
						options={{
							minimap: { enabled: false },
							fontSize: 13,
							lineNumbers: "on",
							scrollBeyondLastLine: false,
							wordWrap: "on",
							tabSize: 4,
							automaticLayout: true,
						}}
						theme="vs-dark"
					/>
				</div>
			</div>
		</div>
	);
}

function DocExtractorNodeProperty({ workflow, wfNode }: { workflow: WorkflowInfo; wfNode: WorkflowNode }) {
	const nodeConfig = wfNode.nodeConfig as any;
	if (nodeConfig.extractionMethod === undefined) nodeConfig.extractionMethod = "auto";
	if (nodeConfig.inputVariable === undefined) nodeConfig.inputVariable = "";
	const [, forceUpdate] = useState(0);

	const methodOptions = [
		{ label: t("workflowDesigner.autoDetect"), value: "auto" },
		{ label: t("workflowDesigner.plainText"), value: "text" },
		{ label: t("workflowDesigner.ocrRecognition"), value: "ocr" },
	];

	return (
		<div className="flex flex-col w-full px-2 space-y-4">
			<WfVariableSelector workflow={workflow} wfNode={wfNode} excludeNodes={[wfNode.uuid]} />
			<div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
				<div className="flex items-center gap-2 mb-2">
					<Icon icon="mdi:file-document" size={18} className="text-orange-600" />
					<span className="text-sm font-semibold text-orange-700">{t("workflowDesigner.docExtractor")}</span>
				</div>
				<p className="text-xs text-gray-500 m-0">{t("workflowDesigner.docExtractorDesc")}</p>
			</div>
			<div>
				<div className="text-sm mb-1">{t("workflowDesigner.extractionMethod")}</div>
				<Select
					value={nodeConfig.extractionMethod}
					onChange={(val) => { nodeConfig.extractionMethod = val; forceUpdate((n) => n + 1); }}
					options={methodOptions}
					className="w-full"
				/>
			</div>
			<div>
				<div className="text-sm mb-1">{t("workflowDesigner.inputVariableName")}</div>
				<Input
					value={nodeConfig.inputVariable}
					onChange={(e) => { nodeConfig.inputVariable = e.target.value; forceUpdate((n) => n + 1); }}
					placeholder={t("workflowDesigner.refUpstreamOutput")}
					className="w-full"
				/>
			</div>
			<div className="mt-4 px-2">
				<OutputParamsTable wfNode={wfNode} />
			</div>
		</div>
	);
}

function LLMNodeProperty({ workflow, wfNode }: { workflow: WorkflowInfo; wfNode: WorkflowNode }) {
	const nodeConfig = wfNode.nodeConfig as any;
	if (nodeConfig.prompt === undefined) nodeConfig.prompt = "";
	if (nodeConfig.modelId === undefined) nodeConfig.modelId = "";
	if (nodeConfig.modelName === undefined) nodeConfig.modelName = "";
	const [modelOptions, setModelOptions] = useState<Array<{ label: string; value: string; id: string }>>([]);
	const [, forceUpdate] = useState(0);

	useEffect(() => {
		listModelsApi({ type: 'CHAT' as any })
			.then((res) => {
				setModelOptions((res || []).map((m: any) => ({
					label: m.name || m.model,
					value: m.name || m.model,
					id: m.id,
				})));
			})
			.catch(() => setModelOptions([]));
	}, []);

	return (
		<div className="flex flex-col w-full">
			<WfVariableSelector workflow={workflow} wfNode={wfNode} excludeNodes={[wfNode.uuid]} />
			<div className="mt-2">
				<div className="text-sm mb-1">{t("workflowDesigner.chatModel")}<span className="text-red-500">*</span></div>
				<Select
					value={nodeConfig.modelId || undefined}
					onChange={(_, option: any) => {
						nodeConfig.modelId = option?.id || "";
						nodeConfig.modelName = option?.value || "";
						forceUpdate((n) => n + 1);
					}}
					options={modelOptions}
					showSearch
					allowClear
					placeholder={t("workflowDesigner.selectModel")}
					className="w-full"
					fieldNames={{ label: "label", value: "id" }}
				/>
			</div>
			<div className="mt-4">
				<div className="text-sm mb-1">{t("workflowDesigner.promptLabel")}</div>
				<Input.TextArea
					value={nodeConfig.prompt || ""}
					onChange={(e) => { nodeConfig.prompt = e.target.value; forceUpdate((n) => n + 1); }}
					autoSize={{ minRows: 4, maxRows: 12 }}
					placeholder={t("workflowDesigner.systemPromptPlaceholder")}
				/>
			</div>
			<div className="mt-4">
				<OutputParamsTable wfNode={wfNode} />
			</div>
		</div>
	);
}

function MultimodalLLMNodeProperty({ workflow, wfNode }: { workflow: WorkflowInfo; wfNode: WorkflowNode }) {
	const nodeConfig = wfNode.nodeConfig as any;
	if (nodeConfig.prompt === undefined) nodeConfig.prompt = "";
	if (nodeConfig.modelId === undefined) nodeConfig.modelId = "";
	if (nodeConfig.modelName === undefined) nodeConfig.modelName = "";
	const [modelOptions, setModelOptions] = useState<Array<{ label: string; value: string; id: string }>>([]);
	const [, forceUpdate] = useState(0);

	useEffect(() => {
		listModelsApi({ type: ModelTypeEnum.IMAGE })
			.then((res) => {
				setModelOptions((res || []).map((m: any) => ({
					label: m.name || m.model,
					value: m.name || m.model,
					id: m.id,
				})));
			})
			.catch(() => setModelOptions([]));
	}, []);

	return (
		<div className="flex flex-col w-full">
			<WfVariableSelector workflow={workflow} wfNode={wfNode} excludeNodes={[wfNode.uuid]} />
			<div className="mt-2">
				<div className="text-sm mb-1">{t("workflowDesigner.multimodalModel")}<span className="text-red-500">*</span></div>
				<Select
					value={nodeConfig.modelId || undefined}
					onChange={(_, option: any) => {
						nodeConfig.modelId = option?.id || "";
						nodeConfig.modelName = option?.value || "";
						forceUpdate((n) => n + 1);
					}}
					options={modelOptions}
					showSearch
					allowClear
					placeholder={t("workflowDesigner.selectMultimodalModel")}
					className="w-full"
					fieldNames={{ label: "label", value: "id" }}
				/>
			</div>
			<div className="mt-4">
				<div className="text-sm mb-1">{t("workflowDesigner.promptLabel")}</div>
				<Input.TextArea
					value={nodeConfig.prompt || ""}
					onChange={(e) => { nodeConfig.prompt = e.target.value; forceUpdate((n) => n + 1); }}
					autoSize={{ minRows: 4, maxRows: 12 }}
					placeholder={t("workflowDesigner.systemPromptPlaceholder")}
				/>
			</div>
				<div className="mt-4">
					<OutputParamsTable wfNode={wfNode} />
				</div>
		</div>
	);
}

function KnowledgeRetrievalNodeProperty({ workflow, wfNode }: { workflow: WorkflowInfo; wfNode: WorkflowNode }) {
	const nodeConfig = wfNode.nodeConfig as any;
	if (nodeConfig.knowledgeIds === undefined) nodeConfig.knowledgeIds = [];
	const [knowledgeOptions, setKnowledgeOptions] = useState<Array<{ label: string; value: string }>>([]);
	const [, forceUpdate] = useState(0);

	useEffect(() => {
		listKnowledgeApi({})
			.then((res) => {
				setKnowledgeOptions((res || []).map((k: any) => ({
					label: k.name,
					value: k.id,
				})));
			})
			.catch(() => setKnowledgeOptions([]));
	}, []);

	return (
		<div className="flex flex-col w-full px-2">
			<WfVariableSelector workflow={workflow} wfNode={wfNode} excludeNodes={[wfNode.uuid]} />
			<div className="text-base font-bold mb-2">{t("workflowDesigner.knowledgeRetrievalConfig")}</div>
			<div>
				<div className="text-sm mb-1">{t("workflowDesigner.selectKnowledgeBase")}<span className="text-red-500">*</span></div>
				<Select
					mode="multiple"
					value={nodeConfig.knowledgeIds || []}
					onChange={(val) => { nodeConfig.knowledgeIds = val; forceUpdate((n) => n + 1); }}
					options={knowledgeOptions}
					showSearch
					allowClear
					placeholder={t("workflowDesigner.selectKnowledgeBasePlaceholder")}
					className="w-full"
				/>
			</div>
			<div className="mt-4">
				<div className="text-sm mb-1">{t("workflowDesigner.retrievalCount")}</div>
				<InputNumber
					value={nodeConfig.topK ?? 5}
					min={1}
					max={20}
					onChange={(val) => { nodeConfig.topK = val; forceUpdate((n) => n + 1); }}
					className="w-full"
				/>
			</div>
			<div className="mt-4">
				<div className="text-sm mb-1">{t("workflowDesigner.similarityThreshold")}</div>
				<InputNumber
					value={nodeConfig.similarityThreshold ?? 0.7}
					min={0}
					max={1}
					step={0.05}
					onChange={(val) => { nodeConfig.similarityThreshold = val; forceUpdate((n) => n + 1); }}
					className="w-full"
				/>
			</div>
			<div className="mt-4 px-2">
				<OutputParamsTable wfNode={wfNode} />
			</div>
		</div>
	);
}

function KgRetrievalNodeProperty({ workflow, wfNode }: { workflow: WorkflowInfo; wfNode: WorkflowNode }) {
	const nodeConfig = wfNode.nodeConfig as any;
	if (nodeConfig.knowledgeId === undefined) nodeConfig.knowledgeId = "";
	if (nodeConfig.maxResults === undefined) nodeConfig.maxResults = 10;
	if (nodeConfig.tokenizationMethod === undefined) nodeConfig.tokenizationMethod = "hanlp";
	if (nodeConfig.enableVectorSearch === undefined) nodeConfig.enableVectorSearch = false;
	const [knowledgeOptions, setKnowledgeOptions] = useState<Array<{ label: string; value: string }>>([]);
	const [modelOptions, setModelOptions] = useState<any[]>([]);
	const [, forceUpdate] = useState(0);

	useEffect(() => {
		listKnowledgeApi({})
			.then((res) => {
				setKnowledgeOptions((res || []).map((k: any) => ({
					label: k.name,
					value: k.id,
				})));
			})
			.catch(() => setKnowledgeOptions([]));

		listModelsApi({ type: ModelTypeEnum.CHAT })
			.then((res) => {
				setModelOptions((res || []).map((m: any) => ({
					label: m.name,
					value: m.name,
					id: m.id,
				})));
			})
			.catch(() => setModelOptions([]));
	}, []);

	return (
		<div className="flex flex-col w-full px-2">
			<WfVariableSelector workflow={workflow} wfNode={wfNode} excludeNodes={[wfNode.uuid]} />
			<div className="text-base font-bold mb-2">{t("workflowDesigner.graphRetrievalConfig")}</div>
			<div>
				<div className="text-sm mb-1">{t("workflowDesigner.selectKnowledgeBase")}<span className="text-red-500">*</span></div>
				<Select
					value={nodeConfig.knowledgeId || undefined}
					onChange={(val) => { nodeConfig.knowledgeId = val; forceUpdate((n) => n + 1); }}
					options={knowledgeOptions}
					showSearch
					allowClear
					placeholder={t("workflowDesigner.selectKnowledgeBaseWithGraph")}
					className="w-full"
				/>
			</div>
			<div className="mt-4">
				<div className="text-sm mb-1">{t("workflowDesigner.maxRetrievalResults")}</div>
				<InputNumber
					value={nodeConfig.maxResults ?? 10}
					min={1}
					max={50}
					onChange={(val) => { nodeConfig.maxResults = val; forceUpdate((n) => n + 1); }}
					className="w-full"
				/>
			</div>
			<div className="mt-4">
				<div className="text-sm mb-1">{t("workflowDesigner.tokenizationMethod")}</div>
				<Select
					value={nodeConfig.tokenizationMethod || "hanlp"}
					onChange={(val) => { nodeConfig.tokenizationMethod = val; forceUpdate((n) => n + 1); }}
					options={[
						{ label: t("workflowDesigner.hanlpChinese"), value: 'hanlp' },
						{ label: t("workflowDesigner.llmKeywordExtract"), value: 'llm' },
					]}
					className="w-full"
				/>
			</div>
			{nodeConfig.tokenizationMethod === "llm" && (
				<div className="mt-4">
					<div className="text-sm mb-1">{t("workflowDesigner.tokenizationModel")}<span className="text-red-500">*</span></div>
					<Select
						value={nodeConfig.tokenizationModelName || undefined}
						onChange={(_, option: any) => {
							nodeConfig.tokenizationModelName = option?.value || "";
							forceUpdate((n) => n + 1);
						}}
						options={modelOptions}
						showSearch
						allowClear
						placeholder={t("workflowDesigner.selectTokenizationModel")}
						className="w-full"
					/>
				</div>
			)}
			<div className="mt-4">
				<div className="flex items-center justify-between">
					<div>
						<div className="text-sm mb-1">{t("workflowDesigner.enableVectorRetrieval")}</div>
						<div className="text-xs text-gray-400">{t("workflowDesigner.hybridRetrievalDesc")}</div>
					</div>
					<Switch
						checked={nodeConfig.enableVectorSearch === true}
						onChange={(checked) => { nodeConfig.enableVectorSearch = checked; forceUpdate((n) => n + 1); }}
					/>
				</div>
			</div>
			<div className="mt-4 px-2">
				<OutputParamsTable wfNode={wfNode} />
			</div>
		</div>
	);
}

function EndNodeProperty({ wfNode, workflow }: { wfNode: WorkflowNode; workflow: WorkflowInfo }) {
    const [, forceUpdate] = useState(0);
    const t = i18n.t;

    // NOTE: Direct mutation of nodeConfig + forceUpdate is an intentional pattern
    // used throughout this file. It avoids deep-clone overhead on every keystroke.
    if (!wfNode.nodeConfig) wfNode.nodeConfig = {} as Record<string, any>;
    if (!wfNode.nodeConfig.output_config) {
        wfNode.nodeConfig.output_config = {
            mode: 'select',
            branchOutputs: [],
            mergeStrategy: 'join',
            separator: '\n---\n'
        };
    }

    const config = wfNode.nodeConfig.output_config as EndNodeOutputConfig;

    // Get all nodes that could be branch sources (nodes with multiple outgoing edges)
    const getAvailableBranches = () => {
        const branches: { nodeId: string; nodeTitle: string; outputs: string[] }[] = [];
        // Find all nodes in the workflow
        workflow.nodes.forEach(node => {
            // Check if this node has outputs
            const outputConfig = getDefaultOutputConfig(node.wfComponent.name);
            if (outputConfig.outputs.length > 0) {
                branches.push({
                    nodeId: node.uuid,
                    nodeTitle: node.title,
                    outputs: outputConfig.outputs.map(o => o.name)
                });
            }
        });
        return branches;
    };

    const availableBranches = getAvailableBranches();

    const handleModeChange = (mode: EndNodeOutputConfig['mode']) => {
        config.mode = mode;
        forceUpdate(n => n + 1);
    };

    const handleAddBranchOutput = () => {
        if (!config.branchOutputs) config.branchOutputs = [];
        config.branchOutputs.push({
            branchId: '',
            param: '',
            alias: ''
        });
        forceUpdate(n => n + 1);
    };

    const handleRemoveBranchOutput = (index: number) => {
        config.branchOutputs?.splice(index, 1);
        forceUpdate(n => n + 1);
    };

    const handleBranchChange = (index: number, field: keyof BranchOutputConfig, value: string) => {
        const branch = config.branchOutputs?.[index];
        if (branch) {
            Object.assign(branch, { [field]: value });
            forceUpdate(n => n + 1);
        }
    };

    return (
        <div className="px-2 space-y-4">
            <div className="text-base font-bold">{t("workflowDesigner.endNodeConfig")}</div>

            {/* Output Mode */}
            <div className="space-y-2">
                <div className="text-sm font-medium">{t("workflowDesigner.outputMode")}</div>
                <Select
                    value={config.mode}
                    onChange={handleModeChange}
                    options={[
                        { label: t("workflowDesigner.selectBranchOutputs"), value: 'select' },
                        { label: t("workflowDesigner.mergeAllOutputs"), value: 'merge' },
                        { label: t("workflowDesigner.firstCompleted"), value: 'first' }
                    ]}
                    className="w-full"
                />
            </div>

            {/* Select Mode Configuration */}
            {config.mode === 'select' && (
                <div className="space-y-2">
                    <div className="text-sm font-medium">{t("workflowDesigner.branchOutputs")}</div>
                    {config.branchOutputs?.map((branch, index) => (
                        <div key={index} className="border rounded p-2 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs">{t("workflowDesigner.branch", { index: index + 1 })}</span>
                                <Button
                                    type="text"
                                    size="small"
                                    danger
                                    onClick={() => handleRemoveBranchOutput(index)}
                                >
                                    {t("common.delText")}
                                </Button>
                            </div>
                            <Select
                                placeholder={t("workflowDesigner.selectBranch")}
                                value={branch.branchId || undefined}
                                onChange={(val) => handleBranchChange(index, 'branchId', val)}
                                options={availableBranches.map(b => ({
                                    label: b.nodeTitle,
                                    value: b.nodeId
                                }))}
                                className="w-full"
                            />
                            <Select
                                placeholder={t("workflowDesigner.selectParam")}
                                value={branch.param || undefined}
                                onChange={(val) => handleBranchChange(index, 'param', val)}
                                options={
                                    availableBranches
                                        .find(b => b.nodeId === branch.branchId)
                                        ?.outputs.map(o => ({ label: o, value: o })) || []
                                }
                                className="w-full"
                            />
                            <Input
                                placeholder={t("workflowDesigner.outputAlias")}
                                value={branch.alias}
                                onChange={(e) => handleBranchChange(index, 'alias', e.target.value)}
                            />
                        </div>
                    ))}
                    <Button type="dashed" onClick={handleAddBranchOutput} className="w-full">
                        {t("workflowDesigner.addBranchOutput")}
                    </Button>
                </div>
            )}

            {/* Merge Mode Configuration */}
            {config.mode === 'merge' && (
                <div className="space-y-2">
                    <div className="text-sm font-medium">{t("workflowDesigner.mergeStrategy")}</div>
                    <Select
                        value={config.mergeStrategy}
                        onChange={(val: EndNodeOutputConfig['mergeStrategy']) => {
                            config.mergeStrategy = val;
                            forceUpdate(n => n + 1);
                        }}
                        options={[
                            { label: t("workflowDesigner.concat"), value: 'concat' },
                            { label: t("workflowDesigner.joinWithSeparator"), value: 'join' },
                            { label: t("workflowDesigner.jsonArray"), value: 'json_array' }
                        ]}
                        className="w-full"
                    />
                    {config.mergeStrategy === 'join' && (
                        <div className="space-y-1">
                            <div className="text-xs text-neutral-500">{t("workflowDesigner.separator")}</div>
                            <Input
                                value={config.separator}
                                onChange={(e) => {
                                    config.separator = e.target.value;
                                    forceUpdate(n => n + 1);
                                }}
                                placeholder="\\n---\\n"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* First Mode - no additional config needed */}
            {config.mode === 'first' && (
                <div className="text-sm text-neutral-500">
                    {t("workflowDesigner.firstBranchOutputDesc")}
                </div>
            )}
        </div>
    );
}

export function RightPanel({ workflow, uiWorkflow, hidePropertyPanel, wfNode, onUpdateNode }: RightPanelProps) {
	const [nodeTitle, setNodeTitle] = useState("");

	useEffect(() => { setNodeTitle(wfNode?.title || ""); }, [wfNode]);
	useEffect(() => { if (wfNode && nodeTitle !== wfNode.title) { wfNode.title = nodeTitle; onUpdateNode?.(wfNode); } }, [nodeTitle]);

	if (hidePropertyPanel || !wfNode) return null;

	const iconName = wfNode.wfComponent?.name || "";
	const componentName = iconName.toLowerCase();

	const renderPropertyEditor = () => {
		if (componentName === "start") return <StartNodeProperty key={wfNode.uuid} workflow={workflow} wfNode={wfNode} />;
		if (componentName === "llm") return <LLMNodeProperty key={wfNode.uuid} workflow={workflow} wfNode={wfNode} />;
		if (componentName === "multimodalllm") return <MultimodalLLMNodeProperty key={wfNode.uuid} workflow={workflow} wfNode={wfNode} />;
		if (componentName === "knowledgeretrieval") return <KnowledgeRetrievalNodeProperty key={wfNode.uuid} workflow={workflow} wfNode={wfNode} />;
		if (componentName === "kgretrieval") return <KgRetrievalNodeProperty key={wfNode.uuid} workflow={workflow} wfNode={wfNode} />;
		if (componentName === "datetimetool") return <DateTimeToolNodeProperty key={wfNode.uuid} workflow={workflow} wfNode={wfNode} />;
		if (componentName === "websearchtool") return <WebSearchToolNodeProperty key={wfNode.uuid} workflow={workflow} wfNode={wfNode} />;
		if (componentName === "httprequesttool") return <HttpRequestToolNodeProperty key={wfNode.uuid} workflow={workflow} wfNode={wfNode} />;
		if (componentName === "customtool") return <CustomToolNodeProperty key={wfNode.uuid} workflow={workflow} wfNode={wfNode} />;
		if (componentName === "commandexectool") return <CommandExecToolNodeProperty key={wfNode.uuid} workflow={workflow} wfNode={wfNode} />;
		if (componentName === "documentextractor") return <DocExtractorNodeProperty key={wfNode.uuid} workflow={workflow} wfNode={wfNode} />;
		if (componentName === "answer") return <AnswerNodeProperty key={wfNode.uuid} workflow={workflow} wfNode={wfNode} />;
		if (componentName === "keywordextractor") return <KeywordExtractorNodeProperty key={wfNode.uuid} workflow={workflow} wfNode={wfNode} />;
		if (componentName === "switcher" || componentName === "ifelse") return <SwitcherNodeProperty key={wfNode.uuid} workflow={workflow} uiWorkflow={uiWorkflow} wfNode={wfNode} onUpdateNode={onUpdateNode} />;
		if (componentName === "end") return <EndNodeProperty key={wfNode.uuid} wfNode={wfNode} workflow={workflow} />;
		return <GenericNodeProperty key={wfNode.uuid} workflow={workflow} wfNode={wfNode} />;
	};

	return (
		<div className="absolute right-0 top-0 bg-white rounded-lg shadow-xl flex flex-col" style={{ zIndex: 20, width: "600px", height: "100%" }}>
			<div className="px-3 pt-5 flex-shrink-0 border-b border-gray-200 pb-3">
				<div className="text-3xl flex items-center h-10 mb-2">
					<Icon icon={getIconByComponentName(iconName)} size={24} style={{ color: getIconColorByComponentName(iconName) }} className="mr-2 mt-1" />
					<Input value={nodeTitle} onChange={(e) => setNodeTitle(e.target.value)} placeholder={t("workflowDesigner.nodeNamePlaceholder")} className="h-8" style={{ fontSize: "1rem", lineHeight: "1.5rem", fontWeight: 700, borderColor: "rgb(243 244 246)" }} />
				</div>
				<div className="text-sm text-gray-500">{t("workflowDesigner.componentFunction")}{wfNode.wfComponent?.remark || ""}</div>
			</div>
			<div className="flex-1 overflow-y-auto px-3 pt-5 pb-4" style={{ minHeight: 0 }}>
				{renderPropertyEditor()}
			</div>
		</div>
	);
}
