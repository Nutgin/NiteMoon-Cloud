import { Icon } from "@/components/icon";
import type { NavItemDataProps, NavProps } from "@/components/nav";
import { useUserRoutes } from "@/store/userStore";
import { Badge } from "@/ui/badge";
import { useMemo } from "react";
import { PermissionType } from "@/types/enum";
import { useTranslation } from "react-i18next";

// 后端路由数据类型定义
interface BackendRoute {
	id: string;
	parentId: string;
	weight: number;
	name: string;
	redirect: string | null;
	path: string;
	component: string;
	createTime: string;
	meta: {
		title: string;
		enTitle?: string;
		icon: string;
		order: number;
	};
	icon: string;
	applicationKey: string | null;
	permission: string;
	sort: number;
	type: string; // 后端返回的是字符串 "0", "1", "2"
	children?: BackendRoute[];
}

// 将后端路由转换为前端导航数据
const convertBackendRouteToNav = (route: BackendRoute, lang: string): NavItemDataProps | null => {
	const hasChildren = route.children && route.children.length > 0;

	// 处理隐藏菜单：type="2"的菜单设置为hidden
	const isHiddenMenu = route.type === "2";

	// 如果是隐藏菜单，返回null，不显示在导航中
	if (isHiddenMenu) {
		console.log('Hiding menu item:', route.meta.title);
		return null;
	}

	// 处理图标名称，如果后端返回的是 ic-xx 格式，转换为 local:ic-xx
	const iconComponent = route.meta.icon ? (
		route.meta.icon.startsWith('ic-') ?
			<Icon icon={`local:${route.meta.icon}`} size="24" /> :
			<Icon icon={route.meta.icon} size="24" />
	) : null;

	// 根据语言选择菜单名称
	const title = lang === "en_US" && route.meta.enTitle ? route.meta.enTitle : route.meta.title;

	const result = {
		title: title,
		path: route.path,
		icon: iconComponent,
		hidden: isHiddenMenu, // 如果type=2则隐藏菜单
		// 如果有子菜单，则不进行路由跳转，只展开子菜单
		hasChild: hasChildren,
		children: hasChildren ? route.children?.map((child) => convertBackendRouteToNav(child, lang)).filter(Boolean) as NavItemDataProps[] : undefined,
	};

	console.log('Converted nav item:', result);
	return result;
};

// 将后端路由数组转换为导航数据格式
const convertBackendRoutes = (routes: BackendRoute[], lang: string): NavProps["data"] => {
	// 将扁平的路由数组按父级路由分组
	const groupedRoutes = routes.reduce((acc, route) => {
		// 只处理顶级路由（component 为 "Layout" 的路由）
		if (route.component === "Layout") {
			// 处理一级菜单图标
			const iconComponent = route.meta.icon ? (
				route.meta.icon.startsWith('ic-') ?
					<Icon icon={`local:${route.meta.icon}`} size="24" /> :
					<Icon icon={route.meta.icon} size="24" />
			) : null;
			// 过滤掉隐藏的子菜单
			const visibleChildren = route.children ? route.children.map((child) => convertBackendRouteToNav(child, lang)).filter(Boolean) as NavItemDataProps[] : [];

			// 根据语言选择菜单名称
			const name = lang === "en_US" && route.meta.enTitle ? route.meta.enTitle : route.meta.title;

			acc.push({
				name: name,
				icon: iconComponent,
				items: visibleChildren,
			});
		}
		return acc;
	}, [] as NavProps["data"]);

	return groupedRoutes;
};

// Hook to get backend navigation data
export const useBackendNavData = () => {
	const userRoutes = useUserRoutes();
	const { i18n } = useTranslation();

	return useMemo(() => {
		if (!userRoutes || userRoutes.length === 0) {
			return [];
		}
		return convertBackendRoutes(userRoutes as BackendRoute[], i18n.language);
	}, [userRoutes, i18n.language]);
};

// For compatibility with existing code structure
export const backendNavData: NavProps["data"] = [];
