package cn.nitemoon.cloud.upms.service;

import cn.nitemoon.cloud.upms.api.dto.FileCreateReqVO;
import cn.nitemoon.cloud.upms.api.dto.FilePageReqVO;
import cn.nitemoon.cloud.upms.api.dto.FilePresignedUrlRespVO;
import cn.nitemoon.cloud.upms.api.entity.File;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;

import java.io.InputStream;

/**
 * 文件 Service 接口
 */
public interface FileService extends IService<File> {

    /**
     * 保存文件，并返回文件的访问路径
     *
     * @param name    文件名称
     * @param path    文件路径
     * @param content 文件内容
     * @return 文件路径
     */
    String createFile(String name, String path, byte[] content);

    /**
     * 创建文件
     *
     * @param createReqVO 创建信息
     * @return 编号
     */
    Long createFile(FileCreateReqVO createReqVO);

    /**
     * 删除文件
     *
     * @param id 编号
     */
    void deleteFile(Long id) throws Exception;

    /**
     * 获得文件内容
     *
     * @param configId 配置编号
     * @param path     文件路径
     * @return 文件内容
     */
    byte[] getFileContent(Long configId, String path) throws Exception;

    /**
     * 生成文件预签名地址信息
     *
     * @param path 文件路径
     * @return 预签名地址信息
     */
    FilePresignedUrlRespVO getFilePresignedUrl(String path) throws Exception;

    /**
     * 文件上传功能
     * @param name
     * @param path
     * @param content
*/
    File uploadFile(String name, String path, byte[] content) throws Exception;

    InputStream getFileInputStream(Long configId, String path) throws Exception;

    /**
     * 获得文件类型
     *
     * @param configId 配置编号
     * @param path     文件路径
     * @return 文件MIME类型
     */
    String getFileType(Long configId, String path) throws Exception;
}
