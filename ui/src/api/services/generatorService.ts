import apiClient from "../apiClient";

// ==================== Datasource ====================

export interface GenDataSource {
  id: string;
  name: string;
  url?: string;
  username: string;
  password: string;
  dbName: string;
  port: string;
  host: string;
  createBy?: string;
  updateBy?: string;
  createTime?: string;
  updateTime?: string;
  delFlag?: string;
  tenantId?: string;
}

export interface DatasourceQueryParams {
  pageNum?: number;
  pageSize?: number;
  name?: string;
  dbName?: string;
}

export interface DatasourceListResponse {
  records: GenDataSource[];
  total: number;
}

// ==================== Table & Column ====================

export interface GenTableColumn {
  columnId: string;
  tableId: string;
  columnName: string;
  columnComment: string;
  columnType: string;
  javaType: string;
  javaField: string;
  isPk: string;
  isIncrement: string;
  isRequired: string;
  isInsert: string;
  isEdit: string;
  isList: string;
  isQuery: string;
  queryType: string;
  htmlType: string;
  dictType: string;
  sort: number;
}

export interface GenTable {
  tableId: string;
  tableName: string;
  tableComment: string;
  className: string;
  tplCategory: string;
  tplWebType: string;
  packageName: string;
  moduleName: string;
  businessName: string;
  functionName: string;
  functionAuthor: string;
  genType: string;
  genPath: string;
  dsName: string;
  pkColumn?: GenTableColumn;
  columns?: GenTableColumn[];
  createBy?: string;
  updateBy?: string;
  createTime?: string;
  updateTime?: string;
}

export interface TableQueryParams {
  current?: number;
  size?: number;
  dsName?: string;
  tableName?: string;
  tableComment?: string;
}

export interface TableListResponse {
  records: any[];
  total: number;
}

// ==================== API URLs ====================

const GenDatasourceApi = {
  Page: "/gen/gen-datasource/page",
  List: "/gen/gen-datasource/list",
  Operation: "/gen/gen-datasource",
};

const GenTableApi = {
  Page: "/gen/gen-table/page",
  Operation: "/gen/gen-table",
  Gen: "/gen/gen-table/gen",
};

// ==================== Datasource APIs ====================

export const queryDatasourcePage = (params: DatasourceQueryParams) => {
  return apiClient.get<DatasourceListResponse>({
    url: GenDatasourceApi.Page,
    params,
  });
};

export const queryDatasourceList = () => {
  return apiClient.get<GenDataSource[]>({
    url: GenDatasourceApi.List,
  });
};

export const getDatasourceById = (id: string) => {
  return apiClient.get<GenDataSource>({
    url: GenDatasourceApi.Operation + "/" + id,
  });
};

export const addDatasource = (data: GenDataSource) => {
  return apiClient.post({
    url: GenDatasourceApi.Operation,
    data,
    headers: { "Content-Type": "application/json" },
  });
};

export const updateDatasource = (data: GenDataSource) => {
  return apiClient.put({
    url: GenDatasourceApi.Operation,
    data,
    headers: { "Content-Type": "application/json" },
  });
};

export const deleteDatasource = (id: string) => {
  return apiClient.delete({
    url: GenDatasourceApi.Operation + "/" + id,
  });
};

// ==================== Table APIs ====================

export const queryTablePage = (params: TableQueryParams) => {
  return apiClient.get<TableListResponse>({
    url: GenTableApi.Page,
    params,
  });
};

export const getTableDetail = (dsName: string, tableName: string) => {
  return apiClient.get<GenTable>({
    url: GenTableApi.Operation + "/" + dsName + "/" + tableName,
  });
};

export const updateTable = (data: GenTable) => {
  return apiClient.put({
    url: GenTableApi.Operation,
    data,
    headers: { "Content-Type": "application/json" },
  });
};

export const generateCode = (tableName: string) => {
  return apiClient.request({
    url: GenTableApi.Gen + "/" + tableName,
    method: "GET",
    responseType: "blob",
  });
};

export default {
  queryDatasourcePage,
  queryDatasourceList,
  getDatasourceById,
  addDatasource,
  updateDatasource,
  deleteDatasource,
  queryTablePage,
  getTableDetail,
  updateTable,
  generateCode,
};
