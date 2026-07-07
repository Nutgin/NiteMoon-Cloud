import BannerCard from "./banner-card";
import HistoryTodayCard from "./history-today-card";
import ZhihuNewsCard from "./zhihu-news-card";

export default function Workbench() {
	return (
		<div className="flex flex-col gap-4 w-full">
			<BannerCard />
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<HistoryTodayCard />
				<ZhihuNewsCard />
			</div>
		</div>
	);
}
