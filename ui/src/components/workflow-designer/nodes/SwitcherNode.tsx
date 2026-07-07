import React, { useCallback, useContext } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import i18n from "@/locales/i18n";
import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { getIconColorByComponentName } from "../utils/workflow-util";
import { DeleteNodeContext } from "./NodeShell";

interface SwitcherNodeData {
	uuid: string;
	title: string;
	wfComponent?: { name: string; title: string };
	nodeConfig?: {
		cases?: Array<{
			uuid: string;
			operator: string;
			conditions: Array<{
				node_param_name: string;
				operator: string;
				value: string;
			}>;
		}>;
	};
}

function cut(val: string, n = 20) {
	if (!val) return "";
	return val.length > n ? `${val.slice(0, n)}...` : val;
}

function getConditionSummary(caseItem: any) {
	const t = i18n.t;
	if (!caseItem.conditions || caseItem.conditions.length === 0) {
		return t("workflowDesigner.noConditions");
	}
	const first = caseItem.conditions[0];
	const count = caseItem.conditions.length;
	const summary = `${first.node_param_name || t("workflowDesigner.parameter")} ${first.operator || ""} ${cut(first.value || "", 10)}`;
	return count > 1 ? `${summary} +${count - 1}` : summary;
}

const SwitcherNode = ({ id, data, selected }: NodeProps) => {
	const { t } = i18n;
	const nodeData = data as unknown as SwitcherNodeData;
	const nodeConfig = nodeData.nodeConfig || {};
	const cases = Array.isArray(nodeConfig.cases) ? nodeConfig.cases : [];
	const totalHandles = cases.length + 1; // cases + default
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

	const getHandleTop = (index: number) => {
		if (totalHandles <= 1) return "50%";
		if (index === totalHandles - 1) return "50%";
		const step = 70 / totalHandles;
		return `${15 + step * (index + 0.5)}%`;
	};

	return (
		<div
			className={`min-w-[280px] bg-white rounded-lg border-2 ${
				selected ? "border-blue-500 shadow-lg shadow-blue-100" : "border-blue-400 shadow-md"
			}`}
		>
			<Handle type="target" position={Position.Left} className="!bg-blue-500" />

			{/* Header */}
			<div
				className={`flex items-center justify-center px-3 pb-3 mb-1 border-b font-bold text-base ${
					selected ? "border-blue-500" : "border-gray-200"
				}`}
			>
				<div className="w-6 mr-2">
					<Icon
						icon="oui:logstash-if"
						size={20}
						style={{ color: getIconColorByComponentName("switcher") }}
					/>
				</div>
				<div className="flex-1 text-center truncate">{nodeData.title}</div>
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
			</div>

			{/* Node content */}
			<div className="px-3 py-2 border-b border-gray-100">
				<div className="flex justify-between text-xs py-0.5">
					<span className="text-gray-500 font-medium">{t("workflowDesigner.branchCount")}</span>
					<span className="text-gray-900 font-semibold">{cases.length}</span>
				</div>
				<div className="flex justify-between text-xs py-0.5">
					<span className="text-gray-500 font-medium">{t("workflowDesigner.logic")}</span>
					<span className="text-gray-900 font-semibold">
						{cases[0]?.operator?.toUpperCase() || "AND"}
					</span>
				</div>
			</div>

			{/* Branches list */}
			{cases.length > 0 && (
				<div className="relative" style={{ minHeight: `${cases.length * 36 + 16}px` }}>
					{cases.map((caseItem, index) => (
						<div
							key={caseItem.uuid}
							className="absolute right-0 w-full flex items-center px-3 py-1.5"
							style={{ top: getHandleTop(index), transform: "translateY(-50%)" }}
						>
							<div className="flex items-center gap-1.5 flex-1 min-w-0">
								<span className="inline-flex items-center justify-center min-w-[20px] h-5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded text-[10px] font-semibold px-1 shadow-sm flex-shrink-0">
									{index + 1}
								</span>
								<span className="text-[11px] text-gray-600 truncate">
									{getConditionSummary(caseItem)}
								</span>
							</div>
							<Handle
								id={caseItem.uuid}
								type="source"
								position={Position.Right}
								className="!bg-blue-500"
								style={{ top: "50%", transform: "translateY(-50%)" }}
							/>
						</div>
					))}
				</div>
			)}

			{/* Default branch */}
			<div
				className="relative border-t border-dashed border-gray-200 bg-gradient-to-b from-transparent to-gray-50"
				style={{ minHeight: "48px", padding: "8px 0" }}
			>
				<div
					className="absolute right-0 w-full flex items-center px-3"
					style={{ top: "50%", transform: "translateY(-50%)" }}
				>
					<div className="flex items-center gap-1.5 flex-1 min-w-0">
						<span className="inline-flex items-center justify-center min-w-[36px] h-5 bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded text-[10px] font-semibold px-2 shadow-sm flex-shrink-0">
							{t("workflowDesigner.default")}
						</span>
						<span className="text-[11px] text-gray-500 italic truncate">
							{t("workflowDesigner.otherCases")}
						</span>
					</div>
					<Handle
						id="default"
						type="source"
						position={Position.Right}
						className="!bg-gray-400"
						style={{ top: "50%", transform: "translateY(-50%)" }}
					/>
				</div>
			</div>
		</div>
	);
};

SwitcherNode.displayName = "SwitcherNode";

export default SwitcherNode;
