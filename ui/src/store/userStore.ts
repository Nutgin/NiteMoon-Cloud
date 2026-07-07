import { useMutation } from "@tanstack/react-query";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { login, logout as logoutApi, getUserInfo, getUserRouter, getDeptList, getRoleList, type LoginParams } from "@/api/auth/login";
import { clearAuth, setAuthData } from "@/utils/auth";

import { toast } from "sonner";
import type { UserInfo, UserToken } from "#/entity";
import { StorageEnum } from "#/enum";

type UserStore = {
	userInfo: Partial<UserInfo>;
	userToken: UserToken;
	userRoutes: any[]; // 存储后端返回的路由数据
	userPermissions: string[]; // 存储后端返回的权限数据
	tenantId: string | null; // 存储租户ID
	deptList: Array<{ id: string; name: string }>; // 存储部门列表
	roleList: Array<{ id: string; name: string }>; // 存储角色列表

	actions: {
		setUserInfo: (userInfo: UserInfo) => void;
		setUserToken: (token: UserToken) => void;
		setUserRoutes: (routes: any[]) => void;
		setUserPermissions: (permissions: string[]) => void;
		setTenantId: (tenantId: string | null) => void;
		setDeptList: (deptList: Array<{ id: string; name: string }>) => void;
		setRoleList: (roleList: Array<{ id: string; name: string }>) => void;
		clearUserInfoAndToken: () => void;
	};
};

const useUserStore = create<UserStore>()(
	persist(
		(set) => ({
			userInfo: {},
			userToken: {},
			userRoutes: [],
			userPermissions: [],
			tenantId: null,
			deptList: [],
			roleList: [],
			actions: {
				setUserInfo: (userInfo) => {
					set({ userInfo });
				},
				setUserToken: (userToken) => {
					set({ userToken });
				},
				setUserRoutes: (userRoutes) => {
					set({ userRoutes });
				},
				setUserPermissions: (userPermissions) => {
					set({ userPermissions });
				},
				setTenantId: (tenantId) => {
					set({ tenantId });
				},
				setDeptList: (deptList) => {
					set({ deptList });
				},
				setRoleList: (roleList) => {
					set({ roleList });
				},
				clearUserInfoAndToken() {
					clearAuth();
					set({ userInfo: {}, userToken: {}, userRoutes: [], userPermissions: [], tenantId: null, deptList: [], roleList: [] });
				},
			},
		}),
		{
			name: "userStore", // name of the item in the storage (must be unique)
			storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
			partialize: (state) => ({
				[StorageEnum.UserInfo]: state.userInfo,
				[StorageEnum.UserToken]: state.userToken,
				[StorageEnum.UserRoutes]: state.userRoutes,
				[StorageEnum.UserPermissions]: state.userPermissions,
				tenantId: state.tenantId,
				deptList: state.deptList,
				roleList: state.roleList,
			}),
		},
	),
);

export const useUserInfo = () => useUserStore((state) => state.userInfo);
export const useUserToken = () => useUserStore((state) => state.userToken);
export const useUserRoutes = () => useUserStore((state) => state.userRoutes);
export const useUserPermissions = () => useUserStore((state) => state.userPermissions);
export const useUserRoles = () => useUserStore((state) => state.userInfo.roles || []);
export const useTenantId = () => useUserStore((state) => state.tenantId);
export const useDeptList = () => useUserStore((state) => state.deptList);
export const useRoleList = () => useUserStore((state) => state.roleList);
export const useUserActions = () => useUserStore((state) => state.actions);

