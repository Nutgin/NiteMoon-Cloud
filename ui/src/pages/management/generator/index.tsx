import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Checkbox } from "@/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  queryDatasourcePage,
  queryDatasourceList,
  addDatasource,
  updateDatasource,
  deleteDatasource,
  queryTablePage,
  getTableDetail,
  updateTable,
  generateCode,
  type GenDataSource,
  type GenTable,
  type GenTableColumn,
} from "@/api/services/generatorService";

// ==================== Datasource Tab ====================

interface DatasourceFormData {
  name: string;
  host: string;
  port: string;
  dbName: string;
  username: string;
  password: string;
}

function DatasourceTab() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState<GenDataSource[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GenDataSource | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  const form = useForm<DatasourceFormData>({
    defaultValues: { name: "", host: "", port: "3306", dbName: "", username: "", password: "" },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await queryDatasourcePage({ pageNum: currentPage, pageSize: pageSize });
      setDataList(response.records || []);
      setTotal(response.total || 0);
    } catch {
      toast.error(t('generator.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize]);

  const handleAdd = () => {
    setEditingRecord(null);
    setIsEdit(false);
    form.reset({ name: "", host: "", port: "3306", dbName: "", username: "", password: "" });
    setDialogOpen(true);
  };

  const handleEdit = (record: GenDataSource) => {
    setEditingRecord(record);
    setIsEdit(true);
    form.reset({
      name: record.name || "",
      host: record.host || "",
      port: record.port || "3306",
      dbName: record.dbName || "",
      username: record.username || "",
      password: "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (data: DatasourceFormData) => {
    try {
      setLoading(true);
      const entityData: any = {
        ...data,
        id: isEdit ? editingRecord?.id : undefined,
      };
      if (isEdit) {
        await updateDatasource(entityData);
        toast.success(t('generator.editSuccess'));
      } else {
        await addDatasource(entityData);
        toast.success(t('generator.addSuccess'));
      }
      setDialogOpen(false);
      loadData();
    } catch {
      toast.error(isEdit ? t('generator.editFailed') : t('generator.addFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (record: GenDataSource) => {
    if (window.confirm(t('generator.deleteConfirm'))) {
      deleteDatasource(record.id).then(() => {
        toast.success(t('generator.deleteSuccess'));
        loadData();
      });
    }
  };

  const columns: ColumnsType<GenDataSource> = [
    { title: t('generator.datasourceName'), dataIndex: "name", width: 150 },
    { title: t('generator.host'), dataIndex: "host", width: 150 },
    { title: t('generator.port'), dataIndex: "port", width: 80, align: "center" },
    { title: t('generator.dbName'), dataIndex: "dbName", width: 150 },
    { title: t('generator.username'), dataIndex: "username", width: 120 },
    { title: t('generator.createdAt'), dataIndex: "createTime", width: 150 },
    {
      title: t('generator.actions'),
      key: "operation",
      align: "center",
      width: 150,
      render: (_, record) => (
        <div className="flex w-full justify-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(record)} title={t('generator.edit')}>
            <Icon icon="solar:pen-bold-duotone" size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(record)} title={t('generator.delete')}>
            <Icon icon="mingcute:delete-2-fill" size={18} className="text-error" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>{t('generator.datasourceList')}</div>
            <Button onClick={handleAdd}>{t('generator.addDatasource')}</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table
            rowKey="id"
            size="small"
            scroll={{ x: "max-content" }}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showTotal: (total, range) => t('common.total', { count: total }),
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size || 10);
              },
            }}
            loading={loading}
            columns={columns}
            dataSource={dataList}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? t('generator.editDatasource') : t('generator.addDatasource')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: t('generator.datasourceNameRequired') }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('generator.datasourceName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('generator.datasourceNamePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="host"
                  rules={{ required: t('generator.hostRequired') }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('generator.host')}</FormLabel>
                      <FormControl>
                        <Input placeholder="localhost" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="port"
                  rules={{ required: t('generator.portRequired') }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('generator.port')}</FormLabel>
                      <FormControl>
                        <Input placeholder="3306" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="dbName"
                rules={{ required: t('generator.dbNameRequired') }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('generator.dbName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('generator.dbNamePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  rules={{ required: t('generator.usernameRequired') }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('generator.username')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('generator.usernamePlaceholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  rules={{ required: !isEdit ? t('generator.passwordRequired') : false }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('generator.password')}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={isEdit ? t('generator.passwordEditPlaceholder') : t('generator.passwordPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {t('common.cancelText')}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? t('common.loadingText') : isEdit ? t('generator.update') : t('generator.add')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ==================== Table Tab ====================

interface TableTabProps {
  onSelectTable: (dsName: string, tableName: string) => void;
}

function TableTab({ onSelectTable }: TableTabProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [datasources, setDatasources] = useState<GenDataSource[]>([]);
  const [selectedDs, setSelectedDs] = useState<string>("");
  const [tableList, setTableList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadDatasources = async () => {
    try {
      const response = await queryDatasourceList();
      setDatasources(response || []);
    } catch {
      toast.error(t('generator.loadDatasourceFailed'));
    }
  };

  const loadTables = useCallback(async () => {
    if (!selectedDs) return;
    setLoading(true);
    try {
      const response = await queryTablePage({
        current: currentPage,
        size: pageSize,
        dsName: selectedDs,
      });
      setTableList(response.records || []);
      setTotal(response.total || 0);
    } catch {
      toast.error(t('generator.loadTableFailed'));
    } finally {
      setLoading(false);
    }
  }, [selectedDs, currentPage, pageSize]);

  useEffect(() => {
    loadDatasources();
  }, []);

  useEffect(() => {
    if (selectedDs) {
      setCurrentPage(1);
      loadTables();
    }
  }, [selectedDs, loadTables]);

  useEffect(() => {
    if (selectedDs) {
      loadTables();
    }
  }, [currentPage, pageSize]);

  const columns: ColumnsType<any> = [
    { title: t('generator.tableName'), dataIndex: "name", width: 200 },
    { title: t('generator.tableComment'), dataIndex: "comment", width: 250 },
    { title: t('generator.engine'), dataIndex: "engine", width: 100 },
    { title: t('generator.createdAt'), dataIndex: "createTime", width: 150 },
    {
      title: t('generator.actions'),
      key: "operation",
      align: "center",
      width: 120,
      render: (_, record) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectTable(selectedDs, record.name)}
        >
          <Icon icon="solar:settings-bold-duotone" size={16} className="mr-1" />
          {t('generator.configure')}
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Label>{t('generator.selectDatasource')}</Label>
          <Select value={selectedDs} onValueChange={setSelectedDs}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder={t('generator.selectDatasourcePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {datasources.map((ds) => (
                <SelectItem key={ds.dbName} value={ds.dbName}>
                  {ds.name} ({ds.dbName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table
          rowKey="name"
          size="small"
          scroll={{ x: "max-content" }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total, range) => t('common.total', { count: total }),
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
          }}
          loading={loading}
          columns={columns}
          dataSource={tableList}
        />
      </CardContent>
    </Card>
  );
}

// ==================== Code Gen Tab ====================

interface CodeGenTabProps {
  dsName: string;
  tableName: string;
  onBack: () => void;
}

function CodeGenTab({ dsName, tableName, onBack }: CodeGenTabProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [tableDetail, setTableDetail] = useState<GenTable | null>(null);
  const [columns, setColumns] = useState<GenTableColumn[]>([]);
  const [generating, setGenerating] = useState(false);

  const metadataForm = useForm<{
    className: string;
    packageName: string;
    moduleName: string;
    businessName: string;
    functionName: string;
    functionAuthor: string;
    tplCategory: string;
  }>({
    defaultValues: {
      className: "",
      packageName: "",
      moduleName: "",
      businessName: "",
      functionName: "",
      functionAuthor: "",
      tplCategory: "crud",
    },
  });

  const loadDetail = async () => {
    if (!dsName || !tableName) return;
    setLoading(true);
    try {
      const response = await getTableDetail(dsName, tableName);
      setTableDetail(response);
      setColumns(response.columns || []);
      metadataForm.reset({
        className: response.className || "",
        packageName: response.packageName || "",
        moduleName: response.moduleName || "",
        businessName: response.businessName || "",
        functionName: response.functionName || "",
        functionAuthor: response.functionAuthor || "",
        tplCategory: response.tplCategory || "crud",
      });
    } catch {
      toast.error(t('generator.loadTableDetailFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [dsName, tableName]);

  const handleColumnChange = (index: number, field: keyof GenTableColumn, value: any) => {
    setColumns((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveConfig = async () => {
    if (!tableDetail) return;
    try {
      setLoading(true);
      const metadata = metadataForm.getValues();
      await updateTable({
        ...tableDetail,
        ...metadata,
        columns: columns,
      });
      toast.success(t('generator.saveConfigSuccess'));
    } catch {
      toast.error(t('generator.saveConfigFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!tableDetail) return;
    try {
      setGenerating(true);
      const blob = await generateCode(tableDetail.tableName);
      const url = window.URL.createObjectURL(new Blob([blob as any]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "nitemoon.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t('generator.generateSuccess'));
    } catch {
      toast.error(t('generator.generateFailed'));
    } finally {
      setGenerating(false);
    }
  };

  const columnTableColumns: ColumnsType<GenTableColumn> = [
    { title: t('generator.columnName'), dataIndex: "columnName", width: 140, fixed: "left" },
    { title: t('generator.columnComment'), dataIndex: "columnComment", width: 150 },
    { title: t('generator.javaType'), dataIndex: "javaType", width: 100 },
    { title: t('generator.javaField'), dataIndex: "javaField", width: 120 },
    {
      title: t('generator.isList'),
      dataIndex: "isList",
      width: 60,
      align: "center",
      render: (val: string, _, index) => (
        <Checkbox
          checked={val === "1"}
          onCheckedChange={(checked) => handleColumnChange(index, "isList", checked ? "1" : "0")}
        />
      ),
    },
    {
      title: t('generator.isQuery'),
      dataIndex: "isQuery",
      width: 60,
      align: "center",
      render: (val: string, _, index) => (
        <Checkbox
          checked={val === "1"}
          onCheckedChange={(checked) => handleColumnChange(index, "isQuery", checked ? "1" : "0")}
        />
      ),
    },
    {
      title: t('generator.isEdit'),
      dataIndex: "isEdit",
      width: 60,
      align: "center",
      render: (val: string, _, index) => (
        <Checkbox
          checked={val === "1"}
          onCheckedChange={(checked) => handleColumnChange(index, "isEdit", checked ? "1" : "0")}
        />
      ),
    },
    {
      title: t('generator.isInsert'),
      dataIndex: "isInsert",
      width: 60,
      align: "center",
      render: (val: string, _, index) => (
        <Checkbox
          checked={val === "1"}
          onCheckedChange={(checked) => handleColumnChange(index, "isInsert", checked ? "1" : "0")}
        />
      ),
    },
    {
      title: t('generator.htmlType'),
      dataIndex: "htmlType",
      width: 120,
      render: (val: string, _, index) => (
        <Select
          value={val || "input"}
          onValueChange={(v) => handleColumnChange(index, "htmlType", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="input">{t('generator.inputType')}</SelectItem>
            <SelectItem value="textarea">{t('generator.textareaType')}</SelectItem>
            <SelectItem value="select">{t('generator.selectType')}</SelectItem>
            <SelectItem value="radio">{t('generator.radioType')}</SelectItem>
            <SelectItem value="checkbox">{t('generator.checkboxType')}</SelectItem>
            <SelectItem value="datetime">{t('generator.datetimeType')}</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      title: t('generator.queryType'),
      dataIndex: "queryType",
      width: 100,
      render: (val: string, _, index) => (
        <Select
          value={val || "EQ"}
          onValueChange={(v) => handleColumnChange(index, "queryType", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EQ">{t('generator.eq')}</SelectItem>
            <SelectItem value="NE">{t('generator.ne')}</SelectItem>
            <SelectItem value="LIKE">{t('generator.like')}</SelectItem>
            <SelectItem value="GT">{t('generator.gt')}</SelectItem>
            <SelectItem value="LT">{t('generator.lt')}</SelectItem>
            <SelectItem value="BETWEEN">{t('generator.between')}</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      title: t('generator.dictType'),
      dataIndex: "dictType",
      width: 130,
      render: (val: string, _, index) => (
        <Input
          value={val || ""}
          onChange={(e) => handleColumnChange(index, "dictType", e.target.value)}
          placeholder={t('generator.dictTypePlaceholder')}
          className="h-8 text-xs"
        />
      ),
    },
  ];

  if (!dsName || !tableName) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            {t('generator.selectTableFirst')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Metadata Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <Icon icon="mdi:arrow-left" size={20} />
              </Button>
              <span>{t('generator.tableConfig')} - {tableName}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveConfig} disabled={loading}>
                <Icon icon="solar:diskette-bold-duotone" size={16} className="mr-2" />
                {t('generator.saveConfig')}
              </Button>
              <Button onClick={handleGenerate} disabled={generating}>
                <Icon icon="solar:download-bold-duotone" size={16} className="mr-2" />
                {generating ? t('generator.generating') : t('generator.generateCode')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...metadataForm}>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={metadataForm.control}
                name="className"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('generator.className')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={metadataForm.control}
                name="packageName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('generator.packageName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={metadataForm.control}
                name="moduleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('generator.moduleName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={metadataForm.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('generator.businessName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={metadataForm.control}
                name="functionName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('generator.functionName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={metadataForm.control}
                name="functionAuthor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('generator.author')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Column Configuration */}
      <Card>
        <CardHeader>
          <div>{t('generator.columnConfig')}</div>
        </CardHeader>
        <CardContent>
          <Table
            rowKey="columnId"
            size="small"
            scroll={{ x: "max-content" }}
            pagination={false}
            loading={loading}
            columns={columnTableColumns}
            dataSource={columns}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== Main Page ====================

export default function GeneratorPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("datasource");
  const [selectedDs, setSelectedDs] = useState("");
  const [selectedTable, setSelectedTable] = useState("");

  const handleSelectTable = (dsName: string, tableName: string) => {
    setSelectedDs(dsName);
    setSelectedTable(tableName);
    setActiveTab("codegen");
  };

  const handleBackToTable = () => {
    setActiveTab("table");
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="datasource">
            <Icon icon="solar:database-bold-duotone" size={16} className="mr-2" />
            {t('generator.datasourceManagement')}
          </TabsTrigger>
          <TabsTrigger value="table">
            <Icon icon="solar:table-2-bold-duotone" size={16} className="mr-2" />
            {t('generator.tableManagement')}
          </TabsTrigger>
          <TabsTrigger value="codegen">
            <Icon icon="solar:code-bold-duotone" size={16} className="mr-2" />
            {t('generator.codeGeneration')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="datasource">
          <DatasourceTab />
        </TabsContent>

        <TabsContent value="table">
          <TableTab onSelectTable={handleSelectTable} />
        </TabsContent>

        <TabsContent value="codegen">
          <CodeGenTab dsName={selectedDs} tableName={selectedTable} onBack={handleBackToTable} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
