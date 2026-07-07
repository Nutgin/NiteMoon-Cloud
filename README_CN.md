<p align="center">
  <img src="https://img.shields.io/badge/Java-17-007396?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 17"/>
  <img src="https://img.shields.io/badge/Spring%20Boot-3.4-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white" alt="Spring Boot"/>
  <img src="https://img.shields.io/badge/Spring%20Cloud-2024.0-6DB33F?style=for-the-badge&logo=spring&logoColor=white" alt="Spring Cloud"/>
  <img src="https://img.shields.io/badge/LangChain4j-1.0.0-blue?style=for-the-badge" alt="LangChain4j"/>
  <img src="https://img.shields.io/badge/YOLOv8-Supported-FF6F00?style=for-the-badge&logo=ultralytics&logoColor=white" alt="YOLOv8"/>
  <img src="https://img.shields.io/badge/Neo4j-5.x-008CC1?style=for-the-badge&logo=neo4j&logoColor=white" alt="Neo4j"/>
  <img src="https://img.shields.io/badge/License-Apache%202.0-blue?style=for-the-badge" alt="Apache 2.0 License"/>
</p>

<h1 align="center">Nitemoon Cloud</h1>

<p align="center">
  <b>企业级 AI 应用平台，基于 Java 构建</b><br/>
  <span>LLM 工作流 | 知识图谱 | YOLO 视觉 | 数字人</span>
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> &bull;
  <a href="#核心特性">特性</a> &bull;
  <a href="#架构设计">架构</a> &bull;
  <a href="https://nitemoon.cn">官网</a> &bull;
  <a href="#参与贡献">贡献</a>
</p>

<p align="center">
  <a href="README.md">English</a>
</p>

---

## 什么是 Nitemoon Cloud？

Nitemoon Cloud 是一个**企业级 AI 应用平台**，完全使用 Java 构建。与大多数依赖 Python 的 AI 平台不同，Nitemoon Cloud 将 Java 生态系统的全部能力带到了 AI 应用开发中——从 LLM 编排、知识图谱到实时 YOLO 目标检测和数字人合成。

它提供了**可视化工作流引擎**（类似 Dify/LangFlow）来构建复杂的 AI 流水线，**兼容 OpenAI 的 API** 实现无缝集成，以及完整的 **YOLO 训练和推理管线**——所有这些都在一个统一的平台中。

**部署模式**：项目以 **Spring Boot 单体应用**为主要启动方式。Spring Cloud 微服务模式也已支持，但需要用户自行配置 Nacos、Gateway 等组件。

## 为什么选择 Nitemoon Cloud？

| 特性 | Nitemoon Cloud | 典型 AI 平台 |
|------|---------------|-------------|
| **开发语言** | Java (Spring Boot) | Python (FastAPI/Flask) |
| **YOLO 支持** | Java 全生命周期（训练→ONNX→推理→视频流） | 仅 Python 或有限支持 |
| **知识图谱** | Neo4j + GraphRAG + HanLP 中文 NLP | 仅基础向量 RAG |
| **工作流引擎** | 可视化 DAG，13+ 种节点类型 | 仅简单链式调用 |
| **部署模式** | 单体（默认）OR 微服务可选 | 通常单一模式 |
| **LLM 提供商** | 15+ 提供商统一接入 | 有限支持 |
| **数字人** | TTS + 实时语音合成 | 不包含 |

## 核心特性

### 1. LLM 工作流引擎
可视化、基于节点的工作流引擎，无需编码即可构建复杂 AI 应用：

- **13 种节点类型**：开始、LLM、多模态 LLM、知识检索、图谱检索、条件分支、文档提取、网页搜索、HTTP 请求、自定义工具、命令执行、时间日期、结束
- **流式输出**：基于 SSE 的实时流式响应
- **上下文传播**：节点间自动参数传递
- **分支逻辑**：基于 LLM 输出的条件路由

### 2. 多厂商 LLM 统一接入
通过 LangChain4j 统一接口，支持 15+ LLM 提供商：

OpenAI、Claude、Gemini、Ollama、通义千问、智谱、DeepSeek、零一万物、Silicon Flow、讯飞星火、豆包、MiMo、Azure OpenAI、GiteeAI、文心一言

### 3. 知识图谱 + GraphRAG
结合图数据库与 RAG 的企业级知识管理：

- **Neo4j 存储**：基于图的实体和关系存储
- **LLM 抽取**：使用 LLM 自动从文本中抽取实体和关系
- **GraphRAG**：结合图遍历与向量相似度的混合检索
- **中文 NLP**：集成 HanLP 进行中文分词和关键词提取
- **多跳推理**：遍历图关系实现复杂查询

