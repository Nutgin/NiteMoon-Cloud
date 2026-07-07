// 从导航配置中拿到菜单项的类型定义

import { ChevronDown } from "lucide-react";
import * as React from "react";
import { useCallback, useMemo } from "react";
// React Router 的 useMatches 可以拿到当前匹配到的所有路由信息
import { Link, useMatches } from "react-router";
import type { NavItemDataProps } from "@/components/nav";
// 过滤后的导航数据（按权限、hidden 等处理过）
import { useFilteredNavData } from "@/layouts/dashboard/nav";
// 国际化 Hook，用于把 title 转成当前语言
import useLocale from "@/locales/use-locale";
// 统一的面包屑 UI 组件（基于 shadcn/ui 封装）
import {
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/ui/breadcrumb";
// 下拉菜单，用于有子路由时展示“更多”入口
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/dropdown-menu";

interface BreadCrumbProps {
	maxItems?: number;
}

// 简化过的导航项结构，只保留面包屑需要的字段
type NavItem = Pick<NavItemDataProps, "path" | "title"> & {
	children?: NavItem[];
};

interface BreadcrumbItemData {
	key: string;
	label: string;
	items: Array<{
		key: string;
		label: string;
	}>;
}

export default function BreadCrumb({ maxItems = 3 }: BreadCrumbProps) {
	const { t } = useLocale();
	const matches = useMatches(); // 当前路由匹配链，例如 /dashboard/workbench 会包含根 + dashboard + workbench
	const navData = useFilteredNavData(); // 左侧导航的数据源（已经按权限过滤）

	// 在导航树中递归查找某个 path 对应的节点路径（父 → 子 ... → 当前）
	const findPathInNavData = useCallback((path: string, items: NavItem[]): NavItem[] => {
		for (const item of items) {
			if (item.path === path) {
				return [item];
			}
			if (item.children) {
				const found = findPathInNavData(path, item.children);
				if (found.length > 0) {
					return [item, ...found];
					//[ { path: '/dashboard', title: '工作台' }, { path: '/dashboard/workbench', title: '工作台' }]
				}
			}
		}
		return [];
	}, []);

	// 根据当前匹配到的路由 + 导航数据，计算出一条“面包屑链”
	const breadCrumbs = useMemo(() => {
		// 过滤掉根路径，只保留实际页面路径
		const paths = matches.filter((item) => item.pathname !== "/").map((item) => item.pathname);
		//['/dashboard/workbench', '/dashboard/workbench/list']
		return paths
			.map((path) => {
				// console.log(navData);
				// 把多个导航分组下的 items 扁平化，方便查找
				const navItems = navData.flatMap((section) => section.items);

				// 在导航树中查出当前 path 对应的“层级路径”
				const pathItems = findPathInNavData(path, navItems);

				if (pathItems.length === 0) return null;

				// 当前路由对应的最后一个节点
				const currentItem = pathItems[pathItems.length - 1];
				// 如果当前节点有 children，则作为下拉菜单的子项展示
				const children =
					currentItem.children?.map((child) => ({
						key: child.path,
						label: t(child.title),
					})) ?? [];

				return {
					key: currentItem.path,
					label: t(currentItem.title),
					items: children,
				};
			})
			.filter((item): item is BreadcrumbItemData => item !== null);
	}, [matches, t, findPathInNavData, navData]);

	// 渲染单个面包屑项：
	// - 如果有 items（有子路由），渲染成带下拉的“可展开”项
	// - 否则渲染为普通的链接或当前页面
	const renderBreadcrumbItem = (item: BreadcrumbItemData, isLast: boolean) => {
		const hasItems = item.items && item.items.length > 0;

		if (hasItems) {
			return (
				<BreadcrumbItem>
					<DropdownMenu>
						<DropdownMenuTrigger className="flex items-center gap-1">
							{item.label}
							<ChevronDown className="h-4 w-4" />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							{item.items.map((subItem) => (
								<DropdownMenuItem key={subItem.key} asChild>
									<Link to={subItem.key}>{subItem.label}</Link>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</BreadcrumbItem>
			);
		}

		return (
			<BreadcrumbItem>
				{isLast ? (
					<BreadcrumbPage>{item.label}</BreadcrumbPage>
				) : (
					<BreadcrumbLink asChild>
						<Link to={item.key}>{item.label}</Link>
					</BreadcrumbLink>
				)}
			</BreadcrumbItem>
		);
	};

	const renderBreadcrumbs = () => {
		// 面包屑数量不多时，全部平铺展示
		if (breadCrumbs.length <= maxItems) {
			return breadCrumbs.map((item, index) => (
				<React.Fragment key={item.key}>
					{renderBreadcrumbItem(item, index === breadCrumbs.length - 1)}
					{index < breadCrumbs.length - 1 && <BreadcrumbSeparator />}
				</React.Fragment>
			));
		}

		// 面包屑太多时：显示第一个 + 省略号(可点击下拉) + 最后 maxItems-1 个
		const firstItem = breadCrumbs[0];
		const lastItems = breadCrumbs.slice(-(maxItems - 1));
		const hiddenItems = breadCrumbs.slice(1, -(maxItems - 1));

		return (
			<>
				{renderBreadcrumbItem(firstItem, false)}
				<BreadcrumbSeparator />
				<BreadcrumbItem>
					<DropdownMenu>
						<DropdownMenuTrigger className="flex items-center gap-1">
							<BreadcrumbEllipsis />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
							{hiddenItems.map((item) => (
								<DropdownMenuItem key={item.key} asChild>
									<Link to={item.key}>{item.label}</Link>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</BreadcrumbItem>
				<BreadcrumbSeparator />
				{lastItems.map((item, index) => (
					<React.Fragment key={item.key}>
						{renderBreadcrumbItem(item, index === lastItems.length - 1)}
						{index < lastItems.length - 1 && <BreadcrumbSeparator />}
					</React.Fragment>
				))}
			</>
		);
	};

	return (
		<Breadcrumb>
			<BreadcrumbList>{renderBreadcrumbs()}</BreadcrumbList>
		</Breadcrumb>
	);
}
