import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { RadioGroup, RadioGroupItem } from "@/ui/radio-group";
import { Textarea } from "@/ui/textarea";
import { Label } from "@/ui/label";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { addConfig, updateConfig, type SystemFileConfig, type FileConfigDetail } from "@/api/services/systemFileConfigService";

export interface ConfigModalProps {
	title: string;
	show: boolean;
	isEdit: boolean;
	isDetail: boolean;
	config: SystemFileConfig | null;
	onOk: VoidFunction;
	onCancel: VoidFunction;
}

interface ConfigFormData {
	name: string;
	storage: string;
	domain: string;
	basePath: string;
	host: string;
	port: string;
	username: string;
	password: string;
	mode: string;
	endpoint: string;
	bucket: string;
	accessKey: string;
	accessSecret: string;
	enablePathStyleAccess: string;
	privateBucket: string;
	backendDomain: string;
	remark: string;
}

export function ConfigModal({ title, show, isEdit, isDetail, config, onOk, onCancel }: ConfigModalProps) {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const form = useForm<ConfigFormData>({
		defaultValues: {
			name: "",
			storage: "",
			domain: "",
			basePath: "",
			host: "",
			port: "",
			username: "",
			password: "",
			mode: "Active",
			endpoint: "",
			bucket: "",
			accessKey: "",
			accessSecret: "",
			enablePathStyleAccess: "false",
			privateBucket: "false",
			backendDomain: "",
			remark: "",
		},
	});

	useEffect(() => {
		if (show) {
			if (config && isEdit) {
				// 编辑模式，填充表单数据
				const configDetail = config.config || {};
				form.reset({
					name: config.name || "",
					storage: config.storage?.toString() || "",
					domain: configDetail.domain || "",
					basePath: configDetail.basePath || "",
					host: configDetail.host || "",
					port: configDetail.port || "",
					username: configDetail.username || "",
					password: configDetail.password || "",
					mode: configDetail.mode || "Active",
					endpoint: configDetail.endpoint || "",
					bucket: configDetail.bucket || "",
					accessKey: configDetail.accessKey || "",
					accessSecret: configDetail.accessSecret || "",
					enablePathStyleAccess: configDetail.enablePathStyleAccess || "false",
					privateBucket: configDetail.privateBucket || "false",
					backendDomain: configDetail.backendDomain || "",
					remark: config.remark || "",
				});
			} else {
				// 新增模式，重置表单
				form.reset({
					name: "",
					storage: "",
					domain: "",
					basePath: "",
					host: "",
					port: "",
					username: "",
					password: "",
					mode: "Active",
					endpoint: "",
					bucket: "",
					accessKey: "",
					accessSecret: "",
					enablePathStyleAccess: "false",
					privateBucket: "false",
					backendDomain: "",
					remark: "",
				});
			}
		}
	}, [show, config, isEdit, form]);

	const handleSubmit = async (values: ConfigFormData) => {
		try {
			setLoading(true);
			
			// 构建配置对象
			const configDetail: FileConfigDetail = {
				domain: values.domain,
				basePath: values.basePath,
				host: values.host,
				port: values.port,
				username: values.username,
				password: values.password,
				mode: values.mode,
				endpoint: values.endpoint,
				bucket: values.bucket,
				accessKey: values.accessKey,
				accessSecret: values.accessSecret,
				enablePathStyleAccess: values.enablePathStyleAccess,
				privateBucket: values.privateBucket,
				backendDomain: values.backendDomain,
			};

			const requestData: Partial<SystemFileConfig> = {
				name: values.name,
				storage: Number(values.storage),
				config: configDetail,
				remark: values.remark,
			};

			if (isEdit && config) {
				requestData.id = config.id;
				await updateConfig(requestData);
				toast.success(t('oss.configModal.updateSuccess'));
			} else {
				await addConfig(requestData);
				toast.success(t('oss.configModal.addSuccess'));
			}

			form.reset();
			onOk();
		} catch (error) {
			console.error("Failed to save config:", error);
			toast.error(isEdit ? t('oss.configModal.updateFailed') : t('oss.configModal.addFailed'));
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		form.reset();
		onCancel();
	};

	const storageValue = form.watch("storage");

	// 判断是否显示本地磁盘相关字段
	const showLocalFields = [10, 11, 12].includes(Number(storageValue));
	// 判断是否显示FTP/SFTP相关字段
	const showFtpFields = [11, 12].includes(Number(storageValue));
	// 判断是否显示S3相关字段
	const showS3Fields = [20].includes(Number(storageValue));

	return (
		<Dialog open={show} onOpenChange={(open) => !open && handleCancel()}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="name"
								rules={{ required: "请输入配置名称" }}
								render={({ field }) => (
									<FormItem>
										<FormLabel>配置名称 *</FormLabel>
										<FormControl>
											<Input placeholder="请输入配置名称" {...field} disabled={isDetail} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="storage"
								rules={{ required: "请选择存储器" }}
								render={({ field }) => (
									<FormItem>
										<FormLabel>存储器 *</FormLabel>
										<Select onValueChange={field.onChange} value={field.value} disabled={isDetail}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="请选择存储器" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="10">本地磁盘</SelectItem>
												<SelectItem value="11">FTP 服务器</SelectItem>
												<SelectItem value="12">SFTP 服务器</SelectItem>
												<SelectItem value="20">S3 对象存储</SelectItem>
												<SelectItem value="30">HDFS 存储</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* 本地磁盘 / FTP / SFTP 字段 */}
						{showLocalFields && (
							<FormField
								control={form.control}
								name="basePath"
								rules={{ required: "请输入根路径" }}
								render={({ field }) => (
									<FormItem>
										<FormLabel>根路径 *</FormLabel>
										<FormControl>
											<Input placeholder="请输入根路径" {...field} disabled={isDetail} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{/* FTP / SFTP 字段 */}
						{showFtpFields && (
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="host"
									rules={{ required: "请输入主机地址" }}
									render={({ field }) => (
										<FormItem>
											<FormLabel>主机地址 *</FormLabel>
											<FormControl>
												<Input placeholder="请输入主机地址" {...field} disabled={isDetail} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="port"
									rules={{ required: "请输入主机端口" }}
									render={({ field }) => (
										<FormItem>
											<FormLabel>主机端口 *</FormLabel>
											<FormControl>
												<Input placeholder="请输入主机端口" {...field} disabled={isDetail} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						)}

						{showFtpFields && (
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="username"
									rules={{ required: "请输入用户名" }}
									render={({ field }) => (
										<FormItem>
											<FormLabel>用户名 *</FormLabel>
											<FormControl>
												<Input placeholder="请输入用户名" {...field} disabled={isDetail} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="password"
									rules={{ required: "请输入密码" }}
									render={({ field }) => (
										<FormItem>
											<FormLabel>密码 *</FormLabel>
											<FormControl>
												<Input type="password" placeholder="请输入密码" {...field} disabled={isDetail} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						)}

						{storageValue === "11" && (
							<FormField
								control={form.control}
								name="mode"
								render={({ field }) => (
									<FormItem>
										<FormLabel>连接模式</FormLabel>
										<FormControl>
											<RadioGroup
												onValueChange={field.onChange}
												value={field.value}
												disabled={isDetail}
												className="flex flex-row space-x-4"
											>
												<div className="flex items-center space-x-2">
													<RadioGroupItem value="Active" id="active" />
													<Label htmlFor="active">主动模式</Label>
												</div>
												<div className="flex items-center space-x-2">
													<RadioGroupItem value="Passive" id="passive" />
													<Label htmlFor="passive">被动模式</Label>
												</div>
											</RadioGroup>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{/* S3 字段 */}
						{showS3Fields && (
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="endpoint"
									rules={{ required: "请输入节点地址" }}
									render={({ field }) => (
										<FormItem>
											<FormLabel>节点地址 *</FormLabel>
											<FormControl>
												<Input placeholder="请输入节点地址" {...field} disabled={isDetail} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="bucket"
									rules={{ required: "请输入存储 bucket" }}
									render={({ field }) => (
										<FormItem>
											<FormLabel>存储 bucket *</FormLabel>
											<FormControl>
												<Input placeholder="请输入存储 bucket" {...field} disabled={isDetail} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						)}

						{showS3Fields && (
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="accessKey"
									rules={{ required: "请输入 accessKey" }}
									render={({ field }) => (
										<FormItem>
											<FormLabel>AccessKey *</FormLabel>
											<FormControl>
												<Input placeholder="请输入 accessKey" {...field} disabled={isDetail} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="accessSecret"
									rules={{ required: "请输入 accessSecret" }}
									render={({ field }) => (
										<FormItem>
											<FormLabel>AccessSecret *</FormLabel>
											<FormControl>
												<Input type="password" placeholder="请输入 accessSecret" {...field} disabled={isDetail} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						)}

						{showS3Fields && (
							<FormField
								control={form.control}
								name="enablePathStyleAccess"
								render={({ field }) => (
									<FormItem>
										<FormLabel>是否 Path Style</FormLabel>
										<FormControl>
											<RadioGroup
												onValueChange={field.onChange}
												value={field.value}
												disabled={isDetail}
												className="flex flex-row space-x-4"
											>
												<div className="flex items-center space-x-2">
													<RadioGroupItem value="true" id="enable" />
													<Label htmlFor="enable">启用</Label>
												</div>
												<div className="flex items-center space-x-2">
													<RadioGroupItem value="false" id="disable" />
													<Label htmlFor="disable">禁用</Label>
												</div>
											</RadioGroup>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{showS3Fields && (
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="privateBucket"
									render={({ field }) => (
										<FormItem>
											<FormLabel>是否私有 Bucket</FormLabel>
											<FormControl>
												<RadioGroup
													onValueChange={field.onChange}
													value={field.value}
													disabled={isDetail}
													className="flex flex-row space-x-4"
												>
													<div className="flex items-center space-x-2">
														<RadioGroupItem value="true" id="private-true" />
														<Label htmlFor="private-true">私有（通过后端代理访问）</Label>
													</div>
													<div className="flex items-center space-x-2">
														<RadioGroupItem value="false" id="private-false" />
														<Label htmlFor="private-false">公开（通过域名直接访问）</Label>
													</div>
												</RadioGroup>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								{form.watch("privateBucket") === "true" && (
									<FormField
										control={form.control}
										name="backendDomain"
										render={({ field }) => (
											<FormItem>
												<FormLabel>后端代理域名</FormLabel>
												<FormControl>
													<Input placeholder="如 https://platform.nitemoon.cn/api" {...field} disabled={isDetail} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
							</div>
						)}

						{/* 通用字段 */}
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="domain"
								render={({ field }) => (
									<FormItem>
										<FormLabel>域名</FormLabel>
										<FormControl>
											<Input placeholder="请输入域名" {...field} disabled={isDetail} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="remark"
							render={({ field }) => (
								<FormItem>
									<FormLabel>备注</FormLabel>
									<FormControl>
										<Textarea placeholder="请输入备注" {...field} disabled={isDetail} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{!isDetail && (
							<div className="flex justify-end space-x-2">
								<Button type="button" variant="outline" onClick={handleCancel}>
									取消
								</Button>
								<Button type="submit" disabled={loading}>
									{loading ? "保存中..." : (isEdit ? "更新" : "新增")}
								</Button>
							</div>
						)}

						{isDetail && (
							<div className="flex justify-end space-x-2">
								<Button type="button" onClick={handleCancel}>
									关闭
								</Button>
							</div>
						)}
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
