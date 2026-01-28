# 学习资料浓缩总结+信息图生成系统

一个智能的学习资料处理工具，能够从PDF、Word、PPT和图片中提取内容，生成简洁的Markdown总结和精美的信息图。

## 功能特性

- 支持多种文件格式：PDF、Word(.doc/.docx)、PowerPoint(.ppt/.pptx)、图片(OCR识别)
- 智能内容总结：使用大语言模型生成通俗易懂的总结
- 关键要点提取：自动提取最重要的知识点
- 信息图生成：自动生成1920x1080分辨率的可视化学习总结图片
- Markdown导出：生成结构化的Markdown文档
- 批量处理：支持批量处理多个文件
- 中文支持：完整支持中文文本处理和总结

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的API密钥：

```env
# API配置 - 必填
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo

# 其他配置（可选）
OUTPUT_DIR=./output
INFO_WIDTH=1920
INFO_HEIGHT=1080
```

### 3. 运行程序

```bash
# 处理单个文件
npm start ./input/document.pdf

# 处理目录中所有支持的文件
npm start ./input/

# 只生成Markdown，不生成信息图
npm start ./input/document.pdf --no-infographic

# 只生成信息图，不生成Markdown
npm start ./input/document.pdf --no-markdown
```

## 使用说明

### 命令行参数

```
node src/index.js <文件路径|目录> [选项]

选项:
  --no-markdown       不生成Markdown文档
  --no-infographic    不生成信息图
  --output-dir <dir>  指定输出目录
  --help, -h          显示帮助信息
```

### 支持的文件格式

| 类型 | 支持的扩展名 |
|------|------------|
| PDF | `.pdf` |
| Word | `.doc`, `.docx` |
| PowerPoint | `.ppt`, `.pptx` |
| 图片 | `.jpg`, `.jpeg`, `.png`, `.bmp`, `.gif`, `.webp` |

### 输出说明

处理完成后，会在输出目录（默认 `./output`）生成以下文件：

- `<filename>.md` - Markdown格式的学习总结
- `<filename>.png` - 信息图图片（1920x1080）

### 环境变量配置

```env
# ==================== API配置 ====================
# OpenAI API密钥（必填）
OPENAI_API_KEY=your_openai_api_key_here

# API基础URL（可选，默认使用OpenAI）
OPENAI_BASE_URL=https://api.openai.com/v1

# 使用的模型（可选，默认gpt-3.5-turbo）
OPENAI_MODEL=gpt-3.5-turbo

# ==================== OCR配置 ====================
# OCR识别语言（可选，默认中英文）
OCR_LANGUAGE=chi_sim+eng

# ==================== 输出配置 ====================
# 输出目录（可选，默认./output）
OUTPUT_DIR=./output

# 图片格式（可选，默认png）
IMAGE_FORMAT=png

# 图片质量（可选，默认90）
IMAGE_QUALITY=90

# ==================== 信息图配置 ====================
# 信息图宽度（可选，默认1920）
INFO_WIDTH=1920

# 信息图高度（可选，默认1080）
INFO_HEIGHT=1080

# 信息图模板（可选，默认basic）
INFO_TEMPLATE=basic

# ==================== 总结配置 ====================
# 总结最大长度（可选，默认500）
MAX_LENGTH=500

# 总结详细程度（可选：low/medium/high，默认medium）
DETAIL_LEVEL=medium

# 总结语言（可选：zh/en，默认zh）
SUMMARY_LANGUAGE=zh
```

## 项目结构

