import { Text } from "@/ui/typography";
import { useTranslation } from "react-i18next";
export default function Child1() {
	const { t } = useTranslation();
	return (
		<div>
			<Text>🎯 {t("sys.test.child1Component")}</Text>
			<Text>{t("sys.test.child1Desc")}</Text>
			<Text>{t("sys.test.child1Path")}</Text>
			<div className="text-success">test colot</div>
		</div>
	);
}
