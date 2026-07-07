import bannerImage from "@/assets/images/background/banner-1.png";
import { Icon } from "@/components/icon";
import { useUserInfo, useRoleList } from "@/store/userStore";
import { themeVars } from "@/theme/theme.css";
import { Avatar, AvatarImage } from "@/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { Text, Title } from "@/ui/typography";
import { useTranslation } from "react-i18next";
import type { CSSProperties } from "react";
import ConnectionsTab from "./connections-tab";
import ProfileTab from "./profile-tab";
import ProjectsTab from "./projects-tab";
import TeamsTab from "./teams-tab";

function UserProfile() {
	const { avatar, username, roles } = useUserInfo();
	const roleList = useRoleList();
	const { t } = useTranslation();

	// Helper function to get name by id from list
	const getNameById = (id: string | undefined, list: Array<{ id: string; name: string }>) => {
		if (!id) return "N/A";
		const item = list.find(item => item.id === id);
		return item?.name || id;
	};

	// Get role names from role IDs
	const roleNames = roles?.map(roleId => getNameById(roleId, roleList)).join(', ') || 'TS FullStack';

	const bgStyle: CSSProperties = {
		position: "absolute",
		inset: 0,
		background: `url(${bannerImage})`,
		backgroundSize: "cover",
		backgroundPosition: "50%",
		backgroundRepeat: "no-repeat",
	};

	const tabs = [
		{
			key: "profile",
			icon: <Icon icon="solar:user-id-bold" size={24} className="mr-2" />,
			title: t("common.profile"),
			content: <ProfileTab />,
		},
		{
			key: "teams",
			icon: <Icon icon="mingcute:profile-fill" size={24} className="mr-2" />,
			title: t("common.teams"),
			content: <TeamsTab />,
		},
		{
			key: "projects",
			icon: <Icon icon="mingcute:profile-fill" size={24} className="mr-2" />,
			title: t("common.projects"),
			content: <ProjectsTab />,
		},
		{
			key: "connections",
			icon: <Icon icon="mingcute:profile-fill" size={24} className="mr-2" />,
			title: t("common.connections"),
			content: <ConnectionsTab />,
		},
	];

	return (
		<Tabs defaultValue={tabs[0].key} className="w-full">
			<div className="relative flex flex-col justify-center items-center gap-4 p-4">
				<div style={bgStyle} className="h-full w-full z-1" />
				<div className="flex flex-col items-center justify-center gap-2 z-2">
					<Avatar className="h-24 w-24">
						<AvatarImage src={avatar} className="rounded-full" />
					</Avatar>
					<div className="flex flex-col justify-center items-center gap-2">
						<div className="flex items-center gap-2">
							<Title as="h5" className="text-xl">
								{username}
							</Title>
							<Icon icon="heroicons:check-badge-solid" size={20} color={themeVars.colors.palette.primary.default} />
						</div>
						<Text variant="body2">{roleNames}</Text>
					</div>
				</div>
				<TabsList className="z-5">
					{tabs.map((tab) => (
						<TabsTrigger key={tab.key} value={tab.key}>
							{tab.icon}
							{tab.title}
						</TabsTrigger>
					))}
				</TabsList>
			</div>

			{tabs.map((tab) => (
				<TabsContent key={tab.key} value={tab.key}>
					{tab.content}
				</TabsContent>
			))}
		</Tabs>
	);
}

export default UserProfile;
