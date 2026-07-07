import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { uploadFile, type SystemFile } from "@/api/services/systemFileService";

export interface FileModalProps {
	title: string;
	show: boolean;
	onOk: VoidFunction;
	onCancel: VoidFunction;
}

interface FileFormData {
	file: FileList;
}

export function FileModal({ title, show, onOk, onCancel }: FileModalProps) {
	const { t } = useTranslation();
	const form = useForm<FileFormData>();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);
	const [fileName, setFileName] = useState<string>("");

	const handleSubmit = async (values: FileFormData) => {
		if (!values.file || values.file.length === 0) {
			toast.error(t('oss.file.selectFile'));
			return;
		}

		const formData = new FormData();
		formData.append('file', values.file[0]);

		try {
			setUploading(true);
			await uploadFile(formData);
			toast.success(t('oss.file.uploadSuccess'));
			form.reset();
			setFileName("");
			onOk();
		} catch (error) {
			console.error("Failed to upload file:", error);
			toast.error(t('oss.file.uploadFailed'));
		} finally {
			setUploading(false);
		}
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (files && files.length > 0) {
			form.setValue('file', files);
			setFileName(files[0].name);
		}
	};

	const handleChooseFile = () => {
		fileInputRef.current?.click();
	};

	const handleCancel = () => {
		form.reset();
		setFileName("");
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
		onCancel();
	};

	return (
		<Dialog open={show} onOpenChange={(open) => !open && handleCancel()}>
			<DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="file"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('oss.file.selectFileLabel')} *</FormLabel>
									<FormControl>
										<div className="flex items-center gap-2">
											<input
												ref={fileInputRef}
												type="file"
												onChange={handleFileChange}
												className="hidden"
											/>
											<Button type="button" variant="outline" onClick={handleChooseFile}>
												{t('oss.file.selectFileLabel')}
											</Button>
											<span className="text-sm text-muted-foreground truncate">
												{fileName || t('oss.file.noFileChosen')}
											</span>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end space-x-2">
							<Button type="button" variant="outline" onClick={handleCancel}>
								{t('common.cancel')}
							</Button>
							<Button type="submit" disabled={uploading}>
								{uploading ? t('oss.file.uploading') : t('common.confirm')}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
