import { useLocation } from "react-router";
import { Navigate } from "react-router";
import { useUserRoutes } from "@/store/userStore";
import { Component } from "./utils";
import { useMemo } from "react";

/**
 * 动态仪表板内容组件
 * 根据当前路径和后端路由数据动态渲染页面组件
 */
export const DynamicDashboardContent: React.FC = () => {
	const location = useLocation();
	const userRoutes = useUserRoutes();

	// 根据路径查找对应的路由配置
	const findRouteByPath = (routes: any[], path: string): any => {
		for (const route of routes) {
			if (route.path === path) {
				return route;
			}
			if (route.children) {
				const found = findRouteByPath(route.children, path);
				if (found) return found;
			}
		}
		return null;
	};

	const currentRoute = useMemo(() => {
		if (!userRoutes || userRoutes.length === 0) {
			return null;
		}
		return findRouteByPath(userRoutes, location.pathname);
	}, [userRoutes, location.pathname]);

	// 如果找到对应的路由配置，渲染对应的组件
	if (currentRoute && currentRoute.component !== "Layout") {
		return Component(currentRoute.component);
	}

	// 如果没有找到路由或者是 Layout 类型，重定向到默认页面
	return <Navigate to="/system/user" replace />;
};
