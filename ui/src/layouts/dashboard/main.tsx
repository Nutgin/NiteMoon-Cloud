import { AuthGuard } from "@/components/auth/auth-guard";
import { LineLoading } from "@/components/loading";
import Page403 from "@/pages/sys/error/Page403";
import { useSettings } from "@/store/settingStore";
import { useBackendNavData } from "./nav/nav-data/nav-data-backend";
import { cn } from "@/utils";
import { flattenTrees } from "@/utils/tree";
import { clone, concat } from "ramda";
import { Suspense } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router";

/**
 * find auth by path
 * @param path
 * @returns
 */

// main.tsx 中的流程

// // 1. 扁平化菜单（树形 → 数组）
// const allItems = flattenTrees(navData);

// // 2. 根据路径查找菜单项
// function findAuthByPath(path: string): string[] {
//   const foundItem = allItems.find((item) => item.path === path);
//   return foundItem?.auth || [];  // 返回菜单项的 auth 字段
// }

// // 3. 获取当前路径需要的权限
// const currentNavAuth = findAuthByPath(pathname);
// // 例如: ["permission:read"]

// // 4. 检查用户是否有这些权限
// <AuthGuard checkAny={currentNavAuth}>
//   <Outlet />
// </AuthGuard>

function findAuthByPath(path: string, allItems: any[]): string[] {
	const foundItem = allItems.find((item) => item.path === path);
	return foundItem?.auth || [];
}

const Main = () => {
	const { themeStretch } = useSettings();
	const { pathname } = useLocation();
	
	// 获取后端导航数据
	const navData = useBackendNavData();
	
	// 扁平化菜单数据
	const allItems = navData.reduce((acc: any[], group) => {
		const flattenedItems = flattenTrees(group.items);
		return concat(acc, flattenedItems);
	}, []);
	
	const currentNavAuth = findAuthByPath(pathname, allItems);

	return (
		<AuthGuard checkAny={currentNavAuth} fallback={<Page403 />}>
			<main
				data-slot="slash-layout-main"
				className={cn(
					"flex-auto w-full flex flex-col",
					"transition-[max-width] duration-300 ease-in-out",
					"px-4 sm:px-6 py-4 sm:py-6 md:px-8 mx-auto",
					{
						"max-w-full": themeStretch,
						"xl:max-w-screen-xl": !themeStretch,
					},
				)}
				style={{
					willChange: "max-width",
				}}
			>
				<Suspense fallback={<LineLoading />}>
					<Outlet />
					<ScrollRestoration />
				</Suspense>
			</main>
		</AuthGuard>
	);
};

export default Main;
