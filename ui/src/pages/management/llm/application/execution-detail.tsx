import { useState, useEffect, useCallback } from "react";
import { Spin, Empty, Tabs, Tag, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/icon";
import {
  getExecutionDetailApi,
  type LlmExecutionNode,
  type ExecutionDetail,
} from "@/api/services/llmExecutionService";

interface Props {
  executionId: string;
}

const NODE_ICON_MAP: Record<string, string> = {
  START: "mdi:play-circle-outline",
  END: "mdi:stop-circle-outline",
  LLM: "mdi:cube-outline",
  MULTIMODAL_LLM: "mdi:cube-outline",
  KNOWLEDGE_RETRIEVAL: "mdi:cube-outline",
  KG_RETRIEVAL: "mdi:cube-outline",
  IF_ELSE: "mdi:cube-outline",
  DATETIME_TOOL: "mdi:cube-outline",
  WEB_SEARCH_TOOL: "mdi:cube-outline",
  HTTP_REQUEST_TOOL: "mdi:cube-outline",
  CUSTOM_TOOL: "mdi:cube-outline",
  COMMAND_EXEC_TOOL: "mdi:cube-outline",
  DOC_EXTRACTOR: "mdi:cube-outline",
};

export function ExecutionDetailPanel({ executionId }: Props) {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<ExecutionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<LlmExecutionNode | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getExecutionDetailApi(executionId);
      setDetail(res);
      if (res.nodes && res.nodes.length > 0) {
        setSelectedNode(res.nodes[0]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [executionId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spin />
      </div>
    );
  }

  if (!detail || !detail.nodes || detail.nodes.length === 0) {
    return (
      <div className="py-8">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("llm.executionRecord.noData")} />
      </div>
    );
  }

  const formatJson = (jsonStr?: string) => {
    if (!jsonStr) return "-";
    try {
      return JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch {
      return jsonStr;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="p-4 bg-muted/30 rounded-lg space-y-5">
      {/* Section: Execution Flow */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Icon icon="mdi:sitemap" size={15} className="text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{t("llm.executionRecord.executionFlow")}</span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {detail.nodes.map((node, idx) => {
            const isSelected = selectedNode?.id === node.id;
            const nodeIcon = NODE_ICON_MAP[node.nodeType] || "mdi:cube-outline";

            return (
              <div key={node.id} className="flex items-center shrink-0">
                <button
                  className={`
                    flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg
                    border cursor-pointer transition-all duration-150 min-w-[88px]
                    ${isSelected
                      ? "border-foreground/20 bg-muted shadow-sm"
                      : "border-transparent hover:bg-muted/60"
                    }
                  `}
                  onClick={() => setSelectedNode(node)}
                >
                  <Icon
                    icon={nodeIcon}
                    size={18}
                    className={
                      node.status === "success"
                        ? "text-emerald-500"
                        : node.status === "failed"
                          ? "text-red-500"
                          : "text-slate-400"
                    }
                  />
                  <span className="text-[11px] font-medium max-w-[72px] truncate text-foreground/80">
                    {node.nodeTitle || node.nodeType}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {formatDuration(node.duration)}
                  </span>
                </button>

                {idx < detail.nodes.length - 1 && (
                  <Icon icon="mdi:chevron-right" size={14} className="text-muted-foreground/50 mx-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section: Node Detail */}
      {selectedNode && (
        <div className="bg-background rounded-lg border border-border">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <Icon
                icon={NODE_ICON_MAP[selectedNode.nodeType] || "mdi:cube-outline"}
                size={18}
                className={
                  selectedNode.status === "success"
                    ? "text-emerald-500"
                    : selectedNode.status === "failed"
                      ? "text-red-500"
                      : "text-slate-400"
                }
              />
              <span className="font-medium text-sm">{selectedNode.nodeTitle}</span>
              <span className="text-xs text-muted-foreground">{selectedNode.nodeType}</span>
            </div>
            <div className="flex items-center gap-2">
              {selectedNode.status === "success" && (
                <Tag bordered={false} className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  {t("llm.executionRecord.statusSuccess")}
                </Tag>
              )}
              {selectedNode.status === "failed" && (
                <Tag bordered={false} className="bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400">
                  {t("llm.executionRecord.statusFailed")}
                </Tag>
              )}
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {formatDuration(selectedNode.duration)}
              </span>
            </div>
          </div>

          {/* Error */}
          {selectedNode.errorMessage && (
            <div className="mx-4 mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <Icon icon="mdi:alert-circle-outline" size={15} className="text-red-500 mt-0.5 shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-300">{selectedNode.errorMessage}</span>
            </div>
          )}

          {/* Tabs */}
          <Tabs
            size="small"
            className="px-4 pb-3"
            items={[
              {
                key: "input",
                label: t("llm.executionRecord.inputParams"),
                children: (
                  <div className="bg-muted/50 rounded-md p-3 max-h-72 overflow-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all text-foreground/80 leading-relaxed">
                      {formatJson(selectedNode.inputParams)}
                    </pre>
                  </div>
                ),
              },
              {
                key: "output",
                label: t("llm.executionRecord.outputText"),
                children: (
                  <div className="space-y-3">
                    {selectedNode.outputParams && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">{t("llm.executionRecord.outputParams")}</div>
                        <div className="bg-muted/50 rounded-md p-3 max-h-48 overflow-auto">
                          <pre className="text-xs font-mono whitespace-pre-wrap break-all text-foreground/80 leading-relaxed">
                            {formatJson(selectedNode.outputParams)}
                          </pre>
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">{t("llm.executionRecord.outputText")}</div>
                      <div className="bg-muted/50 rounded-md p-3 max-h-48 overflow-auto">
                        <pre className="text-xs font-mono whitespace-pre-wrap break-all text-foreground/80 leading-relaxed">
                          {selectedNode.outputText || "-"}
                        </pre>
                      </div>
                    </div>
                  </div>
                ),
              },
              ...(selectedNode.logs
                ? [
                    {
                      key: "logs",
                      label: t("llm.executionRecord.logs"),
                      children: (
                        <div className="bg-slate-900 rounded-md p-3 max-h-72 overflow-auto">
                          <pre className="text-xs font-mono whitespace-pre-wrap break-all text-slate-300 leading-relaxed">
                            {formatJson(selectedNode.logs)}
                          </pre>
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      )}
    </div>
  );
}
