import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  type AigcTool,
  getToolPageApi,
  deleteToolApi,
} from "@/api/services/llmToolService";
import ToolModal from "./tool-modal";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";

const HTTP_METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-100 text-green-700 border-green-200",
  POST: "bg-blue-100 text-blue-700 border-blue-200",
  PUT: "bg-orange-100 text-orange-700 border-orange-200",
  DELETE: "bg-red-100 text-red-700 border-red-200",
};

export default function ToolPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [toolList, setToolList] = useState<AigcTool[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<AigcTool | null>(null);
  const [searchName, setSearchName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AigcTool | null>(null);

  const loadTools = async (params?: { name?: string }) => {
    setLoading(true);
    try {
      const response = await getToolPageApi({
        pageNum: currentPage,
        pageSize,
        name: params?.name || undefined,
      });
      setToolList(response.records || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error("Failed to load tools:", error);
      toast.error(t('llm.tool.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, [currentPage, pageSize]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadTools({ name: searchName || undefined });
  };

  const handleReset = () => {
    setSearchName("");
    setCurrentPage(1);
    loadTools();
  };

  const handleAdd = () => {
    setEditingTool(null);
    setModalOpen(true);
  };

  const handleEdit = (tool: AigcTool) => {
    setEditingTool(tool);
    setModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteToolApi(deleteTarget.id!).then(() => {
      toast.success(t('llm.tool.deleteSuccess'));
      setDeleteTarget(null);
      loadTools();
    }).catch(() => {
      toast.error(t('llm.tool.deleteFailed'));
    });
  };

  const columns: ColumnsType<AigcTool> = [
    {
      title: t('llm.tool.name'),
      dataIndex: "name",
      width: 150,
    },
    {
      title: t('llm.tool.description'),
      dataIndex: "description",
      width: 200,
      ellipsis: true,
      render: (v: string) => v || "-",
    },
    {
      title: t('llm.tool.type'),
      dataIndex: "toolType",
      width: 80,
      render: (v: string) => <Badge variant="secondary">{v}</Badge>,
    },
    {
      title: t('llm.tool.endpointUrl'),
      dataIndex: "endpointUrl",
      width: 250,
      ellipsis: true,
      render: (v: string) => v || "-",
    },
    {
      title: t('llm.tool.httpMethod'),
      dataIndex: "httpMethod",
      width: 100,
      align: "center",
      render: (v: string) =>
        v ? (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${HTTP_METHOD_COLORS[v] || ""}`}>
            {v}
          </span>
        ) : "-",
    },
    {
      title: t('llm.tool.createdAt'),
      dataIndex: "createTime",
      width: 170,
      render: (v: string) => v ? new Date(v).toLocaleString() : "-",
    },
    {
      title: t('llm.tool.actions'),
      key: "operation",
      align: "center",
      width: 120,
      render: (_, record) => (
        <div className="flex w-full justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(record)}
            title={t('llm.tool.edit')}
          >
            <Icon icon="solar:pen-bold-duotone" size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget(record)}
            title={t('llm.tool.delete')}
          >
            <Icon icon="mingcute:delete-2-fill" size={18} className="text-error" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('llm.tool.title')}
        actions={
          <Button onClick={handleAdd}>
            <Icon icon="mdi:plus" size={18} className="mr-2" />
            {t('llm.tool.add')}
          </Button>
        }
      />

      {/* Search bar */}
      <div className="flex items-end gap-3 mb-4">
        <Input
          placeholder={t('llm.tool.name')}
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="w-48"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch}>
          <Icon icon="mdi:search" size={16} className="mr-2" />
          {t('llm.tool.search')}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <Icon icon="mdi:refresh" size={16} className="mr-2" />
          {t('llm.tool.reset')}
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent>
          <Table
            rowKey="id"
            size="small"
            scroll={{ x: 1100 }}
            loading={loading}
            columns={columns}
            dataSource={toolList}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                t('llm.tool.pagination', { start: range[0], end: range[1], total }),
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
            }}
          />
        </CardContent>
      </Card>

      <ToolModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingTool={editingTool}
        onSuccess={() => loadTools()}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
        resourceName={deleteTarget?.name || ""}
        resourceType={t('llm.tool.deleteConfirm')}
      />
    </>
  );
}
