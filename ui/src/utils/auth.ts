import type { UserInfo, UserToken } from "#/entity";
import { StorageEnum } from "#/enum";

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_INFO_KEY = 'user_info';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, remember: boolean = false) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function getUserInfo(): UserInfo | null {
  const userInfo = localStorage.getItem(USER_INFO_KEY);
  return userInfo ? JSON.parse(userInfo) : null;
}

export function setUserInfo(userInfo: UserInfo) {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
  localStorage.removeItem(StorageEnum.UserRoutes);
  localStorage.removeItem(StorageEnum.UserPermissions);
  sessionStorage.removeItem(TOKEN_KEY);
}

export function setAuthData(token: string, refreshToken: string, userInfo: UserInfo, remember: boolean = false) {
  setToken(token, remember);
  setRefreshToken(refreshToken);
  setUserInfo(userInfo);
}
