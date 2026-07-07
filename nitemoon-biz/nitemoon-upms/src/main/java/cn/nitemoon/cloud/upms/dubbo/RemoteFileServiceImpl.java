package cn.nitemoon.cloud.upms.dubbo;

import cn.nitemoon.cloud.upms.api.dto.FileCreateReqVO;
import cn.nitemoon.cloud.upms.api.entity.File;
import cn.nitemoon.cloud.upms.api.remote.RemoteFileService;
import cn.nitemoon.cloud.upms.service.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.dubbo.config.annotation.DubboService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Remote File Service 实现类
 *
 * @author nitemoon
 * @since 2025-09-28
 */
@Slf4j
@RequiredArgsConstructor
@Service
@DubboService
public class RemoteFileServiceImpl implements RemoteFileService {

    private final FileService fileService;

    @Override
    public String uploadFile(String name, String path, byte[] content) throws Exception {
        File file = fileService.uploadFile(name, path, content);
        return file.getUrl();
    }

    @Override
    public FileCreateReqVO uploadFileAndReturnInfo(String name, String path, byte[] content) throws Exception {
        File file = fileService.uploadFile(name, path, content);
        FileCreateReqVO fileVO = new FileCreateReqVO();
        fileVO.setName(file.getName());
        fileVO.setSize(file.getSize());
        fileVO.setType(file.getType());
        fileVO.setId(file.getId());
        fileVO.setId(file.getId());
        fileVO.setUrl(file.getUrl());
        return fileVO;
    }

    @Override
    public List<String> uploadFiles(List<FileCreateReqVO> files) throws Exception {
        List<String> urls = new ArrayList<>();
        for (FileCreateReqVO file : files) {
            File uploadedFile = fileService.uploadFile(file.getName(), file.getPath(), file.getContent());
            urls.add(uploadedFile.getUrl());
        }
        return urls;
    }

    @Override
    public List<FileCreateReqVO> uploadFilesAndReturnInfo(List<FileCreateReqVO> files) throws Exception {
        List<FileCreateReqVO> fileVOs = new ArrayList<>();
        for (FileCreateReqVO file : files) {
            File uploadedFile = fileService.uploadFile(file.getName(), file.getPath(), file.getContent());
            FileCreateReqVO fileVO = new FileCreateReqVO();
            fileVO.setId(uploadedFile.getId());
            fileVO.setConfigId(uploadedFile.getConfigId());
            fileVO.setPath(uploadedFile.getPath());
            fileVO.setName(uploadedFile.getName());
            fileVO.setUrl(uploadedFile.getUrl());
            fileVO.setType(uploadedFile.getType());
            fileVO.setSize(uploadedFile.getSize());
            // 注意：这里无法直接设置content，因为content是上传的文件内容
            fileVOs.add(fileVO);
        }
        return fileVOs;
    }

    @Override
    public void deleteFile(Long id) throws Exception {
        fileService.deleteFile(id);
    }

    @Override
    public void deleteFiles(List<Long> ids) throws Exception {
        for (Long id : ids) {
            fileService.deleteFile(id);
        }
    }
}
