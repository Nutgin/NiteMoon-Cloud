import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/ui/form";
import { Input } from "@/ui/input";
import { Progress } from "@/ui/progress";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { type SysFile } from "@/api/services/systemServerService";

export type ServerModalProps = {
	formValue: SysFile;
	title: string;
	show: boolean;
	onOk: VoidFunction;
	onCancel: VoidFunction;
};

export function ServerModal({ title, show, formValue, onOk, onCancel }: ServerModalProps) {
	const { t } = useTranslation();
	const form = useForm<SysFile>({
		defaultValues: formValue,
	});

	useEffect(() => {
		form.reset(formValue);
	}, [formValue, form]);

	const formatBytes = (bytes: number): string => {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
	};

	const getProgressColor = (usage: number) => {
		if (usage < 30) return 'bg-green-500';
		if (usage < 70) return 'bg-yellow-500';
		return 'bg-red-500';
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
								name="dirName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.server.diskPath')}</FormLabel>
										<FormControl>
											<Input {...field} disabled />
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="typeName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.server.fileSystem')}</FormLabel>
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
								name="total"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.server.totalSize')}</FormLabel>
										<FormControl>
											<Input {...field} value={formatBytes(field.value)} disabled />
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="free"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.server.availableSize')}</FormLabel>
										<FormControl>
											<Input {...field} value={formatBytes(field.value)} disabled />
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="used"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.server.usedSize')}</FormLabel>
										<FormControl>
											<Input {...field} value={formatBytes(field.value)} disabled />
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="usage"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.server.diskUsage')}</FormLabel>
										<FormControl>
											<div className="flex items-center space-x-2">
												<Progress
													value={field.value}
													className="flex-1"
												/>
												<span className="text-sm font-medium">{field.value}%</span>
											</div>
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
