import packageJson from "../package.json";
import i18n from "./locales/i18n";

/**
 * Global application configuration type definition
 */
export type GlobalConfig = {
	/** Application version number */
	appVersion: string;
	/** Default route path for the application */
	defaultRoute: string;
	/** Public path for static assets */
	publicPath: string;
	/** Base URL for API endpoints */
	apiBaseUrl: string;
	/** Cloud deployment flag */
	isCloud: boolean;
};

/**
 * Get application name based on current locale
 */
export function getAppName(): string {
	return i18n.language === "en_US" ? "NiteMoon AI Platform" : "夜月AI应用平台";
}

/**
 * Global configuration constants
 * Reads configuration from environment variables and package.json
 *
 * @warning
 * Please don't use the import.meta.env to get the configuration, use the GLOBAL_CONFIG instead
 */
export const GLOBAL_CONFIG: GlobalConfig = {
	appVersion: packageJson.version,
	defaultRoute: import.meta.env.VITE_APP_DEFAULT_ROUTE || "/workbench",
	publicPath: import.meta.env.VITE_APP_PUBLIC_PATH || "/",
	apiBaseUrl: import.meta.env.VITE_APP_API_BASE_URL || "/api",
	isCloud: import.meta.env.VITE_IS_CLOUD === "true",
};
