package cn.nitemoon.cloud.common.core.util;

import cn.hutool.http.HttpUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Objects;

/**
 * IP工具类
 *
 * @author hetao
 * @date 2022/6/10
 */
@Slf4j
public class IpUtils {

	// ip查询地址
	private static final String IP_URL = "https://v.api.aa1.cn/api/ipcha-baidu";

	// 未知地址
	private static final String UNKNOWN = "未知";

	/**
	 * 通过IP获取地址信息
	 * @param ip
	 * @return
	 */
	public static String getWhoisAddress(String ip) {
		if (isPrivateIpAddress(ip)) {
			return "内网IP";
		}
		try {
			String url = IP_URL + "/?ip=" + ip;
			// GET请求
			String returnStr = HttpUtil.createGet(url)
				.header("User-Agent", "Mozilla/4.0 compatible; MSIE 6.0; Windows NT 5.1;DigExt")
				.execute()
				.body();
			if (returnStr != null) {
				JSONObject rs = JSONUtil.parseObj(returnStr);
				Object codeObj = rs.get("code");
				if (codeObj instanceof Number && ((Number) codeObj).intValue() == 1) {
					return rs.getStr("ip_add");
				}
			}
		}
		catch (Exception e) {
			return UNKNOWN;
		}
		return UNKNOWN;
	}

	public static boolean isPrivateIpAddress(String ip) {
		if (!StringUtils.hasText(ip)) {
			return false;
		}
		if (ip.equals("127.0.0.1") || ip.equals("0:0:0:0:0:0:0:1")) {
			return true;
		}
		// Check IPv4 private ranges
		if (ip.startsWith("10.") || ip.startsWith("172.") && isBetween(ip, 16, 31) || ip.startsWith("192.168.")) {
			return true;
		}
		// Check IPv4 link-local range
		if (ip.startsWith("169.254.")) {
			return true;
		}
		// Check for IPv6 unique local addresses
		if (ip.startsWith("fd")) {
			try {
				// Ensure it's a valid fd00::/8 address
				long prefix = Long.parseUnsignedLong(ip.split(":")[0], 16);
				if ((prefix & 0xfff8_0000L) == 0xfd00_0000L) {
					return true;
				}
			}
			catch (NumberFormatException e) {
				// Not a valid fd00::/8 address
			}
		}
		return false;
	}

	private static boolean isBetween(String ipAddress, int lower, int upper) {
		String[] parts = ipAddress.split("\\.");
		if (parts.length != 4) {
			return false;
		}
		try {
			int secondOctet = Integer.parseInt(parts[1]);
			return secondOctet >= lower && secondOctet <= upper;
		}
		catch (NumberFormatException e) {
			return false;
		}
	}

	/**
	 * 获取请求IP
	 *
	 * @return String IP
	 */
	public static String getHttpServletRequestIpAddress() {
		HttpServletRequest request = getHttpServletRequest();
		String ipAddress;
		try {
			ipAddress = request.getHeader("x-forwarded-for");
			if (ipAddress == null || ipAddress.isEmpty() || UNKNOWN.equalsIgnoreCase(ipAddress)) {
				ipAddress = request.getHeader("Proxy-Client-IP");
			}
			if (ipAddress == null || ipAddress.isEmpty() || UNKNOWN.equalsIgnoreCase(ipAddress)) {
				ipAddress = request.getHeader("WL-Proxy-Client-IP");
			}
			if (ipAddress == null || ipAddress.isEmpty() || UNKNOWN.equalsIgnoreCase(ipAddress)) {
				ipAddress = request.getRemoteAddr();
				if ("127.0.0.1".equals(ipAddress)) {
					// 根据网卡取本机配置的IP
					InetAddress inet = null;
					try {
						inet = InetAddress.getLocalHost();
						ipAddress = inet.getHostAddress();
					} catch (UnknownHostException e) {
						e.printStackTrace();
					}
				}
			}
			// 对于通过多个代理的情况，第一个IP为客户端真实IP,多个IP按照','分割
			if (ipAddress != null && ipAddress.length() > 15) {
				// = 15
				if (ipAddress.indexOf(",") > 0) {
					ipAddress = ipAddress.substring(0, ipAddress.indexOf(","));
				}
			}
		} catch (Exception e) {
			ipAddress = "";
		}
		return "0:0:0:0:0:0:0:1".equals(ipAddress) ? "127.0.0.1" : ipAddress;
	}

	/**
	 * 获取HttpServletRequest
	 *
	 * @return HttpServletRequest
	 */
	public static HttpServletRequest getHttpServletRequest() {
		return ((ServletRequestAttributes) Objects.requireNonNull(RequestContextHolder.getRequestAttributes())).getRequest();
	}

}
