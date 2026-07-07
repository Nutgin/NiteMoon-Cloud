import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: SelectOption[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

export function MultiSelect({ 
  options, 
  value = [], 
  onValueChange, 
  placeholder = "请选择", 
  className,
  disabled = false,
  loading = false
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  // 过滤选项
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  // 获取选中项的标签
  const getSelectedLabels = () => {
    return options
      .filter(option => value.includes(option.value))
      .map(option => option.label);
  };

  // 切换选项
  const toggleOption = (optionValue: string) => {
    if (disabled) return;
    
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    
    onValueChange?.(newValue);
  };

  // 删除标签
  const removeTag = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const newValue = value.filter(v => v !== optionValue);
    onValueChange?.(newValue);
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [open]);

  return (
    <div ref={popoverRef} className={`relative ${className}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-auto min-h-10 py-2",
              value.length === 0 && "text-muted-foreground"
            )}
            disabled={disabled || loading}
            onClick={() => setOpen(!open)}
          >
            <div className="flex flex-wrap items-center gap-1 w-full">
              {value.length > 0 ? (
                getSelectedLabels().map((label, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {label}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => removeTag(value[index], e)}
                        className="hover:text-blue-600 ml-1"
                      >
                        <Icon icon="mdi:close" size={12} />
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <span>{placeholder}</span>
              )}
            </div>
            {loading && (
              <Icon icon="mdi:loading" size={16} className="animate-spin text-gray-400 ml-auto" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="p-3">
            <input
              type="text"
              placeholder="搜索..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm",
                    value.includes(option.value) && "bg-blue-50"
                  )}
                  onClick={() => toggleOption(option.value)}
                >
                  <span>{option.label}</span>
                  {value.includes(option.value) && (
                    <Icon icon="mdi:check" size={16} className="text-blue-600" />
                  )}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                暂无数据
              </div>
            )}
          </div>
          {value.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onValueChange?.([])}
                className="w-full"
              >
                清空选择
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
