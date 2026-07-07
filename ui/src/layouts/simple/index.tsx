import type React from "react";
import HeaderSimple from "../components/header-simple";

type Props = {
	children: React.ReactNode;
};
// 这是只有一个简单的header 用于展示404 500 等页面
export default function SimpleLayout({ children }: Props) {
	return (
		<div className="flex h-screen w-full flex-col text-text-base bg-bg">
			<HeaderSimple />
			{children}
		</div>
	);
}
