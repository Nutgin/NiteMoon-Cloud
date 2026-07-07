import bgImg from "@/assets/images/background/banner-1.png";
import Character from "@/assets/images/characters/character_3.png";
import { Icon } from "@/components/icon";
import { getAppName } from "@/global-config";
import { Button } from "@/ui/button";
import { Text, Title } from "@/ui/typography";
import { useTranslation } from "react-i18next";
import type { CSSProperties } from "react";

const FEATURES = [
	{ key: "bannerFeature1", icon: "lucide:git-branch" },
	{ key: "bannerFeature2", icon: "lucide:image" },
	{ key: "bannerFeature3", icon: "lucide:brain" },
	{ key: "bannerFeature4", icon: "lucide:cpu" },
] as const;

export default function BannerCard() {
	const { t } = useTranslation();

	const bgStyle: CSSProperties = {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundImage: `url("${bgImg}")`,
		backgroundSize: "100%",
		backgroundPosition: "50%",
		backgroundRepeat: "no-repeat",
		opacity: 0.5,
	};
	return (
		<div className="relative bg-primary/90 rounded-xl overflow-hidden">
			<div className="p-6 z-2 relative">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 flex flex-col gap-3">
						<Title as="h2" className="text-white text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
							{t("common.bannerTitle", { appName: getAppName() })}
						</Title>
						<Text className="text-white/80 text-sm md:text-base">
							{t("common.bannerSubtitle")}
						</Text>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
							{FEATURES.map((f) => (
								<div
									key={f.key}
									className="flex items-start gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-2"
								>
									<Icon icon={f.icon} size={18} className="text-white mt-0.5 shrink-0" />
									<Text className="text-white/90 text-xs leading-relaxed">
										{t(`common.${f.key}`)}
									</Text>
								</div>
							))}
						</div>

						<div className="mt-2">
							<Button
								variant="outline"
								className="w-fit bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs"
								onClick={() => window.open("https://gitee.com/nutgin99")}
							>
								<Icon icon="simple-icons:gitee" size={18} />
								<span className="ml-1.5">{t("common.joinGitee")}</span>
							</Button>
						</div>
					</div>

					<div className="hidden lg:flex items-center justify-end">
						<img src={Character} className="w-52 h-52 object-contain" alt="character" />
					</div>
				</div>
			</div>
			<div style={bgStyle} className="z-1" />
		</div>
	);
}
