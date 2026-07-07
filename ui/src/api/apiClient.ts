import { GLOBAL_CONFIG } from "@/global-config";
import { t } from "@/locales/i18n";
import userStore from "@/store/userStore";
import axios, { type AxiosRequestConfig, type AxiosError, type AxiosResponse } from "axios";
import { toast } from "sonner";
import type { Result } from "#/api";

const axiosInstance = axios.create({
	baseURL: GLOBAL_CONFIG.apiBaseUrl,
	timeout: 50000,
	headers: { "Content-Type": "application/json;charset=utf-8" },
});
//请求拦截器
axiosInstance.interceptors.request.use(
	(config) => {
		//token校验
		const { accessToken } = userStore.getState().userToken;
		if (accessToken) {
			config.headers.Authorization = accessToken;
		}

		// 添加 tenant-id 请求头
		const { tenantId } = userStore.getState();
		if (tenantId) {
			config.headers['tenant-id'] = tenantId;
		}

		// 如果是FormData，移除Content-Type让浏览器自动设置
		if (config.data instanceof FormData) {
			delete config.headers['Content-Type'];
		}

		// 如果不是云部署，替换指定的URL路径前缀
		if (!GLOBAL_CONFIG.isCloud && config.url) {
			const prefixesToReplace = ['/auth/', '/system/', '/blog/', '/exam/', '/flow/', '/job/', '/llm/', '/onnx/', '/training/', '/knowledgeGraph/', '/digital/', '/gen/', '/aiexcel/'];

			for (const prefix of prefixesToReplace) {
				if (config.url.startsWith(prefix)) {
					config.url = config.url.replace(prefix, '/boot/');
					break; // 只替换第一个匹配的前缀
				}
			}
		}

		return config;
	},
	(error) => Promise.reject(error),
);

// Token 续期中标记，防止并发续期
let isRenewing = false;
let renewPromise: Promise<boolean> | null = null;

// 尝试续期 token，返回是否成功
async function tryRenewToken(): Promise<boolean> {
	if (isRenewing && renewPromise) {
		return renewPromise;
	}
	isRenewing = true;
	renewPromise = (async () => {
		try {
			let renewalUrl = "/auth/token/renewal";
			if (!GLOBAL_CONFIG.isCloud) {
				renewalUrl = renewalUrl.replace("/auth/", "/boot/");
			}
			const res = await axios.get(renewalUrl, {
				baseURL: GLOBAL_CONFIG.apiBaseUrl,
				headers: { Authorization: userStore.getState().userToken.accessToken || "" },
				timeout: 5000,
			});
			return res.data?.code === 0;
		} catch {
			return false;
		} finally {
			isRenewing = false;
			renewPromise = null;
		}
	})();
	return renewPromise;
}

// 处理 401 未授权：先尝试续期，失败则清除状态并跳转登录
async function handleUnauthorized(originalConfig?: any): Promise<any> {
	const renewed = await tryRenewToken();
	if (renewed && originalConfig) {
		// 续期成功，重试原请求
		return axiosInstance.request(originalConfig);
	}
	// 续期失败，清除登录状态
	const errorMessage = "登录已失效，请重新登录";
	toast.error(errorMessage, { position: "top-center" });
	userStore.getState().actions.clearUserInfoAndToken();
	setTimeout(() => {
		window.location.href = "/auth/login";
	}, 500);
	throw new Error(errorMessage);
}

axiosInstance.interceptors.response.use(
	(res: AxiosResponse<Result<any> | any>) => {
		// 如果是 arraybuffer 响应（如验证码图片），直接返回原始数据
		if (res.config.responseType === 'arraybuffer') {
			return res.data;
		}

		// 如果是 blob 响应（如音频文件），直接返回原始数据
		if (res.config.responseType === 'blob') {
			return res.data;
		}

		// 如果是流式响应（text/event-stream），直接返回原始响应
		if (res.headers['content-type']?.includes('text/event-stream')) {
			return res;
		}

		if (!res.data) throw new Error(t("sys.api.apiRequestFailed"));

		// 处理后端返回的格式
		// 统一格式：{code: 0代表成功，其他代表失败, msg: "错误原因", data: data}
		const { code, msg, data } = res.data;

		// 只有 code 为 0 时才算成功
		if (code === 0) {
			return data;
		}

		// 处理 401 未授权（token无效/过期）
		if (code === 401) {
			return handleUnauthorized(res.config);
		}

		// code 不为 0 时，显示错误信息并抛出异常
		const errorMessage = msg || "操作失败";
		toast.error(errorMessage, { position: "top-center" });
		throw new Error(errorMessage);
	},
	(error: AxiosError<Result>) => {
		const { response, message } = error || {};

		// HTTP 401：尝试续期
		if (response?.status === 401) {
			return handleUnauthorized(error.config);
		}

		// 如果响应体中有业务错误信息，优先显示业务错误
		const businessErrorMsg = response?.data?.msg || response?.data?.message;
		const errMsg = businessErrorMsg || message || t("sys.api.errorMessage");
		toast.error(errMsg, { position: "top-center" });
		return Promise.reject(error);
	},
);

class APIClient {
	get<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "GET" });
	}
	post<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "POST" });
	}
	put<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "PUT" });
	}
	delete<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "DELETE" });
	}
	request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
		return axiosInstance.request<any, T>(config);
	}
}

export default new APIClient();
