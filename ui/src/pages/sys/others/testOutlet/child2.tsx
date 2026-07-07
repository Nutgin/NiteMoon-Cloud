import { useTranslation } from "react-i18next";
export default function Child2() {
	const { t } = useTranslation();
	return (
		<div style={{ background: "#f6ffed", padding: "20px", borderRadius: "4px" }}>
			<h2>🚀 {t("sys.test.child2Component")}</h2>
			<p>{t("sys.test.child2Desc")}</p>
			<p>{t("sys.test.child2Path")}</p>
		</div>
	);
}
