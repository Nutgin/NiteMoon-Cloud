import apiClient from "../apiClient";

export interface ServerInfo {
	cpu: {
		used: number;
		cpuNum: number;
		sys: number;
		free: number;
	};
	mem: {
		usage: number;
		total: number;
		used: number;
		free: number;
	};
	sys: {
		computerName: string;
		osName: string;
		computerIp: string;
		osArch: string;
		userDir: string;
	};
	jvm: {
		name: string;
		version: string;
		startTime: string;
		runTime: string;
		home: string;
	};
	sysFiles: SysFile[];
}

export interface SysFile {
	dirName: string;
	typeName: string;
	total: string | number; // 支持字符串或数字类型
	free: string | number;  // 支持字符串或数字类型
	used: string | number;  // 支持字符串或数字类型
	usage: number;
}

const SystemServerApi = {
	Server: "/system/server",
};

// 获取服务器信息
export const getServerInfo = () => {
	return apiClient.get<ServerInfo>({
		url: SystemServerApi.Server,
	});
};

export default {
	getServerInfo,
};
