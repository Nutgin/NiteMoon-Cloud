package cn.nitemoon.cloud.common.sse.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

/**
 * SSE消息DTO
 *
 * @author hetao
 */
@Data
public class SseMessageDto implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /**
     * 需要推送到的用户ID列表
     */
    private List<Long> userIds;

    /**
     * 需要发送的消息
     */
    private String message;
}
