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
  <b>Enterprise-grade AI Application Platform built with Java</b><br/>
  <span>LLM Workflow | Knowledge Graph | YOLO Vision | Digital Human</span>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &bull;
  <a href="#core-features">Features</a> &bull;
  <a href="#architecture">Architecture</a> &bull;
  <a href="https://nitemoon.cn">Website</a> &bull;
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <a href="README_CN.md">中文文档</a>
</p>

---

## What is Nitemoon Cloud?

Nitemoon Cloud is an **enterprise-grade AI application platform** built entirely in Java. Unlike most AI platforms that rely on Python, Nitemoon Cloud brings the full power of the Java ecosystem to AI application development — from LLM orchestration and knowledge graph to real-time YOLO object detection and digital human synthesis.

It provides a **visual workflow engine** (similar to Dify/LangFlow) for building complex AI pipelines, an **OpenAI-compatible API** for seamless integration, and a complete **YOLO training & inference pipeline** — all within a single, cohesive platform.

**Deployment Mode**: The project primarily runs as a **Spring Boot monolithic application**. Spring Cloud microservice mode is also supported but requires users to configure Nacos, Gateway, and other components themselves.

## Why Nitemoon Cloud?

| Feature | Nitemoon Cloud | Typical AI Platforms |
|---------|---------------|---------------------|
| **Language** | Java (Spring Boot) | Python (FastAPI/Flask) |
| **YOLO Support** | Full lifecycle in Java (Train -> ONNX -> Inference -> Video Stream) | Python-only or limited |
| **Knowledge Graph** | Neo4j + GraphRAG + HanLP NLP | Basic vector RAG only |
| **Workflow Engine** | Visual DAG with 13+ node types | Simple chain only |
| **Deployment** | Monolithic (default) OR Microservices | Usually single mode |
| **LLM Providers** | 15+ providers unified | Limited support |
| **Digital Human** | TTS + Real-time synthesis | Not included |

## Core Features

### 1. LLM Workflow Engine
A visual, node-based workflow engine for building complex AI applications without code:

- **13 Node Types**: Start, LLM, Multimodal LLM, Knowledge Retrieval, KG Retrieval, If/Else, Doc Extractor, Web Search, HTTP Request, Custom Tool, Command Exec, DateTime, End
- **Streaming Output**: SSE-based real-time streaming responses
- **Context Propagation**: Automatic parameter passing between nodes
- **Branch Logic**: Conditional routing based on LLM output

### 2. Multi-Provider LLM Support
Unified interface supporting 15+ LLM providers via LangChain4j:

OpenAI, Claude, Gemini, Ollama, QWen, Zhipu, DeepSeek, Yi, Silicon Flow, Spark, Douyin, MiMo, Azure OpenAI, GiteeAI, QFan

### 3. Knowledge Graph + GraphRAG
Enterprise-grade knowledge management combining graph database with RAG:

- **Neo4j Storage**: Graph-based entity and relationship storage
- **LLM Extraction**: Automatic entity/relation extraction from text using LLM
- **GraphRAG**: Hybrid retrieval combining graph traversal with vector similarity
- **Chinese NLP**: HanLP integration for Chinese text segmentation and keyword extraction
- **Multi-hop Reason**: Traverse graph relationships for complex queries

### 4. YOLO Vision Platform (Java-native)
**The first complete YOLO lifecycle management platform built in Java:**

- **Training**: Upload images -> Annotate (YOLO format) -> Train YOLOv8 models -> Monitor progress in real-time
- **Inference**: Load trained ONNX models for image/video/camera detection
- **Video Streaming**: Real-time object detection on RTMP/RTSP/HTTP video streams
- **Dynamic Models**: Upload custom ONNX models at runtime for inference
- **Car Plate Detection**: Built-in license plate recognition

### 5. Digital Human
AI-powered digital human with voice synthesis:

- **Volcengine TTS**: High-quality text-to-speech via WebSocket streaming
- **Real-time Synthesis**: Character-by-character audio generation
- **Voice Management**: Multiple voice profiles and configurations

