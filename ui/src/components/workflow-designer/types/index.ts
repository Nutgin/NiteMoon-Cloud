export interface WorkflowInfo {
	id?: number;
	uuid: string;
	title: string;
	remark?: string;
	userUuid?: string;
	isPublic?: boolean;
	nodes: WorkflowNode[];
	edges: WorkflowEdge[];
	deleteNodes?: string[];
	deleteEdges?: string[];
}

export interface WorkflowComponent {
	id?: number;
	uuid?: string;
	name: string;
	title: string;
	category?: string;
	remark?: string;
	isEnable?: boolean;
	displayOrder?: number;
	isDeleted?: boolean;
	createTime?: string;
	updateTime?: string;
}

export interface NodeIODefinition {
	uuid: string;
	type: number;
	name: string;
	title: string;
	required: boolean;
	multiple?: boolean;
	limit?: number;
}

export interface NodeIOConfig {
	user_inputs: NodeIODefinition[];
	ref_inputs: any[];
}

export interface OutputParamDefinition {
	name: string;
	type: string;
	label: string;
	fixed: boolean;
}

export interface BranchOutputConfig {
	branchId: string;
	param: string;
	alias?: string;
}

export interface EndNodeOutputConfig {
	mode: 'select' | 'merge' | 'first';
	branchOutputs?: BranchOutputConfig[];
	mergeStrategy?: 'concat' | 'join' | 'json_array';
	separator?: string;
}

export interface WorkflowNode {
	id?: number;
	uuid: string;
	title: string;
	workflowUuid: string;
	workflowId?: number;
	wfComponent?: WorkflowComponent;
	workflowComponentId?: number;
	inputConfig: NodeIOConfig;
	nodeConfig: Record<string, any> & {
		output_config?: EndNodeOutputConfig;
	};
	outputConfig: { outputs: OutputParamDefinition[] };
	positionX: number;
	positionY: number;
}

export interface WorkflowEdge {
	id?: string;
	uuid: string;
	workflowUuid: string;
	sourceNodeUuid: string;
	sourceHandle?: string;
	targetNodeUuid: string;
}

export interface UIWorkflow {
	nodes: any[];
	edges: any[];
}
