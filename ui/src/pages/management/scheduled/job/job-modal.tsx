import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { type Job } from "@/api/services/systemJobService";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const jobSchema = z.object({
	jobId: z.string().optional(),
	beanName: z.string().min(1, "请输入bean名称"),
	methodName: z.string().min(1, "请输入方法名称"),
	params: z.string().optional(),
	cronExpression: z.string().min(1, "请输入cron表达式"),
	status: z.string().optional(),
	remark: z.string().optional(),
});

export type JobModalProps = {
	formValue: Job;
	title: string;
	show: boolean;
	onOk: (values: Job) => void;
	onCancel: VoidFunction;
};

export function JobModal({ title, show, formValue, onOk, onCancel }: JobModalProps) {
	const { t } = useTranslation();
	const form = useForm<Job>({
		resolver: zodResolver(jobSchema),
		defaultValues: formValue,
	});

	useEffect(() => {
		if (show) {
			form.reset(formValue);
		}
	}, [formValue, form, show]);

	const handleSubmit = (values: Job) => {
		onOk(values);
	};

	return (
		<Dialog open={show} onOpenChange={(open) => !open && onCancel()}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
						{/* 隐藏的jobId字段 */}
						<FormField
							control={form.control}
							name="jobId"
							render={({ field }) => (
								<input type="hidden" {...field} />
							)}
						/>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="beanName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Bean名称 *</FormLabel>
										<FormControl>
											<Input placeholder="请输入bean名称" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="methodName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>方法名称 *</FormLabel>
										<FormControl>
											<Input placeholder="请输入方法名称" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="params"
								render={({ field }) => (
									<FormItem>
										<FormLabel>参数</FormLabel>
										<FormControl>
											<Input placeholder="请输入参数" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="cronExpression"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Cron表达式 *</FormLabel>
										<FormControl>
											<Input placeholder="请输入cron表达式" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{formValue.jobId && (
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="status"
									render={({ field }) => (
										<FormItem>
											<FormLabel>状态</FormLabel>
											<Select onValueChange={field.onChange} value={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="请选择状态" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="0">运行</SelectItem>
													<SelectItem value="1">暂停</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div />
							</div>
						)}

						<FormField
							control={form.control}
							name="remark"
							render={({ field }) => (
								<FormItem>
									<FormLabel>备注</FormLabel>
									<FormControl>
										<Input placeholder="请输入备注" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end space-x-2">
							<Button type="button" variant="outline" onClick={onCancel}>
								取消
							</Button>
							<Button type="submit">
								确定
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