```
Study_Summary/
├── src/
│   ├── config/                  # 配置管理
│   │   └── index.js             # 环境变量配置加载
│   │
│   ├── parsers/                 # 文件解析模块
│   │   ├── index.js             # 解析器工厂
│   │   ├── base-parser.js       # 基础解析器类
│   │   ├── pdf-parser.js        # PDF解析器
│   │   ├── word-parser.js       # Word文档解析器
│   │   ├── ppt-parser.js        # PPT解析器
│   │   └── image-parser.js      # 图片解析器（OCR）
│   │
│   ├── processors/              # 内容处理模块
│   │   ├── index.js
│   │   ├── content-summarizer.js    # 内容总结处理器
│   │   └── text-cleaner.js          # 文本清理工具
│   │
│   ├── generators/              # 生成器模块
│   │   ├── index.js
│   │   ├── infographic-generator.js  # 信息图生成器
│   │   ├── markdown-generator.js     # Markdown生成器
│   │   └── templates/                 # 信息图模板
│   │       └── basic-template.js      # 基础模板
│   │
│   ├── services/                # API服务模块
│   │   ├── index.js
│   │   └── llm-service.js       # 大语言模型API服务
│   │
│   ├── utils/                   # 工具函数
│   │   ├── file-utils.js        # 文件操作工具
│   │   └── logger.js            # 日志工具
│   │
│   └── index.js                 # 主程序入口
│
├── output/                      # 输出文件目录
├── .env.example                 # 环境变量示例
├── .gitignore
├── package.json
└── README.md
```

## 技术栈

| 模块 | 技术选型 |
|------|---------|
| 运行环境 | Node.js (ES Modules) |
| PDF解析 | pdf-parse |
| Word解析 | mammoth |
| PPT解析 | officeparser |
| OCR识别 | tesseract.js |
| 信息图生成 | @napi-rs/canvas |
| API调用 | axios |
| 配置管理 | dotenv |

## 使用示例

### 示例1：处理PDF文档

```bash
npm start ./examples/notes.pdf
```

输出：
- `output/notes.md` - Markdown格式的学习笔记
- `output/notes.png` - 可视化信息图

### 示例2：批量处理文档

```bash
npm start ./course-materials/
```

该命令会处理 `course-materials` 目录下所有支持的文件。

### 示例3：自定义输出目录

```bash
npm start ./document.pdf --output-dir ./my-summaries
```

### 示例4：代码调用

```javascript
import StudySummarySystem from './src/index.js';

const system = new StudySummarySystem();

// 处理单个文件
const result = await system.processFile('./document.pdf', {
  markdown: true,
  infographic: true,
  outputDir: './output'
});

console.log('处理结果:', result);
```

## 常见问题

### Q: OCR识别速度很慢怎么办？

A: Tesseract.js的OCR识别需要下载语言包并进行处理，首次使用会比较慢。可以：
- 等待首次运行完成
- 减少处理的图片数量
- 使用更高性能的机器

### Q: 如何使用其他API（如Claude、Azure等）？

A: 修改 `.env` 文件中的 `OPENAI_BASE_URL` 和 `OPENAI_API_KEY` 为相应的API端点和密钥即可。

### Q: 信息图中的中文字体显示不正常？

A: 如果系统中没有安装合适的字体，可能会出现字体问题。可以：
- 安装Microsoft YaHei字体
- 在代码中修改为系统已有的字体

### Q: 如何提高总结的质量？

A: 可以调整 `.env` 中的以下参数：
- `OPENAI_MODEL` - 使用更强大的模型（如gpt-4）
- `DETAIL_LEVEL` - 设置为 `high` 获取更详细的总结
- `MAX_LENGTH` - 增加总结的最大长度

## 开发

### 运行开发模式

```bash
npm run dev
```

### 添加新的文件解析器

1. 在 `src/parsers/` 目录下创建新的解析器类，继承 `BaseParser`
2. 在 `src/parsers/index.js` 中注册新的扩展名和解析器
3. 实现 `parse()` 和 `extractText()` 方法

### 添加新的信息图模板

1. 在 `src/generators/templates/` 目录下创建新的模板类
2. 在模板类中实现 `draw()` 方法
3. 在 `src/generators/infographic-generator.js` 中注册新模板

## 许可证

MIT
