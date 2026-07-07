
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for gen_data_source
-- ----------------------------
DROP TABLE IF EXISTS `gen_data_source`;
CREATE TABLE `gen_data_source` (
  `id` varchar(32) NOT NULL COMMENT '主键',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `del_flag` char(2) NOT NULL DEFAULT '0' COMMENT '逻辑删除：0.显示；1.隐藏；',
  `create_by` varchar(60) DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(60) DEFAULT NULL COMMENT '修改人',
  `name` varchar(128) DEFAULT NULL COMMENT '名称',
  `url` text COMMENT 'jdbc url',
  `username` varchar(64) DEFAULT NULL COMMENT '用户名',
  `password` varchar(256) DEFAULT NULL COMMENT '密码',
  `db_name` varchar(128) DEFAULT NULL COMMENT '数据库名称',
  `port` int(11) DEFAULT NULL COMMENT '端口',
  `host` varchar(128) DEFAULT NULL COMMENT '主机',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='数据源表';

-- ----------------------------
-- Records of gen_data_source
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for gen_table
-- ----------------------------
DROP TABLE IF EXISTS `gen_table`;
CREATE TABLE `gen_table` (
  `table_id` varchar(32) NOT NULL COMMENT '主键',
  `table_name` varchar(200) NOT NULL COMMENT '表名称',
  `table_comment` varchar(500) NOT NULL COMMENT '表描述',
  `sub_table_name` varchar(200) DEFAULT NULL COMMENT '关联父表的表名',
  `sub_table_fk_name` varchar(200) DEFAULT NULL COMMENT '本表关联父表的外键名',
  `class_name` varchar(100) NOT NULL COMMENT '实体类名称(首字母大写)',
  `tpl_category` varchar(50) DEFAULT NULL COMMENT '使用的模板（crud单表操作 tree树表操作 sub主子表操作）',
  `tpl_web_type` varchar(50) DEFAULT NULL COMMENT '前端类型（element-ui模版 element-plus模版）',
  `package_name` varchar(200) NOT NULL COMMENT '生成包路径',
  `module_name` varchar(100) NOT NULL COMMENT '生成模块名',
  `business_name` varchar(100) NOT NULL COMMENT '生成业务名',
  `function_name` varchar(100) NOT NULL COMMENT '生成功能名',
  `function_author` varchar(100) NOT NULL COMMENT '生成作者',
  `gen_type` char(1) DEFAULT NULL COMMENT '生成代码方式（0zip压缩包 1自定义路径）',
  `gen_path` varchar(500) DEFAULT NULL COMMENT '生成路径（不填默认项目路径）',
  `options` text COMMENT '其它生成选项',
  `tree_code` varchar(100) DEFAULT NULL COMMENT '树编码字段',
  `tree_parent_code` varchar(100) DEFAULT NULL COMMENT '树父编码字段',
  `tree_name` varchar(100) DEFAULT NULL COMMENT '树名称字段',
  `parent_menu_id` bigint(20) DEFAULT NULL COMMENT '上级菜单ID字段',
  `parent_menu_name` varchar(200) DEFAULT NULL COMMENT '上级菜单名称字段',
  `create_by` varchar(64) DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(64) DEFAULT NULL COMMENT '修改人',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '修改时间',
  `del_flag` char(1) DEFAULT '0' COMMENT '逻辑删除：0.显示；1.隐藏；',
  `ds_name` varchar(128) DEFAULT NULL COMMENT '数据源名称',
  PRIMARY KEY (`table_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='代码生成表';

-- ----------------------------
-- Records of gen_table
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for gen_table_column
-- ----------------------------
DROP TABLE IF EXISTS `gen_table_column`;
CREATE TABLE `gen_table_column` (
  `column_id` varchar(32) NOT NULL COMMENT '主键',
  `table_id` varchar(32) DEFAULT NULL COMMENT '归属表ID',
  `column_name` varchar(200) DEFAULT NULL COMMENT '列名称',
  `column_comment` varchar(500) DEFAULT NULL COMMENT '列描述',
  `column_type` varchar(100) DEFAULT NULL COMMENT '列类型',
  `java_type` varchar(100) DEFAULT NULL COMMENT 'JAVA类型',
  `java_field` varchar(100) NOT NULL COMMENT 'JAVA字段名',
  `is_pk` char(1) DEFAULT '0' COMMENT '是否主键（1是）',
  `is_increment` char(1) DEFAULT '0' COMMENT '是否自增（1是）',
  `is_required` char(1) DEFAULT '0' COMMENT '是否必填（1是）',
  `is_insert` char(1) DEFAULT '1' COMMENT '是否为插入字段（1是）',
  `is_edit` char(1) DEFAULT '1' COMMENT '是否编辑字段（1是）',
  `is_list` char(1) DEFAULT '1' COMMENT '是否列表字段（1是）',
  `is_query` char(1) DEFAULT '0' COMMENT '是否查询字段（1是）',
  `query_type` varchar(20) DEFAULT NULL COMMENT '查询方式（EQ等于、NE不等于、GT大于、LT小于、LIKE模糊、BETWEEN范围）',
  `html_type` varchar(50) DEFAULT NULL COMMENT '显示类型（input、textarea、select、checkbox、radio、datetime、image、upload、editor）',
  `dict_type` varchar(100) DEFAULT NULL COMMENT '字典类型',
  `sort` int(11) DEFAULT NULL COMMENT '排序',
  `create_by` varchar(64) DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(64) DEFAULT NULL COMMENT '修改人',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '修改时间',
  `del_flag` char(1) DEFAULT '0' COMMENT '逻辑删除：0.显示；1.隐藏；',
  PRIMARY KEY (`column_id`) USING BTREE,
  KEY `idx_table_id` (`table_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='代码生成业务字段表';

-- ----------------------------
-- Records of gen_table_column
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for llm_app
-- ----------------------------
DROP TABLE IF EXISTS `llm_app`;
CREATE TABLE `llm_app` (
  `id` varchar(50) NOT NULL COMMENT '主键',
  `model_id` varchar(50) DEFAULT NULL COMMENT '关联模型',
  `knowledge_ids` varchar(500) DEFAULT NULL COMMENT '关联知识库',
  `cover` varchar(255) DEFAULT NULL COMMENT '封面',
  `name` varchar(50) DEFAULT NULL COMMENT '名称',
  `prompt` text COMMENT '提示词',
  `des` varchar(255) DEFAULT NULL COMMENT '描述',
  `save_time` datetime DEFAULT NULL COMMENT '保存时间',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `workflow_uuid` varchar(64) DEFAULT NULL COMMENT '关联的工作流UUID',
  `enable_memory` tinyint(1) DEFAULT '0' COMMENT '是否开启记忆',
  `memory_window_size` int(11) DEFAULT '20' COMMENT '记忆窗口大小',
  `enable_web_page` tinyint(1) DEFAULT '0' COMMENT '是否启用web页面',
  `web_page_key` varchar(64) DEFAULT NULL COMMENT 'Web页面访问密钥',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提示词表';

-- ----------------------------
-- Records of llm_app
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for llm_app_api
-- ----------------------------
DROP TABLE IF EXISTS `llm_app_api`;
CREATE TABLE `llm_app_api` (
  `id` varchar(50) NOT NULL COMMENT '主键',
  `app_id` varchar(50) DEFAULT NULL COMMENT '应用ID',
  `channel` varchar(50) DEFAULT NULL COMMENT '应用渠道',
  `api_key` varchar(50) DEFAULT NULL COMMENT 'Key',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='应用';

-- ----------------------------
-- Records of llm_app_api
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for llm_conversation
-- ----------------------------
DROP TABLE IF EXISTS `llm_conversation`;
CREATE TABLE `llm_conversation` (
  `id` varchar(50) NOT NULL COMMENT '主键',
  `user_id` varchar(50) DEFAULT NULL COMMENT '用户ID',
  `prompt_id` varchar(50) DEFAULT NULL COMMENT '提示词ID',
  `title` varchar(100) DEFAULT NULL COMMENT '标题',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `app_id` varchar(64) DEFAULT NULL COMMENT '应用ID',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对话窗口表';

-- ----------------------------
-- Records of llm_conversation
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for llm_docs
-- ----------------------------
DROP TABLE IF EXISTS `llm_docs`;
CREATE TABLE `llm_docs` (
  `id` varchar(50) NOT NULL COMMENT '主键',
  `knowledge_id` varchar(50) NOT NULL COMMENT '知识库ID',
  `name` varchar(255) DEFAULT NULL COMMENT '名称',
  `type` varchar(50) DEFAULT NULL COMMENT '类型',
  `url` varchar(255) DEFAULT NULL,
  `origin` varchar(50) DEFAULT NULL COMMENT '来源',
  `content` text COMMENT '内容或链接',
  `size` int(11) DEFAULT NULL COMMENT '文件大小',
  `slice_num` int(11) DEFAULT NULL COMMENT '切片数量',
  `slice_status` tinyint(1) DEFAULT NULL COMMENT '切片状态',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文档表';

-- ----------------------------
-- Records of llm_docs
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for llm_docs_slice
-- ----------------------------
DROP TABLE IF EXISTS `llm_docs_slice`;
CREATE TABLE `llm_docs_slice` (
  `id` varchar(50) NOT NULL COMMENT '主键',
  `vector_id` varchar(100) NOT NULL COMMENT '向量库的ID',
  `docs_id` varchar(50) NOT NULL COMMENT '文档ID',
  `knowledge_id` varchar(50) NOT NULL COMMENT '知识库ID',
  `name` varchar(255) DEFAULT NULL COMMENT '文档名称',
  `content` text COMMENT '切片内容',
  `word_num` int(11) DEFAULT NULL COMMENT '字符数',
  `status` tinyint(1) DEFAULT NULL COMMENT '状态',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `metadata` text COMMENT '元数据JSON(标题/关键词/摘要等)',
  `chunk_index` int(11) DEFAULT NULL COMMENT '在文档中的分块序号',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文档切片表';

-- ----------------------------
-- Records of llm_docs_slice
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for llm_embed_store
-- ----------------------------
DROP TABLE IF EXISTS `llm_embed_store`;
CREATE TABLE `llm_embed_store` (
  `id` varchar(50) NOT NULL COMMENT '主键',
  `name` varchar(100) DEFAULT NULL COMMENT '别名',
  `provider` varchar(100) DEFAULT NULL COMMENT '供应商',
  `host` varchar(100) DEFAULT NULL COMMENT '地址',
  `port` int(11) DEFAULT NULL COMMENT '端口',
  `username` varchar(100) DEFAULT NULL COMMENT '用户名',
  `password` varchar(100) DEFAULT NULL COMMENT '密码',
  `database_name` varchar(100) DEFAULT NULL COMMENT '数据库名称',
  `table_name` varchar(100) DEFAULT NULL COMMENT '表名称',
  `dimension` int(11) DEFAULT NULL COMMENT '向量维数',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Embedding向量数据库配置表';

-- ----------------------------
-- Records of llm_embed_store
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for llm_execution
-- ----------------------------
DROP TABLE IF EXISTS `llm_execution`;
CREATE TABLE `llm_execution` (
  `id` varchar(36) NOT NULL COMMENT '主键UUID',
  `app_id` varchar(36) NOT NULL COMMENT '应用ID',
  `conversation_id` varchar(36) DEFAULT NULL COMMENT '会话ID',
  `user_id` varchar(36) DEFAULT NULL COMMENT '用户ID',
  `user_name` varchar(100) DEFAULT NULL COMMENT '用户名',
  `request_message` text COMMENT '用户输入消息',
  `response_message` text COMMENT '最终输出',
  `status` varchar(20) NOT NULL DEFAULT 'running' COMMENT '执行状态: running/success/failed',
  `error_message` text COMMENT '错误信息',
  `total_input_tokens` int(11) DEFAULT '0' COMMENT '总输入token',
  `total_output_tokens` int(11) DEFAULT '0' COMMENT '总输出token',
  `total_duration` bigint(20) DEFAULT '0' COMMENT '总执行时长(ms)',
  `execution_path` text COMMENT '执行路径摘要',
  `trigger_type` varchar(20) NOT NULL DEFAULT 'chat' COMMENT '触发类型: chat/api',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_app_id` (`app_id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工作流执行记录';

-- ----------------------------
-- Records of llm_execution
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for llm_execution_node
-- ----------------------------
DROP TABLE IF EXISTS `llm_execution_node`;
CREATE TABLE `llm_execution_node` (
  `id` varchar(36) NOT NULL COMMENT '主键UUID',
  `execution_id` varchar(36) NOT NULL COMMENT '执行记录ID',
  `node_uuid` varchar(36) NOT NULL COMMENT '节点UUID',
  `node_type` varchar(50) NOT NULL COMMENT '节点类型',
  `node_title` varchar(100) DEFAULT NULL COMMENT '节点标题',
  `input_params` text COMMENT '输入参数JSON',
  `output_params` text COMMENT '输出参数JSON',
  `output_text` text COMMENT '输出文本',
  `logs` text COMMENT '完整日志JSON',
  `status` varchar(20) NOT NULL DEFAULT 'running' COMMENT '节点状态: running/success/failed',
  `error_message` text COMMENT '错误信息',
  `input_tokens` int(11) DEFAULT '0' COMMENT '输入token',
  `output_tokens` int(11) DEFAULT '0' COMMENT '输出token',
  `duration` bigint(20) DEFAULT '0' COMMENT '执行时长(ms)',
  `sort_order` int(11) NOT NULL DEFAULT '0' COMMENT '执行顺序',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_execution_id` (`execution_id`),
  KEY `idx_node_type` (`node_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工作流节点执行记录';

-- ----------------------------
-- Records of llm_execution_node
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for llm_knowledge
-- ----------------------------
DROP TABLE IF EXISTS `llm_knowledge`;
CREATE TABLE `llm_knowledge` (
  `id` varchar(50) NOT NULL COMMENT '主键',
  `user_id` varchar(50) DEFAULT NULL COMMENT '用户ID',
  `embed_store_id` varchar(50) DEFAULT NULL COMMENT '向量数据库ID',
  `embed_model_id` varchar(50) DEFAULT NULL COMMENT '向量模型ID',
  `name` varchar(50) DEFAULT NULL COMMENT '知识库名称',
  `des` varchar(255) DEFAULT NULL COMMENT '描述',
  `cover` varchar(255) DEFAULT NULL COMMENT '封面',
  `create_time` varchar(50) DEFAULT NULL COMMENT '创建时间',
  `chunk_strategy` varchar(32) DEFAULT 'RECURSIVE' COMMENT '分块策略: RECURSIVE/FIXED_SIZE',
  `chunk_size` int(11) DEFAULT '512' COMMENT '分块粒度(默认512)',
  `chunk_overlap` int(11) DEFAULT '50' COMMENT '重叠长度(默认50)',
  `chunk_unit` varchar(16) DEFAULT 'TOKEN' COMMENT '分块单位: TOKEN/CHAR',
  `embedding_config` text COMMENT 'Embedding模型参数配置JSON',
  `retrieval_config` text COMMENT '检索策略配置JSON',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='知识库表';

-- ----------------------------
-- Records of llm_knowledge
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for llm_message
-- ----------------------------
DROP TABLE IF EXISTS `llm_message`;
CREATE TABLE `llm_message` (
  `id` varchar(50) NOT NULL COMMENT '主键',
  `user_id` varchar(50) DEFAULT NULL COMMENT '用户ID',
  `conversation_id` varchar(50) DEFAULT NULL COMMENT '会话ID',
  `chat_id` varchar(50) DEFAULT NULL COMMENT '消息的ID',
  `username` varchar(100) DEFAULT NULL COMMENT '用户名',
  `ip` varchar(50) DEFAULT NULL COMMENT 'IP地址',
  `role` varchar(10) DEFAULT NULL COMMENT '角色，user和assistant',
  `app_id` varchar(255) DEFAULT NULL COMMENT '应用ID',
  `message` text COMMENT '消息内容',
  `tokens` int(11) DEFAULT NULL,
  `prompt_tokens` int(11) DEFAULT NULL,
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `model_name` varchar(128) DEFAULT NULL COMMENT '模型名称',
  `files` text COMMENT '附件文件列表（JSON格式）',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `conversation_id` (`conversation_id`) USING BTREE,
  KEY `role` (`role`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对话消息表';

-- ----------------------------
-- Records of llm_message
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for llm_model
-- ----------------------------
DROP TABLE IF EXISTS `llm_model`;
CREATE TABLE `llm_model` (
  `id` varchar(50) NOT NULL COMMENT '主键',
  `type` varchar(100) DEFAULT NULL COMMENT '类型: CHAT、Embedding、Image',
  `model` varchar(100) DEFAULT NULL COMMENT '模型名称',
  `provider` varchar(100) DEFAULT NULL COMMENT '供应商',
  `name` varchar(100) DEFAULT NULL COMMENT '别名',
  `response_limit` int(11) DEFAULT NULL COMMENT '响应长度',
  `temperature` double DEFAULT NULL COMMENT '温度',
  `top_p` double DEFAULT NULL,
  `api_key` varchar(100) DEFAULT NULL,
  `base_url` varchar(100) DEFAULT NULL,
  `secret_key` varchar(100) DEFAULT NULL,
  `endpoint` varchar(100) DEFAULT NULL,
  `azure_deployment_name` varchar(100) DEFAULT NULL COMMENT 'azure模型参数',
  `gemini_project` varchar(100) DEFAULT NULL COMMENT 'gemini模型参数',
  `gemini_location` varchar(100) DEFAULT NULL COMMENT 'gemini模型参数',
  `image_size` varchar(50) DEFAULT NULL COMMENT '图片大小',
  `image_quality` varchar(50) DEFAULT NULL COMMENT '图片质量',
  `image_style` varchar(50) DEFAULT NULL COMMENT '图片风格',
  `dimension` int(11) DEFAULT NULL COMMENT '向量维数',
  `fps` double DEFAULT '2' COMMENT 'MIMO视频抽帧率，范围0.1-10，默认2',
  `media_resolution` varchar(20) DEFAULT 'default' COMMENT 'MIMO媒体分辨率档次：default或max',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='LLM模型配置表';

-- ----------------------------
-- Records of llm_model
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for llm_oss
-- ----------------------------
DROP TABLE IF EXISTS `llm_oss`;
CREATE TABLE `llm_oss` (
  `id` varchar(50) NOT NULL COMMENT '主键',
  `user_id` varchar(50) DEFAULT NULL COMMENT '用户ID',
  `oss_id` varchar(50) DEFAULT NULL,
  `original_filename` varchar(50) DEFAULT NULL COMMENT '原始文件名称',
  `filename` varchar(50) DEFAULT NULL COMMENT '文件存储名称',
  `url` varchar(100) DEFAULT NULL COMMENT '文件地址',
  `base_path` varchar(100) DEFAULT NULL COMMENT '桶路径',
  `path` varchar(100) DEFAULT NULL COMMENT '文件的绝对路径',
  `size` int(11) DEFAULT NULL COMMENT '文件大小',
  `ext` varchar(50) DEFAULT NULL COMMENT '文件后缀',
  `content_type` varchar(100) DEFAULT NULL COMMENT '文件头',
  `platform` varchar(50) DEFAULT NULL COMMENT '平台',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源文件表';

-- ----------------------------
-- Records of llm_oss
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for llm_tool
-- ----------------------------
DROP TABLE IF EXISTS `llm_tool`;
CREATE TABLE `llm_tool` (
  `id` varchar(64) NOT NULL COMMENT '主键ID',
  `name` varchar(128) NOT NULL COMMENT '工具名称',
  `description` varchar(512) DEFAULT NULL COMMENT '工具描述',
  `tool_type` varchar(32) NOT NULL COMMENT '工具类型: HTTP',
  `parameters_schema` text COMMENT '参数JSON Schema',
  `endpoint_url` varchar(512) DEFAULT NULL COMMENT 'HTTP端点URL',
  `http_method` varchar(16) DEFAULT 'POST' COMMENT 'HTTP方法',
  `headers` text COMMENT '自定义请求头JSON',
  `is_deleted` tinyint(1) DEFAULT '0' COMMENT '是否删除',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='自定义工具定义表';

-- ----------------------------
-- Records of llm_tool
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for llm_workflow
-- ----------------------------
DROP TABLE IF EXISTS `llm_workflow`;
CREATE TABLE `llm_workflow` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(64) NOT NULL,
  `app_id` varchar(64) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `remark` varchar(500) DEFAULT NULL,
  `is_enable` tinyint(1) DEFAULT '1',
  `is_deleted` tinyint(1) DEFAULT '0',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_uuid` (`uuid`),
  KEY `idx_app_id` (`app_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COMMENT='LLM工作流';

-- ----------------------------
-- Records of llm_workflow
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for llm_workflow_edge
-- ----------------------------
DROP TABLE IF EXISTS `llm_workflow_edge`;
CREATE TABLE `llm_workflow_edge` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(64) NOT NULL,
  `workflow_id` bigint(20) NOT NULL,
  `source_node_uuid` varchar(64) NOT NULL,
  `source_handle` varchar(64) DEFAULT NULL,
  `target_node_uuid` varchar(64) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_workflow_id` (`workflow_id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COMMENT='LLM工作流边';

-- ----------------------------
-- Records of llm_workflow_edge
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for llm_workflow_node
-- ----------------------------
DROP TABLE IF EXISTS `llm_workflow_node`;
CREATE TABLE `llm_workflow_node` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(64) NOT NULL,
  `workflow_id` bigint(20) NOT NULL,
  `node_type` varchar(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `remark` varchar(500) DEFAULT NULL,
  `input_config` text,
  `node_config` text,
  `position_x` double DEFAULT '0',
  `position_y` double DEFAULT '0',
  `is_deleted` tinyint(1) DEFAULT '0',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `output_config` text,
  PRIMARY KEY (`id`),
  KEY `idx_workflow_id` (`workflow_id`),
  KEY `idx_uuid` (`uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COMMENT='LLM工作流节点';

-- ----------------------------
-- Records of llm_workflow_node
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for sys_dept
-- ----------------------------
DROP TABLE IF EXISTS `sys_dept`;
CREATE TABLE `sys_dept` (
  `id` varchar(32) NOT NULL COMMENT 'PK',
  `parent_id` varchar(32) DEFAULT NULL COMMENT '父级id',
  `dept_name` varchar(50) NOT NULL COMMENT '部门名称',
  `leader` varchar(10) DEFAULT NULL COMMENT '负责人',
  `leader_phone` varchar(50) DEFAULT NULL COMMENT '负责人联系电话',
  `sort` int(11) DEFAULT NULL COMMENT '排序序号',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除：0.显示；1.隐藏；',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '修改时间',
  `tenant_id` varchar(32) NOT NULL COMMENT '租户id',
  `status` varchar(2) DEFAULT NULL COMMENT '状态：0.正常；1.停用；',
  `create_by` varchar(60) DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(60) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='部门';

-- ----------------------------
-- Records of sys_dept
-- ----------------------------
BEGIN;
INSERT INTO `sys_dept` (`id`, `parent_id`, `dept_name`, `leader`, `leader_phone`, `sort`, `del_flag`, `create_time`, `update_time`, `tenant_id`, `status`, `create_by`, `update_by`) VALUES ('1', '0', '系统租户', 'lijx', '17615123397', 1, '0', '2022-02-18 17:46:40', '2024-11-08 16:25:23', '1881232176465358849', '0', NULL, 'admin');
INSERT INTO `sys_dept` (`id`, `parent_id`, `dept_name`, `leader`, `leader_phone`, `sort`, `del_flag`, `create_time`, `update_time`, `tenant_id`, `status`, `create_by`, `update_by`) VALUES ('2', '1', '测试部门', NULL, NULL, NULL, '0', NULL, NULL, '1881232176465358849', '0', NULL, NULL);
INSERT INTO `sys_dept` (`id`, `parent_id`, `dept_name`, `leader`, `leader_phone`, `sort`, `del_flag`, `create_time`, `update_time`, `tenant_id`, `status`, `create_by`, `update_by`) VALUES ('3', '1', '研发部门', NULL, NULL, 1, '0', '2025-01-20 14:47:58', NULL, '1881232176465358849', '0', '', NULL);
INSERT INTO `sys_dept` (`id`, `parent_id`, `dept_name`, `leader`, `leader_phone`, `sort`, `del_flag`, `create_time`, `update_time`, `tenant_id`, `status`, `create_by`, `update_by`) VALUES ('4', '1', '产品部门', NULL, NULL, NULL, '0', NULL, NULL, '1881232176465358849', '0', NULL, NULL);
INSERT INTO `sys_dept` (`id`, `parent_id`, `dept_name`, `leader`, `leader_phone`, `sort`, `del_flag`, `create_time`, `update_time`, `tenant_id`, `status`, `create_by`, `update_by`) VALUES ('5', '3', '研发一组', NULL, NULL, NULL, '0', NULL, NULL, '1881232176465358849', '0', NULL, NULL);
INSERT INTO `sys_dept` (`id`, `parent_id`, `dept_name`, `leader`, `leader_phone`, `sort`, `del_flag`, `create_time`, `update_time`, `tenant_id`, `status`, `create_by`, `update_by`) VALUES ('6', '3', '研发二组', NULL, NULL, NULL, '0', NULL, NULL, '1881232176465358849', '0', NULL, NULL);
INSERT INTO `sys_dept` (`id`, `parent_id`, `dept_name`, `leader`, `leader_phone`, `sort`, `del_flag`, `create_time`, `update_time`, `tenant_id`, `status`, `create_by`, `update_by`) VALUES ('7', '5', '业务小队', NULL, NULL, NULL, '0', NULL, '2026-03-03 15:14:38', '1881232176465358849', '0', NULL, 'admin');
INSERT INTO `sys_dept` (`id`, `parent_id`, `dept_name`, `leader`, `leader_phone`, `sort`, `del_flag`, `create_time`, `update_time`, `tenant_id`, `status`, `create_by`, `update_by`) VALUES ('8', '5', '硬件小队', NULL, NULL, NULL, '0', NULL, NULL, '1881232176465358849', '0', NULL, NULL);
COMMIT;

-- ----------------------------
-- Table structure for sys_dict
-- ----------------------------
DROP TABLE IF EXISTS `sys_dict`;
CREATE TABLE `sys_dict` (
  `id` varchar(32) NOT NULL COMMENT 'PK',
  `type` varchar(50) DEFAULT NULL COMMENT '类型',
  `description` varchar(100) DEFAULT NULL COMMENT '描述',
  `status` varchar(2) DEFAULT NULL COMMENT '状态：0.正常；1.停用；',
  `remarks` varchar(100) DEFAULT NULL COMMENT '备注',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除：0.显示；1.隐藏；',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '修改时间',
  `create_by` varchar(60) DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(60) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='字典表';

-- ----------------------------
-- Records of sys_dict
-- ----------------------------
BEGIN;
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1583357541572108290', 'sys_storage_type', '文件存储类型', '0', '文件存储配置类型', '0', '2022-10-21 15:20:31', '2022-10-21 15:55:51', NULL, NULL);
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1585639342383202305', 'status', '状态', '0', '状态', '0', '2022-10-27 22:27:33', NULL, NULL, NULL);
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1590901687026937857', 'application_key', '应用key', '0', '应用key用于租户授权', '0', '2022-11-11 10:58:14', NULL, NULL, NULL);
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1597072635358756866', 'log_status', '日志状态', '0', NULL, '0', '2022-11-28 11:39:23', NULL, NULL, NULL);
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1825786096614240258', 'pay_type', '支付类型', '0', '支付类型', '0', '2024-08-20 14:45:02', '2024-08-20 14:46:05', 'admin', 'admin');
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1825786632403021826', 'pay_status', '支付状态', '0', '支付状态：0.未支付；1.已支付;', '0', '2024-08-20 14:47:09', '2024-08-20 14:47:09', 'admin', 'admin');
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1825787265549987842', 'delivery_way', '配送方式', '0', '配送方式', '0', '2024-08-20 14:49:40', '2024-08-20 14:49:40', 'admin', 'admin');
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1845468560374734850', 'user_source', '用户来源', '0', '用户来源', '0', '2024-10-13 22:16:07', NULL, 'admin', NULL);
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1855529374229479425', 'menu_type', '菜单类型', '0', '菜单类型', '0', '2024-11-10 16:34:12', NULL, 'admin', NULL);
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1869292192170770434', 'user_sex', '用户性别', '0', '用户性别', '0', '2024-12-18 16:02:43', NULL, 'lijx', NULL);
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1871032754213273601', 'goods_status', '商品状态', '0', '商品状态', '0', '2024-12-23 11:19:05', NULL, 'admin', NULL);
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1871032929883308033', 'goods_specs', '商品规格类型', '0', '商品规格类型', '0', '2024-12-23 11:19:47', NULL, 'admin', NULL);
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1871381190397775873', 'refund_status', '退款状态', '0', '退款状态', '0', '2024-12-24 10:23:39', '2024-12-24 10:23:44', 'lijx', 'lijx');
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1905998662952812546', 'freight_type', '运费类型', '0', '运费类型：0.包邮；1.固定运费；', '0', '2025-03-29 23:01:08', '2025-03-29 23:01:14', 'system', 'system');
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1911974209927307266', 'order_status', '订单状态', '0', '订单状态', '0', '2025-04-15 10:45:49', NULL, 'system', NULL);
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1915049899597111298', 'order_item_status', '订单项状态', '0', '订单项状态', '0', '2025-04-23 22:27:31', NULL, 'system', NULL);
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1915429675147091970', 'refund_type', '退款类型', '0', '退款类型', '0', '2025-04-24 23:36:36', NULL, 'system', NULL);
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1917043550726402050', 'order_delivery_status', '发货状态', '0', NULL, '0', '2025-04-29 10:29:34', NULL, 'system', NULL);
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1927953218776702978', 'pay_terminal_type', '支付端类型', '0', '支付端类型：0-小程序，1-App，2-H5，3-PC，4-公众号', '0', '2025-05-29 13:00:42', NULL, 'system', NULL);
INSERT INTO `sys_dict` (`id`, `type`, `description`, `status`, `remarks`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`) VALUES ('1929205944271659009', 'mq_delay_time_level', 'MQ延迟时间级别', '0', 'MQ延迟时间级别', '0', '2025-06-01 23:58:35', NULL, 'system', NULL);
COMMIT;

-- ----------------------------
-- Table structure for sys_dict_value
-- ----------------------------
DROP TABLE IF EXISTS `sys_dict_value`;
CREATE TABLE `sys_dict_value` (
  `id` varchar(32) NOT NULL COMMENT 'PK',
  `dict_id` varchar(32) NOT NULL COMMENT '字典主键',
  `dict_label` varchar(50) DEFAULT NULL COMMENT '字典标签',
  `dict_value` varchar(100) DEFAULT NULL COMMENT '字典键值',
  `dict_type` varchar(50) DEFAULT NULL COMMENT '字典类型',
  `status` varchar(2) DEFAULT NULL COMMENT '状态：0.正常；1.停用；',
  `remarks` varchar(100) DEFAULT NULL COMMENT '备注',
  `sort` int(11) DEFAULT NULL COMMENT '排序序号',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除：0.显示；1.隐藏；',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '修改时间',
  `create_by` varchar(60) DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(60) DEFAULT NULL COMMENT '修改人',
  `show_class` varchar(100) DEFAULT NULL COMMENT '回显样式',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='字典键值表';

-- ----------------------------
-- Records of sys_dict_value
-- ----------------------------
BEGIN;
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1583358198555303938', '1583357541572108290', '阿里OSS', '1', 'sys_storage_type', '0', '阿里OSS', 1, '0', '2022-10-21 15:23:07', NULL, NULL, NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1583358231816134658', '1583357541572108290', '七牛云', '3', 'sys_storage_type', '0', '七牛云', 2, '0', '2022-10-21 15:23:15', '2022-10-21 15:25:30', NULL, NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1583364488060952577', '1583357541572108290', '腾讯云', '2', 'sys_storage_type', '0', '腾讯云', 3, '0', '2022-10-21 15:48:06', NULL, NULL, NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1585639417511575553', '1585639342383202305', '正常', '0', 'status', '0', '正常', 1, '0', '2022-10-27 22:27:51', NULL, NULL, NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1585639464043184129', '1585639342383202305', '停用', '1', 'status', '0', '停用', 2, '0', '2022-10-27 22:28:02', '2024-11-08 15:10:50', NULL, 'admin', NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1590901958058668034', '1590901687026937857', '基础应用', 'app_base', 'application_key', '0', '商城基础功能', 1, '0', '2022-11-11 10:59:19', '2022-11-11 16:05:37', NULL, NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1590902082256203777', '1590901687026937857', '营销应用', 'app_market', 'application_key', '0', '营销应用包括（优惠券/多人拼团）', 2, '0', '2022-11-11 10:59:48', '2022-11-11 16:05:38', NULL, NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1590902629520601090', '1590901687026937857', '微信小程序', 'app_wechat', 'application_key', '0', '微信小程序', 4, '0', '2022-11-11 11:01:59', '2022-11-11 16:05:40', NULL, NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1592543489640525826', '1590901687026937857', '平台应用', 'sys_key', 'application_key', '0', '平台应用', 5, '0', '2022-11-15 23:42:11', '2022-11-15 23:44:14', NULL, NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1597072888086544385', '1597072635358756866', '成功', '1', 'log_status', '0', '成功', 1, '0', '2022-11-28 11:40:23', NULL, NULL, NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1597072943552020482', '1597072635358756866', '失败', '0', 'log_status', '0', '失败', 2, '0', '2022-11-28 11:40:36', NULL, NULL, NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1825786144924233730', '1825786096614240258', '微信支付', '1', 'pay_type', '0', '微信支付', 1, '0', '2024-08-20 14:45:13', '2024-12-24 10:04:11', 'admin', 'lijx', 'success');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1825786177023242241', '1825786096614240258', '支付宝支付', '2', 'pay_type', '0', '支付宝支付', 2, '0', '2024-08-20 14:45:21', '2024-12-24 10:04:08', 'admin', 'lijx', 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1825786695783149569', '1825786632403021826', '未支付', '0', 'pay_status', '0', '未支付', 0, '0', '2024-08-20 14:47:24', NULL, 'admin', NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1825786736451121153', '1825786632403021826', '已支付', '1', 'pay_status', '0', '已支付', 1, '0', '2024-08-20 14:47:34', NULL, 'admin', NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1825787338904170497', '1825787265549987842', '普通快递', '1', 'delivery_way', '0', '普通快递', 1, '0', '2024-08-20 14:49:58', NULL, 'admin', NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1825787372362133505', '1825787265549987842', '上门自提', '2', 'delivery_way', '0', '上门自提', 2, '0', '2024-08-20 14:50:06', NULL, 'admin', NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1845468623192825858', '1845468560374734850', '微信小程序', 'WX_MA', 'user_source', '0', '微信小程序', 1, '0', '2024-10-13 22:16:22', NULL, 'admin', NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1845468655694487554', '1845468560374734850', 'APP', 'APP', 'user_source', '0', 'APP', 2, '0', '2024-10-13 22:16:29', '2025-05-22 21:49:47', 'admin', 'system', NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1845468737055596546', '1845468560374734850', '普通H5', 'H5', 'user_source', '0', '普通H5', 3, '0', '2024-10-13 22:16:49', NULL, 'admin', NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1855529435244019713', '1855529374229479425', '菜单', '0', 'menu_type', '0', '菜单', 0, '0', '2024-11-10 16:34:26', NULL, 'admin', NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1855529480534114306', '1855529374229479425', '按钮', '1', 'menu_type', '0', '按钮', 1, '0', '2024-11-10 16:34:37', NULL, 'admin', NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1869292244662484994', '1869292192170770434', '男', '1', 'user_sex', '0', '男', 1, '0', '2024-12-18 16:02:56', NULL, 'lijx', NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1869292302673903618', '1869292192170770434', '女', '2', 'user_sex', '0', '女', 2, '0', '2024-12-18 16:03:09', NULL, 'lijx', NULL, NULL);
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1871032820101595138', '1871032754213273601', '已下架', '0', 'goods_status', '0', '已下架', 0, '0', '2024-12-23 11:19:21', '2024-12-23 11:31:45', 'admin', 'admin', 'danger');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1871032850510299138', '1871032754213273601', '已上架', '1', 'goods_status', '0', '已上架', 1, '0', '2024-12-23 11:19:28', '2024-12-23 11:31:49', 'admin', 'admin', 'success');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1871033002629316609', '1871032929883308033', '单规格', '0', 'goods_specs', '0', '单规格', 0, '0', '2024-12-23 11:20:05', '2024-12-23 11:31:19', 'admin', 'admin', 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1871033035990810626', '1871032929883308033', '多规格', '1', 'goods_specs', '0', '多规格', 1, '0', '2024-12-23 11:20:13', '2024-12-23 11:31:25', 'admin', 'admin', 'success');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1871381497785733121', '1871381190397775873', '待审核', '1', 'refund_status', '0', '待审核', 1, '0', '2024-12-24 10:24:52', '2025-04-23 22:56:30', 'lijx', 'system', 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1871381692225277953', '1871381190397775873', '退款中', '5', 'refund_status', '0', '退款中', 5, '0', '2024-12-24 10:25:39', '2025-04-23 22:57:34', 'lijx', 'system', 'warning');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1905998759681851393', '1905998662952812546', '包邮', '0', 'freight_type', '0', '包邮', 0, '0', '2025-03-29 23:01:31', NULL, 'system', NULL, 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1905998803931758593', '1905998662952812546', '固定运费', '1', 'freight_type', '0', '固定运费', 1, '0', '2025-03-29 23:01:41', NULL, 'system', NULL, 'success');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1911974266093232129', '1911974209927307266', '已完成', '4', 'order_status', '0', '已完成', 4, '0', '2025-04-15 10:46:02', '2025-04-15 10:46:41', 'system', 'system', 'success');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1911974503704748033', '1911974209927307266', '待付款', '1', 'order_status', '0', '待付款', 1, '0', '2025-04-15 10:46:59', NULL, 'system', NULL, 'danger');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1911974545500987393', '1911974209927307266', '待发货', '2', 'order_status', '0', '待发货', 2, '0', '2025-04-15 10:47:09', NULL, 'system', NULL, 'info');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1911974577667104769', '1911974209927307266', '待收货', '3', 'order_status', '0', '待收货', 3, '0', '2025-04-15 10:47:17', NULL, 'system', NULL, 'warning');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1911974706469986306', '1911974209927307266', '退款中', '5', 'order_status', '0', '退款中', 5, '0', '2025-04-15 10:47:47', NULL, 'system', NULL, 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1911974804155326466', '1911974209927307266', '已取消', '11', 'order_status', '0', '已取消', 11, '0', '2025-04-15 10:48:11', NULL, 'system', NULL, 'danger');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1915055950136483842', '1915049899597111298', '待发货', '1', 'order_item_status', '0', '待发货', 1, '0', '2025-04-23 22:51:33', '2025-04-27 22:01:15', 'system', 'system', 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1915056021531926530', '1915049899597111298', '已发货', '2', 'order_item_status', '0', '已发货', 2, '0', '2025-04-23 22:51:50', NULL, 'system', NULL, 'success');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1915056057670049794', '1915049899597111298', '售后处理中', '3', 'order_item_status', '0', '售后处理中', 3, '0', '2025-04-23 22:51:59', NULL, 'system', NULL, 'warning');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1915056181846614018', '1915049899597111298', '退款完成', '6', 'order_item_status', '0', '退款完成', 6, '0', '2025-04-23 22:52:28', NULL, 'system', NULL, 'success');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1915059719180001281', '1871381190397775873', '退款完成', '6', 'refund_status', '0', '退款完成', 6, '0', '2025-04-23 23:06:32', NULL, 'system', NULL, 'success');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1915059788511846402', '1871381190397775873', '退款失败', '8', 'refund_status', '0', '退款失败', 8, '0', '2025-04-23 23:06:48', '2025-04-23 23:06:56', 'system', 'system', 'danger');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1915429758689239042', '1915429675147091970', '仅退款', '1', 'refund_type', '0', '仅退款', 1, '0', '2025-04-24 23:36:56', NULL, 'system', NULL, 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1915429822904033282', '1915429675147091970', '退货', '2', 'refund_type', '0', '退货', 2, '0', '2025-04-24 23:37:11', '2025-05-04 20:02:10', 'system', 'system', 'danger');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1916502673673310210', '1871381190397775873', '审核拒绝', '9', 'refund_status', '0', '审核拒绝', 9, '0', '2025-04-27 22:40:19', NULL, 'system', NULL, 'danger');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1917043781987741698', '1917043550726402050', '在途', '0', 'order_delivery_status', '0', '在途', 0, '0', '2025-04-29 10:30:29', NULL, 'system', NULL, 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1917043829500817409', '1917043550726402050', '揽收', '1', 'order_delivery_status', '0', '揽收', 1, '0', '2025-04-29 10:30:41', NULL, 'system', NULL, 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1917043861100703745', '1917043550726402050', '疑难', '2', 'order_delivery_status', '0', '疑难', 2, '0', '2025-04-29 10:30:48', NULL, 'system', NULL, 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1917043894059544578', '1917043550726402050', '签收', '3', 'order_delivery_status', '0', '签收', 3, '0', '2025-04-29 10:30:56', NULL, 'system', NULL, 'success');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1917043937143435265', '1917043550726402050', '退签', '4', 'order_delivery_status', '0', '退签', 4, '0', '2025-04-29 10:31:06', NULL, 'system', NULL, 'info');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1917043975538094081', '1917043550726402050', '派件', '5', 'order_delivery_status', '0', '派件', 5, '0', '2025-04-29 10:31:15', NULL, 'system', NULL, 'success');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1917044010703138818', '1917043550726402050', '清关', '8', 'order_delivery_status', '0', '清关', 8, '0', '2025-04-29 10:31:24', NULL, 'system', NULL, 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1917044170027970561', '1917043550726402050', '退回', '6', 'order_delivery_status', '0', '退回', 6, '0', '2025-04-29 10:32:02', NULL, 'system', NULL, 'info');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1917044210259734529', '1917043550726402050', '转投', '7', 'order_delivery_status', '0', '转投', 7, '0', '2025-04-29 10:32:11', NULL, 'system', NULL, 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1927953289186484225', '1927953218776702978', '小程序', '0', 'pay_terminal_type', '0', '小程序', 0, '0', '2025-05-29 13:00:58', NULL, 'system', NULL, 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1927953320081727490', '1927953218776702978', 'App', '1', 'pay_terminal_type', '0', 'App', 1, '0', '2025-05-29 13:01:06', NULL, 'system', NULL, 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1928119897173438466', '1825786096614240258', '0元支付', '0', 'pay_type', '0', '0元支付', 0, '0', '2025-05-30 00:03:01', '2025-05-30 00:03:06', 'system', 'system', 'danger');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1928797196747186177', '1583357541572108290', 'MinIO', '4', 'sys_storage_type', '0', 'MinIO', 4, '0', '2025-05-31 20:54:22', NULL, 'system', NULL, 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1929205321706921986', '1915049899597111298', '已完成', '8', 'order_item_status', '0', '已完成', 8, '0', '2025-06-01 23:56:06', NULL, 'system', NULL, 'success');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1929206209452335106', '1929205944271659009', '5分钟', '9', 'mq_delay_time_level', '0', '5分钟', 9, '0', '2025-06-01 23:59:38', '2025-06-02 00:00:04', 'system', 'system', 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1929206253555441666', '1929205944271659009', '10分钟', '14', 'mq_delay_time_level', '0', '10分钟', 14, '0', '2025-06-01 23:59:48', NULL, 'system', NULL, 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1929206298094755842', '1929205944271659009', '20分钟', '15', 'mq_delay_time_level', '0', '20分钟', 15, '0', '2025-06-01 23:59:59', NULL, 'system', NULL, 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1929206364058574849', '1929205944271659009', '30分钟', '16', 'mq_delay_time_level', '0', '30分钟', 16, '0', '2025-06-02 00:00:15', NULL, 'system', NULL, 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1929206407276683265', '1929205944271659009', '1小时', '17', 'mq_delay_time_level', '0', '1小时', 17, '0', '2025-06-02 00:00:25', NULL, 'system', NULL, 'primary');
INSERT INTO `sys_dict_value` (`id`, `dict_id`, `dict_label`, `dict_value`, `dict_type`, `status`, `remarks`, `sort`, `del_flag`, `create_time`, `update_time`, `create_by`, `update_by`, `show_class`) VALUES ('1929206449693679617', '1929205944271659009', '2小时', '18', 'mq_delay_time_level', '0', '2小时', 18, '0', '2025-06-02 00:00:35', NULL, 'system', NULL, 'primary');
COMMIT;

-- ----------------------------
-- Table structure for sys_file
-- ----------------------------
DROP TABLE IF EXISTS `sys_file`;
CREATE TABLE `sys_file` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '文件编号',
  `CONFIG_ID` bigint(20) DEFAULT NULL COMMENT '配置编号',
  `NAME` varchar(256) CHARACTER SET utf8 DEFAULT NULL COMMENT '文件名',
  `PATH` varchar(512) CHARACTER SET utf8 NOT NULL COMMENT '文件路径',
  `URL` varchar(1024) CHARACTER SET utf8 NOT NULL COMMENT '文件 URL',
  `TYPE` varchar(128) CHARACTER SET utf8 DEFAULT NULL COMMENT '文件类型',
  `SIZE` int(11) NOT NULL COMMENT '文件大小',
  `CREATOR` varchar(64) CHARACTER SET utf8 DEFAULT '' COMMENT '创建者',
  `CREATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `UPDATER` varchar(64) CHARACTER SET utf8 DEFAULT '' COMMENT '更新者',
  `UPDATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `DELETED` decimal(1,0) NOT NULL DEFAULT '0' COMMENT '是否删除',
  PRIMARY KEY (`ID`) USING BTREE,
  UNIQUE KEY `ID_177589379498200` (`ID`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2026913144536514866 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='文件表';

-- ----------------------------
-- Records of sys_file
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for sys_file_config
-- ----------------------------
DROP TABLE IF EXISTS `sys_file_config`;
CREATE TABLE `sys_file_config` (
  `ID` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '编号',
  `NAME` varchar(63) CHARACTER SET utf8 NOT NULL COMMENT '配置名',
  `STORAGE` tinyint(4) NOT NULL COMMENT '存储器',
  `REMARK` varchar(255) CHARACTER SET utf8 DEFAULT NULL COMMENT '备注',
  `MASTER` decimal(1,0) NOT NULL COMMENT '是否为主配置',
  `CONFIG` varchar(4096) CHARACTER SET utf8 NOT NULL COMMENT '存储配置',
  `CREATOR` varchar(64) CHARACTER SET utf8 DEFAULT '' COMMENT '创建者',
  `CREATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `UPDATER` varchar(64) CHARACTER SET utf8 DEFAULT '' COMMENT '更新者',
  `UPDATE_TIME` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `DELETED` decimal(1,0) NOT NULL DEFAULT '0' COMMENT '是否删除',
  PRIMARY KEY (`ID`) USING BTREE,
  UNIQUE KEY `ID_177589399585100` (`ID`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='文件配置表';

-- ----------------------------
-- Records of sys_file_config
-- ----------------------------
BEGIN;
INSERT INTO `sys_file_config` (`ID`, `NAME`, `STORAGE`, `REMARK`, `MASTER`, `CONFIG`, `CREATOR`, `CREATE_TIME`, `UPDATER`, `UPDATE_TIME`, `DELETED`) VALUES (1, '七牛存储器', 20, '这是一个七牛云的对象存储', 0, '{\"@class\": \"cn.nitemoon.cloud.common.storage.core.client.s3.S3FileClientConfig\", \"bucket\": \"nitemoon\", \"domain\": \"https://storage.nitemoon.cn\", \"endpoint\": \"s3.cn-south-1.qiniucs.com\", \"accessKey\": \"xxxxxxxxxxxxxxxxxxxx\", \"accessSecret\": \"xxxxxxxxxxxxxxxxxxxx\", \"backendDomain\": \"https://platform.nitemoon.cn/api\", \"privateBucket\": false}', 'nutgin', '2024-01-13 22:11:12', NULL, '2026-06-16 15:44:14', 0);
INSERT INTO `sys_file_config` (`ID`, `NAME`, `STORAGE`, `REMARK`, `MASTER`, `CONFIG`, `CREATOR`, `CREATE_TIME`, `UPDATER`, `UPDATE_TIME`, `DELETED`) VALUES (2, '本地', 10, '这是本地存储', 1, '{\"@class\":\"cn.nitemoon.cloud.common.storage.core.client.local.LocalFileClientConfig\",\"basePath\":\"/data/doggy/pic/\",\"domain\":\"https://platform.nitemoon.cn/api\"}', 'nutgin', '2024-04-08 16:02:37', NULL, '2026-06-16 15:44:14', 0);
COMMIT;

-- ----------------------------
-- Table structure for sys_log
-- ----------------------------
DROP TABLE IF EXISTS `sys_log`;
CREATE TABLE `sys_log` (
  `id` varchar(32) NOT NULL COMMENT 'PK',
  `ip_addr` varchar(255) DEFAULT NULL COMMENT 'ip地址',
  `status` char(2) DEFAULT NULL COMMENT '状态：0.失败；1.成功；',
  `create_time` datetime DEFAULT NULL COMMENT '新增时间',
  `location` varchar(255) DEFAULT NULL COMMENT '登录地点',
  `user_name` varchar(255) DEFAULT NULL COMMENT '登录用户',
  `title` varchar(255) DEFAULT '' COMMENT '日志标题',
  `request_method` varchar(255) DEFAULT NULL COMMENT '请求方式',
  `request_uri` varchar(255) DEFAULT NULL COMMENT '请求URI',
  `request_params` text COMMENT '请求数据',
  `request_time` bigint(20) DEFAULT NULL COMMENT '请求时长',
  `ex_msg` varchar(1024) DEFAULT NULL COMMENT '异常信息',
  `method` varchar(255) DEFAULT NULL COMMENT '操作方法',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除：0.显示；1.隐藏；',
  `tenant_id` varchar(32) NOT NULL COMMENT '租户id',
  `create_by` varchar(60) DEFAULT NULL COMMENT '创建人',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='操作日志';

-- ----------------------------
-- Records of sys_log
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for sys_login_log
-- ----------------------------
DROP TABLE IF EXISTS `sys_login_log`;
CREATE TABLE `sys_login_log` (
  `id` varchar(32) NOT NULL COMMENT 'PK',
  `ip_addr` varchar(255) DEFAULT NULL COMMENT 'ip地址',
  `status` char(2) DEFAULT NULL COMMENT '状态：0.失败；1.成功；',
  `user_name` varchar(255) DEFAULT NULL COMMENT '登录用户',
  `location` varchar(255) DEFAULT NULL COMMENT '登录地点',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `msg` varchar(255) DEFAULT NULL COMMENT '信息',
  `browser` varchar(255) DEFAULT NULL COMMENT '浏览器',
  `os` varchar(255) DEFAULT NULL COMMENT '操作系统',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除：0.显示；1.隐藏；',
  `tenant_id` varchar(32) NOT NULL COMMENT '租户id',
  `create_by` varchar(60) DEFAULT NULL COMMENT '创建人',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='登录日志';

-- ----------------------------
-- Records of sys_login_log
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for sys_menu
-- ----------------------------
DROP TABLE IF EXISTS `sys_menu`;
CREATE TABLE `sys_menu` (
  `id` varchar(32) NOT NULL COMMENT 'PK',
  `name` varchar(60) NOT NULL COMMENT '菜单名称',
  `en_name` varchar(60) DEFAULT NULL COMMENT '菜单英文名称',
  `permission` varchar(60) DEFAULT NULL COMMENT '菜单权限',
  `path` varchar(100) DEFAULT NULL COMMENT 'URL',
  `redirect` varchar(100) DEFAULT NULL COMMENT '重定向url',
  `parent_id` varchar(32) DEFAULT NULL COMMENT '父菜单ID',
  `icon` varchar(32) DEFAULT NULL COMMENT '图标',
  `component` varchar(500) DEFAULT NULL COMMENT '页面地址',
  `sort` int(11) NOT NULL DEFAULT '0' COMMENT '排序',
  `type` char(1) DEFAULT NULL COMMENT '类型: 0.菜单; 1.按钮;',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `outer_status` char(2) DEFAULT '0' COMMENT '外链状态：0.否；1.是；',
  `del_flag` char(2) NOT NULL DEFAULT '0' COMMENT '逻辑删除：0.显示；1.隐藏；',
  `application_key` varchar(32) DEFAULT NULL COMMENT '应用id',
  `create_by` varchar(60) DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(60) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='菜单表';

-- ----------------------------
-- Records of sys_menu
-- ----------------------------
BEGIN;
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('1', '系统管理', 'System Management', '', '/system', NULL, '0', 'ic-setting', 'Layout', 1, '0', '2017-12-27 16:39:07', '2026-02-09 01:41:12', '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('10', '系统日志', 'System Logs', 'upms:log:page', '/monitor/syslog', NULL, '2', NULL, '/pages/management/monitor/syslog', 2, '0', '2017-12-27 17:00:50', '2023-06-08 08:07:49', '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('11', '新增用户', 'Add User', 'upms:sysuser:add', '', NULL, '3', NULL, '', 0, '1', '2017-12-27 17:02:58', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('12', '修改用户', 'Edit User', 'upms:sysuser:edit', '', NULL, '3', NULL, '', 0, '1', '2017-12-27 17:04:07', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('13', '删除用户', 'Delete User', 'upms:sysuser:del', '', NULL, '3', NULL, '', 0, '1', '2017-12-27 17:04:58', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('130', '导出Excel', 'Export Excel', 'user:export', NULL, NULL, '3', NULL, NULL, 0, '1', '2019-01-23 06:35:16', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('131', '导出Excel', 'Export Excel', 'role:export', NULL, NULL, '4', NULL, NULL, 0, '1', '2019-01-23 06:35:36', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('132', '导出Excel', 'Export Excel', 'menu:export', NULL, NULL, '5', NULL, NULL, 0, '1', '2019-01-23 06:36:05', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('133', '导出Excel', 'Export Excel', 'dept:export', NULL, NULL, '6', NULL, NULL, 0, '1', '2019-01-23 06:36:25', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('135', '密码重置', 'Reset Password', 'upms:sysuser:password', NULL, NULL, '3', NULL, NULL, 0, '1', '2019-01-23 06:37:00', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('136', '导出Excel', 'Export Excel', 'log:export', NULL, NULL, '10', NULL, NULL, 0, '1', '2019-01-23 06:37:27', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('14', '新增角色', 'Add Role', 'upms:role:add', '', NULL, '4', NULL, '', 0, '1', '2017-12-27 17:06:38', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('15', '修改角色', 'Edit Role', 'upms:role:edit', '', NULL, '4', NULL, '', 0, '1', '2017-12-27 17:06:38', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('150', '登录日志', 'Login Logs', 'upms:loginlog:page', '/monitor/loginlog', NULL, '2', '', '/pages/management/monitor/loginlog', 3, '0', '2019-07-22 13:41:17', '2025-06-03 05:28:28', '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('151', '删除日志', 'Delete Log', 'loginlog:delete', NULL, NULL, '150', NULL, NULL, 0, '1', '2019-07-22 13:43:04', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('152', '导出Excel', 'Export Excel', 'loginlog:export', NULL, NULL, '150', NULL, NULL, 0, '1', '2019-07-22 13:43:30', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('153', '任务调度', 'Task Scheduler', '', '/scheduled', NULL, '0', 'ic-code', 'Layout', 3, '0', '2023-10-16 02:19:28', '2026-07-07 10:42:33', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('154', '定时任务', 'Scheduled Tasks', 'job:view', '/scheduled/job', NULL, '153', '', '/pages/management/scheduled/job', 0, '0', '2023-10-16 02:20:00', '2026-07-07 10:42:31', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('155', '新增', 'Add', 'job:add', NULL, NULL, '154', NULL, NULL, 0, '1', '2023-10-16 02:21:57', '2026-07-07 10:42:06', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('156', '更新', 'Update', 'job:update', NULL, NULL, '154', NULL, NULL, 0, '1', '2023-10-16 02:22:28', '2026-07-07 10:42:10', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('157', '删除', 'Delete', 'job:delete', NULL, NULL, '154', NULL, NULL, 0, '1', '2023-10-16 02:22:42', '2026-07-07 10:42:15', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('158', '运行任务', 'Run Task', 'job:run', NULL, NULL, '154', NULL, NULL, 0, '1', '2023-10-16 02:22:57', '2026-07-07 10:42:18', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('159', '暂停任务', 'Pause Task', 'job:pause', NULL, NULL, '154', NULL, NULL, 0, '1', '2023-10-16 02:23:12', '2026-07-07 10:42:23', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('16', '删除角色', 'Delete Role', 'upms:role:del', '', NULL, '4', NULL, '', 0, '1', '2017-12-27 17:06:38', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('160', '恢复任务', 'Resume Task', 'job:resume', NULL, NULL, '154', NULL, NULL, 0, '1', '2023-10-16 02:23:30', '2026-07-07 10:42:28', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('161', '执行日志', 'Execution Logs', 'job:log:view', '/scheduled/jobLog', NULL, '153', '', '/pages/management/scheduled/joblog', 1, '0', '2023-10-16 08:16:33', '2026-07-07 10:42:00', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('167', '系统文件', 'System Files', '', '/oss', NULL, '0', 'ic-blank', 'Layout', 7, '0', '2025-07-03 07:04:25', '2025-07-03 07:08:29', '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('168', '文件管理', 'File Management', 'file:view', '/oss/file', NULL, '167', '', '/pages/management/oss/file', 0, '0', '2025-07-03 07:05:56', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('169', '新增', 'Add', 'file:add', NULL, NULL, '168', NULL, NULL, 0, '1', '2025-07-03 07:06:27', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('17', '新增菜单', 'Add Menu', 'upms:menu:add', '', NULL, '5', NULL, '', 0, '1', '2017-12-27 17:08:02', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('170', '更新', 'Update', 'file:update', NULL, NULL, '168', NULL, NULL, 0, '1', '2025-07-03 07:06:41', '2025-07-03 07:07:01', '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('171', '删除', 'Delete', 'file:delete', NULL, NULL, '168', NULL, NULL, 0, '1', '2025-07-03 07:06:53', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('172', '文件配置', 'File Config', 'file-config:query', '/oss/config', NULL, '167', '', '/pages/management/oss/config', 1, '0', '2025-07-03 07:05:56', '2025-09-26 03:53:03', '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('173', '新增', 'Add', 'file-config:add', NULL, NULL, '172', NULL, NULL, 0, '1', '2025-07-03 07:06:27', '2025-07-03 08:30:56', '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('174', '更新', 'Update', 'file-config:update', NULL, NULL, '172', NULL, NULL, 0, '1', '2025-07-03 07:06:41', '2025-07-03 08:30:59', '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('175', '删除', 'Delete', 'file-config:delete', NULL, NULL, '172', NULL, NULL, 0, '1', '2025-07-03 07:06:53', '2025-07-03 08:31:01', '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('176', '博客管理', 'Blog Management', '', '/blog', NULL, '0', 'ic-blog', 'Layout', 8, '0', '2025-07-10 06:27:31', '2026-07-07 10:41:54', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('177', '文章管理', 'Article Management', NULL, '/blog/article', NULL, '176', NULL, '/pages/management/blog/article', 0, '0', '2025-07-10 06:28:41', '2026-07-07 10:41:35', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('178', '类别管理', 'Category Management', NULL, '/blog/category', NULL, '176', NULL, '/pages/management/blog/category', 0, '0', '2025-07-10 06:28:41', '2026-07-07 10:41:39', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('179', '说说管理', 'Moments Management', NULL, '/blog/moment', NULL, '176', NULL, '/pages/management/blog/moment', 0, '0', '2025-07-10 06:28:41', '2026-07-07 10:41:41', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('18', '修改菜单', 'Edit Menu', 'upms:menu:edit', '', NULL, '5', NULL, '', 0, '1', '2017-12-27 17:08:02', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('180', '标签管理', 'Tag Management', NULL, '/blog/tag', NULL, '176', NULL, '/pages/management/blog/tag', 0, '0', '2025-07-10 06:28:41', '2026-07-07 10:41:46', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('181', '信息管理', 'Message Management', '', '/message', NULL, '0', 'ic-rise', 'Layout', 8, '0', '2025-07-10 06:27:31', '2026-07-07 10:41:32', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('182', '评论管理', 'Comment Management', NULL, '/blog/comment', NULL, '181', NULL, '/pages/management/blog/comment', 0, '0', '2025-07-10 06:28:41', '2026-07-07 10:41:19', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('183', '反馈管理', 'Feedback Management', NULL, '/blog/feedback', NULL, '181', NULL, '/pages/management/blog/feedback', 0, '0', '2025-07-10 06:28:41', '2026-07-07 10:41:22', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('184', '消息管理', 'Notification Management', NULL, '/blog/message', NULL, '181', NULL, '/pages/management/blog/message', 0, '0', '2025-07-10 06:28:41', '2026-07-07 10:41:29', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('185', '网站管理', 'Site Management', '', '/site', NULL, '0', 'ic-label', 'Layout', 8, '0', '2025-07-10 06:27:31', '2026-07-07 10:41:10', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('186', '站点配置', 'Site Config', NULL, '/blog/siteconfig', NULL, '185', NULL, '/pages/management/blog/siteconfig', 0, '0', '2025-07-10 06:28:41', '2026-07-07 10:40:55', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('187', '友链管理', 'Friend Links', NULL, '/blog/friend', NULL, '185', NULL, '/pages/management/blog/friend', 0, '0', '2025-07-10 06:28:41', '2026-07-07 10:40:58', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('188', '公告管理', 'Announcements', NULL, '/blog/notice', NULL, '185', NULL, '/pages/management/blog/notice', 0, '0', '2025-07-10 06:28:41', '2026-07-07 10:41:01', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('19', '删除菜单', 'Delete Menu', 'upms:menu:del', '', NULL, '5', NULL, '', 0, '1', '2017-12-27 17:08:02', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('190', '相册管理', 'Album Management', NULL, '/blog/album', NULL, '185', NULL, '/pages/management/blog/album', 0, '0', '2025-07-10 06:28:41', '2026-07-07 10:41:05', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('191', '系统概览', 'System Overview', 'upms:server:get', '/monitor/server', NULL, '2', NULL, '/pages/management/monitor/server', 2, '0', '2017-12-27 17:00:50', '2023-06-08 08:07:49', '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('192', '在线用户', 'Online Users', 'upms:online:get', '/monitor/online', NULL, '2', NULL, '/pages/management/monitor/online', 2, '0', '2017-12-27 17:00:50', '2023-06-08 08:07:49', '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('193', '缓存概览', 'Cache Overview', 'cache:view', '/monitor/cache', NULL, '2', NULL, '/pages/management/monitor/cache', 2, '0', '2017-12-27 17:00:50', '2023-06-08 08:07:49', '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('194', '删除', 'Delete', 'sys:message:delete', NULL, NULL, '184', NULL, NULL, 0, '1', '2025-08-07 06:14:33', '2026-07-07 10:41:27', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('195', '删除', 'Delete', 'sys:comment:delete', NULL, NULL, '182', NULL, NULL, 0, '1', '2025-08-07 06:44:48', '2026-07-07 10:41:16', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('196', 'AI识别', 'AI Recognition', '', '/onnx', NULL, '0', 'ic-search', 'Layout', 10, '0', '2025-09-09 07:19:21', '2025-09-09 07:20:41', '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('197', '摄像头识别', 'Camera Recognition', '', '/onnx/camera', NULL, '196', '', '/pages/management/ai/camera', 0, '0', '2025-09-09 07:20:16', '2026-07-07 10:40:50', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('198', '图片识别', 'Image Recognition', '', '/onnx/pic', NULL, '196', '', '/pages/management/ai/picture', 0, '0', '2025-09-09 07:20:16', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('199', '车牌识别', 'License Plate', '', '/onnx/car', NULL, '196', '', '/pages/management/ai/car', 0, '0', '2025-09-09 07:20:16', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('2', '系统监控', 'System Monitoring', NULL, '/monitor', NULL, '0', 'ic-workbench', 'Layout', 2, '0', '2017-12-27 16:45:51', '2019-01-23 06:27:12', '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('20', '新增部门', 'Add Department', 'upms:dept:add', '', NULL, '6', NULL, '', 0, '1', '2017-12-27 17:09:24', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('200', '模型训练', 'Model Training', '', '/model', NULL, '0', 'ic-menu', 'Layout', 10, '0', '2025-09-09 07:19:21', '2026-07-07 10:40:47', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('201', '项目管理', 'Project Management', '', '/model/project', NULL, '200', '', '/pages/management/ai/model', 0, '0', '2025-09-09 07:20:16', '2026-07-07 10:40:19', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('202', '模型概览', 'Model Overview', NULL, '/model/overview', NULL, '200', NULL, '/pages/management/ai/model/overview', 1, '2', '2026-02-03 14:57:59', '2026-07-07 10:40:22', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('203', '图片管理', 'Image Management', NULL, '/model/imgmanage', NULL, '200', NULL, '/pages/management/ai/model/image-management', 2, '2', '2026-02-03 14:57:59', '2026-07-07 10:40:25', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('204', '图片标注', 'Image Annotation', NULL, '/model/annotation', NULL, '200', NULL, '/pages/management/ai/model/image-annotation', 3, '2', '2026-02-03 14:57:59', '2026-07-07 10:40:28', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('205', '数据集划分', 'Dataset Split', NULL, '/model/dataset', NULL, '200', NULL, '/pages/management/ai/model/dataset-split', 4, '2', '2026-02-03 14:57:59', '2026-07-07 10:40:31', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('206', '模型训练', 'Model Training', NULL, '/model/training', NULL, '200', NULL, '/pages/management/ai/model/model-training', 5, '2', '2026-02-03 14:57:59', '2026-07-07 10:40:35', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('207', '模型导出', 'Model Export', NULL, '/model/export', NULL, '200', NULL, '/pages/management/ai/model/model-export', 6, '2', '2026-02-03 14:57:59', '2026-07-07 10:40:38', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('208', '模型推理', 'Model Inference', NULL, '/model/inference', NULL, '200', NULL, '/pages/management/ai/model/model-inference', 7, '2', '2026-02-03 14:57:59', '2026-07-07 10:40:41', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('21', '修改部门', 'Edit Department', 'upms:dept:edit', '', NULL, '6', NULL, '', 0, '1', '2017-12-27 17:09:24', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('212', 'AI应用', 'AI Application', '', '/aigc', NULL, '0', 'ic-settings-fullscreen', 'Layout', 12, '0', '2026-02-11 01:23:26', '2026-02-11 01:23:42', '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('213', '应用管理', 'Application Management', '', '/aigc/application', NULL, '212', '', '/pages/management/llm/application', 0, '0', '2026-02-11 01:24:29', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('214', '应用详情', 'Application Details', '', '/aigc/application/detail', NULL, '212', '', '/pages/management/llm/application/detail', 0, '2', '2026-02-11 01:24:29', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('215', '智能对话', 'AI Chat', '', '/aigc/chat', NULL, '212', '', '/pages/management/llm/chat', 1, '0', '2026-02-11 01:24:29', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('216', '模型管理', 'Model Management', '', '/aigc/model', NULL, '212', '', '/pages/management/llm/model', 2, '0', '2026-02-11 01:24:29', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('217', '向量库管理', 'Vector Database', '', '/aigc/embedding', NULL, '212', '', '/pages/management/llm/embedding', 3, '0', '2026-02-11 01:24:29', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('218', '知识库管理', 'Knowledge Base', '', '/aigc/knowledge', NULL, '212', '', '/pages/management/llm/knowledge', 4, '0', '2026-02-11 01:24:29', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('219', '对话数据', 'Chat History', '', '/aigc/history', NULL, '212', '', '/pages/management/llm/history', 5, '0', '2026-02-11 01:24:29', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('22', '删除部门', 'Delete Department', 'upms:dept:del', '', NULL, '6', NULL, '', 0, '1', '2017-12-27 17:09:24', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('220', '账单统计', 'Billing Statistics', '', '/aigc/token', NULL, '212', '', '/pages/management/llm/token', 6, '0', '2026-02-11 01:24:29', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('221', '文档配置', 'Document Config', '', '/aigc/knowledge/setting', NULL, '212', '', '/pages/management/llm/knowledge/setting', 4, '2', '2026-02-11 01:24:29', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('222', '视频识别', 'Video Recognition', '', '/onnx/video', NULL, '196', '', '/pages/management/ai/video', 0, '0', '2025-09-09 07:20:16', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('24', '删除日志', 'Delete Log', 'log:delete', '', NULL, '10', NULL, '', 0, '1', '2017-12-27 17:11:45', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('274', '知识图谱', 'Knowledge Graph', '', '/graph', NULL, '0', 'mdi:chart-line', 'Layout', 12, '0', '2026-02-11 01:23:26', '2026-07-07 10:40:12', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('275', '图谱实例', 'Graph Instance', '', '/graph/instance', NULL, '274', '', '/pages/management/graph/instance/index', 0, '0', '2026-02-11 01:24:29', '2026-07-07 10:40:02', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('276', '图谱可视化', 'Graph Visualization', '', '/graph/visualization', NULL, '274', '', '/pages/management/graph/visualization/index', 0, '2', '2026-02-11 01:24:29', '2026-07-07 10:40:05', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('277', '图谱检索', 'Graph Search', '', '/graph/index', NULL, '274', '', '/pages/management/graph/rag/index', 1, '0', '2026-02-11 01:24:29', '2026-07-07 10:40:08', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('3', '用户管理', 'User Management', 'upms:sysuser:page', '/system/user', NULL, '1', '', '/pages/management/system/user', 1, '0', '2017-12-27 16:47:13', '2026-02-05 06:40:37', '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('300', '数字人', 'Digital Human', '', '/human', NULL, '0', 'solar:global-bold', 'Layout', 13, '0', '2025-06-05 00:00:00', '2026-07-07 10:39:59', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('301', '数字人配置', 'Digital Human Config', 'human:config:view', '/human/config', NULL, '300', '', '/pages/management/human/config', 0, '0', '2025-06-05 00:00:00', '2026-07-07 10:39:52', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('302', '数字人信息', 'Digital Human Info', 'human:info:view', '/human/info', NULL, '300', '', '/pages/management/human/publish', 1, '0', '2025-06-05 00:00:00', '2026-07-07 10:39:56', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('303', '照片管理', 'Photo Management', '', '/blog/photo', NULL, '185', '', '/pages/management/blog/photo', 1, '2', '2025-07-10 06:28:41', '2026-07-07 10:41:08', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('304', '文章编辑', 'Article Editor', '', '/blog/article/editor', NULL, '176', 'mdi:file-document-edit', '/pages/management/blog/article/editor', 2, '2', '2026-06-15 00:49:27', '2026-07-07 10:41:51', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('305', '工具管理', 'Tool Management', '', '/aigc/tool', NULL, '212', '', '/pages/management/llm/tool', 5, '0', '2026-06-15 10:00:00', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('306', '工具管理', 'Tool Management', '', '/aigc/tool', NULL, '212', '', '/pages/management/llm/tool', 5, '0', '2026-06-15 10:00:00', '2026-06-15 10:25:40', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('307', '代码生成', 'Code Generator', '', '/generator', NULL, '0', 'carbon:api', 'Layout', 8, '0', '2026-06-20 12:55:51', '2026-06-20 23:15:18', '0', '0', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('308', '代码生成器', 'Code Generator', 'gen:generator:view', '/generator/code', NULL, '307', '', '/pages/management/generator', 0, '0', '2026-06-20 12:55:51', NULL, '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('309', '智能Excel', 'AI Excel', '', '/aiexcel', NULL, '0', 'mdi:file-excel-outline', 'Layout', 13, '0', '2026-06-21 00:00:00', '2026-07-07 10:39:48', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('310', '智能Excel生成', 'AI Excel Generator', '', '/aiexcel/chat', NULL, '309', '', '/pages/management/aiexcel/chat/index', 0, '0', '2026-06-21 00:00:00', '2026-07-07 10:39:42', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('311', '模板管理', 'Template Management', '', '/aiexcel/template', NULL, '309', '', '/pages/management/aiexcel/template/index', 1, '0', '2026-06-21 00:00:00', '2026-07-07 10:39:45', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('312', '模块配置', 'Module Config', '', '/aiexcel/config', NULL, '309', '', '/pages/management/aiexcel/config/index', 2, '0', '2026-06-21 00:00:00', '2026-07-07 10:39:38', '0', '1', NULL, NULL, 'admin');
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('4', '角色管理', 'Role Management', 'upms:role:list', '/system/role', NULL, '1', NULL, '/pages/management/system/role', 2, '0', '2017-12-27 16:48:09', '2018-04-25 09:01:12', '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('5', '菜单管理', 'Menu Management', 'upms:menu:page', '/system/menu', NULL, '1', NULL, '/pages/management/system/permission', 3, '0', '2017-12-27 16:48:57', '2018-04-25 09:01:30', '0', '0', NULL, NULL, NULL);
INSERT INTO `sys_menu` (`id`, `name`, `en_name`, `permission`, `path`, `redirect`, `parent_id`, `icon`, `component`, `sort`, `type`, `create_time`, `update_time`, `outer_status`, `del_flag`, `application_key`, `create_by`, `update_by`) VALUES ('6', '部门管理', 'Department Management', 'upms:dept:page', '/system/dept', NULL, '1', NULL, '/pages/management/system/dept', 4, '0', '2017-12-27 16:57:33', '2018-04-25 09:01:40', '0', '0', NULL, NULL, NULL);
COMMIT;

-- ----------------------------
-- Table structure for sys_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_role`;
CREATE TABLE `sys_role` (
  `id` varchar(32) NOT NULL COMMENT 'PK',
  `role_name` varchar(10) NOT NULL COMMENT '角色名称',
  `role_code` varchar(50) NOT NULL COMMENT '角色编码',
  `role_desc` varchar(100) DEFAULT NULL COMMENT '角色描述',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '修改时间',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除：0.显示；1.隐藏；',
  `tenant_id` varchar(32) NOT NULL COMMENT '租户id',
  `create_by` varchar(60) DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(60) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='用户角色表';

-- ----------------------------
-- Records of sys_role
-- ----------------------------
BEGIN;
INSERT INTO `sys_role` (`id`, `role_name`, `role_code`, `role_desc`, `create_time`, `update_time`, `del_flag`, `tenant_id`, `create_by`, `update_by`) VALUES ('1', '超级管理员', 'ROLE_ADMIN', '超级管理员拥有全部权限', '2021-11-26 11:34:48', '2026-03-03 16:24:14', '0', '1881232176465358849', 'admin', 'admin');
INSERT INTO `sys_role` (`id`, `role_name`, `role_code`, `role_desc`, `create_time`, `update_time`, `del_flag`, `tenant_id`, `create_by`, `update_by`) VALUES ('2029377458876592130', '演示角色', 'DEMO', '', '2026-03-05 10:04:25', '2026-03-05 10:04:51', '0', '1881232176465358849', 'admin', 'admin');
COMMIT;

-- ----------------------------
-- Table structure for sys_role_menu
-- ----------------------------
DROP TABLE IF EXISTS `sys_role_menu`;
CREATE TABLE `sys_role_menu` (
  `id` varchar(32) NOT NULL COMMENT 'PK',
  `role_id` varchar(32) NOT NULL COMMENT '角色ID',
  `menu_id` varchar(32) NOT NULL COMMENT '菜单ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `tenant_id` varchar(32) NOT NULL COMMENT '租户id',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='角色关联菜单表';

-- ----------------------------
-- Records of sys_role_menu
-- ----------------------------
BEGIN;
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696960', '1', '212', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696961', '1', '196', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696962', '1', '307', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696963', '1', '167', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696964', '1', '220', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696965', '1', '305', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696966', '1', '219', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696967', '1', '6', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696968', '1', '221', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696969', '1', '218', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696970', '1', '150', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696971', '1', '217', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696972', '1', '5', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696973', '1', '4', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696974', '1', '2', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696975', '1', '193', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696976', '1', '192', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696977', '1', '191', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696978', '1', '216', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696979', '1', '10', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696980', '1', '172', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696981', '1', '3', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696982', '1', '1', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696983', '1', '215', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696984', '1', '173', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696985', '1', '175', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696986', '1', '169', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696987', '1', '308', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696988', '1', '198', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696989', '1', '17', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696990', '1', '15', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696991', '1', '214', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696992', '1', '131', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696993', '1', '132', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696994', '1', '222', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696995', '1', '24', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696996', '1', '22', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696997', '1', '135', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696998', '1', '213', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198696999', '1', '171', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198697000', '1', '21', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198697001', '1', '170', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198697002', '1', '11', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198697003', '1', '13', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198697004', '1', '133', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198697005', '1', '14', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198697006', '1', '18', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198697007', '1', '151', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198697008', '1', '174', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198697009', '1', '152', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198697010', '1', '130', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198697011', '1', '136', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198697012', '1', '199', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198697013', '1', '16', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198697014', '1', '19', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198697015', '1', '168', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198697016', '1', '12', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323328198697017', '1', '20', '2026-07-07 10:43:15', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323344749420544', '2029377458876592130', '212', '2026-07-07 10:43:19', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323344749420545', '2029377458876592130', '196', '2026-07-07 10:43:19', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323344749420546', '2029377458876592130', '220', '2026-07-07 10:43:19', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323344749420547', '2029377458876592130', '305', '2026-07-07 10:43:19', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323344749420548', '2029377458876592130', '219', '2026-07-07 10:43:19', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323344749420549', '2029377458876592130', '6', '2026-07-07 10:43:19', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323344749420550', '2029377458876592130', '221', '2026-07-07 10:43:19', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323344749420551', '2029377458876592130', '218', '2026-07-07 10:43:19', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323344749420552', '2029377458876592130', '4', '2026-07-07 10:43:19', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323344749420553', '2029377458876592130', '215', '2026-07-07 10:43:19', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323344749420554', '2029377458876592130', '199', '2026-07-07 10:43:19', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323344749420555', '2029377458876592130', '198', '2026-07-07 10:43:19', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323344749420556', '2029377458876592130', '168', '2026-07-07 10:43:19', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323344749420557', '2029377458876592130', '214', '2026-07-07 10:43:19', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323344749420558', '2029377458876592130', '213', '2026-07-07 10:43:19', '1881232176465358849');
INSERT INTO `sys_role_menu` (`id`, `role_id`, `menu_id`, `create_time`, `tenant_id`) VALUES ('2074323344749420559', '2029377458876592130', '222', '2026-07-07 10:43:19', '1881232176465358849');
COMMIT;

-- ----------------------------
-- Table structure for sys_tenant
-- ----------------------------
DROP TABLE IF EXISTS `sys_tenant`;
CREATE TABLE `sys_tenant` (
  `id` varchar(32) NOT NULL COMMENT 'PK',
  `name` varchar(100) NOT NULL COMMENT '租户名称',
  `logo_url` varchar(255) DEFAULT NULL COMMENT '租户logo',
  `address` varchar(255) DEFAULT NULL COMMENT '租户地址',
  `site_url` varchar(255) DEFAULT NULL COMMENT '官网地址',
  `status` char(2) NOT NULL COMMENT '状态：0.正常；1.停用；',
  `email` varchar(255) DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `auth_begin_time` datetime NOT NULL COMMENT '授权开始时间',
  `auth_end_time` datetime NOT NULL COMMENT '授权结束时间',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除：0.显示；1.隐藏；',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `package_id` varchar(32) NOT NULL COMMENT '租户套餐id',
  `create_by` varchar(60) DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(60) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='租户管理';

-- ----------------------------
-- Records of sys_tenant
-- ----------------------------
BEGIN;
INSERT INTO `sys_tenant` (`id`, `name`, `logo_url`, `address`, `site_url`, `status`, `email`, `phone`, `auth_begin_time`, `auth_end_time`, `del_flag`, `create_time`, `update_time`, `package_id`, `create_by`, `update_by`) VALUES ('1881232176465358849', '系统租户', NULL, '湖南省长沙市岳麓区', 'https://www.nitemoon.cn', '0', NULL, '18591691691', '2025-01-20 00:00:00', '2025-02-28 00:00:00', '0', '2025-01-20 14:47:57', '2025-04-23 21:29:30', '1639458123460681730', 'admin', 'admin');
COMMIT;

-- ----------------------------
-- Table structure for sys_tenant_menu
-- ----------------------------
DROP TABLE IF EXISTS `sys_tenant_menu`;
CREATE TABLE `sys_tenant_menu` (
  `id` varchar(32) NOT NULL COMMENT '主键',
  `tenant_id` varchar(32) NOT NULL COMMENT '租户ID',
  `menu_id` varchar(32) NOT NULL COMMENT '菜单ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `create_by` varchar(60) DEFAULT NULL COMMENT '创建人',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='租户分配菜单表';

-- ----------------------------
-- Records of sys_tenant_menu
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for sys_tenant_package
-- ----------------------------
DROP TABLE IF EXISTS `sys_tenant_package`;
CREATE TABLE `sys_tenant_package` (
  `id` varchar(32) NOT NULL COMMENT 'PK',
  `name` varchar(50) NOT NULL COMMENT '套餐名称',
  `sub_title` varchar(200) DEFAULT NULL COMMENT '子标题',
  `sales_price` decimal(10,2) DEFAULT NULL COMMENT '销售价格（元）',
  `original_price` decimal(10,2) DEFAULT NULL COMMENT '原价（元）',
  `status` char(2) NOT NULL DEFAULT '1' COMMENT '状态：0.正常；1.停用；',
  `description` text COMMENT '描述',
  `app_key` varchar(100) NOT NULL COMMENT '应用key',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `del_flag` char(2) NOT NULL DEFAULT '0' COMMENT '逻辑删除：0.显示；1.隐藏；',
  `create_by` varchar(60) DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(60) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='租户套餐';

-- ----------------------------
-- Records of sys_tenant_package
-- ----------------------------
BEGIN;
INSERT INTO `sys_tenant_package` (`id`, `name`, `sub_title`, `sales_price`, `original_price`, `status`, `description`, `app_key`, `create_time`, `update_time`, `del_flag`, `create_by`, `update_by`) VALUES ('1639458123460681730', '系统套餐', '系统套餐', 0.01, 0.01, '1', '', '', '2022-11-11 16:17:10', '2022-11-13 18:11:39', '0', NULL, NULL);
COMMIT;

-- ----------------------------
-- Table structure for sys_user
-- ----------------------------
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
  `id` varchar(32) NOT NULL COMMENT 'PK',
  `username` varchar(100) DEFAULT NULL COMMENT '用户名',
  `password` varchar(100) NOT NULL COMMENT '密码',
  `email` varchar(255) DEFAULT NULL COMMENT '邮箱',
  `nike_name` varchar(50) DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像',
  `dept_id` varchar(32) DEFAULT NULL COMMENT '部门ID',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '逻辑删除：0.显示；1.隐藏；',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `tenant_id` varchar(32) NOT NULL COMMENT '租户id',
  `status` varchar(2) DEFAULT NULL COMMENT '状态：0.正常；1.停用；',
  `create_by` varchar(60) DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(60) DEFAULT NULL COMMENT '修改人',
  `type` char(1) DEFAULT NULL COMMENT '账号类型：0.系统主账户；',
  `open_id` varchar(255) DEFAULT NULL COMMENT '微信小程序openId',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='系统用户表';

-- ----------------------------
-- Records of sys_user
-- ----------------------------
BEGIN;
INSERT INTO `sys_user` (`id`, `username`, `password`, `email`, `nike_name`, `avatar`, `dept_id`, `phone`, `del_flag`, `create_time`, `update_time`, `tenant_id`, `status`, `create_by`, `update_by`, `type`, `open_id`) VALUES ('1', 'admin', 'e10adc3949ba59abbe56e057f20f883e', 'admin@nitemoon.cn', '炒鸡管理员', 'https://platform.nitemoon.cn/api/boot/file/2/get/f448be966bd0319579f7d00fbabaaef553956d5c859b182f7a3a6c609dd2748a.gif', '5', '18591691691', '0', '2022-05-20 17:33:24', '2026-03-03 09:01:23', '1881232176465358849', '0', NULL, 'admin', '0', NULL);
COMMIT;

-- ----------------------------
-- Table structure for sys_user_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_user_role`;
CREATE TABLE `sys_user_role` (
  `id` varchar(32) NOT NULL COMMENT 'PK',
  `user_id` varchar(32) NOT NULL COMMENT '用户ID',
  `role_id` varchar(32) NOT NULL COMMENT '角色ID',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `tenant_id` varchar(32) NOT NULL COMMENT '租户id',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='系统用户关联角色表';

-- ----------------------------
-- Records of sys_user_role
-- ----------------------------
BEGIN;
INSERT INTO `sys_user_role` (`id`, `user_id`, `role_id`, `create_time`, `tenant_id`) VALUES ('2028636819133992961', '1', '1', '2026-03-03 09:01:23', '1881232176465358849');
COMMIT;

-- ----------------------------
-- Table structure for undo_log
-- ----------------------------
DROP TABLE IF EXISTS `undo_log`;
CREATE TABLE `undo_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `branch_id` bigint(20) NOT NULL,
  `xid` varchar(100) NOT NULL,
  `context` varchar(128) NOT NULL,
  `rollback_info` longblob NOT NULL,
  `log_status` int(11) NOT NULL,
  `log_created` datetime NOT NULL,
  `log_modified` datetime NOT NULL,
  `ext` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `ux_undo_log` (`xid`,`branch_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of undo_log
-- ----------------------------
BEGIN;
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
