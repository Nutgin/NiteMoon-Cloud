export interface HistoryModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
	children?: React.ReactNode;
}

export interface ConversationDetailModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	conversation?: any;
}

export interface MessageSearchForm {
	text?: string;
	username?: string;
	role?: string;
}

export interface ConversationSearchForm {
	text?: string;
	username?: string;
}
