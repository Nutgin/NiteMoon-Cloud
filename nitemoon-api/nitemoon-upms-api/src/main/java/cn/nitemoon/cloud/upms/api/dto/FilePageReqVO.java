package cn.nitemoon.cloud.upms.api.dto;

import cn.nitemoon.cloud.common.core.util.DateUtil;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;


@Data
@EqualsAndHashCode
@ToString(callSuper = true)
public class FilePageReqVO {

    @Schema(description = "文件路径，模糊匹配", example = "dicp")
    private String path;

     @Schema(description = "文件类型，模糊匹配", example = "jpg")
    private String type;

     @Schema(description = "文件名")
     private String name;

     @Schema(description = "创建时间", example = "[2022-07-01 00:00:00, 2022-07-01 23:59:59]")
    @DateTimeFormat(pattern = DateUtil.FULL_TIME_SPLIT_PATTERN)
    private LocalDateTime[] createTime;

}
