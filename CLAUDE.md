# 学习资料浓缩总结与信息图生成系统

这是一个 Node.js 应用程序，可以处理多种文档格式，使用 LLM API 生成摘要，并创建可视化信息图和 Markdown 文档。

## 常用命令

### 运行应用程序

```bash
# 启动应用程序
npm start

# 开发模式（自动重载）
npm run dev

# 处理单个文件
node src/index.js ./document.pdf

# 处理目录中所有支持的文件
node src/index.js ./documents/

# 指定输出目录
node src/index.js ./document.pdf --output-dir ./my-output

# 仅生成信息图（不生成 Markdown）
node src/index.js ./document.pdf --no-markdown

# 仅生成 Markdown（不生成信息图）
node src/index.js ./document.pdf --no-infographic

# 显示帮助
node src/index.js --help
```

### 安装依赖

```bash
npm install
```

### 运行测试

```bash
npm test
```

## 高层架构

应用程序采用模块化流水线架构，职责分离清晰：

```
输入文件 (PDF/Word/PPT/图片)
    |
    v
解析器工厂 -> 文件解析器 (PDF/Word/PPT/图片)
    |
    v
提取文本内容
    |
    v
文本清理器 (标准化和预处理)
    |
    v
内容总结器 -> LLM API 服务
    |                     |
    |                     +--> 生成标题
    |                     +--> 生成摘要
    |                     +--> 提取关键点
    |
    v
生成器
    |
    +--> Markdown 生成器
    |         |
    |         v
    |     输出 .md 文件
    |
    +--> 信息图生成器 (使用 @napi-rs/canvas)
              |
              v
          输出 .png 文件
```

### 模块职责

1. **解析器** (`src/parsers/`): 从各种文件格式中提取原始内容
2. **处理器** (`src/processors/`): 清理文本并协调基于 LLM 的摘要生成
3. **生成器** (`src/generators/`): 创建 Markdown 文档和信息图图片
4. **服务** (`src/services/`): 处理 LLM API 通信 (OpenAI/智谱AI)
5. **配置** (`src/config/`): 集中式配置管理及验证
6. **工具** (`src/utils/`): 文件操作和日志工具

## 重要技术细节

### ES 模块

项目使用 ES 模块 (`package.json` 中的 `"type": "module"`)。所有导入/导出必须使用 ES 模块语法：

```javascript
import something from './file.js';
export default MyClass;
export { namedExport };
```

**重要**：导入本地文件时，始终包含 `.js` 扩展名。

### 文件解析器

使用解析器工厂模式根据文件扩展名动态选择合适的解析器：

- **PDF 解析器**: 使用 `pdf-parse` 库
- **Word 解析器**: 使用 `mammoth` 库处理 .doc/.docx 文件
- **PPT 解析器**: 使用 `officeparser` 库处理 .ppt/.pptx 文件（有降级处理）
- **图片解析器**: 使用 `tesseract.js` 进行 OCR 文本提取

所有解析器都继承 `BaseParser` 并实现 `parse()` 和 `extractText()` 方法。

### LLM API 服务

`LLMService` 类通过端点检测支持多个 LLM 提供商：

**API 提供商检测**：
- 智谱AI：通过 `OPENAI_BASE_URL` 中的 `bigmodel.cn` 检测
  - 使用的端点：`{base_url}/api/paas/v4/chat/completions`
  - 示例基础 URL：`https://open.bigmodel.cn/`
- OpenAI/OpenAI 兼容：默认行为
  - 使用的端点：`{base_url}/chat/completions`

**GLM 模型推荐**：
- **推荐使用**: `GLM-4-Flash` - 快速，适合内容生成
- **不推荐使用**: `GLM-4.7` - 这是一个推理模型，输出到 `reasoning_content` 字段而非 `content`
  - 服务有降级逻辑，当 `content` 为空时从 `reasoning_content` 提取
  - 这是变通方案，不是预期使用情况

**API 配置** (`.env`):
```
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://open.bigmodel.cn/  # 用于智谱AI
OPENAI_MODEL=GLM-4-Flash                   # 推荐模型
```

**重试逻辑**：
- 最大重试次数：3（可通过 `config.maxRetries` 配置）
- 速率限制错误的指数退避 (429)
- 默认超时：60 秒

### 文本处理

`TextCleaner` 类提供静态工具方法：

- `clean(text)`: 移除 PDF 伪影、标准化空白、移除特殊字符
- `truncateText(text, maxLength)`: 在段落边界智能截断
- `splitIntoChunks(text, chunkSize, overlap)`: 分割文本以进行批处理
- `removePDFArtifacts(text)`: 移除页码、日期、URL

### 信息图生成

使用 `@napi-rs/canvas` 进行服务端图片生成：

**主要功能**：
- 基于模板的设计（目前只有 `basic` 模板）
- 可配置尺寸（默认：1920x1080）
- 通过 `"Microsoft YaHei"` 支持中文字体
- 多行内容自动换行

**模板系统**：
- 模板是 `src/generators/templates/` 中的类
- 每个模板实现 `draw(ctx, content, metadata, options)` 方法
- 可通过扩展基础模式轻松添加新模板

### 内容总结器

`ContentSummarizer` 协调 LLM 操作：

1. **预处理**: 文本被清理并截断到 4000 个字符
2. **标题生成**: 可选，失败时回退到文件名
3. **摘要生成**: 可配置长度和详细程度
4. **关键点提取**: 返回关键点数组（默认：5 个）
5. **长文本处理**: 可分块并递归摘要

### 支持的文件格式

