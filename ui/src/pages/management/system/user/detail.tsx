import { useParams, useRouter } from "@/routes/hooks";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { addUser, updateUser, queryUser, type SystemUser } from "@/api/services/systemUserService";

interface UserFormData {
	realName: string;
	username: string;
	password: string;
	sex: string;
	mobile: string;
	email: string;
	status: string;
}

export default function UserDetail() {
	const { t } = useTranslation();
	const { id } = useParams<{ id?: string }>();
	const { push } = useRouter();
	const [loading, setLoading] = useState(false);
	const [isEdit, setIsEdit] = useState(false);

	const form = useForm<UserFormData>({
		defaultValues: {
			realName: "",
			username: "",
			password: "999888",
			sex: "1",
			mobile: "",
			email: "",
			status: "1",
		},
	});

	const loadUser = async (userId: string) => {
		try {
			setLoading(true);
			const response = await queryUser({ pageNum: 1, pageSize: 1 });
			const user = response.rows.find(u => u.userId === userId);
			if (user) {
				form.reset({
					realName: user.realName,
					username: user.username,
					password: "",
					sex: user.sex,
					mobile: user.mobile,
					email: user.email,
					status: user.status,
				});
			}
		} catch (error) {
			console.error("Failed to load user:", error);
			toast.error(t('system.user.loadUserInfoFailed'));
		} finally {
			setLoading(false);
		}
	};

	const onSubmit = async (data: UserFormData) => {
		try {
			setLoading(true);
			const userData: SystemUser = {
				userId: isEdit ? id : null,
				...data,
				deptId: null,
				roleIds: [],
			};

			if (isEdit) {
				await updateUser(userData);
				toast.success(t('system.user.editSuccess'));
			} else {
				await addUser(userData);
				toast.success(t('system.user.addSuccess'));
			}

			push("/management/system/user");
		} catch (error) {
			console.error("Failed to save user:", error);
			toast.error(isEdit ? t('system.user.editFailed') : t('system.user.addFailed'));
		} finally {
			setLoading(false);
		}
	};

	const handleBack = () => {
		push("/management/system/user");
	};

	useEffect(() => {
		if (id && id !== "add") {
			setIsEdit(true);
			loadUser(id);
		} else {
			setIsEdit(false);
			form.reset({
				realName: "",
				username: "",
				password: "999888",
				sex: "1",
				mobile: "",
				email: "",
				status: "1",
			});
		}
	}, [id]);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>{isEdit ? t('system.user.edit') : t('system.user.add')}</div>
					<Button variant="outline" onClick={handleBack}>
						{t('system.user.back')}
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="realName"
								rules={{ required: t('system.user.pleaseInputName') }}
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('system.user.name')}</FormLabel>
										<FormControl>
											<Input placeholder={t('system.user.pleaseInputName')} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="username"
								rules={{
									required: t('system.user.pleaseInputUsername'),
									disabled: isEdit,
								}}
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('system.user.username')}</FormLabel>
										<FormControl>
											<Input
												placeholder={t('system.user.pleaseInputUsername')}
												{...field}
												disabled={isEdit}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="password"
								rules={{
									required: !isEdit ? t('system.user.pleaseInputPassword') : false,
								}}
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('system.user.password')}</FormLabel>
										<FormControl>
											<Input
												type="password"
												placeholder={t('system.user.pleaseInputPassword')}
												{...field}
												disabled={isEdit}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="sex"
								rules={{ required: t('system.user.pleaseSelectSex') }}
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('system.user.sex')}</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={t('system.user.pleaseSelectSex')} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="0">{t('system.user.female')}</SelectItem>
												<SelectItem value="1">{t('system.user.male')}</SelectItem>
												<SelectItem value="2">{t('system.user.unknown')}</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="mobile"
								rules={{
									required: t('system.user.pleaseInputPhone'),
									pattern: {
										value: /^1[3456789]\d{9}$/,
										message: t('system.user.phoneFormatError')
									}
								}}
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('system.user.phone')}</FormLabel>
										<FormControl>
											<Input placeholder={t('system.user.pleaseInputPhone')} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="email"
								rules={{
									required: t('system.user.pleaseInputEmail'),
									pattern: {
										value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
										message: t('system.user.emailFormatError')
									}
								}}
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('system.user.email')}</FormLabel>
										<FormControl>
											<Input placeholder={t('system.user.pleaseInputEmail')} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="status"
								rules={{ required: t('system.user.pleaseSelectStatus') }}
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('system.user.status')}</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={t('system.user.pleaseSelectStatus')} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="0">{t('system.user.disable')}</SelectItem>
												<SelectItem value="1">{t('system.user.enable')}</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="flex justify-end space-x-2">
							<Button type="button" variant="outline" onClick={handleBack}>
								{t('system.user.cancel')}
							</Button>
							<Button type="submit" disabled={loading}>
								{loading ? t('system.user.saving') : (isEdit ? t('system.user.update') : t('system.user.add'))}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
