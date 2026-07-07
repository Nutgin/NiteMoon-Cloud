import Logo from "@/components/logo";
import { down, useMediaQuery } from "@/hooks";
import { useSettings } from "@/store/settingStore";
import { ThemeLayout } from "#/enum";
import Header from "./header";
import Main from "./main";
import { NavHorizontalLayout, NavMobileLayout, NavVerticalLayout, useFilteredNavData } from "./nav";

export default function DashboardLayout() {
	const isMobile = useMediaQuery(down("md"));

	return (
		<div data-slot="slash-layout-root" className="w-full min-h-screen bg-background">
			{isMobile ? <MobileLayout /> : <PcLayout />}
		</div>
	);
}
// 移动设备布局
function MobileLayout() {
	const navData = useFilteredNavData();
	return (
		<>
			{/* Sticky Header */}
			<Header leftSlot={<NavMobileLayout data={navData} />} />
			<Main />
		</>
	);
}
//初始化pc布局
function PcLayout() {
	const { themeLayout } = useSettings();

	if (themeLayout === ThemeLayout.Horizontal) return <PcHorizontalLayout />;
	return <PcVerticalLayout />;
}
//PcHorizontalLayout布局
function PcHorizontalLayout() {
	const navData = useFilteredNavData();
	return (
		<>
			{/* Sticky Header */}
			<Header leftSlot={<Logo />} />
			{/* Sticky Nav */}
			<NavHorizontalLayout data={navData} />

			<Main />
		</>
	);
}
//pcVerticalLayout布局
function PcVerticalLayout() {
	const settings = useSettings();
	const { themeLayout } = settings;
	const navData = useFilteredNavData();

	const mainPaddingLeft =
		themeLayout === ThemeLayout.Vertical ? "var(--layout-nav-width)" : "var(--layout-nav-width-mini)";

	return (
		<>
			{/* Fixed Header */}
			<NavVerticalLayout data={navData} />

			<div
				className="relative w-full min-h-screen flex flex-col transition-[padding] duration-300 ease-in-out"
				style={{
					paddingLeft: mainPaddingLeft,
				}}
			>
				<Header />
				<Main />
			</div>
		</>
	);
}
