import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  EmbedStore,
  ProviderEnum,
  pageEmbedStoreApi,
  deleteEmbedStoreApi,
  type EmbedStoreQueryParams
} from "@/api/services/llmEmbedStoreService";
import { EMBED_STORE_PROVIDERS, getProviderLabel } from "./constants";
import EmbedModal from "./embed-modal";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function EmbedStorePage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [embedStoreList, setEmbedStoreList] = useState<EmbedStore[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<EmbedStore | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ProviderEnum>(ProviderEnum.REDIS);
  const [deleteTarget, setDeleteTarget] = useState<EmbedStore | null>(null);

  const [searchName, setSearchName] = useState("");
  const [searchProvider, setSearchProvider] = useState("all");

  const loadEmbedStores = async (params?: Partial<EmbedStoreQueryParams>) => {
    setLoading(true);
    try {
      const queryParams: EmbedStoreQueryParams = {
        page: currentPage,
        limit: pageSize,
        ...params,
      };
      const response = await pageEmbedStoreApi(queryParams);
      setEmbedStoreList(response.rows || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error("Failed to load embed stores:", error);
      toast.error(t('llm.embedding.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmbedStores();
  }, [currentPage, pageSize]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadEmbedStores({
      name: searchName || undefined,
      provider: searchProvider && searchProvider !== "all" ? searchProvider as ProviderEnum : undefined
    });
  };

  const handleReset = () => {
    setSearchName("");
    setSearchProvider("all");
    setCurrentPage(1);
    loadEmbedStores();
  };

  const handleAdd = (provider: ProviderEnum) => {
    setSelectedProvider(provider);
    setEditingStore(null);
    setModalOpen(true);
  };

  const handleEdit = (store: EmbedStore) => {
    setEditingStore(store);
    setSelectedProvider(store.provider);
    setModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteEmbedStoreApi(deleteTarget.id!).then(() => {
      toast.success(t('llm.embedding.deleteSuccess'));
      setDeleteTarget(null);
      loadEmbedStores();
    }).catch(() => {
      toast.error(t('llm.embedding.deleteFailed'));
    });
  };

  const handleSuccess = () => {
    loadEmbedStores();
  };

  const columns: ColumnsType<EmbedStore> = [
    {
      title: t('llm.embedding.alias'),
      dataIndex: "name",
      width: 150,
    },
    {
      title: t('llm.embedding.provider'),
      dataIndex: "provider",
      width: 120,
      render: (provider: ProviderEnum) => (
        <Badge variant="secondary">
          {getProviderLabel(provider)}
        </Badge>
      ),
    },
    {
      title: t('llm.embedding.dimension'),
      dataIndex: "dimension",
      width: 100,
      align: 'center',
      render: (dimension: number) => (
        <Badge variant="outline">{dimension}</Badge>
      ),
    },
    {
      title: t('llm.embedding.address'),
      dataIndex: "host",
      width: 150,
    },
    {
      title: t('llm.embedding.port'),
      dataIndex: "port",
      width: 80,
      align: 'center',
    },
    {
      title: t('llm.embedding.username'),
      dataIndex: "username",
      width: 120,
      render: (username: string) => username || "-",
    },
    {
      title: t('llm.embedding.password'),
      dataIndex: "password",
      width: 120,
      render: (password: string) => password ? "••••••••" : "-",
    },
    {
      title: t('llm.embedding.database'),
      dataIndex: "databaseName",
      width: 120,
      render: (databaseName: string) => databaseName || "-",
    },
    {
      title: t('llm.embedding.tableName'),
      dataIndex: "tableName",
      width: 120,
      render: (tableName: string) => tableName || "-",
    },
    {
      title: t('llm.embedding.actions'),
      key: "operation",
      align: "center",
      width: 120,
      render: (_, record) => (
        <div className="flex w-full justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(record)}
            title={t('llm.embedding.edit')}
          >
            <Icon icon="solar:pen-bold-duotone" size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteTarget(record)}
            title={t('llm.embedding.delete')}
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
        title={t('llm.embedding.title')}
        actions={
          <Button onClick={() => handleAdd(ProviderEnum.REDIS)}>
            <Icon icon="mdi:plus" size={18} className="mr-2" />
            {t('llm.embedding.add')}
          </Button>
        }
      />

      {/* Search bar */}
      <div className="flex items-end gap-3 mb-4">
        <Input
          placeholder={t('llm.embedding.alias')}
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="w-48"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Select value={searchProvider} onValueChange={setSearchProvider}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('llm.embedding.allProviders')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('llm.embedding.allProviders')}</SelectItem>
            {EMBED_STORE_PROVIDERS.map((provider) => (
              <SelectItem key={provider.value} value={provider.value}>
                {provider.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSearch}>
          <Icon icon="mdi:search" size={16} className="mr-2" />
          {t('llm.embedding.search')}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <Icon icon="mdi:refresh" size={16} className="mr-2" />
          {t('llm.embedding.reset')}
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
            dataSource={embedStoreList}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                t('llm.embedding.pagination', { start: range[0], end: range[1], total }),
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
            }}
          />
        </CardContent>
      </Card>

      <EmbedModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingStore={editingStore}
        defaultProvider={selectedProvider}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
        resourceName={deleteTarget?.name || ""}
        resourceType={t('llm.embedding.deleteConfirm')}
      />
    </>
  );
}
