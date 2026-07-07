

package cn.nitemoon.cloud.llm.service;

import cn.nitemoon.cloud.llm.entity.LlmOss;
import com.baomidou.mybatisplus.extension.service.IService;
import org.springframework.web.multipart.MultipartFile;

/**
 * @author hetao
 * @date 2025/1/4
 */
public interface LlmOssService extends IService<LlmOss> {

    LlmOss upload(MultipartFile file, String userId);
}

