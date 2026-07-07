package cn.nitemoon.cloud.upms.api.remote;


import cn.nitemoon.cloud.upms.api.dto.FileCreateReqVO;

import java.util.List;

/**
 * Remote File Service
 *
 * @author nitemoon
 * @since 2025-09-28
 */
public interface RemoteFileService {

    /**
     * 上传文件
     *
     * @param name    文件名称
     * @param path    文件路径
     * @param content 文件内容
     * @return 文件访问路径
     */
    String uploadFile(String name, String path, byte[] content) throws Exception;

    /**
     * 上传文件并返回文件信息
     *
     * @param name    文件名称
     * @param path    文件路径
     * @param content 文件内容
     * @return 文件信息
     */
    FileCreateReqVO uploadFileAndReturnInfo(String name, String path, byte[] content) throws Exception;

    /**
     * 批量上传文件
     *
     * @param files 文件列表
     * @return 文件访问路径列表
     */
    List<String> uploadFiles(List<FileCreateReqVO> files) throws Exception;

    /**
     * 批量上传文件并返回文件信息
     *
     * @param files 文件列表
     * @return 文件信息列表
     */
    List<FileCreateReqVO> uploadFilesAndReturnInfo(List<FileCreateReqVO> files) throws Exception;

    /**
     * 删除文件
     *
     * @param id 文件ID
     */
    void deleteFile(Long id) throws Exception;

    /**
     * 批量删除文件
     *
     * @param ids 文件ID列表
     */
    void deleteFiles(List<Long> ids) throws Exception;
}
