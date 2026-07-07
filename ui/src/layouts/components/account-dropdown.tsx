import { useLoginStateContext } from "@/pages/sys/login/providers/login-provider";
import { useRouter } from "@/routes/hooks";
import { useUserActions, useUserInfo } from "@/store/userStore";
import { logout as logoutApi } from "@/api/auth/login";
import { AppImage } from "@/components/app-image";
import { Button } from "@/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

/**
 * Account Dropdown
 */
export default function AccountDropdown() {
	const { replace } = useRouter();
	const { username, email, avatar, nikeName } = useUserInfo();
	const { clearUserInfoAndToken } = useUserActions();
	const { backToLogin } = useLoginStateContext();
	const { t } = useTranslation();
	
	// 生成默认头像
	const getDefaultAvatar = (size = "small") => {
		const firstChar = (nikeName || username || '').charAt(0).toUpperCase();
		const sizeClasses = size === "small" 
			? "h-6 w-6 text-xs" 
			: "h-10 w-10 text-sm";
		
		return (
			<div className={`${sizeClasses} rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium border border-gray-300`}>
				{firstChar}
			</div>
		);
	};
	
	const shouldShowDefault = !avatar;
	
	const logout = async () => {
		try {
			// 通知后端销毁 token
			await logoutApi().catch(() => { /* 忽略网络错误，仍然清理本地状态 */ });
		} finally {
			clearUserInfoAndToken();
			backToLogin();
			replace("/auth/login");
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="rounded-full">
					{shouldShowDefault ? (
						getDefaultAvatar("small")
					) : (
						<AppImage
							className="h-6 w-6 rounded-full border border-gray-200 object-cover" 
							src={avatar} 
							alt=""
							showLoading={false}
						/>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<div className="flex items-center gap-2 p-2">
					{shouldShowDefault ? (
						getDefaultAvatar("large")
					) : (
						<AppImage
							className="h-10 w-10 rounded-full border border-gray-200 object-cover" 
							src={avatar} 
							alt=""
							showLoading={false}
						/>
					)}
					<div className="flex flex-col items-start">
						<div className="text-text-primary text-sm font-medium">{nikeName || username}</div>
						<div className="text-text-secondary text-xs">{email}</div>
					</div>
				</div>
				<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
					<NavLink to="/management/user/profile">{t("sys.nav.user.profile")}</NavLink>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<NavLink to="/management/user/account">{t("sys.nav.user.account")}</NavLink>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem className="font-bold text-warning" onClick={logout}>
					{t("sys.login.logout")}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
