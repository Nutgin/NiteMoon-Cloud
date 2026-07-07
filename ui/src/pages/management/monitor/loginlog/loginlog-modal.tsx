import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/ui/form";
import { Input } from "@/ui/input";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { type LoginLog } from "@/api/services/systemLoginlogService";

export type LoginlogModalProps = {
	formValue: LoginLog;
	title: string;
	show: boolean;
	onOk: VoidFunction;
	onCancel: VoidFunction;
};

export function LoginlogModal({ title, show, formValue, onOk, onCancel }: LoginlogModalProps) {
	const { t } = useTranslation();
	const form = useForm<LoginLog>({
		defaultValues: formValue,
	});

	useEffect(() => {
		form.reset(formValue);
	}, [formValue, form]);

	const getSystemBadge = (system: string) => {
		const lowerSystem = system.toLowerCase();
		if (lowerSystem.includes('mac os') || lowerSystem.includes('darwin')) {
			return { variant: "default" as const, icon: "mdi:apple", text: "macOS" };
		}
		if (lowerSystem.includes('windows')) {
			return { variant: "secondary" as const, icon: "mdi:microsoft-windows", text: "Windows" };
		}
		if (lowerSystem.includes('linux')) {
			return { variant: "outline" as const, icon: "mdi:linux", text: "Linux" };
		}
		return { variant: "outline" as const, icon: "mdi:desktop-classic", text: system };
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
								name="userName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.loginlog.loginUser')}</FormLabel>
										<FormControl>
											<div className="flex items-center gap-2">
												<Icon icon="mdi:account" size={16} className="text-gray-500" />
												<Input {...field} disabled />
											</div>
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="createTime"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.loginlog.loginTime')}</FormLabel>
										<FormControl>
											<div className="flex items-center gap-2">
												<Icon icon="mdi:clock" size={16} className="text-gray-500" />
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
										<FormLabel>{t('monitor.loginlog.browser')}</FormLabel>
										<FormControl>
											<Input {...field} disabled />
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="os"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.loginlog.os')}</FormLabel>
										<FormControl>
											<div className="flex items-center gap-2">
												{(() => {
													const systemInfo = getSystemBadge(field.value);
													return (
														<Badge
															variant={systemInfo.variant}
															className="flex items-center gap-1 dark:bg-white dark:text-black"
														>
															<Icon icon={systemInfo.icon} size={14} />
															{systemInfo.text}
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
								name="ipAddr"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.loginlog.ipAddress')}</FormLabel>
										<FormControl>
											<div className="flex items-center gap-2">
												<Icon icon="mdi:ip-network" size={16} className="text-gray-500" />
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
										<FormLabel>{t('monitor.loginlog.loginLocation')}</FormLabel>
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
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.loginlog.loginStatus')}</FormLabel>
										<FormControl>
											<Badge
												variant={field.value === "1" ? "default" : "destructive"}
												className="flex items-center gap-1 w-fit"
											>
												{field.value === "1" ? t('monitor.loginlog.success') : t('monitor.loginlog.failed')}
											</Badge>
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="createBy"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.loginlog.creator')}</FormLabel>
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
								name="msg"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.loginlog.loginMsg')}</FormLabel>
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