export const useSignIn = () => {
	const { setUserToken, setUserInfo, setUserRoutes, setUserPermissions, setTenantId, setDeptList, setRoleList } = useUserActions();

	const signInMutation = useMutation({
		mutationFn: login,
	});

	const signIn = async (data: LoginParams) => {
		try {
			const res = await signInMutation.mutateAsync(data);
			
			// 兼容新旧两种登录响应格式
			let tokenValue: string;
			
			// 新格式：{tokenName, tokenValue, isLogin, ...}
			if (res.tokenValue) {
				tokenValue = res.tokenValue;
			}
			// 旧格式：{token, exipreTime}
			else if (res.token) {
				tokenValue = res.token;
			}
			// 如果都没有，抛出错误
			else {
				throw new Error('登录响应中未找到有效的token信息');
			}

			// Store token first - use tokenValue as accessToken
			setUserToken({ accessToken: tokenValue, refreshToken: '' });
			setAuthData(tokenValue, '', {}, data.remember);

			// After login success, call info and route APIs
			try {
				// Call user info API
				const userInfoResponse = await getUserInfo();
				console.log('User info response:', userInfoResponse);

				// 提取并存储 tenantId
				if (userInfoResponse && userInfoResponse.tenantId) {
					setTenantId(userInfoResponse.tenantId);
					console.log('Tenant ID set:', userInfoResponse.tenantId);
				}

				// 新格式：用户信息中包含 permissions 和 roles
				if (userInfoResponse && userInfoResponse.permissions) {
					setUserPermissions(userInfoResponse.permissions);
					console.log('User permissions set from info API:', userInfoResponse.permissions);
				}

				if (userInfoResponse && userInfoResponse.roles) {
					// 将 roles 数组转换为用户信息的一部分
					const updatedUserInfo = {
						...userInfoResponse,
						roles: userInfoResponse.roles
					};
					setUserInfo(updatedUserInfo);
					console.log('User info set with roles:', updatedUserInfo);
				} else {
					// 如果没有 roles，至少设置基本信息
					setUserInfo(userInfoResponse);
					console.log('User info set (basic):', userInfoResponse);
				}

				// 获取部门列表和角色列表
				try {
					const [deptListResponse, roleListResponse] = await Promise.all([
						getDeptList(),
						getRoleList()
					]);

					// 存储部门列表
					if (deptListResponse && Array.isArray(deptListResponse)) {
						const deptList = deptListResponse.map(dept => ({
							id: dept.id,
							name: dept.name || dept.deptName || dept.dept_name || dept.id
						}));
						setDeptList(deptList);
						console.log('Department list set:', deptList);
					}

					// 存储角色列表
					if (roleListResponse && Array.isArray(roleListResponse)) {
						const roleList = roleListResponse.map(role => ({
							id: role.id,
							name: role.name || role.roleName || role.role_name || role.id
						}));
						setRoleList(roleList);
						console.log('Role list set:', roleList);
					}
				} catch (listError) {
					console.error('Failed to fetch dept/role lists:', listError);
					// 即使部门角色列表获取失败，也不影响登录流程
				}

				// 仍然尝试调用路由接口以保持兼容性（如果有的话）
				try {
					const userRouterResponse = await getUserRouter();
					console.log('User router response:', userRouterResponse);

					// 直接使用新的菜单格式数据
					if (userRouterResponse && Array.isArray(userRouterResponse)) {
						setUserRoutes(userRouterResponse);
						console.log('User routes set directly:', userRouterResponse);
					} else if (userRouterResponse && userRouterResponse.routes) {
						// 兼容旧格式（如果有 routes 字段）
						setUserRoutes(userRouterResponse.routes);
						console.log('User routes set from routes field:', userRouterResponse.routes);
					}

					// 如果路由接口有权限信息且用户信息没有，则使用路由接口的权限
					if (userRouterResponse && userRouterResponse.permissions && !userInfoResponse.permissions) {
						setUserPermissions(userRouterResponse.permissions);
						console.log('User permissions set from router API (fallback):', userRouterResponse.permissions);
					}
				} catch (routerError) {
					console.log('Router API call failed, but user info was successful:', routerError);
					// 如果路由接口失败，但用户信息成功，这是可以接受的
				}

				// 更新认证数据
				setAuthData(tokenValue, '', userInfoResponse, data.remember);
			} catch (apiError) {
				console.error('Failed to fetch user info:', apiError);
				// Continue with basic user info if API calls fail
				const basicUserInfo: UserInfo = {
					id: data.username, // 使用用户名作为临时ID
					username: data.username,
					roles: ['user'], // 默认角色
					permissions: [], // 空权限列表
				};

				setUserInfo(basicUserInfo);
				setAuthData(tokenValue, '', basicUserInfo, data.remember);
			}

			return res;
		} catch (err: any) {
			// apiClient已经处理了错误显示，这里不需要重复显示
			throw err;
		}
	};

	return signIn;
};

export default useUserStore;
