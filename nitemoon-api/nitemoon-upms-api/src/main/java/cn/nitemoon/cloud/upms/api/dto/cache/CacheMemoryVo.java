package cn.nitemoon.cloud.upms.api.dto.cache;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class CacheMemoryVo {

    @Schema(description = "已用内存")
    private Long used;

    @Schema(description = "总内存")
    private Long total;
}
