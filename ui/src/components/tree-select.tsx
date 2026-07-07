import { Icon } from "@/components/icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { useState, useEffect } from "react";
import React from "react";

export interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
}

interface TreeSelectProps {
  data: TreeNode[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

export function TreeSelect({ 
  data, 
  value, 
  onValueChange, 
  placeholder = "请选择", 
  className,
  disabled = false,
  loading = false
}: TreeSelectProps) {
  const renderTreeOptions = (nodes: TreeNode[], level = 0): React.ReactNode[] => {
    return nodes.map((node) => (
      <React.Fragment key={node.id}>
        <SelectItem value={node.id}>
          <div className="flex items-center">
            {level > 0 && (
              <span style={{ width: `${level * 16}px` }} className="inline-block" />
            )}
            {level > 0 && (
              <Icon icon="mdi:subdirectory-arrow-right" size={14} className="text-gray-400 mr-1" />
            )}
            <span>{node.name}</span>
          </div>
        </SelectItem>
        {node.children && node.children.length > 0 && 
          renderTreeOptions(node.children, level + 1)
        }
      </React.Fragment>
    ));
  };

  const getSelectedNodeName = () => {
    if (!value) return "";
    
    const findNode = (nodes: TreeNode[]): TreeNode | null => {
      for (const node of nodes) {
        if (node.id === value) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    const selectedNode = findNode(data);
    return selectedNode ? selectedNode.name : "";
  };

  return (
    <div className={`relative ${className}`}>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || loading}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder}>
            {value && (
              <div className="flex items-center">
                <span>{getSelectedNodeName()}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {data.length > 0 ? (
            renderTreeOptions(data)
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              暂无数据
            </div>
          )}
        </SelectContent>
      </Select>
      {loading && (
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
          <Icon icon="mdi:loading" size={16} className="animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );
}
