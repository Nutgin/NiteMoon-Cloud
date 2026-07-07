import { Icon } from "@/components/icon";
import { useState, useEffect } from "react";
import React from "react";

export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
}

interface TreeCheckboxProps {
  data: TreeNode[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  checkStrictly?: boolean; // 是否严格的父子不互相关联
  expandedKeys?: string[]; // 外部控制的展开节点
  onExpandedKeysChange?: (keys: string[]) => void; // 展开状态变化回调
}

export function TreeCheckbox({ 
  data, 
  value = [], 
  onValueChange, 
  placeholder = "请选择", 
  className,
  disabled = false,
  loading = false,
  checkStrictly = false,
  expandedKeys: externalExpandedKeys,
  onExpandedKeysChange
}: TreeCheckboxProps) {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>(value);

  useEffect(() => {
    setCheckedKeys(value);
  }, [value]);

  // 如果外部传入了expandedKeys，使用外部控制的值
  const currentExpandedKeys = externalExpandedKeys !== undefined ? externalExpandedKeys : expandedKeys;
  const setCurrentExpandedKeys = onExpandedKeysChange || setExpandedKeys;

  // 初始化展开所有节点（只在内部控制时生效）
  useEffect(() => {
    if (externalExpandedKeys === undefined) {
      const getAllKeys = (nodes: TreeNode[]): string[] => {
        let keys: string[] = [];
        nodes.forEach(node => {
          keys.push(node.id);
          if (node.children) {
            keys = keys.concat(getAllKeys(node.children));
          }
        });
        return keys;
      };
      setExpandedKeys(getAllKeys(data));
    }
  }, [data, externalExpandedKeys]);

  const handleCheck = (nodeId: string, checked: boolean) => {
    let newCheckedKeys: string[];
    
    if (checked) {
      newCheckedKeys = [...checkedKeys, nodeId];
    } else {
      newCheckedKeys = checkedKeys.filter(key => key !== nodeId);
    }

    // 如果不是严格模式，需要处理父子节点的关联
    if (!checkStrictly) {
      // 获取所有子节点
      const getAllChildrenIds = (node: TreeNode): string[] => {
        let ids: string[] = [];
        if (node.children) {
          node.children.forEach(child => {
            ids.push(child.id);
            ids = ids.concat(getAllChildrenIds(child));
          });
        }
        return ids;
      };

      // 查找当前节点
      const findNode = (nodes: TreeNode[], targetId: string): TreeNode | null => {
        for (const node of nodes) {
          if (node.id === targetId) return node;
          if (node.children) {
            const found = findNode(node.children, targetId);
            if (found) return found;
          }
        }
        return null;
      };

      const currentNode = findNode(data, nodeId);
      if (currentNode) {
        // 处理子节点
        const childrenIds = getAllChildrenIds(currentNode);
        if (checked) {
          // 选中父节点时，选中所有子节点
          childrenIds.forEach(childId => {
            if (!newCheckedKeys.includes(childId)) {
              newCheckedKeys.push(childId);
            }
          });
        } else {
          // 取消父节点时，取消所有子节点
          newCheckedKeys = newCheckedKeys.filter(key => !childrenIds.includes(key));
        }
      }

      // 处理父节点
      const checkParentNode = (nodes: TreeNode[], targetId: string): void => {
        for (const node of nodes) {
          if (node.children) {
            const childIds = node.children.map(child => child.id);
            const allChildrenChecked = childIds.every(childId => newCheckedKeys.includes(childId));
            const someChildrenChecked = childIds.some(childId => newCheckedKeys.includes(childId));

            if (childIds.includes(targetId)) {
              // 当前节点的父节点
              if (allChildrenChecked && !newCheckedKeys.includes(node.id)) {
                newCheckedKeys.push(node.id);
              } else if (!someChildrenChecked && newCheckedKeys.includes(node.id)) {
                newCheckedKeys = newCheckedKeys.filter(key => key !== node.id);
              }
              return;
            }

            // 递归检查父节点
            checkParentNode(node.children, targetId);
          }
        }
      };

      checkParentNode(data, nodeId);
    }

    setCheckedKeys(newCheckedKeys);
    onValueChange?.(newCheckedKeys);
  };

  const toggleExpand = (nodeId: string) => {
    setCurrentExpandedKeys(prev => 
      prev.includes(nodeId) 
        ? prev.filter(key => key !== nodeId)
        : [...prev, nodeId]
    );
  };

  const renderTree = (nodes: TreeNode[], level = 0): React.ReactNode[] => {
    return nodes.map((node) => {
      const isExpanded = currentExpandedKeys.includes(node.id);
      const isChecked = checkedKeys.includes(node.id);
      const hasChildren = node.children && node.children.length > 0;

      return (
        <div key={node.id} className="select-none">
          <div 
            className="flex items-center py-1 hover:bg-gray-50 rounded cursor-pointer"
            style={{ paddingLeft: `${level * 20}px` }}
          >
            {hasChildren && (
              <button
                type="button"
                onClick={() => toggleExpand(node.id)}
                className="mr-1 p-1 hover:bg-gray-200 rounded"
                disabled={disabled}
              >
                <Icon 
                  icon={isExpanded ? "mdi:chevron-down" : "mdi:chevron-right"} 
                  size={16} 
                  className="text-gray-600"
                />
              </button>
            )}
            {!hasChildren && <span className="mr-1 w-6" />}
            
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => handleCheck(node.id, e.target.checked)}
              disabled={disabled}
              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            
            <span className="text-sm text-gray-700">{node.name}</span>
          </div>
          
          {hasChildren && isExpanded && (
            <div className="ml-2">
              {renderTree(node.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className={`border border-gray-300 rounded-md p-3 max-h-60 overflow-y-auto ${className}`}>
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Icon icon="mdi:loading" size={20} className="animate-spin text-gray-400 mr-2" />
          <span className="text-sm text-gray-500">加载中...</span>
        </div>
      ) : data.length > 0 ? (
        renderTree(data)
      ) : (
        <div className="text-center py-4 text-sm text-gray-500">
          暂无数据
        </div>
      )}
    </div>
  );
}
