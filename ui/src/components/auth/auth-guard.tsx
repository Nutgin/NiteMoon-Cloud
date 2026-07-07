import type { ReactNode } from "react";
import { useAuthCheck } from "./use-auth";

interface AuthGuardProps {
	/**
	 * 当用户拥有所需权限/角色时渲染的内容
	 */
	children: ReactNode;
	/**
	 * 当用户没有所需权限/角色时渲染的备用内容
	 */
	fallback?: ReactNode;
	/**
	 * 要检查的权限/角色
	 */
	check?: string;
	/**
	 * 要检查的权限/角色列表（满足其中任意一个即可）
	 */
	checkAny?: string[];
	/**
	 * 要检查的权限/角色列表（需要满足全部）
	 */
	checkAll?: string[];
	/**
	 * 检查类型：'role'（角色）或 'permission'（权限）
	 * @default 'permission'
	 */
	baseOn?: "role" | "permission";
}

/**
 * 基于用户权限/角色条件渲染子组件的包装组件
 *
 * @example
 * // 检查单个权限
 * <AuthGuard check="user.create">
 *   <button>创建用户</button>
 * </AuthGuard>
 *
 * @example
 * // 检查多个权限（满足任意一个）
 * <AuthGuard checkAny={["user.create", "user.edit"]}>
 *   <button>编辑用户</button>
 * </AuthGuard>
 *
 * @example
 * // 检查多个权限（需要满足全部）
 * <AuthGuard checkAll={["user.create", "user.edit"]}>
 *   <button>高级编辑</button>
 * </AuthGuard>
 *
 * @example
 * // 带备用内容
 * <AuthGuard check="admin" baseOn="role" fallback={<div>访问被拒绝</div>}>
 *   <AdminPanel />
 * </AuthGuard>
 */
export const AuthGuard = ({
	children,
	fallback = null,
	check,
	checkAny,
	checkAll,
	baseOn = "permission",
}: AuthGuardProps) => {
	const checkFn = useAuthCheck(baseOn);

	const hasAccess = check
		? checkFn.check(check)
		: checkAny
			? checkFn.checkAny(checkAny)
			: checkAll
				? checkFn.checkAll(checkAll)
				: true;

	return hasAccess ? children : fallback;
};
