package cn.nitemoon.cloud.upms.controller;

import cn.hutool.core.io.IoUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.core.util.URLUtil;
import cn.nitemoon.cloud.common.core.util.Result;
import cn.nitemoon.cloud.common.log.annotation.SysLog;
import cn.nitemoon.cloud.upms.api.dto.FileCreateReqVO;
import cn.nitemoon.cloud.upms.api.dto.FilePageReqVO;
import cn.nitemoon.cloud.upms.api.entity.File;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import cn.nitemoon.cloud.upms.api.dto.FilePresignedUrlRespVO;
import cn.nitemoon.cloud.upms.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URLEncoder;


@Slf4j
@Validated
@RestController
@AllArgsConstructor
@Tag(description = "file", name = "文件管理")
@RequestMapping("/file")
public class FileController {

    private final FileService fileService;

    @PostMapping("/upload")
    @Operation(summary = "上传文件", description = "模式一：后端上传文件")
    public Result<String> uploadFile(@RequestParam("file") MultipartFile file , String path){
        String extension = file.getContentType().substring(file.getContentType().lastIndexOf('.') + 1).toLowerCase();
        try {
            return Result.success(fileService.createFile(file.getOriginalFilename(), path, IoUtil.readBytes(file.getInputStream())));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @GetMapping("/presigned-url")
    @SysLog("获取文件预签名地址")
    public Result<FilePresignedUrlRespVO> getFilePresignedUrl(@RequestParam("path") String path) throws Exception {
        return Result.success(fileService.getFilePresignedUrl(path));
    }

    @PostMapping("/create")
    @Operation(summary = "创建文件", description = "模式二：前端上传文件：配合 presigned-url 接口，记录上传了上传的文件")
    public Result<Long> createFile(@Valid @RequestBody FileCreateReqVO createReqVO) {
        return Result.success(fileService.createFile(createReqVO));
    }

    @DeleteMapping("/delete")
    @Operation(summary = "删除文件")
//    @SaCheckPermission("infra:file:delete")
    public Result<Boolean> deleteFile(@RequestParam("id") Long id) throws Exception {
        fileService.deleteFile(id);
        return Result.success(true);
    }

     @GetMapping("/{configId}/get/**")
     @Operation(summary = "下载文件")
     public void getFileContent(HttpServletRequest request,
                               HttpServletResponse response,
                               @PathVariable("configId") Long configId) throws Exception {
        log.info("开始下载文件");
         // 获取请求的路径
         String path = StrUtil.subAfter(request.getRequestURI(), "/get/", false);
         if (StrUtil.isEmpty(path)) {
             throw new IllegalArgumentException("结尾的 path 路径必须传递");
         }
         // 解码，解决中文路径的问题
         path = URLUtil.decode(path);

         // 获取文件输入流而不是一次性读取所有字节
         InputStream fileStream = fileService.getFileInputStream(configId, path);
         if (fileStream == null) {
             log.warn("[getFileContent][configId({}) path({}) 文件不存在]", configId, path);
             response.setStatus(HttpStatus.NOT_FOUND.value());
             return;
         }

         // 获取文件类型以设置合适的缓存策略
         String fileType = fileService.getFileType(configId, path);
         
         // 设置响应头和缓存策略
         if (fileType != null) {
             response.setContentType(fileType);
             // 根据文件类型设置缓存时间
             if (fileType.startsWith("image/")) {
                 response.setHeader("Cache-Control", "public, max-age=3600"); // 图片缓存1小时
             } else if (fileType.startsWith("text/") || fileType.startsWith("application/")) {
                 response.setHeader("Cache-Control", "public, max-age=86400"); // 文档缓存24小时
             } else {
                 response.setHeader("Cache-Control", "public, max-age=3600"); // 其他文件缓存1小时
             }
         } else {
             response.setContentType("application/octet-stream");
             response.setHeader("Cache-Control", "public, max-age=3600");
         }
         
         response.setHeader("Content-Disposition", "inline; filename=\"" + URLEncoder.encode(path, "UTF-8") + "\"");

         log.info("准备传输文件");
         // 使用流式传输
         try (InputStream in = fileStream;
              OutputStream out = response.getOutputStream()) {
             byte[] buffer = new byte[8192]; // 8KB缓冲区
             int bytesRead;
             while ((bytesRead = in.read(buffer)) != -1) {
                 out.write(buffer, 0, bytesRead);
             }
             out.flush();
         } catch (IOException e) {
             log.error("文件传输过程中发生错误", e);
             // 客户端可能已经中断连接，这是正常情况
         }
     }


    @GetMapping("/page")
    @Operation(summary = "获得文件分页")
//    @SaCheckPermission("infra:file:query")
    public Result getFilePage(Page<File> page, @Valid File file) {
        QueryWrapper<File> query = Wrappers.query(file);
        query.orderByDesc("create_time");
        return Result.success(fileService.page(page, query ));
    }

}
