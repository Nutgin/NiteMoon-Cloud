import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/ui/form";
import { Input } from "@/ui/input";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { type JobLog } from "@/api/services/systemJoblogService";

export type JoblogModalProps = {
	formValue: JobLog;
	title: string;
	show: boolean;
	onOk: VoidFunction;
	onCancel: VoidFunction;
};

export function JoblogModal({ title, show, formValue, onOk, onCancel }: JoblogModalProps) {
	const { t } = useTranslation();
	const form = useForm<JobLog>({
		defaultValues: formValue,
	});

	useEffect(() => {
		form.reset(formValue);
	}, [formValue, form]);

	const getStatusBadge = (status: string) => {
		if (status === "0") {
			return { variant: "default" as const, text: "成功", color: "bg-green-500" };
		}
		return { variant: "destructive" as const, text: "失败", color: "bg-red-500" };
	};

	const formatExecutionTime = (times: number) => {
		if (times < 1000) {
			return `${times}ms`;
		}
		return `${(times / 1000).toFixed(2)}s`;
	};

	return (
		<Dialog open={show} onOpenChange={(open) => !open && onCancel()}>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<div className="space-y-6">
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="beanName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Bean名称</FormLabel>
										<FormControl>
											<div className="flex items-center gap-2">
												<Icon icon="mdi:bean" size={16} className="text-gray-500" />
												<Input {...field} disabled />
											</div>
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="methodName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>方法名称</FormLabel>
										<FormControl>
											<div className="flex items-center gap-2">
												<Icon icon="mdi:function" size={16} className="text-gray-500" />
												<Input {...field} disabled />
											</div>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-1 gap-4">
							<FormField
								control={form.control}
								name="params"
								render={({ field }) => (
									<FormItem>
										<FormLabel>参数</FormLabel>
										<FormControl>
											<Input {...field} disabled className="font-mono" />
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="times"
								render={({ field }) => (
									<FormItem>
										<FormLabel>执行耗时</FormLabel>
										<FormControl>
											<div className="flex items-center gap-2">
												<Icon icon="mdi:timer" size={16} className="text-gray-500" />
												<Input 
													{...field} 
													value={formatExecutionTime(field.value)} 
													disabled 
												/>
											</div>
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>执行结果</FormLabel>
										<FormControl>
											<div className="flex items-center gap-2">
												{(() => {
													const statusInfo = getStatusBadge(field.value);
													return (
														<Badge 
															variant={statusInfo.variant} 
															className="flex items-center gap-1 dark:bg-white dark:text-black"
														>
															<div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
															{statusInfo.text}
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

						<div className="grid grid-cols-1 gap-4">
							<FormField
								control={form.control}
								name="error"
								render={({ field }) => (
									<FormItem>
										<FormLabel>异常信息</FormLabel>
										<FormControl>
											<div className="relative">
												{field.value && (
													<div className="absolute left-3 top-1/2 transform -translate-y-1/2">
														<Icon icon="mdi:alert-circle" size={16} className="text-red-500" />
													</div>
												)}
												<Input 
													{...field} 
													disabled 
													className={`pl-8 font-mono ${field.value ? "text-red-500" : ""}`}
													placeholder="无异常" 
												/>
											</div>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-1 gap-4">
							<FormField
								control={form.control}
								name="createTime"
								render={({ field }) => (
									<FormItem>
										<FormLabel>执行时间</FormLabel>
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

						<div className="flex justify-end space-x-2">
							<Button variant="outline" onClick={onCancel}>
								关闭
							</Button>
						</div>
					</div>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
