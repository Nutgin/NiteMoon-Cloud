import { useState } from "react";
import LocalePicker from "@/components/locale-picker";
import Logo from "@/components/logo";
import { GLOBAL_CONFIG, getAppName } from "@/global-config";
import SettingButton from "@/layouts/components/setting-button";
import { useUserToken } from "@/store/userStore";
import { Navigate } from "react-router";
import LoginForm from "./login-form";
import MobileForm from "./mobile-form";
import { LoginProvider } from "./providers/login-provider";
import QrCodeFrom from "./qrcode-form";
import RegisterForm from "./register-form";
import ResetForm from "./reset-form";
import { InteractiveCharacters } from "./components/interactive-characters";

function LoginPage() {
	//解构出两个token
	const token = useUserToken();
	const [inputState, setInputState] = useState({
		isTypingEmail: false,
		passwordLength: 0,
		passwordVisible: false
	});

	const handleInputChange = (state: typeof inputState) => {
		setInputState(state);
	};

	if (token.accessToken) {
		return <Navigate to={GLOBAL_CONFIG.defaultRoute} replace />;
	}

	return (
		<div className="relative grid min-h-svh lg:grid-cols-2 bg-background">
			<div className="flex flex-col gap-4 p-6 md:p-10">
				<div className="flex justify-center gap-2 md:justify-start">
					<div className="flex items-center gap-2 font-medium cursor-pointer">
						<Logo size={28} />
						<span>{getAppName()}</span>
					</div>
				</div>
				<div className="flex flex-1 items-center justify-center">
					<div className="w-full max-w-xs">
						<LoginProvider>
							<LoginForm onInputChange={handleInputChange} />
							<MobileForm />
							<QrCodeFrom />
							<RegisterForm />
							<ResetForm />
						</LoginProvider>
					</div>
				</div>
			</div>

			<div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-purple-50 to-orange-50 dark:from-purple-900/20 dark:to-orange-900/20 p-12">
				<div className="flex-1 flex items-end justify-center">
					<InteractiveCharacters 
						isTypingEmail={inputState.isTypingEmail}
						passwordLength={inputState.passwordLength}
						passwordVisible={inputState.passwordVisible}
					/>
				</div>
			</div>

			<div className="absolute right-2 top-0 flex flex-row">
				<LocalePicker />
				<SettingButton />
			</div>
		</div>
	);
}
export default LoginPage;
