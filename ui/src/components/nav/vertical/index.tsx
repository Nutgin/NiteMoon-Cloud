import { cn } from "@/utils";
import type { NavProps } from "../types";
import { NavGroup } from "./nav-group";

/**
 * 纵向导航（侧边栏菜单）。
 *
 * 只做一件事：渲染“分组”（section）。
 * - 不处理路由 active 判断
 * - 不处理展开/折叠逻辑
 * - 不处理权限过滤
 *
 * 这些逻辑都在更底层组件里：
 * - `NavGroup`：分组标题 + 分组折叠
 * - `NavList`：递归渲染树形菜单、计算 active、控制每个节点是否展开
 * - `NavItem`：单行菜单的 UI（图标/标题/角标/箭头）
 */
export function NavVertical({ data, className, ...props }: NavProps) {
	return (
		<nav className={cn("flex w-full flex-col gap-2.5", className)} {...props}>
			{data.map((group, index) => (
				<NavGroup key={group.name || index} name={group.name} icon={group.icon} items={group.items} />
			))}
		</nav>
	);
}
