import React, { memo, useCallback, useContext } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import i18n from "@/locales/i18n";
import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { getIconByComponentName, getIconColorByComponentName } from "../utils/workflow-util";

interface NodeShellData {
	uuid: string;
	title: string;
	wfComponent?: {
		name: string;
		title: string;
		remark?: string;
	};
	nodeConfig?: Record<string, any>;
	inputConfig?: {
		user_inputs: Array<{
			uuid: string;
			type: number;
			name: string;
			title: string;
		}>;
		ref_inputs?: Array<{
			name: string;
			source_node_uuid: string;
			source_param: string;
		}>;
	};
}

// 删除节点回调 Context
export const DeleteNodeContext = React.createContext<((uuid: string) => void) | null>(null);

function getNodeLines(data: NodeShellData): string[] {
	const name = (data.wfComponent?.name || "").toLowerCase();
	const c = data.nodeConfig || {};
	const t = i18n.t;

	const cut = (val: string, n = 30) => {
		if (!val) return "";
		return val.length > n ? `${val.slice(0, n)}...` : val;
	};

	switch (name) {
		case "start": {
			const lines: string[] = [];
			if (c.prologue) lines.push(`${t("workflowDesigner.prologue")}: ${cut(c.prologue, 25)}`);
			const inputCount = Array.isArray(data.inputConfig?.user_inputs) ? data.inputConfig.user_inputs.length : 0;
			lines.push(`${t("workflowDesigner.input")}: ${inputCount} ${t("workflowDesigner.parameter")}`);
			return lines;
		}
		case "end": {
			const oc = c.output_config;
			if (!oc) return [];
			const modeLabel = oc.mode === "merge" ? t("workflowDesigner.mergeAllOutputs")
				: oc.mode === "first" ? t("workflowDesigner.firstCompleted")
				: t("workflowDesigner.selectBranchOutputs");
			const lines: string[] = [`${t("workflowDesigner.outputMode")}: ${modeLabel}`];
			if (oc.mode === "merge" && oc.mergeStrategy) {
				const strategyLabel = oc.mergeStrategy === "join" ? "join"
					: oc.mergeStrategy === "concat" ? "concat" : "json_array";
				lines.push(`${t("workflowDesigner.mergeStrategy")}: ${strategyLabel}${oc.mergeStrategy === "join" && oc.separator ? ` "${oc.separator}"` : ""}`);
			}
			if (oc.mode === "select" && Array.isArray(oc.branchOutputs)) {
				lines.push(`${t("workflowDesigner.branchOutputs")}: ${oc.branchOutputs.length}`);
			}
			return lines;
		}
		case "llm":
			return [`${c.modelName || c.modelId || t("workflowDesigner.unselectedModel")}`, cut(c.prompt || "")];
		case "multimodalllm":
			return [`${c.modelName || c.modelId || t("workflowDesigner.unselectedModel")}`, cut(c.prompt || "")];
		case "answer":
			return [`${c.model_name || ""}`];
		case "documentextractor":
			return[`${t("workflowDesigner.extractionMethodLabel")} ${c.extractionMethod || "auto"}`, cut(c.inputVariable || t("workflowDesigner.notConfiguredInputVar"))];
		case "keywordextractor":
			return[`${t("workflowDesigner.keywordCountLabel")} ${c.top_n ?? 5}`, `${t("workflowDesigner.modelLabel")} ${c.model_name || ""}`];
		case "faqextractor":
			return[`${t("workflowDesigner.extractCountLabel")} ${c.top_n ?? 5}`, `${t("workflowDesigner.modelLabel")} ${c.model_name || ""}`];
		case "knowledgeretrieval":
			return [
				`${t("workflowDesigner.knowledgeBaseLabel")} ${Array.isArray(c.knowledgeIds) ? c.knowledgeIds.length : 0}`,
				`${t("workflowDesigner.countLabel")} ${c.topK ?? 5}  ${t("workflowDesigner.thresholdLabel")} ${c.similarityThreshold ?? 0.7}`,
			];
		case "kgretrieval":
			return [
				`${t("workflowDesigner.knowledgeBaseLabel")} ${c.knowledgeId || t("workflowDesigner.notSelected")}`,
				`${t("workflowDesigner.maxResultsLabel")} ${c.maxResults ?? 10}  ${t("workflowDesigner.tokenizationLabel")} ${c.tokenizationMethod === "llm" ? "LLM" : "HanLP"}`,
				c.enableVectorSearch ? t("workflowDesigner.graphVectorHybrid") : t("workflowDesigner.graphOnly"),
			];
		case "switcher":
			return[`${t("workflowDesigner.branchCountLabel")} ${Array.isArray(c.cases) ? c.cases.length : 0}`];
		case "template":
			return [cut(c.content || c.prompt || "")];
		case "httprequest":
			return [`${c.method || "GET"} ${cut(c.url || "")}`];
		case "mailsend":
			return[`${t("workflowDesigner.recipientLabel")} ${cut(c.to_mails || "")}`, `${t("workflowDesigner.subjectLabel")} ${cut(c.subject || "")}`];
		case "humanfeedback":
			return [cut(c.tip || "")];
		case "google":
			return [
				`${t("workflowDesigner.countryLabel")} ${c.country || "cn"}`,
				`${t("workflowDesigner.languageLabel")} ${c.language || "zh-cn"}`,
				`${t("workflowDesigner.extractCount")} ${c.top_n ?? 5}`,
			];
		case "dalle3":
			return[`${t("workflowDesigner.sizeLabel")} ${c.size || ""}`, `${t("workflowDesigner.qualityLabel")} ${c.quality || ""}`];
		case "tongyiwanx":
			return[`${t("workflowDesigner.modelLabel")} ${c.model_name || ""}`, `${t("workflowDesigner.sizeLabel")} ${c.size || ""}`];
		case "datetimetool":
			return [t("workflowDesigner.getCurrentDateTime")];
		case "websearchtool":
			return[`${t("workflowDesigner.resultCountLabel")} ${c.resultCount ?? 5}`];
		case "httprequesttool":
			return [`${c.defaultMethod || "GET"} ${cut(c.defaultUrl || t("workflowDesigner.notConfiguredUrl"))}`];
		case "customtool": {
			const ids = Array.isArray(c.toolIds) ? c.toolIds : [];
			return [t("workflowDesigner.selectedCustomTools", { count: ids.length })];
		}
		case "commandexectool":
			return [cut(c.command || t("workflowDesigner.notConfiguredCommand"))];
		default:
			return [];
	}
}

