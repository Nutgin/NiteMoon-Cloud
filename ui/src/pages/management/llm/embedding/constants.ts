import { ProviderEnum } from "@/api/services/llmEmbedStoreService";

export const EMBED_STORE_PROVIDERS = [
  {
    value: ProviderEnum.REDIS,
    label: 'Redis',
    description: '基于内存的向量数据库'
  },
  {
    value: ProviderEnum.PGVECTOR,
    label: 'PgVector',
    description: 'PostgreSQL的向量扩展'
  },
  {
    value: ProviderEnum.MILVUS,
    label: 'Milvus',
    description: '开源的向量数据库'
  }
];

export const DIMENSION_OPTIONS = [
  { label: '512', value: 512 },
  { label: '768', value: 768 },
  { label: '1024', value: 1024 },
  { label: '1536', value: 1536 }
];

export function getProviderLabel(value: ProviderEnum): string {
  const provider = EMBED_STORE_PROVIDERS.find(p => p.value === value);
  return provider?.label || value;
}

export function getProviderDescription(value: ProviderEnum): string {
  const provider = EMBED_STORE_PROVIDERS.find(p => p.value === value);
  return provider?.description || '';
}
