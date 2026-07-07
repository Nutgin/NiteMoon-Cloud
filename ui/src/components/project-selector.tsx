import { Icon } from "@/components/icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  getAllProjectsApi,
  type TrainingProject
} from "@/api/services/aiModelService";

interface ProjectSelectorProps {
  selectedProjectId?: string;
  onProjectChange?: (project: TrainingProject) => void;
  className?: string;
  autoSelectFirst?: boolean; // 新增：是否自动选择第一个项目
}

export function ProjectSelector({ 
  selectedProjectId, 
  onProjectChange, 
  className,
  autoSelectFirst = false // 默认不自动选择
}: ProjectSelectorProps) {
  const [projects, setProjects] = useState<TrainingProject[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProjects = async () => {
    setLoading(true);
    try {
      // 调用GET /training/project获取完整项目列表
      const response = await getAllProjectsApi();
      const projectList = response || [];
      setProjects(projectList);
      
      // 如果启用自动选择第一个项目，且当前没有选中项目，则选择第一个
      if (autoSelectFirst && !selectedProjectId && projectList.length > 0) {
        const firstProject = projectList[0];
        if (firstProject && onProjectChange) {
          onProjectChange(firstProject);
        }
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
      toast.error("加载项目列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleProjectChange = (projectId: string) => {
    // 从暂存的项目列表中查找完整项目信息（直接使用字符串匹配）
    const project = projects.find(p => p.id === projectId);
    
    if (project && onProjectChange) {
      onProjectChange(project);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Icon icon="mdi:folder-open" size={18} className="text-gray-600" />
      <span className="text-sm font-medium text-gray-700">项目:</span>
      <Select
        value={selectedProjectId}
        onValueChange={handleProjectChange}
        disabled={loading}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="选择项目" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id || ""}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {loading && (
        <Icon icon="mdi:loading" size={16} className="animate-spin text-gray-400" />
      )}
    </div>
  );
}
