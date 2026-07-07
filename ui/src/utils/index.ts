import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 Tailwind className 的工具函数（项目里用得非常多）。
 *
 * 为什么需要 `cn`：
 * - `clsx(...)`：让你可以用非常灵活的方式拼 className
 *   - 字符串：`"px-2"`
 *   - 数组：`["px-2", condition && "text-red-500"]`
 *   - 对象：`{ "text-red-500": condition }`
 * - `twMerge(...)`：解决 Tailwind “冲突类”的覆盖问题，并以“后者覆盖前者”为准
 *   - `cn("p-2", "p-4")` => `"p-4"`
 *   - `cn("text-red-500", isDark && "text-white")` => `"text-white"`（当 isDark 为 true）
 *
 * 结论：用 `cn(...)` 拼接 className，既方便写条件样式，也不会出现 Tailwind 冲突导致样式不生效。
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * check if item exists in resourcePool
 */
export const check = (item: string, resourcePool: string[]) => {
	return resourcePool.some((p) => p === item);
};

/**
 * check if any item exists in resourcePool
 */
export const checkAny = (items: string[], resourcePool: string[]) => items.some((item) => check(item, resourcePool));

/**
 * check if all items exist in resourcePool
 */
export const checkAll = (items: string[], resourcePool: string[]) => items.every((item) => check(item, resourcePool));

/**
 * join url parts
 * @example
 * urlJoin('/admin/', '/api/', '/user/') // '/admin/api/user'
 * urlJoin('/admin', 'api', 'user/')     // '/admin/api/user'
 * urlJoin('/admin/', '', '/user/')      // '/admin/user'
 */
export const urlJoin = (...parts: string[]) => {
	const result = parts
		.map((part) => {
			return part.replace(/^\/+|\/+$/g, ""); // 去除两边/
		})
		.filter(Boolean);
	return `/${result.join("/")}`;
};
