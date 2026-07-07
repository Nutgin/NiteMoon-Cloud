package cn.nitemoon.cloud.upms.service;

import cn.nitemoon.cloud.common.storage.core.client.FileClient;
import cn.nitemoon.cloud.upms.api.dto.FileConfigPageReqVO;
import cn.nitemoon.cloud.upms.api.dto.FileConfigSaveReqVO;
import cn.nitemoon.cloud.upms.api.entity.FileConfig;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import jakarta.validation.Valid;


/**
 * 文件配置 Service 接口
 */
public interface FileConfigService extends IService<FileConfig> {

    /**
     * 创建文件配置
     *
     * @param createReqVO 创建信息
     * @return 编号
     */
    Long createFileConfig(@Valid FileConfigSaveReqVO createReqVO);

    /**
     * 更新文件配置
     *
     * @param updateReqVO 更新信息
     */
    void updateFileConfig(@Valid FileConfigSaveReqVO updateReqVO);

    /**
     * 更新文件配置为 Master
     *
     * @param id 编号
     */
    void updateFileConfigMaster(Long id);

    /**
     * 删除文件配置
     *
     * @param id 编号
     */
    void deleteFileConfig(Long id);

    /**
     * 获得文件配置
     *
     * @param id 编号
     * @return 文件配置
     */
    FileConfig getFileConfig(Long id);

    /**
     * 测试文件配置是否正确，通过上传文件
     *
     * @param id 编号
     * @return 文件 URL
     */
    String testFileConfig(Long id) throws Exception;

    /**
     * 获得指定编号的文件客户端
     *
     * @param id 配置编号
     * @return 文件客户端
     */
    FileClient getFileClient(Long id);

    /**
     * 获得 Master 文件客户端
     *
     * @return 文件客户端
     */
    FileClient getMasterFileClient();

}
