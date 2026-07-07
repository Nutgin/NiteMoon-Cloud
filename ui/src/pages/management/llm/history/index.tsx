import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  llmMessageService,
  type LlmMessage,
  type MessageQueryParams
} from "@/api/services/llmMessageService";
import {
  llmConversationService,
  type LlmConversation,
  type ConversationQueryParams
} from "@/api/services/llmConversationService";
import { ConversationDetailModal } from "./conversation-detail-modal";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function HistoryPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [messageList, setMessageList] = useState<LlmMessage[]>([]);
  const [conversationList, setConversationList] = useState<LlmConversation[]>([]);
  const [messageTotal, setMessageTotal] = useState(0);
  const [conversationTotal, setConversationTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [conversationCurrentPage, setConversationCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [conversationPageSize, setConversationPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState("message");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<LlmConversation | null>(null);
  const [deleteMessageTarget, setDeleteMessageTarget] = useState<LlmMessage | null>(null);
  const [deleteConversationTarget, setDeleteConversationTarget] = useState<LlmConversation | null>(null);

  // Message search state
  const [msgText, setMsgText] = useState("");
  const [msgUsername, setMsgUsername] = useState("");
  const [msgRole, setMsgRole] = useState("");

  // Conversation search state
  const [convText, setConvText] = useState("");
  const [convUsername, setConvUsername] = useState("");

  const loadMessages = async (params?: Partial<MessageQueryParams>) => {
    setLoading(true);
    try {
      const queryParams: MessageQueryParams = {
        pageNum: currentPage,
        pageSize: pageSize,
        ...params,
      };
      const response = await llmMessageService.queryPage(queryParams);
      setMessageList(response.rows || []);
      setMessageTotal(response.total || 0);
    } catch (error) {
      console.error("Failed to load messages:", error);
      toast.error(t('llm.history.loadMessageFailed'));
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async (params?: Partial<ConversationQueryParams>) => {
    setConversationLoading(true);
    try {
      const queryParams: ConversationQueryParams = {
        pageNum: conversationCurrentPage,
        pageSize: conversationPageSize,
        ...params,
      };
      const response = await llmConversationService.queryPage(queryParams);
      setConversationList(response.rows || []);
      setConversationTotal(response.total || 0);
    } catch (error) {
      console.error("Failed to load conversations:", error);
      toast.error(t('llm.history.loadConversationFailed'));
    } finally {
      setConversationLoading(false);
    }
  };

  const handleMessageSearch = () => {
    setCurrentPage(1);
    loadMessages({
      text: msgText || undefined,
      username: msgUsername || undefined,
      role: msgRole && msgRole !== "all" ? msgRole : undefined,
    });
  };

  const handleMessageReset = () => {
    setMsgText("");
    setMsgUsername("");
    setMsgRole("");
    setCurrentPage(1);
    loadMessages({});
  };

  const handleConversationSearch = () => {
    setConversationCurrentPage(1);
    loadConversations({
      text: convText || undefined,
      username: convUsername || undefined,
    });
  };

  const handleConversationReset = () => {
    setConvText("");
    setConvUsername("");
    setConversationCurrentPage(1);
    loadConversations({});
  };

  const handleDeleteMessageConfirm = () => {
    if (!deleteMessageTarget) return;
    llmMessageService.delete(deleteMessageTarget.id!).then(() => {
      toast.success(t('llm.history.deleteMessageSuccess'));
      setDeleteMessageTarget(null);
      loadMessages();
    }).catch(() => {
      toast.error(t('llm.history.deleteMessageFailed'));
    });
  };

  const handleDeleteConversationConfirm = () => {
    if (!deleteConversationTarget) return;
    llmConversationService.delete(deleteConversationTarget.id!).then(() => {
      toast.success(t('llm.history.deleteConversationSuccess'));
      setDeleteConversationTarget(null);
      loadConversations();
    }).catch(() => {
      toast.error(t('llm.history.deleteConversationFailed'));
    });
  };

  useEffect(() => {
    if (activeTab === "message") {
      loadMessages();
    }
  }, [currentPage, pageSize, activeTab]);

  useEffect(() => {
    if (activeTab === "conversation") {
      loadConversations();
    }
  }, [conversationCurrentPage, conversationPageSize, activeTab]);

  const messageColumns: ColumnsType<LlmMessage> = [
    {
      title: t('llm.history.username'),
      dataIndex: "username",
      width: 120,
    },
    {
      title: t('llm.history.ip'),
      dataIndex: "ip",
      width: 120,
    },
    {
      title: t('llm.history.modelName'),
      dataIndex: "modelName",
      width: 150,
    },
    {
      title: t('llm.history.role'),
      dataIndex: "role",
      width: 80,
      render: (role: string) => (
        <Badge variant={role === "user" ? "default" : "secondary"}>
          {role}
        </Badge>
      ),
    },
    {
      title: t('llm.history.appId'),
      dataIndex: "appId",
      width: 120,
    },
    {
      title: t('llm.history.tokenUsage'),
      width: 100,
      align: "right",
      render: (_, record) => <span className="font-mono tabular-nums">{((record.promptTokens || 0) + (record.completionTokens || 0)).toLocaleString()}</span>,
    },
    {
      title: t('llm.history.promptTokens'),
      dataIndex: "promptTokens",
      width: 110,
      align: "right",
      render: (v: number) => <span className="font-mono tabular-nums">{v || 0}</span>,
    },
    {
      title: t('llm.history.messageContent'),
      dataIndex: "message",
      render: (message: string) => (
        <div className="max-w-xs truncate" title={String(message || "")}>
          {String(message || "").replace(/```|\n/g, "")}
        </div>
      ),
    },
    {
      title: t('llm.history.time'),
      dataIndex: "createTime",
      width: 170,
    },
    {
      title: t('llm.history.actions'),
      key: "operation",
      align: "center",
      width: 80,
      render: (_, record) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDeleteMessageTarget(record)}
          title={t('llm.history.delete')}
        >
          <Icon icon="mingcute:delete-2-fill" size={18} className="text-error" />
        </Button>
      ),
    },
  ];

  const conversationColumns: ColumnsType<LlmConversation> = [
    {
      title: t('llm.history.username'),
      dataIndex: "username",
      width: 120,
    },
    {
      title: t('llm.history.windowTitle'),
      dataIndex: "title",
    },
    {
      title: t('llm.history.chatCount'),
      dataIndex: "chatTotal",
      width: 100,
      align: "right",
      render: (v: number) => <span className="font-mono tabular-nums">{v || 0}</span>,
    },
    {
      title: t('llm.history.tokenUsage'),
      dataIndex: "tokenUsed",
      width: 110,
      align: "right",
      render: (v: number) => <span className="font-mono tabular-nums">{v || 0}</span>,
    },
    {
      title: t('llm.history.lastChatTime'),
      dataIndex: "endTime",
      width: 170,
    },
    {
      title: t('llm.history.createdAt'),
      dataIndex: "createTime",
      width: 170,
    },
    {
      title: t('llm.history.actions'),
      key: "operation",
      align: "center",
      width: 120,
      render: (_, record) => (
        <div className="flex w-full justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedConversation(record);
              setDetailModalOpen(true);
            }}
            title={t('llm.history.viewDetail')}
          >
            <Icon icon="mdi:eye" size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteConversationTarget(record)}
            title={t('llm.history.delete')}
          >
            <Icon icon="mingcute:delete-2-fill" size={18} className="text-error" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={t('llm.history.title')} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="message">{t('llm.history.messageTab')}</TabsTrigger>
          <TabsTrigger value="conversation">{t('llm.history.conversationTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="message" className="mt-4 space-y-4">
          {/* Search bar */}
          <div className="flex items-end gap-3">
            <Input
              placeholder={t('llm.history.messageContent')}
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              className="w-48"
              onKeyDown={(e) => e.key === "Enter" && handleMessageSearch()}
            />
            <Input
              placeholder={t('llm.history.username')}
              value={msgUsername}
              onChange={(e) => setMsgUsername(e.target.value)}
              className="w-36"
              onKeyDown={(e) => e.key === "Enter" && handleMessageSearch()}
            />
            <Select value={msgRole} onValueChange={setMsgRole}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t('llm.history.allRoles')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('llm.history.allRoles')}</SelectItem>
                <SelectItem value="user">user</SelectItem>
                <SelectItem value="assistant">assistant</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleMessageSearch}>
              <Icon icon="mdi:search" size={16} className="mr-2" />
              {t('llm.history.search')}
            </Button>
            <Button variant="outline" onClick={handleMessageReset}>
              <Icon icon="mdi:refresh" size={16} className="mr-2" />
              {t('llm.history.reset')}
            </Button>
          </div>

          <Card>
            <CardContent>
              <Table
                rowKey="id"
                size="small"
                scroll={{ x: 1200 }}
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: messageTotal,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => t('llm.history.pagination', { start: range[0], end: range[1], total }),
                  onChange: (page, size) => {
                    setCurrentPage(page);
                    setPageSize(size || 10);
                  },
                }}
                loading={loading}
                columns={messageColumns}
                dataSource={messageList}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversation" className="mt-4 space-y-4">
          {/* Search bar */}
          <div className="flex items-end gap-3">
            <Input
              placeholder={t('llm.history.content')}
              value={convText}
              onChange={(e) => setConvText(e.target.value)}
              className="w-48"
              onKeyDown={(e) => e.key === "Enter" && handleConversationSearch()}
            />
            <Input
              placeholder={t('llm.history.username')}
              value={convUsername}
              onChange={(e) => setConvUsername(e.target.value)}
              className="w-36"
              onKeyDown={(e) => e.key === "Enter" && handleConversationSearch()}
            />
            <Button onClick={handleConversationSearch}>
              <Icon icon="mdi:search" size={16} className="mr-2" />
              {t('llm.history.search')}
            </Button>
            <Button variant="outline" onClick={handleConversationReset}>
              <Icon icon="mdi:refresh" size={16} className="mr-2" />
              {t('llm.history.reset')}
            </Button>
          </div>

          <Card>
            <CardContent>
              <Table
                rowKey="id"
                size="small"
                scroll={{ x: 1000 }}
                pagination={{
                  current: conversationCurrentPage,
                  pageSize: conversationPageSize,
                  total: conversationTotal,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => t('llm.history.pagination', { start: range[0], end: range[1], total }),
                  onChange: (page, size) => {
                    setConversationCurrentPage(page);
                    setConversationPageSize(size || 10);
                  },
                }}
                loading={conversationLoading}
                columns={conversationColumns}
                dataSource={conversationList}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConversationDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        conversation={selectedConversation}
      />

      <ConfirmDialog
        open={!!deleteMessageTarget}
        onOpenChange={(open) => { if (!open) setDeleteMessageTarget(null); }}
        onConfirm={handleDeleteMessageConfirm}
        resourceName={t('llm.history.thisMessage')}
        resourceType=""
      />

      <ConfirmDialog
        open={!!deleteConversationTarget}
        onOpenChange={(open) => { if (!open) setDeleteConversationTarget(null); }}
        onConfirm={handleDeleteConversationConfirm}
        resourceName={deleteConversationTarget?.title || ""}
        resourceType={t('llm.history.deleteConfirm')}
      />
    </>
  );
}
