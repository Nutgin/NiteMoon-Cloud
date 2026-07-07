import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { useTranslation } from "react-i18next";
import type { TokenMessage } from "./types";

interface TokenModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	token: TokenMessage | null;
}

export function TokenModal({ open, onOpenChange, token }: TokenModalProps) {
	const { t } = useTranslation();
	if (!token) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t('llm.tokenModal.title')}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="text-sm font-medium text-muted-foreground">{t('llm.tokenModal.username')}</label>
							<p className="mt-1">{token.username}</p>
						</div>
						<div>
							<label className="text-sm font-medium text-muted-foreground">{t('llm.tokenModal.model')}</label>
							<p className="mt-1">{token.modelName}</p>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-4">
						<div>
							<label className="text-sm font-medium text-muted-foreground">{t('llm.tokenModal.totalTokens')}</label>
							<p className="mt-1">
								<Badge variant="secondary">{((token.promptTokens || 0) + (token.completionTokens || 0)).toLocaleString()}</Badge>
							</p>
						</div>
						<div>
							<label className="text-sm font-medium text-muted-foreground">Prompt Tokens</label>
							<p className="mt-1">{(token.promptTokens || 0).toLocaleString()}</p>
						</div>
						<div>
							<label className="text-sm font-medium text-muted-foreground">Completion Tokens</label>
							<p className="mt-1">{(token.completionTokens || 0).toLocaleString()}</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="text-sm font-medium text-muted-foreground">{t('llm.tokenModal.ipAddress')}</label>
							<p className="mt-1">{token.ip}</p>
						</div>
						<div>
							<label className="text-sm font-medium text-muted-foreground">{t('llm.tokenModal.callTime')}</label>
							<p className="mt-1">{token.createTime}</p>
						</div>
					</div>

					<div className="flex justify-end pt-4">
						<Button onClick={() => onOpenChange(false)}>{t('llm.tokenModal.close')}</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
