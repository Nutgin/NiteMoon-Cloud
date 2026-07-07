import apiClient from "../apiClient";
import { AesUtils, DEFAULT_ENCRYPT_KEY } from "@/utils/crypto";

export interface LoginParams {
  username: string;
  password: string;
  key: string;
  code: string;
  remember?: boolean;
}

// 新格式的登录响应数据
export interface NewLoginData {
  tokenName: string;
  tokenValue: string;
  isLogin: boolean;
  loginId: string;
  loginType: string;
  tokenTimeout: number;
  sessionTimeout: number;
  tokenSessionTimeout: number;
  tokenActiveTimeout: number;
  loginDeviceType: string;
  tag: string | null;
}

// 旧格式的登录响应数据
export interface OldLoginData {
  exipreTime: string;
  token: string;
}

// 兼容两种格式的登录响应
export interface LoginResponse {
  code: number;
  msg: string | null;
  data: NewLoginData | OldLoginData;
  extra?: any;
}

export function login(params: LoginParams) {
  const { remember, password, ...otherData } = params;

  // 对密码进行 AES 加密
  const encryptedPassword = AesUtils.encrypt(DEFAULT_ENCRYPT_KEY, password);

  const formData = new FormData();
  Object.keys(otherData).forEach(key => {
    formData.append(key, otherData[key as keyof typeof otherData]);
  });
  // 添加加密后的密码
  formData.append('password', encryptedPassword);

  return apiClient.post<LoginResponse>({
    url: '/auth/token/login',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

export function getCaptcha(key: string) {
  return apiClient.get({
    url: `/auth/token/captcha?key=${key}`,
    responseType: 'arraybuffer'
  });
}

export function logout() {
  return apiClient.post({
    url: '/auth/token/logout'
  });
}

export function getUserInfo() {
  return apiClient.get({
    url: '/system/user/info'
  });
}

export function getUserRouter() {
  return apiClient.get({
    url: '/system/menu'
  });
}

export function getUserById(id: string) {
  return apiClient.get({
    url: `/system/user/${id}`
  });
}

export function renewalToken() {
  return apiClient.get({
    url: '/auth/token/renewal'
  });
}

export function getDeptList() {
  return apiClient.get({
    url: '/system/dept/list'
  });
}

export function getRoleList() {
  return apiClient.get({
    url: '/system/role/list'
  });
}
