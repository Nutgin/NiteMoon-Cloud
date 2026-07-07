import type { MenuTree } from "@/types/entity";
import { PermissionType } from "@/types/enum";
import type { RouteObject } from "react-router";
import { Navigate } from "react-router";
import { Component } from "./utils";

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

/**
 * get route path from menu path and parent path
 * @param menuPath '/a/b/c'
 * @param parentPath '/a/b'
 * @returns '/c'
 *
 * @example
 * getRoutePath('/a/b/c', '/a/b') // '/c'
 */
const getRoutePath = (menuPath?: string, parentPath?: string) => {
	const menuPathArr = menuPath?.split("/").filter(Boolean) || [];
	const parentPathArr = parentPath?.split("/").filter(Boolean) || [];

	// remove parentPath items from menuPath
	const result = menuPathArr.slice(parentPathArr.length).join("/");
	return result;
};

/**
 * generate props for menu component
 * @param metaInfo
 * @returns
 */
const generateProps = (metaInfo?: any) => {
	const props: any = {};
	if (metaInfo?.externalLink) {
		props.src = metaInfo.externalLink?.toString() || "";
	}
	return props;
};

/**
 * convert backend route to route
 * @param backendRoutes 后端路由数据
 * @param parent 父级路由
 * @returns
 */
const convertBackendToRoute = (backendRoutes: BackendRoute[], parent?: any): RouteObject[] => {
	const routes: RouteObject[] = [];

	const processItem = (item: BackendRoute, parentItem?: any) => {
		// 如果是 Layout 组件，处理子路由
		if (item.component === "Layout") {
			const children = item.children || [];
			if (children.length > 0) {
				// 为 Layout 创建路由容器
				routes.push({
					path: getRoutePath(item.path, parentItem?.path),
					children: [
						// 如果有子路由，默认重定向到第一个子路由
						...(children.length > 0 ? [{
							index: true,
							element: <Navigate to={getRoutePath(children[0].path, item.path)} replace />,
						}] : []),
						...convertBackendToRoute(children, item),
					],
				});
			}
		} else {
			// 普通页面路由
			const props = generateProps(item.meta);

			routes.push({
				path: getRoutePath(item.path, parentItem?.path),
				element: Component(item.component, props),
			});
		}
	};

	for (const item of backendRoutes) {
		processItem(item, parent);
	}
	return routes;
};
const convertToRoute = (items: MenuTree[], parent?: MenuTree): RouteObject[] => {
	const routes: RouteObject[] = [];

	const processItem = (item: MenuTree) => {
		// if group, process children
		if (item.type === PermissionType.GROUP) {
			for (const child of item.children || []) {
				processItem(child);
			}
		}

		// if catalogue, process children
		if (item.type === PermissionType.CATALOGUE) {
			const children = item.children || [];
			if (children.length > 0) {
				const firstChild = children[0];
				if (firstChild.path) {
					routes.push({
						path: getRoutePath(item.path, parent?.path),
						children: [
							{
								index: true,
								element: <Navigate to={getRoutePath(firstChild.path, item.path)} replace />,
							},
							...convertToRoute(children, item),
						],
					});
				}
			}
		}

		// if visible menu, create route
		if (item.type === "0") {
			const props = generateProps(item);

			routes.push({
				path: getRoutePath(item.path, parent?.path),
				element: Component(item.component, props),
			});
		}

		// if hidden menu, create route (same as visible menu but not shown in sidebar)
		if (item.type === "2") {
			const props = generateProps(item);

			routes.push({
				path: getRoutePath(item.path, parent?.path),
				element: Component(item.component, props),
			});
		}
	};

	for (const item of items) {
		processItem(item);
	}
	return routes;
};