### 4. YOLO 视觉平台（Java 原生）
**首个完全基于 Java 构建的 YOLO 全生命周期管理平台：**

- **训练**：上传图片→标注（YOLO 格式）→训练 YOLOv8 模型→实时监控训练进度
- **推理**：加载训练好的 ONNX 模型进行图片/视频/摄像头检测
- **视频流**：对 RTMP/RTSP/HTTP 视频流进行实时目标检测
- **动态模型**：运行时上传自定义 ONNX 模型进行推理
- **车牌识别**：内置车牌检测功能

### 5. 数字人
AI 驱动的数字人与语音合成：

- **火山引擎 TTS**：通过 WebSocket 流式传输实现高质量语音合成
- **实时合成**：逐字符音频生成
- **语音管理**：多种语音配置方案

### 6. 企业级基础设施
- **认证授权**：Sa-Token + Redis 会话管理
- **服务发现**：Nacos 配置中心与服务注册（微服务模式）
- **API 网关**：Spring Cloud Gateway 动态路由（微服务模式）
- **RPC 调用**：Apache Dubbo 3 服务间通信
- **限流熔断**：Sentinel 集成
- **分布式事务**：Seata 支持
- **文件存储**：MinIO、阿里云 OSS、七牛云、腾讯云 COS
- **API 文档**：Knife4j/Swagger 自动生成

## 架构设计

> 架构图即将推出，敬请期待！

### 模块结构

```
nitemoon-cloud/
├── nitemoon-gateway/          # API 网关 (Spring Cloud Gateway, 端口 7770)
├── nitemoon-auth/             # 认证服务 (Sa-Token, 端口 7771)
├── nitemoon-common/           # 公共模块
│   ├── nitemoon-common-core/       # 核心工具
│   ├── nitemoon-common-security/   # 安全框架
│   ├── nitemoon-common-redis/      # Redis 集成
│   ├── nitemoon-common-mybatis/    # MyBatis-Plus 集成
│   ├── nitemoon-common-dubbo/      # Dubbo RPC 框架
│   ├── nitemoon-common-storage/    # 文件存储抽象
│   ├── nitemoon-common-sentinel/   # 限流熔断
│   └── ...                         # 15+ 公共模块
├── nitemoon-api/              # 服务 API 接口
│   ├── nitemoon-llm-api/          # LLM 服务 API
│   └── nitemoon-upms-api/         # UPMS API
├── nitemoon-biz/              # 业务服务
│   ├── nitemoon-llm/              # LLM 工作流引擎
│   ├── nitemoon-onnx/             # ONNX 推理服务
│   ├── nitemoon-upms/             # 用户权限管理
│   ├── nitemoon-generator/        # 代码生成器
│   └── nitemoon-monitor/          # 系统监控
└── nitemoon-boot/             # 单体启动应用 (端口 8000)
```

## 技术栈

| 类别 | 技术 |
|------|------|
| **框架** | Spring Boot 3.4.7, Spring Cloud 2024.0.0, Spring Cloud Alibaba 2023.0.3.2 |
| **RPC** | Apache Dubbo 3.2.14 |
| **AI/LLM** | LangChain4j 1.0.0-beta1, YOLOv8 (ultralytics), ONNX Runtime |
| **数据库** | MySQL 9.2, Neo4j 5.27, Redis (Redisson 3.38) |
| **ORM** | MyBatis-Plus 3.5.12 |
| **认证** | Sa-Token 1.44.0 |
| **存储** | MinIO 8.4, 阿里云 OSS 3.18, 七牛云 7.17, 腾讯云 COS 5.6 |
| **消息队列** | RocketMQ 5.2 |
| **API 文档** | Knife4j 4.6, SpringDoc 2.8 |
| **NLP** | HanLP（中文分词） |
| **TTS** | 火山引擎 WebSocket API |
| **监控** | Spring Boot Admin 3.4.7 |

## 快速开始

### 环境要求

- Java 17+
- Maven 3.8+
- MySQL 8.0+
- Redis 6.0+
- Neo4j 5.x（知识图谱功能）
- Python 3.8+ 及 ultralytics（YOLO 训练功能）

### 单体模式（推荐）

```bash
# 克隆仓库
git clone https://github.com/Nutgin/NiteMoon-Cloud.git
cd NiteMoon-Cloud

# 构建项目
mvn clean install -DskipTests

# 以单体模式运行（默认 profile）
cd nitemoon-boot
mvn spring-boot:run
```

应用将在 `http://localhost:8000/boot` 启动

### 微服务模式（可选）

> 注意：微服务模式需要额外配置 Nacos、Gateway 等组件。