### 6. Enterprise Infrastructure
- **Authentication**: Sa-Token with Redis session management
- **Service Discovery**: Nacos for configuration and service registry (microservice mode)
- **API Gateway**: Spring Cloud Gateway with dynamic routing (microservice mode)
- **RPC**: Apache Dubbo 3 for inter-service communication
- **Rate Limiting**: Sentinel integration
- **Distributed Transaction**: Seata support
- **File Storage**: MinIO, Aliyun OSS, Qiniu, Tencent COS
- **API Documentation**: Knife4j/Swagger auto-generation

## Architecture

> Architecture diagram coming soon. Stay tuned!

### Module Structure

```
nitemoon-cloud/
├── nitemoon-gateway/          # API Gateway (Spring Cloud Gateway, Port 7770)
├── nitemoon-auth/             # Authentication Service (Sa-Token, Port 7771)
├── nitemoon-common/           # Shared Libraries
│   ├── nitemoon-common-core/       # Core utilities
│   ├── nitemoon-common-security/   # Security framework
│   ├── nitemoon-common-redis/      # Redis integration
│   ├── nitemoon-common-mybatis/    # MyBatis-Plus integration
│   ├── nitemoon-common-dubbo/      # Dubbo RPC framework
│   ├── nitemoon-common-storage/    # File storage abstraction
│   ├── nitemoon-common-sentinel/   # Rate limiting
│   └── ...                         # 15+ common modules
├── nitemoon-api/              # Service API Interfaces
│   ├── nitemoon-llm-api/          # LLM service API
│   └── nitemoon-upms-api/         # UPMS API
├── nitemoon-biz/              # Business Services
│   ├── nitemoon-llm/              # LLM Workflow Engine
│   ├── nitemoon-onnx/             # ONNX Inference Service
│   ├── nitemoon-upms/             # User Permission Management
│   ├── nitemoon-generator/        # Code Generator
│   └── nitemoon-monitor/          # System Monitor
└── nitemoon-boot/             # Monolithic Boot Application (Port 8000)
```

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Spring Boot 3.4.7, Spring Cloud 2024.0.0, Spring Cloud Alibaba 2023.0.3.2 |
| **RPC** | Apache Dubbo 3.2.14 |
| **AI/LLM** | LangChain4j 1.0.0-beta1, YOLOv8 (ultralytics), ONNX Runtime |
| **Database** | MySQL 9.2, Neo4j 5.27, Redis (Redisson 3.38) |
| **ORM** | MyBatis-Plus 3.5.12 |
| **Auth** | Sa-Token 1.44.0 |
| **Storage** | MinIO 8.4, Aliyun OSS 3.18, Qiniu 7.17, Tencent COS 5.6 |
| **Messaging** | RocketMQ 5.2 |
| **API Doc** | Knife4j 4.6, SpringDoc 2.8 |
| **NLP** | HanLP (Chinese segmentation) |
| **TTS** | Volcengine WebSocket API |
| **Monitoring** | Spring Boot Admin 3.4.7 |

## Quick Start

### Prerequisites

- Java 17+
- Maven 3.8+
- MySQL 8.0+
- Redis 6.0+
- Neo4j 5.x (for Knowledge Graph)
- Python 3.8+ with ultralytics (for YOLO training)

### Monolithic Mode (Recommended)

```bash
# Clone the repository
git clone https://github.com/Nutgin/NiteMoon-Cloud.git
cd NiteMoon-Cloud

# Build the project
mvn clean install -DskipTests

# Run in monolithic mode (default profile)
cd nitemoon-boot
mvn spring-boot:run
```

The application will start at `http://localhost:8000/boot`

### Microservice Mode (Optional)

> Note: Microservice mode requires additional configuration of Nacos, Gateway, etc.

```bash
# Start Nacos first
# Then start each service independently:

# 1. Gateway (Port 7770)
cd nitemoon-gateway && mvn spring-boot:run

# 2. Auth Service (Port 7771)
cd nitemoon-auth && mvn spring-boot:run

# 3. Business Services (start as needed)
cd nitemoon-biz/nitemoon-llm && mvn spring-boot:run
cd nitemoon-biz/nitemoon-onnx && mvn spring-boot:run
```

