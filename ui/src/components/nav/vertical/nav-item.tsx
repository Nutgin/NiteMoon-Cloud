import Icon from "@/components/icon/icon";
import useLocale from "@/locales/use-locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/ui/tooltip";
import { cn } from "@/utils";
import { NavItemRenderer } from "../components";
import { navItemClasses, navItemStyles } from "../styles";
import type { NavItemProps } from "../types";

/**
 * 单行菜单项（只负责“长什么样”）。
 *
 * 它不直接做路由跳转/权限判断：
 * - 真正决定“渲染成 Link / Button / 禁用 / 权限拦截”的是 `NavItemRenderer`
 *
 * 常见字段解释：
 * - `title`：i18n key（例如 sys.nav.dashboard），通过 `t(title)` 翻译显示
 * - `open`：当前节点是否展开（有 children 的情况下用于旋转箭头）
 * - `active`：当前路由是否命中（用于高亮样式）
 * - `depth`：层级深度（一级/二级/三级），用于区分不同层的高亮策略
 * - `hasChild`：是否存在 children，决定是否显示右侧箭头
 */
export function NavItem(item: NavItemProps) {
	const { title, icon, info, caption, open, active, disabled, depth, hasChild } = item;
	const { t } = useLocale();

	const content = (
		<>
			{/* 左侧图标：支持 string（Iconify key）或直接传 ReactNode */}
			<span style={navItemStyles.icon} className="mr-3 items-center justify-center">
				{icon && typeof icon === "string" ? <Icon icon={icon} /> : icon}
			</span>

			{/* 中间文案区：标题 + 可选 caption */}
			<span style={navItemStyles.texts} className="min-h-[24px]">
				{/* 标题：title 是 i18n key */}
				<span style={navItemStyles.title}>{t(title)}</span>

				{/* Caption：一般用于“解释文案/提示文案”，hover 时通过 tooltip 展示完整内容 */}
				{caption && (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<span style={navItemStyles.caption}>{t(caption)}</span>
							</TooltipTrigger>
							<TooltipContent side="top" align="start">
								{t(caption)}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</span>

			{/* 右侧信息位：比如 Badge/数字/自定义节点 */}
			{info && <span style={navItemStyles.info}>{info}</span>}

			{/* 右侧箭头：仅在有 children 时展示；open 时旋转 */}
			{hasChild && (
				<Icon
					icon="eva:arrow-ios-forward-fill"
					style={{
						...navItemStyles.arrow,
						transform: open ? "rotate(90deg)" : "rotate(0deg)",
					}}
				/>
			)}
		</>
	);

	const itemClassName = cn(
		navItemClasses.base,
		navItemClasses.hover,
		"min-h-[44px]",
		// 基于深度添加缩进：depth >= 1 表示二级菜单及以下，添加左边距
		depth !== undefined && depth >= 1 && "!pl-8",
		// 一级菜单：active 用专门的 active class（通常更强的高亮）
		active && depth === 1 && navItemClasses.active,
		// 非一级菜单：active 给一个 hover 背景即可（视觉更轻）
		active && depth !== 1 && "bg-action-hover!",
		disabled && navItemClasses.disabled,
		// Add special class for dark mode black theme active state
		active && "dark-black-theme-active-menu",
	);

	return (
		// 统一由 NavItemRenderer 包装：它通常负责
		// - 根据 path 渲染为 Link
		// - 根据 disabled/auth 做拦截/样式处理
		<NavItemRenderer item={item} className={itemClassName}>
			{content}
		</NavItemRenderer>
	);
}
