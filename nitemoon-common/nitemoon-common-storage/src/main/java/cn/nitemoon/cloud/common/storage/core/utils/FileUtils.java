package cn.nitemoon.cloud.common.storage.core.utils;

import cn.hutool.core.io.FileTypeUtil;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.io.file.FileNameUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.crypto.digest.DigestUtil;
import lombok.SneakyThrows;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 文件工具类
 */
public class FileUtils {

    /**
     * 创建临时文件
     * 该文件会在 JVM 退出时，进行删除
     *
     * @param data 文件内容
     * @return 文件
     */
    @SneakyThrows
    public static File createTempFile(String data) {
        File file = createTempFile();
        // 写入内容
        FileUtil.writeUtf8String(data, file);
        return file;
    }

    /**
     * 创建临时文件
     * 该文件会在 JVM 退出时，进行删除
     *
     * @param data 文件内容
     * @return 文件
     */
    @SneakyThrows
    public static File createTempFile(byte[] data) {
        File file = createTempFile();
        // 写入内容
        FileUtil.writeBytes(data, file);
        return file;
    }

    /**
     * 创建临时文件，无内容
     * 该文件会在 JVM 退出时，进行删除
     *
     * @return 文件
     */
    @SneakyThrows
    public static File createTempFile() {
        // 创建文件，通过 UUID 保证唯一
        File file = File.createTempFile(IdUtil.simpleUUID(), null);
        // 标记 JVM 退出时，自动删除
        file.deleteOnExit();
        return file;
    }

    /**
     * 生成文件路径
     *
     * @param content      文件内容
     * @param originalName 原始文件名
     * @return path，唯一不可重复
     */
    public static String generatePath(byte[] content, String originalName) {
        String sha256Hex = DigestUtil.sha256Hex(content);
        // 情况一：如果存在 name，则优先使用 name 的后缀
        if (StrUtil.isNotBlank(originalName)) {
            String extName = FileNameUtil.extName(originalName);
            return StrUtil.isBlank(extName) ? sha256Hex : sha256Hex + "." + extName;
        }
        // 情况二：基于 content 计算
        return sha256Hex + '.' + FileTypeUtil.getType(new ByteArrayInputStream(content));
    }

    /**
     * 在给定目录中递归查找优先级最高的文件
     *
     * @param directoryPath 要查找的目录地址
     * @param fileNames  要查找的文件名数组，按优先级排序
     * @return 找到的第一个文件，如果未找到则返回null
     */
    public static File findFirstFile(String directoryPath, String[] fileNames) {
        File directory=new File(directoryPath);
        // 检查当前目录是否为文件（防止无限递归）
        if (!directory.isDirectory()) {
            return null;
        }
        // 获取当前目录中的所有文件和子目录
        File[] files = directory.listFiles();
        if (files != null) {
            for (String fileName : fileNames) {
                // 遍历当前目录中的所有文件，查找匹配的文件名
                for (File file : files) {
                    if (file.isFile() && file.getName().equals(fileName)) {
                        // 找到文件，返回它
                        return file;
                    }
                }
                // 如果当前目录没有找到，则递归查找子目录
                for (File subdir : files) {
                    if (subdir.isDirectory()) {
                        String[] subFile=new String[]{fileName};
                        File result = findFirstFile(subdir.getPath(), subFile);
                        if (result != null) {
                            // 在子目录中找到文件，返回它
                            return result;
                        }
                    }
                }
            }
        }
        // 未找到文件，返回null
        return null;
    }

    public static byte[] convertFileToBytes(String filePath) throws IOException {
        FileInputStream fis = null;
        byte[] fileBytes = null;
        try {
            fis = new FileInputStream(filePath);
            fileBytes = new byte[fis.available()];
            fis.read(fileBytes);
        }finally {
            if (fis!=null){
                fis.close();
            }
        }
        return fileBytes;
    }

    /**
     * 在给定目录中递归查找优先级最高的且最新的文件
     *
     * @param directoryPath 要查找的目录地址
     * @param fileNames  要查找的文件名数组，按优先级排序
     * @return 找到的第一个文件，如果未找到则返回null
     */
    public static File findLatestFile(String directoryPath, String[] fileNames) {
        File directory=new File(directoryPath);
        List<File> allFiles=getAllFilesAndDirs(directory);
        List<File> sortedByTimeFiles=allFiles.stream().sorted(Comparator.comparing(File::lastModified)).collect(Collectors.toList());
        for(String fileName:fileNames) {
            for (int i=sortedByTimeFiles.size()-1;i>=0;i--) {
                if (sortedByTimeFiles.get(i).getName().equals(fileName)){
                    return sortedByTimeFiles.get(i);
                }
            }
        }
        return null;
    }

    public static List<File> getAllFilesAndDirs(File directory) {
        List<File> allFilesAndDirs = new ArrayList<>();

        // 检查目录是否为空或不是有效的目录
        if (directory != null && directory.isDirectory()) {
            // 获取当前目录下的所有文件和文件夹
            File[] filesList = directory.listFiles();
            if (filesList != null) {
                for (File fileOrDir : filesList) {
                    // 将当前文件或文件夹添加到列表中
                    allFilesAndDirs.add(fileOrDir);

                    // 如果当前是文件夹，则递归调用以获取其子目录下的所有文件和文件夹
                    if (fileOrDir.isDirectory()) {
                        allFilesAndDirs.addAll(getAllFilesAndDirs(fileOrDir));
                    }
                }
            }
        }

        return allFilesAndDirs;
    }
}
