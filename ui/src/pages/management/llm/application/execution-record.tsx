import { useState, useEffect, useCallback } from "react";
import { Table, Button, Select, Space, Popconfirm, Tooltip, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/icon";
import { toast } from "sonner";
import {
  getExecutionPageApi,
  deleteExecutionApi,
  type LlmExecution,
  type ExecutionQueryParams,
} from "@/api/services/llmExecutionService";
import { ExecutionDetailPanel } from "./execution-detail";

interface Props {
  applicationId: string;
}

export function ExecutionRecord({ applicationId }: Props) {
  const { t } = useTranslation();
  const [data, setData] = useState<LlmExecution[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<ExecutionQueryParams>({
    pageNum: 1,
    pageSize: 10,
    appId: applicationId,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getExecutionPageApi(params);
      setData(res.rows || res.records || []);
      setTotal(res.total);
    } catch {
      toast.error(t("llm.executionRecord.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [params, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    try {
      await deleteExecutionApi(id);
      toast.success("OK");
      fetchData();
    } catch {
      toast.error(t("llm.executionRecord.deleteFailed"));
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const columns: ColumnsType<LlmExecution> = [
    {
      title: t("llm.executionRecord.status"),
      dataIndex: "status",
      width: 70,
      align: "center",
      render: (status: string) => (
        <Icon
          icon={status === "success" ? "mdi:check-circle" : status === "failed" ? "mdi:close-circle" : "mdi:loading"}
          size={18}
          className={
            status === "success"
              ? "text-emerald-500"
              : status === "failed"
                ? "text-red-500"
                : "text-slate-400 animate-spin"
          }
        />
      ),
    },
    {
      title: t("llm.executionRecord.triggerType"),
      dataIndex: "triggerType",
      width: 90,
      render: (type: string) => (
        <span className="text-xs text-muted-foreground">
          {type === "chat" ? t("llm.executionRecord.triggerChat") : t("llm.executionRecord.triggerApi")}
        </span>
      ),
    },
    {
      title: t("llm.executionRecord.requestMessage"),
      dataIndex: "requestMessage",
      ellipsis: true,
      render: (msg: string) => (
        <span className="text-sm text-foreground/80">{msg || "-"}</span>
      ),
    },
    {
      title: t("llm.executionRecord.totalTokens"),
      width: 100,
      align: "right",
      render: (_, record) => (
        <span className="font-mono text-xs text-muted-foreground">
          {((record.totalInputTokens || 0) + (record.totalOutputTokens || 0)).toLocaleString()}
        </span>
      ),
    },
    {
      title: t("llm.executionRecord.duration"),
      dataIndex: "totalDuration",
      width: 90,
      align: "right",
      render: (ms: number) => (
        <span className="font-mono text-xs text-muted-foreground">{formatDuration(ms)}</span>
      ),
    },
    {
      title: t("llm.executionRecord.createTime"),
      dataIndex: "createTime",
      width: 170,
      render: (time: string) => (
        <span className="text-xs text-muted-foreground">
          {time ? new Date(time).toLocaleString() : "-"}
        </span>
      ),
    },
    {
      title: t("llm.executionRecord.action"),
      width: 80,
      align: "center",
      render: (_, record) => (
        <Space size={0}>
          <Tooltip title={t("llm.executionRecord.viewDetail")}>
            <Button
              type="text"
              size="small"
              icon={<Icon icon={expandedId === record.id ? "mdi:chevron-up" : "mdi:chevron-down"} size={16} />}
              onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
            />
          </Tooltip>
          <Popconfirm
            title={t("llm.executionRecord.deleteConfirm")}
            onConfirm={() => handleDelete(record.id)}
            okButtonProps={{ danger: true }}
          >
            <Tooltip title={t("llm.executionRecord.delete")}>
              <Button type="text" size="small" danger icon={<Icon icon="mdi:delete-outline" size={16} />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-5 space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <Space size={8}>
          <Select
            placeholder={t("llm.executionRecord.allStatus")}
            allowClear
            style={{ width: 140 }}
            onChange={(val) => setParams((p) => ({ ...p, status: val, pageNum: 1 }))}
            options={[
              { label: t("llm.executionRecord.statusRunning"), value: "running" },
              { label: t("llm.executionRecord.statusSuccess"), value: "success" },
              { label: t("llm.executionRecord.statusFailed"), value: "failed" },
            ]}
          />
          <Select
            placeholder={t("llm.executionRecord.allTrigger")}
            allowClear
            style={{ width: 140 }}
            onChange={(val) => setParams((p) => ({ ...p, triggerType: val, pageNum: 1 }))}
            options={[
              { label: t("llm.executionRecord.triggerChat"), value: "chat" },
              { label: t("llm.executionRecord.triggerApi"), value: "api" },
            ]}
          />
        </Space>
        <Button icon={<Icon icon="mdi:refresh" size={16} />} onClick={() => setParams({ pageNum: 1, pageSize: 10, appId: applicationId })}>
          {t("llm.executionRecord.reset")}
        </Button>
      </div>

      {/* Table */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        size="middle"
        pagination={{
          current: params.pageNum,
          pageSize: params.pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (totalNum, range) => t("llm.pagination", { start: range[0], end: range[1], total: totalNum }),
          onChange: (page, size) => setParams((p) => ({ ...p, pageNum: page, pageSize: size })),
        }}
        expandable={{
          expandedRowRender: (record) => <ExecutionDetailPanel executionId={record.id} />,
          expandedRowKeys: expandedId ? [expandedId] : [],
          onExpand: (expanded, record) => setExpandedId(expanded ? record.id : null),
          expandRowByClick: false,
          showExpandColumn: false,
        }}
        scroll={{ x: 800 }}
      />
    </div>
  );
}