function getInputBindings(data: NodeShellData): string[] {
	const refInputs = data.inputConfig?.ref_inputs || [];
	if (!Array.isArray(refInputs) || refInputs.length === 0) return [];
	return refInputs.map((r: any) => `${r.name} ← ${r.source_param || "?"}`);
}

const NodeShell = memo(({ id, data, selected }: NodeProps) => {
	const nodeData = data as unknown as NodeShellData;
	const iconName = nodeData.wfComponent?.name || "";
	const iconColor = getIconColorByComponentName(iconName);
	const lines = getNodeLines(nodeData);
	const userInputs = nodeData.inputConfig?.user_inputs || [];
	const inputBindings = getInputBindings(nodeData);
	const isStart = iconName.toLowerCase() === "start";
	const isEnd = iconName.toLowerCase() === "end";
	const deleteNode = useContext(DeleteNodeContext);

	const handleDelete = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			if (deleteNode && id) {
				deleteNode(id);
			}
		},
		[deleteNode, id]
	);

	return (
		<div
			className={`flex flex-col w-[220px] bg-white rounded-lg shadow-md border ${
				selected ? "border-blue-500 shadow-blue-200" : "border-gray-200"
			}`}
		>
			{!isStart && <Handle type="target" position={Position.Left} />}
			{!isEnd && <Handle type="source" position={Position.Right} />}

			{/* Header */}
			<div
				className={`flex items-center justify-center px-2 pb-3 mb-3 border-b font-bold text-base ${
					selected ? "border-blue-500" : "border-gray-200"
				}`}
			>
				<div className="w-6 mr-2">
					<Icon
						icon={getIconByComponentName(iconName)}
						size={20}
						style={{ color: iconColor }}
					/>
				</div>
				<div className="flex-1 max-h-6 overflow-hidden text-nowrap text-center">
					{nodeData.title}
				</div>
				{/* 删除按钮 - 非开始节点显示 */}
				{!isStart && (
					<div className="w-6 ml-2">
						<Button
							variant="ghost"
							size="icon"
							className="h-5 w-5 p-0 hover:bg-red-50 hover:text-red-500"
							onClick={handleDelete}
						>
							<Icon icon="ri:delete-bin-line" size={14} />
						</Button>
					</div>
				)}
			</div>

			{/* Content Lines */}
			<div className="px-2 pb-2">
				{lines.map((line, idx) => (
					<div
						key={idx}
						className="h-8 leading-8 bg-gray-50 mb-1.5 text-left px-3 text-xs text-gray-600 overflow-hidden whitespace-nowrap text-ellipsis rounded"
					>
						{line}
					</div>
				))}

				{/* Input parameter bindings */}
				{inputBindings.map((binding, idx) => (
					<div
						key={`bind-${idx}`}
						className="h-6 leading-6 bg-blue-50 mb-1 text-left px-2 text-[10px] text-blue-600 overflow-hidden whitespace-nowrap text-ellipsis rounded"
					>
						{binding}
					</div>
				))}

				{/* Start Node: Show user inputs */}
				{isStart &&
					userInputs.map((input) => (
						<div
							key={input.uuid}
							className="h-8 leading-8 bg-gray-50 mb-1.5 text-left px-2 flex items-center text-xs text-gray-600 rounded"
						>
							<div className="w-5 h-5 flex items-center justify-center mr-1">
								<Icon
									icon={
										input.type === 1
											? "carbon:string-text"
											: input.type === 2
											? "carbon:string-integer"
											: input.type === 3
											? "carbon:list-boxes"
											: input.type === 4
											? "carbon:list-dropdown"
											: "carbon:boolean"
									}
									size={12}
								/>
							</div>
							<div className="w-20 overflow-hidden mr-1 font-medium">{input.name}</div>
							<div className="flex-1 overflow-hidden">{input.title}</div>
						</div>
					))}
			</div>
		</div>
	);
});

NodeShell.displayName = "NodeShell";

export default NodeShell;