### Configuration

1. Create MySQL database and run SQL scripts
2. Configure `application-dev.yml` with your database credentials
3. Configure LLM API keys in the admin panel
4. (Optional) Start Neo4j for Knowledge Graph features
5. (Optional) Configure Python path for YOLO training

## API Documentation

Once the application is running, access the API documentation at:

- **Monolithic Mode**: `http://localhost:8000/boot/doc.html`
- **Gateway Mode**: `http://localhost:7770/doc.html`

### OpenAI Compatible API

Nitemoon Cloud provides an OpenAI-compatible API endpoint:

```bash
curl -X POST http://localhost:8000/boot/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "model": "your-app-id",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "stream": true
  }'
```

## Open Source vs Commercial Edition

Nitemoon Cloud offers both open source and commercial editions:

| Feature | Open Source Edition | Commercial Edition |
|---------|-------------------|-------------------|
| **LLM Workflow Engine** | ✅ Full support | ✅ Full support |
| **Multi-Provider LLM** | ✅ 15+ providers | ✅ 15+ providers |
| **YOLO Inference** | ✅ ONNX inference | ✅ ONNX inference |
| **Enterprise Infrastructure** | ✅ Sa-Token, Redis, etc. | ✅ Sa-Token, Redis, etc. |
| **Knowledge Graph (kg module)** | ❌ Not included | ✅ Neo4j + GraphRAG + HanLP NLP |
| **YOLO Training (training module)** | ❌ Not included | ✅ Full training pipeline |
| **Digital Human (human module)** | ❌ Not included | ✅ TTS + Real-time synthesis |
| **1v1 Support** | ❌ Not included | ✅ Dedicated support |
| **Full Process Support** | ❌ Not included | ✅ End-to-end guidance |
| **Support** | Community | Priority support |

For commercial inquiries, please contact: **nutgin@foxmail.com**

### Custom Development & Cooperation

We also provide secondary development, custom development, and technical consulting services. If you have specific requirements or need tailored solutions, feel free to reach out via email: **nutgin@foxmail.com**

## Demo

Try the live demo at: **[platform.nitemoon.cn](https://platform.nitemoon.cn)**

- **you can login by github**

## Use Cases

### 1. Build an AI Chatbot with RAG
Create a knowledge base -> Upload documents -> Configure workflow with Knowledge Retrieval node -> Deploy as API

### 2. YOLO Object Detection Pipeline
Upload images -> Annotate with YOLO format -> Train model -> Export ONNX -> Deploy for real-time video detection

### 3. Knowledge Graph Question Answering
Ingest documents -> Auto-extract entities/relations -> Query with natural language -> Get graph-enhanced answers

### 4. Digital Human with Voice
Configure TTS provider -> Create digital human profile -> Generate speech from text

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Sponsorship

If you find this project helpful, consider buying the author a coffee!

| WeChat Pay | Alipay |
|:----------:|:------:|
| <img src="https://storage.nitemoon.cn/406191cf7a0ecd207e0edee85b7c5c75ec56e5507ce562444f88faebeb72475d.JPG" width="200" alt="WeChat Pay"/> | <img src="https://storage.nitemoon.cn/bfa10fa1173bcca429b5bd95d2d262491d80b6cff8e6f32e66abddf93f25a546.JPG" width="200" alt="Alipay"/> |

## Acknowledgements

Special thanks to:

- [RuoYi-AI](https://github.com/ruoyi-ai/ruoyi-ai) team
- Chang Kang (常康)
- [MRBIRD](https://github.com/MRBIRD0824)
- [Dify](https://github.com/langgenius/dify) team

## Contact

- **Website**: [www.nitemoon.cn](https://www.nitemoon.cn)
- **Demo**: [platform.nitemoon.cn](https://platform.nitemoon.cn)
- **Email**: nutgin@foxmail.com
- **GitHub**: [github.com/Nutgin/NiteMoon-Cloud](https://github.com/Nutgin/NiteMoon-Cloud)
