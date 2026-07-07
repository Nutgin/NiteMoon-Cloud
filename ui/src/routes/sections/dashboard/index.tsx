import { GLOBAL_CONFIG } from "@/global-config";
import DashboardLayout from "@/layouts/dashboard";
import LoginAuthGuard from "@/routes/components/login-auth-guard";
import { Navigate, type RouteObject } from "react-router";
import { DynamicDashboardContent } from "./dynamic-dashboard-content";
import ProfilePage from "@/pages/management/user/profile";
import AccountPage from "@/pages/management/user/account";
import WorkbenchPage from "@/pages/dashboard/workbench";

//这里是主路由 也就是系统主页的路由
export const dashboardRoutes: RouteObject[] = [
	{
		element: (
			<LoginAuthGuard>
				{/* 主布局 */}
				<DashboardLayout />
			</LoginAuthGuard>
		),
		// 使用通配符路由，让动态内容组件处理所有路径
		children: [
			{ index: true, element: <Navigate to={GLOBAL_CONFIG.defaultRoute} replace /> }, 
			// 固定路由：主页
			{ 
				path: "workbench", 
				element: <WorkbenchPage /> 
			},
			// 固定路由：个人资料页面
			{ 
				path: "management/user/profile", 
				element: <ProfilePage /> 
			},
			// 固定路由：账户设置页面
			{ 
				path: "management/user/account", 
				element: <AccountPage /> 
			},
			// 动态路由处理其他所有路径
			{ path: "*", element: <DynamicDashboardContent /> }
		],
	},
];
