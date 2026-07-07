import { Link, Outlet } from "react-router";
import { useTranslation } from "react-i18next";

export default function TestOutlet() {
	const { t } = useTranslation();
	return (
		<div style={{ padding: "20px" }}>
			<h1>{t("sys.test.parentComponent")}</h1>

			{/* 子路由导航 */}
			<nav style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
				<Link
					to="/testOutlet/child1"
					style={{
						padding: "8px 16px",
						background: "#1890ff",
						color: "white",
						textDecoration: "none",
						borderRadius: "4px",
					}}
				>
					Child 1
				</Link>
				<Link
					to="/testOutlet/child2"
					style={{
						padding: "8px 16px",
						background: "#52c41a",
						color: "white",
						textDecoration: "none",
						borderRadius: "4px",
					}}
				>
					Child 2
				</Link>
				<Link
					to="/testOutlet/child3"
					style={{
						padding: "8px 16px",
						background: "#faad14",
						color: "white",
						textDecoration: "none",
						borderRadius: "4px",
					}}
				>
					Child 3
				</Link>
			</nav>

			{/* 子路由渲染区域 */}
			<div style={{ border: "2px dashed #d9d9d9", padding: "20px", borderRadius: "8px" }}>
				<p style={{ color: "#999", marginBottom: "10px" }}>👇 {t("sys.test.outletDesc")}</p>
				<Outlet />
			</div>
		</div>
	);
}
