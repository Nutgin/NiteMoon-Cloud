import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import type { WorkflowComponent } from "../types";
import { getIconByComponentName, getIconColorByComponentName } from "../utils/workflow-util";

interface LeftPanelProps {
	components: WorkflowComponent[];
}

export function LeftPanel({ components }: LeftPanelProps) {
	const { t } = useTranslation();
	const [collapsed, setCollapsed] = useState(false);

	const onDragStart = (event: React.DragEvent, componentName: string) => {
		event.dataTransfer.setData("application/reactflow", componentName);
		event.dataTransfer.effectAllowed = "move";
	};

	return (
		<>
			<div
				className={`h-full bg-white border-r border-gray-200 flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden ${
					collapsed ? "w-0 opacity-0 border-r-0" : "w-[260px]"
				}`}
			>
				{/* Header */}
				<div className="p-4 border-b border-gray-200 bg-white flex justify-between items-start gap-2">
					<div className="flex-1 min-w-0">
						<div className="text-base font-semibold text-gray-800 whitespace-nowrap">
							{t("workflowDesigner.componentLibrary")}
						</div>
						<div className="text-xs text-gray-500 whitespace-nowrap">
							{t("workflowDesigner.dragComponentHint")}
						</div>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="h-auto w-auto p-1 text-gray-500 hover:text-blue-500"
						onClick={() => setCollapsed(!collapsed)}
					>
						<Icon
							icon={
								collapsed
									? "ri:arrow-right-s-line"
									: "ri:arrow-left-s-line"
							}
							size={18}
						/>
					</Button>
				</div>

				{/* Component List */}
				<div className="flex-1 overflow-y-auto p-3">
					{(() => {
						const enabled = components.filter((c) => c.isEnable !== false);
						const groups = enabled.reduce<Record<string, WorkflowComponent[]>>((acc, c) => {
							const cat = c.category || '其他';
							if (!acc[cat]) acc[cat] = [];
							acc[cat].push(c);
							return acc;
						}, {});
						return Object.entries(groups).map(([category, items]) => (
							<div key={category} className="mb-3">
								<div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-0.5">
									{category}
								</div>
								{items.map((component) => (
									<div
										key={component.name}
										className="flex items-center p-2.5 mb-2 bg-white border border-gray-200 rounded-md cursor-grab transition-all hover:border-blue-500 hover:bg-blue-50 hover:shadow-md hover:-translate-y-0.5 active:cursor-grabbing active:translate-y-0"
										draggable
										onDragStart={(e) => onDragStart(e, component.name)}
									>
										<div className="w-7 h-7 flex items-center justify-center mr-2.5">
											<Icon
												icon={getIconByComponentName(component.name)}
												size={20}
												style={{ color: getIconColorByComponentName(component.name) }}
											/>
										</div>
										<div className="text-sm text-gray-800 font-medium">
											{component.title}
										</div>
									</div>
								))}
							</div>
						));
					})()}
				</div>
			</div>

			{/* Expand Button */}
			{collapsed && (
				<div
					className="absolute left-0 top-24 w-8 h-12 bg-white border border-gray-200 border-l-0 rounded-r-lg flex items-center justify-center cursor-pointer z-10 shadow-md hover:bg-blue-50 hover:border-blue-500 transition-all"
					onClick={() => setCollapsed(false)}
				>
					<Icon icon="ri:arrow-right-s-line" size={18} />
				</div>
			)}
		</>
	);
}
