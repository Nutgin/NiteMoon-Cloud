import { Loader2, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { LoginParams } from "@/api/auth/login";
import { getCaptcha } from "@/api/auth/login";
import { Icon } from "@/components/icon";
import { GLOBAL_CONFIG } from "@/global-config";
import { useSignIn } from "@/store/userStore";
import { randomString } from "@/utils/random";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { cn } from "@/utils";
import { LoginStateEnum, useLoginStateContext } from "./providers/login-provider";

export function LoginForm({ 
	className, 
	onInputChange, 
	...props 
}: React.ComponentPropsWithoutRef<"form"> & {
	onInputChange?: (state: {
		isTypingEmail: boolean;
		passwordLength: number;
		passwordVisible: boolean;
	}) => void;
}) {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [captchaImage, setCaptchaImage] = useState<string>("");
	const [captchaKey, setCaptchaKey] = useState<string>("");
	const [isTypingEmail, setIsTypingEmail] = useState(false);
	const [passwordLength, setPasswordLength] = useState(0);
	const [passwordVisible, setPasswordVisible] = useState(false);
	const navigate = useNavigate();

	const { loginState, setLoginState } = useLoginStateContext();
	const signIn = useSignIn();

	const form = useForm<LoginParams>({
		defaultValues: {
			username: "",
			password: "",
			key: "",
			code: "",
			remember: false,
		},
	});

	// Fetch captcha image
	const fetchCaptcha = async () => {
		try {
			const key = randomString();
			setCaptchaKey(key);

			const response = await getCaptcha(key);
			const base64 = btoa(
				new Uint8Array(response).reduce(
					(data, byte) => data + String.fromCharCode(byte),
					''
				)
			);
			setCaptchaImage(`data:image/png;base64,${base64}`);
		} catch (error) {
			toast.error(t("sys.login.getSmsFailed"));
		}
	};

	useEffect(() => {
		fetchCaptcha();
	}, []);

	// 通知父组件状态变化
	useEffect(() => {
		if (onInputChange) {
			onInputChange({
				isTypingEmail,
				passwordLength,
				passwordVisible
			});
		}
	}, [isTypingEmail, passwordLength, passwordVisible, onInputChange]);

	// 添加回车键监听器
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Enter' && !loading) {
				event.preventDefault();
				form.handleSubmit(handleFinish)();
			}
		};

		// 添加全局键盘事件监听
		window.addEventListener('keydown', handleKeyDown);

		// 清理监听器
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [form, loading, captchaKey]);

	if (loginState !== LoginStateEnum.LOGIN) return null;

	const handleFinish = async (values: LoginParams) => {
		setLoading(true);
		try {
			// Include captcha key in the login request
			const loginData = {
				...values,
				key: captchaKey,
			};

			await signIn(loginData);
			navigate(GLOBAL_CONFIG.defaultRoute, { replace: true });
			toast.success(t("sys.login.loginSuccessTitle"), {
				closeButton: true,
			});
		} catch (error) {
			// Refresh captcha on login error
			fetchCaptcha();
			form.setValue("code", "");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={cn("flex flex-col gap-6", className)}>
			<Form {...form} {...props}>
				<form onSubmit={form.handleSubmit(handleFinish)} className="space-y-4">
					<div className="flex flex-col items-center gap-2 text-center">
						<h1 className="text-2xl font-bold">{t("sys.login.signInFormTitle")}</h1>
						<p className="text-balance text-sm text-muted-foreground">{t("sys.login.signInFormDescription")}</p>
					</div>

					<FormField
						control={form.control}
						name="username"
						rules={{ required: t("sys.login.accountPlaceholder") }}
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("sys.login.userName")}</FormLabel>
								<FormControl>
									<Input 
										placeholder={t("sys.login.userName")} 
										{...field} 
										onFocus={() => setIsTypingEmail(true)}
										onBlur={() => setIsTypingEmail(false)}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="password"
						rules={{
							required: t("sys.login.passwordPlaceholder"),
							minLength: { value: 6, message: t("sys.login.passwordMinLength") },
						}}
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("sys.login.password")}</FormLabel>
								<FormControl>
									<div className="relative">
										<Input 
											type={passwordVisible ? "text" : "password"} 
											placeholder={t("sys.login.password")} 
											{...field} 
											suppressHydrationWarning 
											onChange={(e) => {
												field.onChange(e);
												setPasswordLength(e.target.value.length);
											}}
										/>
										<button
											type="button"
											onClick={() => setPasswordVisible(!passwordVisible)}
											className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
										>
											{passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
										</button>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="remember"
						render={({ field }) => (
							<div className="flex items-center space-x-2">
								<Checkbox id="remember" checked={field.value ?? false} onCheckedChange={field.onChange} />
								<label
									htmlFor="remember"
									className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									{t("sys.login.rememberMe")}
								</label>
							</div>
						)}
					/>

					<FormField
						control={form.control}
						name="code"
						rules={{ required: t("sys.login.smsPlaceholder") }}
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("sys.login.smsCode")}</FormLabel>
								<FormControl>
									<div className="flex gap-2">
										<Input placeholder={t("sys.login.smsPlaceholder")} {...field} />
										{captchaImage && (
											<img
												src={captchaImage}
												alt={t("sys.login.smsCode")}
												className="h-10 w-24 cursor-pointer border rounded"
												onClick={fetchCaptcha}
											/>
										)}
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* <div className="flex flex-row justify-between">
						<Button variant="link" onClick={() => setLoginState(LoginStateEnum.RESET_PASSWORD)} size="sm">
							{t("sys.login.forgetPassword")}
						</Button>
					</div> */}

					{/* 登录按钮 */}
					<Button type="submit" className="w-full">
						{loading && <Loader2 className="animate-spin mr-2" />}
						{t("sys.login.loginButton")}
					</Button>

					{/* 手机登录/二维码登录 */}
					{/* <div className="grid gap-4 sm:grid-cols-2">
						<Button variant="outline" className="w-full" onClick={() => setLoginState(LoginStateEnum.MOBILE)}>
							<Icon icon="uil:mobile-android" size={20} />
							{t("sys.login.mobileSignInFormTitle")}
						</Button>
						<Button variant="outline" className="w-full" onClick={() => setLoginState(LoginStateEnum.QR_CODE)}>
							<Icon icon="uil:qrcode-scan" size={20} />
							{t("sys.login.qrSignInFormTitle")}
						</Button>
					</div> */}

					{/* 其他登录方式 */}
					{/* <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
						<span className="relative z-10 bg-background px-2 text-muted-foreground">{t("sys.login.otherSignIn")}</span>
					</div>
					<div className="flex cursor-pointer justify-around text-2xl">
						<Button variant="ghost" size="icon">
							<Icon icon="mdi:github" size={24} />
						</Button>
						<Button variant="ghost" size="icon">
							<Icon icon="mdi:wechat" size={24} />
						</Button>
						<Button variant="ghost" size="icon">
							<Icon icon="ant-design:google-circle-filled" size={24} />
						</Button>
					</div> */}

					{/* 注册 */}
					{/* <div className="text-center text-sm">
						{t("sys.login.noAccount")}
						<Button variant="link" className="px-1" onClick={() => setLoginState(LoginStateEnum.REGISTER)}>
							{t("sys.login.signUpFormTitle")}
						</Button>
					</div> */}
				</form>
			</Form>
		</div>
	);
}

export default LoginForm;
