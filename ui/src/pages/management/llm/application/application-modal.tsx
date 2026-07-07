import { useState, useEffect, useRef } from "react";
import { Icon } from "@/components/icon";
import { AppImage } from "@/components/app-image";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/ui/dialog";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { createApplicationApi, updateApplicationApi, type LlmApplication } from "@/api/services/llmApplicationService";
import { uploadFile } from "@/api/services/systemFileService";

interface ApplicationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	application?: LlmApplication | null;
	onSuccess: () => void;
}

export function ApplicationModal({ open, onOpenChange, application, onSuccess }: ApplicationModalProps) {
	const { t } = useTranslation();
	const [formData, setFormData] = useState<LlmApplication>({
		name: "",
		des: "",
		cover: "",
		enableMemory: false,
		memoryWindowSize: 20,
	});
	const [loading, setLoading] = useState(false);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (open) {
			if (application) {
				setFormData({
					id: application.id,
					name: application.name || "",
					des: application.des || "",
					cover: application.cover || "",
					enableMemory: application.enableMemory ?? false,
					memoryWindowSize: application.memoryWindowSize ?? 20,
				});
			} else {
				setFormData({
					name: "",
					des: "",
					cover: "",
					enableMemory: false,
					memoryWindowSize: 20,
				});
			}
		}
	}, [open, application]);

	const handleInputChange = (field: keyof LlmApplication, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	// 处理文件上传
	const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			toast.error(t('llm.applicationModal.invalidImageType'));
			return;
		}

		const maxSize = 5 * 1024 * 1024;
		if (file.size > maxSize) {
			toast.error(t('llm.applicationModal.imageTooLarge'));
			return;
		}

		const uploadFormData = new FormData();
		uploadFormData.append('file', file);

		try {
			setUploading(true);
			const response = await uploadFile(uploadFormData);

			const coverUrl = typeof response === 'string' ? response : response?.data || '';
			if (coverUrl) {
				setFormData((prev) => ({
					...prev,
					cover: coverUrl,
				}));
				toast.success(t('llm.applicationModal.coverUploadSuccess'));
			} else {
				toast.error(t('llm.applicationModal.coverUploadNoUrl'));
			}
		} catch (error) {
			console.error("封面上传失败:", error);
			toast.error(t('llm.applicationModal.coverUploadFailed'));
		} finally {
			setUploading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		}
	};

	const handleSubmit = async () => {
		if (!formData.name?.trim()) {
			toast.error(t('llm.applicationModal.nameRequired'));
			return;
		}

		try {
			setLoading(true);

			if (application?.id) {
				await updateApplicationApi(formData);
				toast.success(t('llm.applicationModal.updateSuccess'));
			} else {
				await createApplicationApi(formData);
				toast.success(t('llm.applicationModal.addSuccess'));
			}

			onSuccess();
		} catch (error) {
			console.error("保存应用失败:", error);
			toast.error(t('llm.applicationModal.saveFailed'));
		} finally {
			setLoading(false);
		}
	};

	const handleClose = () => {
		if (!loading && !uploading) {
			onOpenChange(false);
		}
	};

	const triggerFileSelect = () => {
		fileInputRef.current?.click();
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>{application?.id ? t('llm.applicationModal.editTitle') : t('llm.applicationModal.addTitle')}</DialogTitle>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="name">{t('llm.applicationModal.name')} *</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) => handleInputChange("name", e.target.value)}
							placeholder={t('llm.applicationModal.namePlaceholder')}
							disabled={loading || uploading}
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="des">{t('llm.applicationModal.description')}</Label>
						<Textarea
							id="des"
							value={formData.des}
							onChange={(e) => handleInputChange("des", e.target.value)}
							placeholder={t('llm.applicationModal.descPlaceholder')}
							rows={4}
							disabled={loading || uploading}
						/>
					</div>

					<div className="grid gap-2">
						<Label htmlFor="cover">{t('llm.applicationModal.cover')}</Label>
						<div className="flex items-center gap-2">
							<Input
								id="cover"
								value={formData.cover}
								onChange={(e) => handleInputChange("cover", e.target.value)}
								placeholder={t('llm.applicationModal.coverPlaceholder')}
								disabled={loading || uploading}
								className="flex-1"
							/>
							<Button
								type="button"
								variant="outline"
								onClick={triggerFileSelect}
								disabled={loading || uploading}
								className="shrink-0"
							>
								{uploading ? (
									<>
										<Icon icon="mdi:loading" className="mr-2 h-4 w-4 animate-spin" />
										{t('llm.applicationModal.uploading')}
									</>
								) : (
									<>
										<Icon icon="mdi:upload" size={16} className="mr-2" />
										{t('llm.applicationModal.upload')}
									</>
								)}
							</Button>
							{formData.cover && (
								<div className="w-10 h-10 border rounded overflow-hidden flex-shrink-0">
									<AppImage
										src={formData.cover}
										alt={t('llm.applicationModal.coverPreview')}
										className="w-full h-full object-cover"
										showLoading={false}
									/>
								</div>
							)}
						</div>
						<input
							ref={fileInputRef}
							type="file"
							accept=".jpg,.jpeg,.png,.gif,.bmp,.webp"
							onChange={handleFileUpload}
							className="hidden"
						/>
					</div>

					{/* 记忆配置 */}
					<div className="grid gap-3 rounded-lg border p-4">
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>{t('llm.applicationModal.memory')}</Label>
								<p className="text-xs text-muted-foreground">
									{t('llm.applicationModal.memoryDesc')}
								</p>
							</div>
							<Switch
								checked={formData.enableMemory ?? false}
								onCheckedChange={(checked) =>
									setFormData((prev) => ({
										...prev,
										enableMemory: checked,
									}))
								}
								disabled={loading || uploading}
							/>
						</div>

						{formData.enableMemory && (
							<div className="grid gap-2">
								<Label htmlFor="memoryWindowSize">{t('llm.applicationModal.memoryWindowSize')}</Label>
								<div className="flex items-center gap-2">
									<Input
										id="memoryWindowSize"
										type="number"
										min={1}
										max={100}
										value={formData.memoryWindowSize ?? 20}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												memoryWindowSize: parseInt(e.target.value) || 20,
											}))
										}
										disabled={loading || uploading}
										className="w-24"
									/>
									<span className="text-sm text-muted-foreground">{t('llm.applicationModal.messages')}</span>
								</div>
								<p className="text-xs text-muted-foreground">
									{t('llm.applicationModal.memoryHint')}
								</p>
							</div>
						)}
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleClose} disabled={loading || uploading}>
						{t('llm.applicationModal.cancel')}
					</Button>
					<Button onClick={handleSubmit} disabled={loading || uploading}>
						{loading ? (
							<>
								<Icon icon="mdi:loading" className="mr-2 h-4 w-4 animate-spin" />
								{t('llm.applicationModal.saving')}
							</>
						) : (
							<>
								<Icon icon="mdi:check" className="mr-2 h-4 w-4" />
								{application?.id ? t('llm.applicationModal.update') : t('llm.applicationModal.add')}
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
