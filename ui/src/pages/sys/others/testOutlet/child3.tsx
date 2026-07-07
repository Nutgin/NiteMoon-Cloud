import { useTranslation } from "react-i18next";
export default function Child3() {
	const { t } = useTranslation();
	return (
		<div style={{ background: "#fffbe6", padding: "20px", borderRadius: "4px" }}>
			<h2>⚡ {t("sys.test.child3Component")}</h2>
			<p>{t("sys.test.child3Desc")}</p>
			<p>{t("sys.test.child3Path")}</p>
		</div>
	);
}
