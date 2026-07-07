import { useToggle } from "react-use";
import { Icon } from "@/components/icon";
import useLocale from "@/locales/use-locale";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/ui/collapsible";
import { cn } from "@/utils";
import type { NavGroupProps } from "../types";
import { NavList } from "./nav-list";

/**
 * 导航分组（section）。
 *
 * 职责：
 * - 渲染分组标题（name）
 * - 控制整个分组的展开/收起（open）
 * - 渲染该分组下的第一层 items（每个 item 继续交给 `NavList` 递归渲染）
 *
 * 注意：这里的 open 只控制“分组是否折叠”，
 * 不等于某个具体菜单节点（NavList）的 open。
 */
export function NavGroup({ name, icon, items }: NavGroupProps) {
	const [open, toggleOpen] = useToggle(false);
	return (
		<Collapsible open={open}>
			<CollapsibleTrigger asChild>
				{/* 最外层title */}
				<Group name={name} icon={icon} open={open} onClick={toggleOpen} />
			</CollapsibleTrigger>
			{/* 最外层title下的内容 */}
			<CollapsibleContent>
				<ul className="flex w-full flex-col gap-0">
					{items.map((item, index) => (
						// 这里的data结构是
						//{
						//  title: string;
						//  path: string;
						//  icon: string;
						//  info: string;
						//  caption: string;
						//  auth: string[];
						//  children: NavItemDataProps[];
						//}
						<NavList key={item.title || index} data={item} depth={1} />
					))}
				</ul>
			</CollapsibleContent>
		</Collapsible>
	);
}

function Group({ name, icon, open, onClick }: { name?: string; icon?: string | React.ReactNode; open: boolean; onClick: (nextValue: boolean) => void }) {
	const { t } = useLocale();
	return (
		name && (
			<button
				type="button"
				className={cn(
					"group w-full inline-flex items-center justify-start relative gap-2 cursor-pointer pt-4 pr-2 pb-2 pl-3 transition-all duration-300 ease-in-out",
					"hover:pl-4",
				)}
				// 这里不依赖 Collapsible 的内部状态，手动切换 open，做更灵活的交互/动画控制
				onClick={() => onClick(!open)}
			>
				{/* 箭头图标 */}
				<Icon
					icon="eva:arrow-ios-forward-fill"
					className={cn(
						"absolute left-[-4px] h-4 w-4 inline-flex shrink-0 transition-all duration-300 ease-in-out",
						"opacity-0 group-hover:opacity-100",
						{
							"rotate-90": open,
						},
					)}
				/>

				{/* 分组图标 */}
				{icon && (
					<span className="mr-2 items-center justify-center">
						{typeof icon === "string" ? <Icon icon={icon} size="16" /> : icon}
					</span>
				)}

				{/* name 是 i18n key（例如 sys.nav.dashboard），这里通过 t(name) 翻译成当前语言文案 */}
				<span
					className={cn(
						"text-sm font-medium transition-all duration-300 ease-in-out text-text-disabled",
						"hover:text-text-primary",
					)}
				>
					{t(name)}
				</span>
			</button>
		)
	);
}
