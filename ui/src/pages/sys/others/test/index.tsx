import { Text } from "@/ui/typography";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Button } from "@/ui/button";
import { useUserPermissions } from "@/store/userStore";
import { useTranslation } from "react-i18next";
// import React from 'react'
// 测试权限页面
const Index = () => {
	const permissions = useUserPermissions();
	const { t } = useTranslation();
	return (
		<div>
			<div className="testBox flex w-full h-full ">
				<div className="currentInfo bg-pink-300">
					<Text variant="body1">{t("sys.test.currentPermissions")} {permissions.map((p) => p.code).join(", ")}</Text>
				</div>
			</div>
			<div>
				<div className="testBoxItem">
					<Text variant="body1">{t("sys.test.testPermission1")}</Text>
					<AuthGuard check="permission:rd" baseOn="permission" fallback={<Text variant="body1">{t("sys.test.noPermissionText")}</Text>}>
						<Button>{t("sys.test.testPermission1")}</Button>
					</AuthGuard>
				</div>
				<div className="testBoxItem">
					<Text variant="body1">{t("sys.test.testPermission2")}</Text>
					<AuthGuard check="permission:update">
						<Button>{t("sys.test.testPermission2")}</Button>
					</AuthGuard>
				</div>
			</div>
		</div>
	);
};

export default Index;
