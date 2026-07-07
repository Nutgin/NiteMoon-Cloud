import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/ui/form";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { type CacheKey } from "@/api/services/systemCacheService";

export type CacheModalProps = {
	formValue: CacheKey;
	title: string;
	show: boolean;
	onOk: VoidFunction;
	onCancel: VoidFunction;
};

export function CacheModal({ title, show, formValue, onOk, onCancel }: CacheModalProps) {
	const { t } = useTranslation();
	const form = useForm<CacheKey>({
		defaultValues: formValue,
	});

	useEffect(() => {
		form.reset(formValue);
	}, [formValue, form]);

	const formatSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
		if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
		return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
	};

	const formatTTL = (ttl: number) => {
		if (ttl === -1) return t('monitor.cache.neverExpire');
		if (ttl === -2) return t('monitor.cache.expired');
		return t('monitor.cache.ttlSeconds', { ttl });
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
								name="key"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.cache.keyName')}</FormLabel>
										<FormControl>
											<Input {...field} disabled />
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.cache.type')}</FormLabel>
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
								name="size"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.cache.size')}</FormLabel>
										<FormControl>
											<Input {...field} value={formatSize(field.value)} disabled />
										</FormControl>
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="ttl"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('monitor.cache.expireTime')}</FormLabel>
										<FormControl>
											<Input {...field} value={formatTTL(field.value)} disabled />
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
