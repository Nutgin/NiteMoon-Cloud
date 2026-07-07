import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/ui/form";
import { Input } from "@/ui/input";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { type OnlineUser } from "@/api/services/systemOnlineService";

export type OnlineModalProps = {
	formValue: OnlineUser;
	title: string;
	show: boolean;
	onOk: VoidFunction;
	onCancel: VoidFunction;
};

export function OnlineModal({ title, show, formValue, onOk, onCancel }: OnlineModalProps) {
	const { t } = useTranslation();
	const form = useForm<OnlineUser>({
		defaultValues: formValue,
	});

	useEffect(() => {
		form.reset(formValue);
	}, [formValue, form]);

	const getBrowserIcon = (browser: string) => {
		const lowerBrowser = browser.toLowerCase();
		if (lowerBrowser.includes('chrome') && !lowerBrowser.includes('edge')) {
			return "mdi:google-chrome";
		}
		if (lowerBrowser.includes('firefox')) {
			return "mdi:firefox";
		}
		if (lowerBrowser.includes('safari') && !lowerBrowser.includes('chrome')) {
			return "mdi:apple-safari";
		}
		if (lowerBrowser.includes('edge')) {
			return "mdi:microsoft-edge";
		}
		return "mdi:web";
	};

	const getOSBadge = (os: string) => {
		const lowerOS = os.toLowerCase();
		if (lowerOS.includes('windows')) {
			return { variant: "destructive" as const, icon: "mdi:microsoft-windows", text: "Windows" };
		}
		if (lowerOS.includes('mac') || lowerOS.includes('darwin')) {
			return { variant: "default" as const, icon: "mdi:apple", text: "macOS" };
		}
		if (lowerOS.includes('linux')) {
			return { variant: "secondary" as const, icon: "mdi:linux", text: "Linux" };
		}
		return { variant: "outline" as const, icon: "mdi:desktop-classic", text: os };
	};

	return (
		<Dialog open={show} onOpenChange={(open) => !open && onCancel()}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<div className="space-y-6">
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="tokenId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Token ID</FormLabel>
										<FormControl>
											<Input {...field} disabled />
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="userName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.online.account')}</FormLabel>
										<FormControl>
											<Input {...field} disabled />
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="ipAddr"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.online.loginIp')}</FormLabel>
										<FormControl>
											<div className="flex items-center gap-2">
												<Icon icon="mdi:desktop-mac" size={16} className="text-gray-500" />
												<Input {...field} disabled />
											</div>
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="location"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.online.loginLocation')}</FormLabel>
										<FormControl>
											<div className="flex items-center gap-2">
												<Icon icon="mdi:map-marker" size={16} className="text-gray-500" />
												<Input {...field} disabled />
											</div>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="browser"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.online.browser')}</FormLabel>
										<FormControl>
											<div className="flex items-center gap-2">
												<Icon icon={getBrowserIcon(field.value)} size={16} className="text-gray-500" />
												<Input {...field} disabled />
											</div>
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="os"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.online.os')}</FormLabel>
										<FormControl>
											<div className="flex items-center gap-2">
												{(() => {
													const osInfo = getOSBadge(field.value);
													return (
														<Badge
															variant={osInfo.variant}
															className="flex items-center gap-1 dark:bg-white dark:text-black"
														>
															<Icon icon={osInfo.icon} size={14} />
															{osInfo.text}
														</Badge>
													);
												})()}
												<Input {...field} disabled className="ml-2" />
											</div>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="loginTime"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.online.loginTime')}</FormLabel>
										<FormControl>
											<Input {...field} disabled />
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="tokenTimeout"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.online.tokenTimeout')}</FormLabel>
										<FormControl>
											<Input {...field} disabled />
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-1 gap-4">
							<FormField
								control={form.control}
								name="tenantId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.online.tenantId')}</FormLabel>
										<FormControl>
											<Input {...field} disabled />
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						<div className="flex justify-end space-x-2">
							<Button variant="outline" onClick={onCancel}>
								{t('common.closeText')}
							</Button>
						</div>
					</div>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
