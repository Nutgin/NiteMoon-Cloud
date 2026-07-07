package cn.nitemoon.cloud.llm.endpoint;

import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.common.demo.annotation.DemoTrail;
import cn.nitemoon.cloud.common.security.util.SecurityUtils;
import cn.nitemoon.cloud.llm.constants.EmbedConst;
import cn.nitemoon.cloud.llm.dto.ChatReq;
import cn.nitemoon.cloud.llm.dto.EmbeddingR;
import cn.nitemoon.cloud.llm.dto.SearchRequest;
import cn.nitemoon.cloud.llm.entity.LlmDocs;
import cn.nitemoon.cloud.llm.entity.LlmDocsSlice;
import cn.nitemoon.cloud.llm.entity.LlmOss;
import cn.nitemoon.cloud.llm.mapper.LlmDocsMapper;
import cn.nitemoon.cloud.llm.service.LlmKnowledgeService;
import cn.nitemoon.cloud.llm.service.LlmOssService;
import cn.nitemoon.cloud.llm.service.EmbeddingService;
import cn.nitemoon.cloud.llm.service.DocumentEmbeddingService;
import cn.nitemoon.cloud.llm.utils.TaskManager;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.common.security.handler.CommonBusinessException;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.concurrent.Executors;

/**
 * @author hetao
 * @date 2025/05/25
 */
@Slf4j
@RestController
@AllArgsConstructor
@RequestMapping("/aigc/embedding")
public class EmbeddingEndpoint {

    private final DocumentEmbeddingService documentEmbeddingService;
    private final LlmKnowledgeService knowledgeService;
    private final LlmDocsMapper docsMapper;
    private final LlmOssService ossService;
    private final EmbeddingService embeddingService;

    @PostMapping("/text")
    //@SaCheckPermission("aigc:embedding:text")
    @DemoTrail
    public Result text(@RequestBody LlmDocs data) {
        if (StrUtil.isBlankIfStr(data.getContent())) {
            throw new CommonBusinessException("文档内容不能为空");
        }
        if (StrUtil.isBlank(data.getId())) {
            knowledgeService.addDocs(data);
        }
        data.setType(EmbedConst.ORIGIN_TYPE_INPUT).setSliceStatus(false);

        try {
            EmbeddingR embeddingR = documentEmbeddingService.embeddingText(
                    new ChatReq().setMessage(data.getContent())
                            .setDocsName(data.getType())
                            .setDocsId(data.getId())
                            .setKnowledgeId(data.getKnowledgeId()));

            knowledgeService.addDocsSlice(new LlmDocsSlice()
                    .setKnowledgeId(data.getKnowledgeId())
                    .setDocsId(data.getId())
                    .setVectorId(embeddingR.getVectorId())
                    .setName(data.getName())
                    .setContent(embeddingR.getText())
            );

            knowledgeService.updateDocs(new LlmDocs().setId(data.getId()).setSliceStatus(true).setSliceNum(1));
        } catch (Exception e) {
            e.printStackTrace();

            // del data
            knowledgeService.removeSlicesOfDoc(data.getId());
        }
        return Result.success();
    }

    @PostMapping("/docs/{knowledgeId}")
    //@SaCheckPermission("aigc:embedding:docs")
    @DemoTrail
    public Result docs(MultipartFile file, @PathVariable String knowledgeId) {
        String userId = String.valueOf(SecurityUtils.getUserId());
        LlmOss oss = ossService.upload(file, userId);
        LlmDocs data = new LlmDocs()
                .setName(oss.getOriginalFilename())
                .setSliceStatus(false)
                .setUrl(oss.getUrl())
                .setSize(file.getSize())
                .setType(EmbedConst.ORIGIN_TYPE_UPLOAD)
                .setKnowledgeId(knowledgeId);
        knowledgeService.addDocs(data);
        TaskManager.submitTask(userId, Executors.callable(() -> {
            embeddingService.embedDocsSlice(data, oss.getUrl());
        }));
        return Result.success(data.getId());
    }

    @GetMapping("/re-embed/{docsId}")
    @DemoTrail
    public Result reEmbed(@PathVariable String docsId) {
        String userId = String.valueOf(SecurityUtils.getUserId());
        LlmDocs docs = docsMapper.selectById(docsId);
        if (docs == null) {
            throw new CommonBusinessException("没有查询到文档数据");
        }
        if (EmbedConst.ORIGIN_TYPE_INPUT.equals(docs.getType())) {
            docsMapper.updateById(new LlmDocs().setId(docsId).setSliceStatus(false).setSliceNum(0));
            text(docs);
        }
        if (EmbedConst.ORIGIN_TYPE_UPLOAD.equals(docs.getType())) {
            // clear before re-embed
            embeddingService.clearDocSlices(docsId);
            docsMapper.updateById(new LlmDocs().setId(docsId).setSliceStatus(false).setSliceNum(0));
            TaskManager.submitTask(userId, Executors.callable(() -> {
                embeddingService.embedDocsSlice(docs, docs.getUrl());
            }));
        }
        return Result.success(docsId);
    }

    @PostMapping("/search")
    @DemoTrail
    public Result search(@RequestBody LlmDocs data) {
        return Result.success(embeddingService.search(data));
    }

    @PostMapping("/search/advanced")
    @DemoTrail
    public Result advancedSearch(@RequestBody SearchRequest request) {
        return Result.success(embeddingService.search(request));
    }
}
