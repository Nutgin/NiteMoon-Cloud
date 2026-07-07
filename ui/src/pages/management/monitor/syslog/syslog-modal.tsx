import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/ui/form";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { useTranslation } from "react-i18next";
import { type SystemSyslog } from "@/api/services/systemSyslogService";

export type SyslogModalProps = {
	formValue: SystemSyslog;
	title: string;
	show: boolean;
	onOk: VoidFunction;
	onCancel: VoidFunction;
};

export function SyslogModal({ title, show, formValue, onOk, onCancel }: SyslogModalProps) {
	const { t } = useTranslation();
	const form = useForm<SystemSyslog>({
		defaultValues: formValue,
	});

	const [isJsonFormatted, setIsJsonFormatted] = useState(true);

	useEffect(() => {
		form.reset(formValue);
	}, [formValue, form]);

	const formatJson = (data: any): string => {
		if (!data) return '';
		if (typeof data === 'string') {
			try {
				return JSON.stringify(JSON.parse(data), null, 2);
			} catch {
				return data;
			}
		}
		return JSON.stringify(data, null, 2);
	};

	const compactJson = (data: any): string => {
		if (!data) return '';
		if (typeof data === 'string') {
			try {
				return JSON.stringify(JSON.parse(data));
			} catch {
				return data;
			}
		}
		return JSON.stringify(data);
	};

	const getRequestParamsDisplay = () => {
		const fieldValue = form.getValues('requestParams');
		return isJsonFormatted ? formatJson(fieldValue) : compactJson(fieldValue);
	};

	return (
		<Dialog open={show} onOpenChange={(open) => !open && onCancel()}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="userName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.syslog.operator')}</FormLabel>
										<FormControl>
											<Input {...field} disabled />
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="title"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.syslog.operation')}</FormLabel>
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
										<FormLabel>{t('monitor.syslog.ipAddress')}</FormLabel>
										<FormControl>
											<Input {...field} disabled />
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="requestTime"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.syslog.duration')}</FormLabel>
										<FormControl>
											<Input {...field} value={`${field.value}ms`} disabled />
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="createTime"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.syslog.operationTime')}</FormLabel>
										<FormControl>
											<Input {...field} disabled />
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="method"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.syslog.httpMethod')}</FormLabel>
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
								name="requestMethod"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.syslog.requestMethod')}</FormLabel>
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
								name="requestUri"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.syslog.requestUrl')}</FormLabel>
										<FormControl>
											<Input {...field} disabled />
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-1 gap-4">
							<FormItem>
								<div className="flex items-center justify-between">
									<FormLabel>{t('monitor.syslog.requestParams')}</FormLabel>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setIsJsonFormatted(!isJsonFormatted)}
										className="h-8 w-8 p-0"
										title={isJsonFormatted ? t('monitor.syslog.compact') : t('monitor.syslog.pretty')}
									>
										<Icon
											icon={isJsonFormatted ? "mdi:code-json" : "mdi:format-align-left"}
											size={16}
										/>
									</Button>
								</div>
								<FormControl>
									<Textarea
										disabled
										rows={isJsonFormatted ? 8 : 4}
										className="font-mono text-sm"
										value={getRequestParamsDisplay()}
									/>
								</FormControl>
							</FormItem>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="location"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.syslog.operationLocation')}</FormLabel>
										<FormControl>
											<Input {...field} disabled />
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.syslog.status')}</FormLabel>
										<FormControl>
											<Input {...field} value={field.value === '1' ? t('monitor.syslog.success') : t('monitor.syslog.failed')} disabled />
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						<div className="flex justify-end space-x-2 pt-4">
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
