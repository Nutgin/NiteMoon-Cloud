package cn.nitemoon.cloud.upms.api.entity;

import cn.hutool.core.util.StrUtil;
import cn.nitemoon.cloud.common.core.util.JsonUtils;
import cn.nitemoon.cloud.common.storage.core.client.FileClientConfig;
import cn.nitemoon.cloud.common.storage.core.client.ftp.FtpFileClientConfig;
import cn.nitemoon.cloud.common.storage.core.client.local.LocalFileClientConfig;
import cn.nitemoon.cloud.common.storage.core.client.s3.S3FileClientConfig;
import cn.nitemoon.cloud.common.storage.core.client.sftp.SftpFileClientConfig;
import cn.nitemoon.cloud.common.storage.core.enums.FileStorageEnum;
import com.baomidou.mybatisplus.annotation.*;
import com.baomidou.mybatisplus.extension.activerecord.Model;
import com.baomidou.mybatisplus.extension.handlers.AbstractJsonTypeHandler;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.*;
import lombok.experimental.Accessors;
import org.apache.ibatis.type.JdbcType;

import java.time.LocalDateTime;

/**
 * 文件配置表
 */
@TableName(value = "sys_file_config", autoResultMap = true)
@Data
@EqualsAndHashCode(callSuper = true)
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class FileConfig extends Model<FileConfig> {

    /**
     * 配置编号，数据库自增
     */
    @JsonSerialize(using = ToStringSerializer.class) // 将 Long 序列化为字符串
    private Long id;
    /**
     * 配置名
     */
    private String name;
    /**
     * 存储器
     *
     * 枚举 {@link FileStorageEnum}
     */
    private Integer storage;
    /**
     * 备注
     */
    private String remark;
    /**
     * 是否为主配置
     *
     * 由于我们可以配置多个文件配置，默认情况下，使用主配置进行文件的上传
     */
    private Boolean master;

    /**
     * 支付渠道配置
     */
    @TableField(typeHandler = FileClientConfigTypeHandler.class)
    private FileClientConfig config;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    /**
     * 创建者，目前使用 SysUser 的 id 编号
     *
     * 使用 String 类型的原因是，未来可能会存在非数值的情况，留好拓展性。
     */
    @TableField(fill = FieldFill.INSERT, jdbcType = JdbcType.VARCHAR)
    private String creator;
    /**
     * 更新者，目前使用 SysUser 的 id 编号
     *
     * 使用 String 类型的原因是，未来可能会存在非数值的情况，留好拓展性。
     */
    @TableField(fill = FieldFill.INSERT_UPDATE, jdbcType = JdbcType.VARCHAR)
    private String updater;
    /**
     * 是否删除
     */
    @TableLogic
    private Boolean deleted;


    public static class FileClientConfigTypeHandler extends AbstractJsonTypeHandler<Object> {

        public FileClientConfigTypeHandler(Class<?> clazz) {
            super(Object.class);
        }

        @Override
        public Object parse(String json) {
            FileClientConfig config = JsonUtils.parseObjectQuietly(json, new TypeReference<FileClientConfig>() {
            });
            if (config != null) {
                return config;
            }

            // 兼容老版本的包路径
            String className = JsonUtils.parseObject(json, "@class", String.class);
            className = StrUtil.subAfter(className, ".", true);
            switch (className) {
                case "FtpFileClientConfig":
                    return JsonUtils.parseObject2(json, FtpFileClientConfig.class);
                case "LocalFileClientConfig":
                    return JsonUtils.parseObject2(json, LocalFileClientConfig.class);
                case "SftpFileClientConfig":
                    return JsonUtils.parseObject2(json, SftpFileClientConfig.class);
                case "S3FileClientConfig":
                    return JsonUtils.parseObject2(json, S3FileClientConfig.class);
                default:
                    throw new IllegalArgumentException("未知的 FileClientConfig 类型：" + json);
            }
        }

        @Override
        public String toJson(Object obj) {
            return JsonUtils.toJsonString(obj);
        }
    }

}
