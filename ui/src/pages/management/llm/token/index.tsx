import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Chart, useChart } from "@/components/chart";
import {
  getTokenChartBy30,
  getTokenMessagePage,
  deleteTokenMessage,
  exportTokenMessages
} from "@/api/services/llmTokenService";
import type {
  TokenStatistic,
  TokenMessage,
  TokenQueryParams
} from "./types";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function TokenPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [tokenList, setTokenList] = useState<TokenMessage[]>([]);
  const [chartData, setChartData] = useState<TokenStatistic[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState<TokenMessage | null>(null);

  // Search state
  const [searchUsername, setSearchUsername] = useState("");
  const [searchModel, setSearchModel] = useState("");
  const [searchDateRange, setSearchDateRange] = useState<string>("all");

  const loadChartData = async () => {
    setChartLoading(true);
    try {
      const data = await getTokenChartBy30();
      setChartData(data);
    } catch (error) {
      console.error("Failed to load chart data:", error);
      toast.error(t('llm.token.loadChartFailed'));
    } finally {
      setChartLoading(false);
    }
  };

  const buildQueryParams = (overrides?: Partial<TokenQueryParams>): TokenQueryParams => {
    const params: TokenQueryParams = {
      page: currentPage,
      limit: pageSize,
      ...overrides,
    };

    if (searchUsername) params.username = searchUsername;
    if (searchModel) params.modelName = searchModel;

    if (searchDateRange && searchDateRange !== "all") {
      const today = new Date();
      const days = parseInt(searchDateRange);
      const startDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
      params.startDate = startDate.toISOString().split('T')[0];
      params.endDate = today.toISOString().split('T')[0];
    }

    return params;
  };

  const loadTokenList = async (overrides?: Partial<TokenQueryParams>) => {
    setLoading(true);
    try {
      const response = await getTokenMessagePage(buildQueryParams(overrides));
      setTokenList(response.rows || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error("Failed to load token list:", error);
      toast.error(t('llm.token.loadListFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadTokenList({ page: 1 });
  };

  const handleReset = () => {
    setSearchUsername("");
    setSearchModel("");
    setSearchDateRange("all");
    setCurrentPage(1);
    loadTokenList({ page: 1, username: undefined, modelName: undefined, startDate: undefined, endDate: undefined });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteTokenMessage(deleteTarget.id).then(() => {
      toast.success(t('llm.token.deleteSuccess'));
      setDeleteTarget(null);
      loadTokenList();
    }).catch(() => {
      toast.error(t('llm.token.deleteFailed'));
    });
  };

  const handleExport = async () => {
    try {
      const params = buildQueryParams();
      const response = await exportTokenMessages(params);
      const blob = new Blob([response as BlobPart], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `token_usage_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(t('llm.token.exportSuccess'));
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(t('llm.token.exportFailed'));
    }
  };

  useEffect(() => {
    loadChartData();
  }, []);

  useEffect(() => {
    loadTokenList();
  }, [currentPage, pageSize]);

  const sortedChartData = [...chartData].reverse();

  const chartYears = sortedChartData.length > 0
    ? [...new Set(sortedChartData.map(item => item.date.slice(0, 4)))]
    : [];
  const isSameYear = chartYears.length <= 1;

  const chartOptions = useChart({
    xaxis: {
      categories: sortedChartData.map(item => isSameYear ? item.date.slice(5) : item.date),
      labels: { rotate: 0 },
    },
    yaxis: {
      title: { text: t('llm.token.tokenCount') },
    },
    tooltip: {
      x: { format: "yyyy-MM-dd" },
    },
  });

  const chartSeries = [
    {
      name: t('llm.token.tokenUsage'),
      data: sortedChartData.map(item => item.tokens),
    },
  ];

  const columns: ColumnsType<TokenMessage> = [
    {
      title: t('llm.token.username'),
      dataIndex: "username",
      width: 120,
    },
    {
      title: t('llm.token.modelName'),
      dataIndex: "modelName",
      width: 150,
    },
    {
      title: t('llm.token.totalTokens'),
      width: 120,
      align: "right",
      render: (_, record) => (
        <span className="font-mono tabular-nums">{((record.promptTokens || 0) + (record.completionTokens || 0)).toLocaleString()}</span>
      ),
    },
    {
      title: "Prompt Tokens",
      dataIndex: "promptTokens",
      width: 130,
      align: "right",
      render: (tokens: number) => (
        <span className="font-mono tabular-nums">{(tokens || 0).toLocaleString()}</span>
      ),
    },
    {
      title: "Completion Tokens",
      dataIndex: "completionTokens",
      width: 140,
      align: "right",
      render: (tokens: number) => (
        <span className="font-mono tabular-nums">{(tokens || 0).toLocaleString()}</span>
      ),
    },
    {
      title: t('llm.token.ipAddress'),
      dataIndex: "ip",
      width: 120,
    },
    {
      title: t('llm.token.callTime'),
      dataIndex: "createTime",
      width: 180,
    },
    {
      title: t('llm.token.actions'),
      key: "operation",
      align: "center",
      width: 80,
      render: (_, record) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteTarget(record)}
          title={t('llm.token.delete')}
        >
          <Icon icon="mingcute:delete-2-fill" size={18} className="text-error" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('llm.token.title')}
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Icon icon="mdi:download" size={18} className="mr-2" />
            {t('llm.token.export')}
          </Button>
        }
      />

      {/* Chart */}
      <div className="rounded-xl border bg-card p-6">
        <p className="text-sm font-medium text-muted-foreground mb-4">
          {isSameYear ? `${chartYears[0]}${t('llm.token.yearSuffix')}` : ""}{t('llm.token.usageTrend')}
        </p>
        {chartLoading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="text-muted-foreground">{t('llm.token.loading')}</div>
          </div>
        ) : (
          <Chart
            type="area"
            series={chartSeries}
            options={chartOptions}
            height={300}
          />
        )}
      </div>

      {/* Search bar */}
      <div className="flex items-end gap-3">
        <Input
          placeholder={t('llm.token.username')}
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          className="w-36"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Input
          placeholder={t('llm.token.modelName')}
          value={searchModel}
          onChange={(e) => setSearchModel(e.target.value)}
          className="w-40"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Select value={searchDateRange} onValueChange={setSearchDateRange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder={t('llm.token.timeRange')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('llm.token.all')}</SelectItem>
            <SelectItem value="7">{t('llm.token.last7Days')}</SelectItem>
            <SelectItem value="30">{t('llm.token.last30Days')}</SelectItem>
            <SelectItem value="90">{t('llm.token.last90Days')}</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch}>
          <Icon icon="mdi:search" size={16} className="mr-2" />
          {t('llm.token.search')}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <Icon icon="mdi:refresh" size={16} className="mr-2" />
          {t('llm.token.reset')}
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent>
          <Table
            rowKey="id"
            size="small"
            scroll={{ x: 1100 }}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => t('llm.token.pagination', { start: range[0], end: range[1], total }),
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size || 10);
              },
            }}
            loading={loading}
            columns={columns}
            dataSource={tokenList}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
        resourceName={t('llm.token.deleteConfirm', { username: deleteTarget?.username || "" })}
        resourceType=""
      />
    </div>
  );
}
