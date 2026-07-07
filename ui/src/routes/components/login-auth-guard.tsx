import { useUserToken, useUserActions } from "@/store/userStore";
import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "../hooks";
import { GLOBAL_CONFIG } from "@/global-config";
import { toast } from "sonner";

type Props = {
	children: React.ReactNode;
};

export default function LoginAuthGuard({ children }: Props) {
	const router = useRouter();
	const { accessToken } = useUserToken();
	const { clearUserInfoAndToken } = useUserActions();
	const validatedRef = useRef(false);

	const check = useCallback(async () => {
		if (!accessToken) {
			router.replace("/auth/login");
			return;
		}

		// 同一 token 只验证一次，避免重复请求
		if (validatedRef.current) return;
		validatedRef.current = true;

		try {
			const tokenPath = !GLOBAL_CONFIG.isCloud ? '/boot/validate-token' : '/auth/validate-token';
			const res = await fetch(`${GLOBAL_CONFIG.apiBaseUrl}${tokenPath}`, {
				headers: { Authorization: accessToken },
			});
			const data = await res.json();
			if (data.code !== 0 || data.data !== true) {
				throw new Error("invalid");
			}
		} catch {
			toast.error("登录已失效，请重新登录", { position: "top-center" });
			clearUserInfoAndToken();
			router.replace("/auth/login");
		}
	}, [router, accessToken, clearUserInfoAndToken]);

	// token 变化时重置验证标记
	useEffect(() => {
		validatedRef.current = false;
	}, [accessToken]);

	useEffect(() => {
		check();
	}, [check]);

	return <>{children}</>;
}
