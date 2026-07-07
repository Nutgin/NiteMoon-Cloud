'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { useRouter } from '@/routes/hooks'
import { Icon } from '@/components/icon'
import { Button } from '@/ui/button'
import { toast } from 'sonner'
import { Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import {
  getLlmWorkflowDetailApi,
  updateLlmWorkflowApi,
  createLlmWorkflowApi,
  type LlmWorkflowResp,
} from '@/api/services/llmApplicationService'
import {
  WorkflowDesigner,
  getDefaultOutputConfig,
  type WorkflowInfo,
  type WorkflowComponent,
} from '@/components/workflow-designer'

// LLM workflow supports 8 node types - translated at component level
const LLM_WF_COMPONENT_KEYS: Array<{ name: string; titleKey: string; categoryKey: string }> = [
  { name: 'Start', titleKey: 'llm.applicationWorkflow.nodeStart', categoryKey: 'llm.applicationWorkflow.categorySystem' },
  { name: 'End', titleKey: 'llm.applicationWorkflow.nodeEnd', categoryKey: 'llm.applicationWorkflow.categorySystem' },
  { name: 'KnowledgeRetrieval', titleKey: 'llm.applicationWorkflow.nodeKnowledgeRetrieval', categoryKey: 'llm.applicationWorkflow.categoryLLM' },
  { name: 'KgRetrieval', titleKey: 'llm.applicationWorkflow.nodeKgRetrieval', categoryKey: 'llm.applicationWorkflow.categoryLLM' },
  { name: 'LLM', titleKey: 'llm.applicationWorkflow.nodeLLM', categoryKey: 'llm.applicationWorkflow.categoryLLM' },
  { name: 'MultimodalLLM', titleKey: 'llm.applicationWorkflow.nodeMultimodalLLM', categoryKey: 'llm.applicationWorkflow.categoryLLM' },
  { name: 'DateTimeTool', titleKey: 'llm.applicationWorkflow.nodeDateTimeTool', categoryKey: 'llm.applicationWorkflow.categoryTool' },
  { name: 'HttpRequestTool', titleKey: 'llm.applicationWorkflow.nodeHttpRequestTool', categoryKey: 'llm.applicationWorkflow.categoryTool' },
  { name: 'CommandExecTool', titleKey: 'llm.applicationWorkflow.nodeCommandExecTool', categoryKey: 'llm.applicationWorkflow.categoryTool' },
  { name: 'CustomTool', titleKey: 'llm.applicationWorkflow.nodeCustomTool', categoryKey: 'llm.applicationWorkflow.categoryTool' },
  { name: 'WebSearchTool', titleKey: 'llm.applicationWorkflow.nodeWebSearchTool', categoryKey: 'llm.applicationWorkflow.categoryTool' },
  { name: 'IfElse', titleKey: 'llm.applicationWorkflow.nodeIfElse', categoryKey: 'llm.applicationWorkflow.categoryLogic' },
  { name: 'DocumentExtractor', titleKey: 'llm.applicationWorkflow.nodeDocumentExtractor', categoryKey: 'llm.applicationWorkflow.categoryTool' },
]

// Convert backend nodeType to component name for WorkflowDesigner
function nodeTypeToComponentName(nodeType: string): string {
  const map: Record<string, string> = {
    Start: 'Start',
    LLM: 'LLM',
    MultimodalLlm: 'MultimodalLLM',
    KnowledgeRetrieval: 'KnowledgeRetrieval',
    KgRetrieval: 'KgRetrieval',
    DateTimeTool: 'DateTimeTool',
    WebSearchTool: 'WebSearchTool',
    HttpRequestTool: 'HttpRequestTool',
    CustomTool: 'CustomTool',
    CommandExecTool: 'CommandExecTool',
    IfElse: 'IfElse',
    DocExtractor: 'DocumentExtractor',
    End: 'End',
  }
  return map[nodeType] || nodeType
}

// Convert backend LlmWorkflowResp to WorkflowInfo format expected by WorkflowDesigner
function toWorkflowInfo(data: LlmWorkflowResp): WorkflowInfo {
  const nodes = (data.nodes || []).map((n) => {
    const componentName = nodeTypeToComponentName(n.nodeType)
    return {
      ...n,
      workflowUuid: data.uuid,
      wfComponent: {
        name: componentName,
        title: n.title,
      },
      workflowComponentId: undefined,
      inputConfig: n.inputConfig || { user_inputs: [], ref_inputs: [] },
      outputConfig: (n.outputConfig?.outputs?.length > 0)
        ? n.outputConfig
        : getDefaultOutputConfig(componentName),
      positionX: n.positionX ?? 0,
      positionY: n.positionY ?? 0,
    }
  })

  const edges = (data.edges || []).map((e) => ({
    ...e,
    workflowUuid: data.uuid,
  }))

  return {
    id: data.id,
    uuid: data.uuid,
    title: data.title || 'Workflow',
    remark: data.remark,
    nodes: nodes as any,
    edges: edges as any,
  }
}

// Convert WorkflowInfo back to backend format for saving
function toBackendPayload(workflow: WorkflowInfo) {
  const nodeTypeMap: Record<string, string> = {
    start: 'Start',
    llm: 'LLM',
    multimodalllm: 'MultimodalLlm',
    knowledgeretrieval: 'KnowledgeRetrieval',
    kgretrieval: 'KgRetrieval',
    datetimetool: 'DateTimeTool',
    websearchtool: 'WebSearchTool',
    httprequesttool: 'HttpRequestTool',
    customtool: 'CustomTool',
    commandexectool: 'CommandExecTool',
    ifelse: 'IfElse',
    documentextractor: 'DocExtractor',
    end: 'End',
  }

  const nodes = (workflow.nodes || []).map((n: any) => {
    const wfName = n.wfComponent?.name || ''
    const nodeType = nodeTypeMap[wfName.toLowerCase()] || wfName
    return {
      uuid: n.uuid,
      nodeType,
      title: n.title || wfName,
      remark: n.remark || '',
      inputConfig: n.inputConfig || { user_inputs: [], ref_inputs: [] },
      nodeConfig: n.nodeConfig || {},
      outputConfig: n.outputConfig || { outputs: [] },
      positionX: n.positionX ?? 0,
      positionY: n.positionY ?? 0,
    }
  })

  const edges = (workflow.edges || []).map((e: any) => ({
    uuid: e.uuid,
    sourceNodeUuid: e.sourceNodeUuid,
    sourceHandle: e.sourceHandle || null,
    targetNodeUuid: e.targetNodeUuid,
  }))

  return {
    uuid: workflow.uuid,
    nodes,
    edges,
    deleteNodes: (workflow as any).deleteNodes || [],
    deleteEdges: (workflow as any).deleteEdges || [],
  }
}

// Core workflow editor component that takes appId directly
function WorkflowEditor({ appId }: { appId: string }) {
  const { t } = useTranslation()
  const router = useRouter()

  const [workflow, setWorkflow] = useState<WorkflowInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Translate workflow components
  const llmWfComponents: WorkflowComponent[] = useMemo(
    () =>
      LLM_WF_COMPONENT_KEYS.map((c) => ({
        name: c.name,
        title: t(c.titleKey),
        category: t(c.categoryKey),
      })),
    [t]
  )

  const loadWorkflow = useCallback(async () => {
    if (!appId) {
      toast.error(t('llm.applicationWorkflow.appIdMissing'))
      return
    }

    try {
      setLoading(true)
      const data = await getLlmWorkflowDetailApi(appId)
      setWorkflow(toWorkflowInfo(data))
    } catch (error: any) {
      console.error('加载工作流失败:', error)
      // If workflow doesn't exist, try to create one
      try {
        await createLlmWorkflowApi(appId)
        const data = await getLlmWorkflowDetailApi(appId)
        setWorkflow(toWorkflowInfo(data))
      } catch (createError: any) {
        console.error('创建工作流失败:', createError)
        toast.error(createError.message || t('llm.applicationWorkflow.loadFailed'))
      }
    } finally {
      setLoading(false)
    }
  }, [appId])

  useEffect(() => {
    loadWorkflow()
  }, [loadWorkflow])

  const handleSave = useCallback(
    async (workflowData: WorkflowInfo) => {
      if (saving) return
      setSaving(true)
      try {
        const payload = toBackendPayload(workflowData)
        await updateLlmWorkflowApi(payload)
        toast.success(t('llm.applicationWorkflow.saveSuccess'))
      } catch (error: any) {
        console.error('保存工作流失败:', error)
        toast.error(error.message || t('llm.applicationWorkflow.saveFailed'))
      } finally {
        setSaving(false)
      }
    },
    [saving]
  )

  const handleDeleteNode = useCallback((nodeUuid: string) => {
    console.log('节点已删除:', nodeUuid)
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" tip={t('llm.applicationWorkflow.loading')} />
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Icon icon="mdi:alert-circle" size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">{t('llm.applicationWorkflow.loadFailed')}</p>
          <Button variant="outline" onClick={loadWorkflow} className="mt-4">
            {t('llm.applicationWorkflow.retry')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '600px', width: '100%', position: 'relative' }}>
      <WorkflowDesigner
        workflow={workflow}
        wfComponents={llmWfComponents}
        componentIdMap={{}}
        saving={saving}
        onSave={handleSave}
        onDeleteNode={handleDeleteNode}
      />
    </div>
  )
}

// Named export: used as a tab inside detail.tsx
export function ApplicationWorkflow({ applicationId }: { applicationId: string }) {
  return <WorkflowEditor appId={applicationId} />
}

// Default export: standalone full-page version
export default function ApplicationWorkflowPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const appId = searchParams.get('id')
  const router = useRouter()

  const handleCancel = useCallback(() => {
    router.back()
  }, [router])

  if (!appId) {
    toast.error(t('llm.applicationWorkflow.appIdMissing'))
    router.back()
    return null
  }

  return (
    <div className="flex flex-col" style={{ height: '100vh', width: '100%' }}>
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleCancel} className="h-8 w-8">
              <Icon icon="mdi:arrow-left" size={20} />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{t('llm.applicationWorkflow.title')}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* 工作流设计器 */}
      <div className="flex-1 overflow-hidden" style={{ position: 'relative', minHeight: 0 }}>
        <WorkflowEditor appId={appId} />
      </div>
    </div>
  )
}
