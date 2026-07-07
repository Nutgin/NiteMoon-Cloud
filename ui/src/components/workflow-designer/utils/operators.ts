import i18n from "@/locales/i18n";

export interface OperatorOption {
	label: string;
	value: string;
	description?: string;
}

export function getConditionOperators(): OperatorOption[] {
	const t = i18n.t;
	return [
		{ label: t("workflowDesigner.conditionContains"), value: "contains", description: t("workflowDesigner.conditionContainsDesc") },
		{ label: t("workflowDesigner.conditionNotContains"), value: "not contains", description: t("workflowDesigner.conditionNotContainsDesc") },
		{ label: t("workflowDesigner.conditionStartsWith"), value: "start with", description: t("workflowDesigner.conditionStartsWithDesc") },
		{ label: t("workflowDesigner.conditionEndsWith"), value: "end with", description: t("workflowDesigner.conditionEndsWithDesc") },
		{ label: t("workflowDesigner.conditionEmpty"), value: "empty", description: t("workflowDesigner.conditionEmptyDesc") },
		{ label: t("workflowDesigner.conditionNotEmpty"), value: "not empty", description: t("workflowDesigner.conditionNotEmptyDesc") },
		{ label: t("workflowDesigner.conditionEquals"), value: "=", description: t("workflowDesigner.conditionEqualsDesc") },
		{ label: t("workflowDesigner.conditionNotEquals"), value: "!=", description: t("workflowDesigner.conditionNotEqualsDesc") },
		{ label: t("workflowDesigner.conditionGreaterThan"), value: ">", description: t("workflowDesigner.conditionGreaterThanDesc") },
		{ label: t("workflowDesigner.conditionGreaterOrEqual"), value: ">=", description: t("workflowDesigner.conditionGreaterOrEqualDesc") },
		{ label: t("workflowDesigner.conditionLessThan"), value: "<", description: t("workflowDesigner.conditionLessThanDesc") },
		{ label: t("workflowDesigner.conditionLessOrEqual"), value: "<=", description: t("workflowDesigner.conditionLessOrEqualDesc") },
	];
}

export function getLogicOperators(): OperatorOption[] {
	const t = i18n.t;
	return [
		{ label: t("workflowDesigner.logicAnd"), value: "and", description: t("workflowDesigner.logicAndDesc") },
		{ label: t("workflowDesigner.logicOr"), value: "or", description: t("workflowDesigner.logicOrDesc") },
	];
}