| 扩展名 | 类型     | 解析器       | 说明                          |
|-----------|----------|--------------|--------------------------------|
| .pdf      | PDF      | PDFParser    | 通过 pdf-parse 提取文本    |
| .doc      | Word     | WordParser   | 通过 mammoth                   |
| .docx     | Word     | WordParser   | 通过 mammoth                   |
| .ppt      | PPT      | PPTParser    | 通过 officeparser（功能有限）     |
| .pptx     | PPT      | PPTParser    | 通过 officeparser（功能有限）     |
| .jpg      | 图片    | ImageParser  | 通过 tesseract.js 进行 OCR          |
| .jpeg     | 图片    | ImageParser  | 通过 tesseract.js 进行 OCR          |
| .png      | 图片    | ImageParser  | 通过 tesseract.js 进行 OCR          |
| .bmp      | 图片    | ImageParser  | 通过 tesseract.js 进行 OCR          |
| .tiff     | 图片    | ImageParser  | 通过 tesseract.js 进行 OCR          |
| .tif      | 图片    | ImageParser  | 通过 tesseract.js 进行 OCR          |
| .gif      | 图片    | ImageParser  | 通过 tesseract.js 进行 OCR          |
| .webp     | 图片    | ImageParser  | 通过 tesseract.js 进行 OCR          |

## 配置

### 环境变量

所有配置通过 `.env` 文件管理（从 `.env.example` 创建）：

**API 配置**：
- `OPENAI_API_KEY`: 必需。你的 LLM API 密钥
- `OPENAI_BASE_URL`: 可选。默认为 `https://api.openai.com/v1`
- `OPENAI_MODEL`: 可选。默认为 `gpt-3.5-turbo`

**OCR 配置**：
- `OCR_LANGUAGE`: 可选。默认为 `chi_sim+eng`（简体中文 + 英文）

**输出配置**：
- `OUTPUT_DIR`: 可选。默认为 `./output`
- `IMAGE_FORMAT`: 可选。默认为 `png`
- `IMAGE_QUALITY`: 可选。默认为 `90`

**信息图配置**：
- `INFO_WIDTH`: 可选。默认为 `1920`
- `INFO_HEIGHT`: 可选。默认为 `1080`
- `INFO_TEMPLATE`: 可选。默认为 `basic`

**摘要配置**：
- `MAX_LENGTH`: 可选。默认为 `500`（字符）
- `DETAIL_LEVEL`: 可选。默认为 `medium`（low/medium/high）
- `SUMMARY_LANGUAGE`: 可选。默认为 `zh`

### 访问配置

```javascript
import config from './config/index.js';

// 获取嵌套值
const apiKey = config.get('api.openai.apiKey');
const outputDir = config.get('output.directory');

// 验证配置
const validation = config.validate();
if (!validation.valid) {
  throw new Error(validation.errors.join('\n'));
}
```

## 重要注意事项

### 文件路径处理

- 应用程序使用 `path` 模块进行跨平台路径处理
- 主入口点 (`src/index.js`) 中正确处理 Windows 路径
- 与文件系统交互时始终使用绝对路径

### 错误处理

- 解析器在处理前验证文件存在性和非空大小
- LLM 服务实现指数退避重试逻辑
- 批处理即使单个文件失败也会继续
- 所有错误都使用适当的严重级别记录

### 日志记录

日志工具提供彩色控制台输出：

```javascript
import logger from './utils/logger.js';

logger.info('信息消息');
logger.warn('警告消息');
logger.error('错误消息');
logger.success('成功消息');
logger.debug('调试消息'); // 仅在 DEBUG=true 时显示
```

启用调试模式：
```bash
DEBUG=true npm start
```

### 输出结构

对于名为 `document.pdf` 的文件：
- Markdown: `./output/document.md`
- 信息图: `./output/document.png`

### 内存和性能考虑

1. **大文件**: 文本在发送到 LLM API 前截断到 4000 个字符
2. **OCR 处理**: 可能较慢；实时显示进度
3. **批处理**: 按顺序处理文件，非并行
4. **Canvas 生成**: 使用 `@napi-rs/canvas` 原生代码以获得性能

## 添加新功能

### 添加新解析器

1. 在 `src/parsers/` 中创建一个继承 `BaseParser` 的新类
2. 实现 `parse()` 和 `extractText()` 方法
3. 在 `src/parsers/index.js` 中添加映射：

```javascript
import NewParser from './new-parser.js';

const SUPPORTED_EXTENSIONS = {
  '.newext': NewParser,
  // ... 现有映射
};
```

### 添加新模板

1. 在 `src/generators/templates/` 中创建一个继承模板模式的新类
2. 实现 `draw(ctx, content, metadata, options)` 方法
3. 在 `src/generators/infographic-generator.js` 中注册：

```javascript
import NewTemplate from './templates/new-template.js';

const TEMPLATES = {
  basic: BasicTemplate,
  newtemplate: NewTemplate,
};
```

### 添加新的 LLM 操作

扩展 `LLMService` 类：

```javascript
async newOperation(params) {
  const response = await this.callAPI({
    model: this.model,
    messages: [
      { role: 'system', content: '系统提示...' },
      { role: 'user', content: '用户提示...' }
    ],
    max_tokens: 1000,
    temperature: 0.5
  });
  // 处理并返回响应
}
```

## 故障排除

### 常见问题

1. **"API 密钥无效"**: 检查 `.env` 文件中的 `OPENAI_API_KEY`
2. **"不支持的文件格式"**: 验证文件扩展名是否在支持列表中
3. **"OCR 耗时太长"**: 这对复杂图片是正常的；会显示进度
4. **"文本内容太少"**: 提取的文本必须至少 10 个字符
5. **"Canvas 错误"**: 确保 `@napi-rs/canvas` 正确安装（在某些平台上可能需要构建工具）

### 调试模式

启用调试日志以查看详细的 API 响应：

```bash
DEBUG=true npm start
```
