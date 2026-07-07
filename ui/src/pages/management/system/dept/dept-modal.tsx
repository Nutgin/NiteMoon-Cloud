import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { queryDept, addDept, updateDept, type SystemDept } from "@/api/services/systemDeptService";

interface DeptFormData {
	deptName: string;
	parentId: string | null;
}

interface DeptTreeNode {
	key: string;
	title: string;
	children: DeptTreeNode[];
	deptData: SystemDept;
}

const buildDeptTree = (depts: SystemDept[]): DeptTreeNode[] => {
	if (!depts || !depts.length) return [];

	const handle = (parentId: any): DeptTreeNode[] => {
		const arr: DeptTreeNode[] = [];
		depts.forEach((item) => {
			if (item.parentId === parentId) {
				const children = handle(item.deptId);
				const curr: DeptTreeNode = {
					key: item.deptId || '',
					title: item.deptName,
					children,
					deptData: item,
				};
				arr.push(curr);
			}
		});
		return arr;
	};

	return handle('0');
};

export type DeptModalProps = {
	formValue: SystemDept;
	title: string;
	show: boolean;
	onOk: VoidFunction;
	onCancel: VoidFunction;
};

export function DeptModal({ title, show, formValue, onOk, onCancel }: DeptModalProps) {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [deptOptions, setDeptOptions] = useState<DeptTreeNode[]>([]);

	const form = useForm<DeptFormData>({
		defaultValues: {
			deptName: formValue.deptName || "",
			parentId: formValue.parentId || null,
		},
	});

	useEffect(() => {
		form.reset({
			deptName: formValue.deptName || "",
			parentId: formValue.parentId || null,
		});
	}, [formValue, form]);

	useEffect(() => {
		loadDeptOptions();
	}, []);

	const loadDeptOptions = async () => {
		try {
			const response = await queryDept();
			const deptData = response || [];
			if (deptData.length > 0) {
				const builtTreeData = buildDeptTree(deptData);
				setDeptOptions(builtTreeData);
			}
		} catch (error) {
			console.error("Failed to load department options:", error);
		}
	};

	const handleSubmit = async (data: DeptFormData) => {
		try {
			setLoading(true);
			const deptData: SystemDept = {
				deptId: formValue.deptId,
				...data,
			};

			if (formValue.deptId) {
				await updateDept(deptData);
				toast.success(t('system.dept.editSuccess'));
			} else {
				await addDept(deptData);
				toast.success(t('system.dept.addSuccess'));
			}

			onOk();
		} catch (error) {
			console.error("Failed to save department:", error);
			toast.error(formValue.deptId ? t('system.dept.deleteFailed') : t('system.dept.addSuccess'));
		} finally {
			setLoading(false);
		}
	};

	const renderDeptOptions = (treeNodes: DeptTreeNode[], level = 0): JSX.Element[] => {
		return treeNodes.map(node => (
			<option key={node.key} value={node.key}>
				{'  '.repeat(level) + node.title}
			</option>
		)).concat(
			treeNodes.flatMap(node =>
				node.children && node.children.length > 0
					? renderDeptOptions(node.children, level + 1)
					: []
			)
		);
	};

	return (
		<Dialog open={show} onOpenChange={(open) => !open && onCancel()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="deptName"
							rules={{ required: t('system.dept.pleaseInputDeptName') }}
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('system.dept.name')}</FormLabel>
									<FormControl>
										<Input placeholder={t('system.dept.pleaseInputDeptName')} {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="parentId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t('system.dept.parentDept')}</FormLabel>
									<FormControl>
										<select
											className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
											{...field}
											value={field.value || ""}
											onChange={(e) => field.onChange(e.target.value || null)}
										>
											<option value="">{t('system.dept.pleaseSelectParentDept')}</option>
											{renderDeptOptions(deptOptions)}
										</select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button variant="outline" onClick={onCancel} disabled={loading}>
								{t('system.dept.cancel')}
							</Button>
							<Button type="submit" disabled={loading}>
								{loading ? t('system.dept.saving') : t('system.dept.save')}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
