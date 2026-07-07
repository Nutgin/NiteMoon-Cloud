import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "@/routes/hooks/use-router";
import {
  pageKnowledgeApi,
  deleteKnowledgeApi,
  type Knowledge,
  type KnowledgeQueryParams
} from "@/api/services/llmKnowledgeService";
import KnowledgeModal from "./knowledge-modal";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function KnowledgePage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [knowledgeList, setKnowledgeList] = useState<Knowledge[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState<Knowledge | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Knowledge | null>(null);
  const [searchName, setSearchName] = useState("");

  const router = useRouter();

  const loadKnowledge = async (params?: Partial<KnowledgeQueryParams>) => {
    setLoading(true);
    try {
      const queryParams: KnowledgeQueryParams = {
        pageNum: currentPage,
        pageSize: pageSize,
        ...params,
      };
      const response = await pageKnowledgeApi(queryParams);
      setKnowledgeList(response.rows || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error("Failed to load knowledge:", error);
      toast.error(t('llm.knowledge.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadKnowledge({ name: searchName || undefined });
  };

  const handleReset = () => {
    setSearchName("");
    setCurrentPage(1);
    loadKnowledge({});
  };

  const handleEdit = (record: Knowledge) => {
    setEditingKnowledge(record);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingKnowledge(null);
    setModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteKnowledgeApi(deleteTarget.id!).then(() => {
      toast.success(t('llm.knowledge.deleteSuccess'));
      setDeleteTarget(null);
      loadKnowledge();
    }).catch(() => {
      toast.error(t('llm.knowledge.deleteFailed'));
    });
  };

  const handleViewSettings = (record: Knowledge) => {
    router.push(`/aigc/knowledge/setting?id=${record.id}`);
  };

  const formatSize = (size?: string | number) => {
    if (!size) return "0 MB";
    const sizeNum = typeof size === 'string' ? parseInt(size) : size;
    if (sizeNum < 1024 * 1024) {
      return `${(sizeNum / 1024).toFixed(2)} KB`;
    }
    return `${(sizeNum / (1024 * 1024)).toFixed(2)} MB`;
  };

  useEffect(() => {
    loadKnowledge();
  }, [currentPage, pageSize]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      <PageHeader
        title={t('llm.knowledge.title')}
        actions={
          <Button onClick={handleAdd}>
            <Icon icon="mdi:plus" size={18} className="mr-2" />
            {t('llm.knowledge.createKnowledge')}
          </Button>
        }
      />

      {/* Search bar */}
      <div className="flex items-end gap-3 mb-6">
        <Input
          placeholder={t('llm.knowledge.namePlaceholder')}
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="w-64"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch}>
          <Icon icon="mdi:search" size={16} className="mr-2" />
          {t('llm.knowledge.search')}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <Icon icon="mdi:refresh" size={16} className="mr-2" />
          {t('llm.knowledge.reset')}
        </Button>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Create card */}
        <button
          type="button"
          className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-6 flex flex-col items-center justify-center gap-2 min-h-[160px] transition-colors hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
          onClick={handleAdd}
        >
          <Icon icon="mdi:plus-circle-outline" size={32} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t('llm.knowledge.createBlank')}</span>
        </button>

        {/* Knowledge cards */}
        {knowledgeList.map((knowledge) => (
          <div
            key={knowledge.id}
            className="group bg-card border rounded-xl p-5 cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
            onClick={() => handleViewSettings(knowledge)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 bg-primary/10 p-3 rounded-lg">
                <Icon icon="mdi:database" size={24} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{knowledge.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {knowledge.des || t('llm.knowledge.noDescription')}
                </p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Icon icon="mdi:dots-vertical" size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => handleViewSettings(knowledge)}>
                      <Icon icon="mdi:cog" size={16} className="mr-2" />
                      {t('llm.knowledge.settings')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(knowledge)}>
                      <Icon icon="mdi:pencil" size={16} className="mr-2" />
                      {t('llm.knowledge.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteTarget(knowledge)} className="text-destructive">
                      <Icon icon="mdi:delete" size={16} className="mr-2" />
                      {t('llm.knowledge.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Icon icon="mdi:file-document-outline" size={14} />
                {t('llm.knowledge.docCount', { count: knowledge.docsNum || 0 })}
              </span>
              <span className="flex items-center gap-1">
                <Icon icon="mdi:harddisk" size={14} />
                {formatSize(knowledge.totalSize)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {knowledgeList.length === 0 && !loading && (
        <div className="text-center py-16">
          <Icon icon="mdi:database" size={48} className="mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">{t('llm.knowledge.emptyHint')}</p>
        </div>
      )}

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <Icon icon="mdi:chevron-left" size={16} className="mr-1" />
            {t('llm.knowledge.prevPage')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
          >
            {t('llm.knowledge.nextPage')}
            <Icon icon="mdi:chevron-right" size={16} className="ml-1" />
          </Button>
        </div>
      )}

      <KnowledgeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingKnowledge={editingKnowledge}
        onSuccess={() => loadKnowledge()}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
        resourceName={deleteTarget?.name || ""}
        resourceType={t('llm.knowledge.deleteConfirm')}
      />
    </>
  );
}
