import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuthCheck } from "@/components/auth/use-auth";
import { CodeBlock } from "@/components/code/code-bock";
import { useSignIn, useUserInfo } from "@/store/userStore";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/ui/tabs";
import { Text } from "@/ui/typography";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

const Component_Auth_1 = `
<AuthGuard
  check="permission:delete"
  baseOn="permission"
  fallback={
    <Text variant="body1" color="error">
      没有<Text variant="code">permission:delete</Text>权限
    </Text>
  }
>
  <Button variant="destructive">
    删除
  </Button>
</AuthGuard>
`;

const Component_Auth_2 = `
<AuthGuard
  checkAny={["permission:update", "permission:delete"]}
  baseOn="permission"
  fallback={
    <Text variant="body1" color="error">
      没有<Text variant="code">permission:update</Text>或<Text variant="code">permission:delete</Text>权限
    </Text>
  }
>
  <Button variant="secondary">Detail</Button>
</AuthGuard>
`;

const Component_Auth_3 = `
<AuthGuard
  checkAll={["permission:read", "permission:create"]}
  baseOn="permission"
  fallback={
    <Text variant="body1" color="error">
      没有<Text variant="code">permission:read</Text>和<Text variant="code">permission:create</Text>权限
    </Text>
  }
>
  <Button variant="destructive">Add</Button>
</AuthGuard>
`;

const Function_Auth_1 = `
const { check, checkAny, checkAll } = useAuthCheck();
check("permission:delete") ? (
  <Button variant="destructive">Delete</Button>
) : (
  <Text variant="body1" color="error">
    没有<Text variant="code">permission:delete</Text>权限
  </Text>
);
`;

const Function_Auth_2 = `
const { check, checkAny, checkAll } = useAuthCheck();
checkAny(["permission:update", "permission:delete"]) ? (
  <Button variant="secondary">Detail</Button>
) : (
  <Text variant="body1" color="error">
`;

const Function_Auth_3 = `
const { check, checkAny, checkAll } = useAuthCheck();
checkAll(["permission:read", "permission:create"]) ? (
  <Button variant="secondary">Add</Button>
) : (
  <Text variant="body1" color="error">
`;

export default function PermissionPage() {
	const { permissions, roles, username } = useUserInfo();
	const signIn = useSignIn();
	const { check, checkAny, checkAll } = useAuthCheck();
	const { t } = useTranslation();

	const handleSwitch = (_username: string) => {
		if (_username === username) return;
		// TODO: 从实际API获取用户信息进行切换
		console.log(`Switch to user: ${_username}`);
	};
	return (
		<div className="flex flex-col gap-4">
			<div className="w-full flex  items-center justify-center">
				<Text variant="subTitle1">{t("sys.test.currentUser")}</Text>
				<Tabs defaultValue={username} onValueChange={handleSwitch}>
					<TabsList>
						<TabsTrigger value={username}>
							{username}
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>
			<Card>
				<CardContent>
					<div className="flex items-center gap-2">
						<Text variant="body1">{t("sys.test.currentUserRole")}</Text>
						{permissions && permissions.length > 0 ? (
							<Text variant="body1">[{roles?.map((role) => role.name).join(", ")}]</Text>
						) : (
							<Text variant="body1">[]</Text>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Text variant="body1">{t("sys.test.currentUserPermissions")}</Text>
						{permissions && permissions.length > 0 ? (
							<Text variant="body1">[{permissions?.map((permission) => permission.code).join(", ")}]</Text>
						) : (
							<Text variant="body1">[]</Text>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("sys.test.pageAuthTest")}</CardTitle>
					<CardDescription>点击下面按钮，当拥有页面指定权限时正常显示，否则显示403</CardDescription>
				</CardHeader>
				<CardContent>
					<Link to="/permission/page-test">
						<Button>{t("sys.test.goToPage")}</Button>
					</Link>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("sys.test.componentAuthTest")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-2 flex-col">
						<CodeBlock
							code={Component_Auth_1.trim()}
							options={{
								lang: "tsx",
							}}
							title={t("sys.test.singlePermission")}
							description="当用户拥有permission:delete权限时，显示Delete按钮，否则fallback"
						>
							<AuthGuard
								check="permission:delete"
								baseOn="permission"
								fallback={
									<Text variant="body1" color="error">
										没有<Text variant="code">permission:delete</Text>权限
									</Text>
								}
							>
								<Button variant="destructive">Delete</Button>
							</AuthGuard>
						</CodeBlock>

						<CodeBlock
							code={Component_Auth_2.trim()}
							title={t("sys.test.anyPermission")}
							description="当用户拥有permission:update或permission:delete权限时，显示Detail按钮，否则fallback"
							options={{
								lang: "tsx",
							}}
						>
							<AuthGuard
								checkAny={["permission:update", "permission:delete"]}
								baseOn="permission"
								fallback={
									<Text variant="body1" color="error">
										没有<Text variant="code">permission:update</Text>或<Text variant="code">permission:delete</Text>权限
									</Text>
								}
							>
								<Button variant="secondary">Detail</Button>
							</AuthGuard>
						</CodeBlock>

						<CodeBlock
							code={Component_Auth_3.trim()}
							options={{
								lang: "tsx",
							}}
							title={t("sys.test.multiplePermission")}
							description="当用户拥有permission:read和permission:create权限时，显示Add按钮，否则fallback"
						>
							<AuthGuard
								checkAll={["permission:read", "permission:create"]}
								baseOn="permission"
								fallback={
									<Text variant="body1" color="error">
										没有<Text variant="code">permission:read</Text>和<Text variant="code">permission:create</Text>权限
									</Text>
								}
							>
								<Button variant="secondary">Add</Button>
							</AuthGuard>
						</CodeBlock>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("sys.test.functionAuthTest")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-2 flex-col">
						<CodeBlock
							code={Function_Auth_1.trim()}
							options={{
								lang: "tsx",
							}}
							title={t("sys.test.singlePermission")}
							description="当用户拥有permission:delete权限时，显示Delete按钮，否则fallback"
						>
							{check("permission:delete") ? (
								<Button variant="destructive">Delete</Button>
							) : (
								<Text variant="body1" color="error">
									没有<Text variant="code">permission:delete</Text>权限
								</Text>
							)}
						</CodeBlock>

						<CodeBlock
							code={Function_Auth_2.trim()}
							title={t("sys.test.anyPermission")}
							description="当用户拥有permission:update或permission:delete权限时，显示Detail按钮，否则fallback"
							options={{
								lang: "tsx",
							}}
						>
							{checkAny(["permission:update", "permission:delete"]) ? (
								<Button variant="secondary">Detail</Button>
							) : (
								<Text variant="body1" color="error">
									没有<Text variant="code">permission:update</Text>或<Text variant="code">permission:delete</Text>权限
								</Text>
							)}
						</CodeBlock>

						<CodeBlock
							code={Function_Auth_3.trim()}
							options={{
								lang: "tsx",
							}}
							title={t("sys.test.multiplePermission")}
							description="当用户拥有permission:read和permission:create权限时，显示Add按钮，否则fallback"
						>
							{checkAll(["permission:read", "permission:create"]) ? (
								<Button variant="secondary">Add</Button>
							) : (
								<Text variant="body1" color="error">
									没有<Text variant="code">permission:read</Text>和<Text variant="code">permission:create</Text>权限
								</Text>
							)}
						</CodeBlock>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
