import { useState } from "react";
import { useLocation } from "react-router";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/ui/collapsible";
import { isNavPathActive } from "../components";
import type { NavListProps } from "../types";
import { NavItem } from "./nav-item";

/**
 * 单个“树节点”的渲染器（递归组件）。
 *
 * 核心点：这是一个递归组件。
 * - 当前节点渲染一行 `NavItem`
 * - 如果有 children，则继续渲染 children（每个 child 还是 `NavList`）
 *
 * 关键状态/字段：
 * - `depth`：层级深度（第一层是 1，子层 +1），用于样式区分（例如一级高亮、二级 hover 背景）
 * - `isActive`：当前路由是否命中该节点（通常是 pathname 是否以 data.path 开头等规则）
 * - `open`：当前节点是否展开（只对 “有 children 的节点” 有意义）
 * - `hasChild`：是否有子节点
 */
export function NavList({ data, depth = 1 }: NavListProps) {
	const location = useLocation();
	const isActive = isNavPathActive(location.pathname, data.path);
	// 初始展开逻辑：如果当前路由命中该节点，则默认展开，确保用户能看到自己所在位置的菜单链路
	const [open, setOpen] = useState(isActive);
	const hasChild = data.children && data.children.length > 0;

	const handleClick = () => {
		// 只有存在子节点时，点击才是“展开/收起”；没有子节点时交给 NavItemRenderer 去做跳转
		if (hasChild) {
			setOpen(!open);
		}
	};

	// hidden 的节点直接不渲染（常用于按权限/配置隐藏菜单）
	if (data.hidden) {
		return null;
	}

	return (
		// Collapsible 用来做“展开/收起”容器：Trigger 是 NavItem，Content 是 children 列表
		<Collapsible open={open} onOpenChange={setOpen} data-nav-type="list">
			<CollapsibleTrigger className="w-full">
				<NavItem
					// data：菜单本身的数据
					title={data.title}
					path={data.path}
					icon={data.icon}
					info={data.info}
					caption={data.caption}
					auth={data.auth}
					// state：渲染状态（是否展开/是否 active/是否禁用）
					open={open}
					active={isActive}
					disabled={data.disabled}
					// options：渲染选项（是否有 children、当前深度）
					hasChild={hasChild}
					depth={depth}
					// event：点击行为（有 children 时切换 open）
					onClick={handleClick}
				/>
			</CollapsibleTrigger>
			{hasChild && (
				<CollapsibleContent>
					{/* 子菜单缩进、并保持纵向间距 */}
					<div className="ml-4 mt-1 flex flex-col gap-1">
						{data.children?.map((child) => (
							<NavList key={child.title} data={child} depth={depth + 1} />
						))}
					</div>
				</CollapsibleContent>
			)}
		</Collapsible>
	);
}