```bash
# 首先启动 Nacos
# 然后独立启动各个服务：

# 1. 网关 (端口 7770)
cd nitemoon-gateway && mvn spring-boot:run

# 2. 认证服务 (端口 7771)
cd nitemoon-auth && mvn spring-boot:run

# 3. 业务服务（按需启动）
cd nitemoon-biz/nitemoon-llm && mvn spring-boot:run
cd nitemoon-biz/nitemoon-onnx && mvn spring-boot:run
```

### 配置说明

1. 创建 MySQL 数据库并执行 SQL 脚本
2. 在 `application-dev.yml` 中配置数据库连接信息
3. 在管理后台配置 LLM API Key
4. （可选）启动 Neo4j 以使用知识图谱功能
5. （可选）配置 Python 路径以使用 YOLO 训练功能

## API 文档

应用启动后，访问以下地址查看 API 文档：

- **单体模式**：`http://localhost:8000/boot/doc.html`
- **网关模式**：`http://localhost:7770/doc.html`

### 兼容 OpenAI 的 API

Nitemoon Cloud 提供兼容 OpenAI 的 API 端点：

```bash
curl -X POST http://localhost:8000/boot/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "model": "your-app-id",
    "messages": [
      {"role": "user", "content": "你好！"}
    ],
    "stream": true
  }'
```

## 开源版 vs 商业版

Nitemoon Cloud 提供开源版和商业版两种选择：

| 功能 | 开源版 | 商业版 |
|------|--------|--------|
| **LLM 工作流引擎** | ✅ 完整支持 | ✅ 完整支持 |
| **多厂商 LLM 接入** | ✅ 15+ 提供商 | ✅ 15+ 提供商 |
| **YOLO 推理** | ✅ ONNX 推理 | ✅ ONNX 推理 |
| **企业级基础设施** | ✅ Sa-Token、Redis 等 | ✅ Sa-Token、Redis 等 |
| **知识图谱（kg 模块）** | ❌ 不包含 | ✅ Neo4j + GraphRAG + HanLP NLP |
| **YOLO 训练（training 模块）** | ❌ 不包含 | ✅ 完整训练流水线 |
| **数字人（human 模块）** | ❌ 不包含 | ✅ TTS + 实时语音合成 |
| **1v1 答疑** | ❌ 不包含 | ✅ 专属技术支持 |
| **全流程支持** | ❌ 不包含 | ✅ 端到端指导 |
| **技术支持** | 社区支持 | 优先支持 |

商业合作请联系：**nutgin@foxmail.com**

### 二开与定制开发

我们还提供二次开发、定制开发和技术咨询服务。如果您有特定需求或需要定制化解决方案，欢迎通过邮箱联系我们：**nutgin@foxmail.com**

## 演示平台

在线体验地址：**[platform.nitemoon.cn](https://platform.nitemoon.cn)**

- **用户名**：`demo`
- **密码**：`UhOtrDnzRh`

## 应用场景

### 1. 构建带 RAG 的 AI 聊天机器人
创建知识库→上传文档→配置包含知识检索节点的工作流→部署为 API

### 2. YOLO 目标检测流水线
上传图片→YOLO 格式标注→训练模型→导出 ONNX→部署实时视频检测

### 3. 知识图谱问答
导入文档→自动抽取实体/关系→自然语言查询→获得图增强答案

### 4. 数字人语音合成
配置 TTS 提供商→创建数字人档案→从文本生成语音

## 参与贡献

我们欢迎贡献！请参阅我们的[贡献指南](CONTRIBUTING.md)。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

## 开源协议

本项目基于 Apache License 2.0 协议开源 - 详见 [LICENSE](LICENSE) 文件

## 赞赏支持

如果觉得项目不错，请作者喝杯咖啡！

| 微信支付 | 支付宝 |
|:--------:|:------:|
| <img src="https://storage.nitemoon.cn/406191cf7a0ecd207e0edee85b7c5c75ec56e5507ce562444f88faebeb72475d.JPG" width="200" alt="微信支付"/> | <img src="https://storage.nitemoon.cn/bfa10fa1173bcca429b5bd95d2d262491d80b6cff8e6f32e66abddf93f25a546.JPG" width="200" alt="支付宝"/> |

## 致谢

特别感谢：

- [RuoYi-AI](https://github.com/ruoyi-ai/ruoyi-ai) 团队
- 常康
- [MRBIRD](https://github.com/MRBIRD0824)
- [Dify](https://github.com/langgenius/dify) 团队

## 联系方式

- **官网**：[www.nitemoon.cn](https://www.nitemoon.cn)
- **演示平台**：[platform.nitemoon.cn](https://platform.nitemoon.cn)
- **邮箱**：nutgin@foxmail.com
- **GitHub**：[github.com/Nutgin/NiteMoon-Cloud](https://github.com/Nutgin/NiteMoon-Cloud)
