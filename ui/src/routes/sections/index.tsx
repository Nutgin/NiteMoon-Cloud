import { Navigate, type RouteObject } from "react-router";
import { authRoutes } from "./auth";
import { dashboardRoutes } from "./dashboard";
import { mainRoutes } from "./main";

export const routesSection: RouteObject[] = [
	// Auth 登录路由 无header layout
	...authRoutes,
	// Dashboard
	...dashboardRoutes,
	// Main
	...mainRoutes, // 这是只有一个简单的header 用于展示404 500 等页面
	// No Match
	{ path: "*", element: <Navigate to="/404" replace /> },
];
