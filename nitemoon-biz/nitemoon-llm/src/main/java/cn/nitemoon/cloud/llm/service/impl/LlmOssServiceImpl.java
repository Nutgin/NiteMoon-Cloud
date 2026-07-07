

package cn.nitemoon.cloud.llm.service.impl;

import cn.nitemoon.cloud.llm.entity.LlmOss;
import cn.nitemoon.cloud.llm.mapper.LlmOssMapper;
import cn.nitemoon.cloud.llm.service.LlmOssService;
import cn.nitemoon.cloud.upms.api.dto.FileCreateReqVO;
import cn.nitemoon.cloud.upms.api.remote.RemoteFileService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.dubbo.config.annotation.DubboReference;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.UUID;

/**
 * @author hetao
 * @date 2025/1/4
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LlmOssServiceImpl extends ServiceImpl<LlmOssMapper, LlmOss> implements LlmOssService {

    @DubboReference
    private final RemoteFileService remoteFileService;

    @Override
    public LlmOss upload(MultipartFile file, String userId) {
        try {
            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String uniqueFilename = UUID.randomUUID().toString().replace("-", "") + extension;

            // 构造文件路径
            String filePath = "tempPic" + File.separator + "aigc" + File.separator + uniqueFilename;

            FileCreateReqVO reqVO = remoteFileService.uploadFileAndReturnInfo(file.getOriginalFilename(), filePath, file.getBytes());
            LlmOss oss = new LlmOss();
            oss.setPath(reqVO.getPath());
            oss.setFilename(reqVO.getName());
            oss.setSize(Long.valueOf(reqVO.getSize()));
            oss.setOssId(String.valueOf(reqVO.getId()));
            oss.setUserId(userId);
            oss.setOriginalFilename(reqVO.getName());
            oss.setUrl(reqVO.getUrl());
            oss.setBasePath(reqVO.getPath());
            oss.setContentType(reqVO.getType());
            this.save(oss);
            return oss;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

    }
}

