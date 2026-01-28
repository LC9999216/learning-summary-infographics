import path from 'path';
import fs from 'fs/promises';

import ParserFactory from './parsers/index.js';
import ContentSummarizer from './processors/content-summarizer.js';
import InfographicGenerator from './generators/infographic-generator.js';
import MarkdownGenerator from './generators/markdown-generator.js';
import LLMService from './services/llm-service.js';
import config from './config/index.js';
import logger from './utils/logger.js';
import { ensureDirectory, getOutputPath, getFileExtension } from './utils/file-utils.js';

export default class StudySummarySystem {
  constructor(options = {}) {
    this.options = options;

    // 验证配置
    const validation = config.validate();
    if (!validation.valid) {
      throw new Error(`配置错误:\n${validation.errors.join('\n')}`);
    }

    // 初始化服务
    this.apiService = new LLMService(config.get('api.openai'));
    this.apiService.validateConfig();

    // 初始化处理器
    this.summarizer = new ContentSummarizer(this.apiService, config.get('summary'));

    // 初始化生成器
    this.infographicGenerator = new InfographicGenerator(config.get('infographic'));
    this.markdownGenerator = new MarkdownGenerator();
  }

  async processFile(inputPath, outputOptions = {}) {
    logger.info(`\n开始处理文件: ${inputPath}`);

    try {
      // 1. 解析文件
      logger.info('正在解析文件...');
      const parser = ParserFactory.getParser(inputPath, this.options);
      const parsedContent = await parser.parse();
      logger.success('文件解析完成');

      // 2. 提取文本内容
      logger.info('正在提取文本内容...');
      const text = await parser.extractText();

      if (!text || text.trim().length < 10) {
        throw new Error('提取的文本内容太少，无法生成总结');
      }

      logger.info(`提取到 ${text.length} 个字符`);

      // 3. 生成标题（可选）
      let title = this.extractTitle(inputPath);
      try {
        logger.info('正在生成标题...');
        title = await this.summarizer.generateTitle(text);
        logger.success(`标题: ${title}`);
      } catch (error) {
        logger.warn(`标题生成失败，使用文件名: ${error.message}`);
      }

      // 4. 生成总结
      logger.info('正在生成内容总结...');
      const summary = await this.summarizer.summarize(text);
      logger.success('总结生成完成');

      // 5. 提取关键点
      logger.info('正在提取关键要点...');
      const keyPoints = await this.summarizer.extractKeyPoints(text, 5);
      logger.success(`提取到 ${keyPoints.length} 个关键要点`);

      // 6. 准备内容对象
      const content = {
        title,
        summary,
        keyPoints,
        details: text.substring(0, 1500) + (text.length > 1500 ? '\n\n[内容已截断...]' : '')
      };

      // 7. 确保输出目录存在
      const outputDir = outputOptions.outputDir || config.get('output.directory');
      await ensureDirectory(outputDir);

      // 8. 生成输出
      const results = {};

      // 生成Markdown
      if (outputOptions.markdown !== false) {
        logger.info('正在生成Markdown文档...');
        const markdown = await this.markdownGenerator.generate(content, {
          date: new Date().toLocaleDateString('zh-CN'),
          source: path.basename(inputPath)
        });

        const mdPath = getOutputPath(inputPath, 'md', outputDir);
        await this.markdownGenerator.saveToFile(markdown, mdPath);
        results.markdown = mdPath;
        logger.success(`Markdown生成完成: ${mdPath}`);
      }

      // 生成信息图
      if (outputOptions.infographic !== false) {
        logger.info('正在生成信息图...');
        const infographic = await this.infographicGenerator.generate(content, {
          date: new Date().toLocaleDateString('zh-CN'),
          source: path.basename(inputPath)
        });

        const imgPath = getOutputPath(inputPath, 'png', outputDir);
        await this.infographicGenerator.saveToFile(infographic, imgPath);
        results.infographic = imgPath;
        logger.success(`信息图生成完成: ${imgPath}`);
      }

      logger.info(`\n处理完成！输出文件保存在: ${outputDir}`);

      return {
        success: true,
        content: content,
        outputs: results
      };

    } catch (error) {
      logger.error(`\n处理文件失败: ${error.message}`);
      throw error;
    }
  }

  async processBatch(files, outputOptions = {}) {
    logger.info(`\n开始批量处理 ${files.length} 个文件`);

    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      logger.info(`\n[${i + 1}/${files.length}] 处理文件: ${file}`);

      try {
        const result = await this.processFile(file, outputOptions);
        results.push({
          file: file,
          success: true,
          result: result
        });
      } catch (error) {
        results.push({
          file: file,
          success: false,
          error: error.message
        });
        logger.warn(`文件处理失败，继续下一个...`);
      }
    }

    // 输出批量处理结果
    logger.info('\n\n批量处理结果:');
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    logger.info(`成功: ${successCount}, 失败: ${failCount}`);

    results.forEach((r, i) => {
      if (r.success) {
        logger.success(`${i + 1}. ${r.file} - 成功`);
      } else {
        logger.error(`${i + 1}. ${r.file} - 失败: ${r.error}`);
      }
    });

    return results;
  }

  extractTitle(filePath) {
    const basename = path.basename(filePath, path.extname(filePath));
    return basename.replace(/[-_]/g, ' ');
  }

  async getSupportedFiles(dir) {
    try {
      const files = await fs.readdir(dir);
      return files
        .filter(file => ParserFactory.isSupported(file))
        .map(file => path.join(dir, file));
    } catch (error) {
      logger.error(`读取目录失败: ${error.message}`);
      return [];
    }
  }
}

// CLI入口
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
学习资料浓缩总结+信息图生成系统

使用方法:
  node src/index.js <文件路径|目录> [选项]

选项:
  --no-markdown       不生成Markdown文档
  --no-infographic    不生成信息图
  --output-dir <dir>  指定输出目录
  --help, -h          显示此帮助信息

示例:
  # 处理单个文件
  node src/index.js ./document.pdf

  # 处理目录中所有支持的文件
  node src/index.js ./documents/

  # 指定输出目录
  node src/index.js ./document.pdf --output-dir ./my-output

  # 只生成信息图
  node src/index.js ./document.pdf --no-markdown

支持的文件格式:
  PDF: .pdf
  Word: .doc, .docx
  PowerPoint: .ppt, .pptx
  图片: .jpg, .jpeg, .png, .bmp, .gif, .webp
`);
    process.exit(0);
  }

  const inputPath = args[0];

  // 解析选项
  const options = {
    markdown: !args.includes('--no-markdown'),
    infographic: !args.includes('--no-infographic'),
    outputDir: args.find(arg => arg.startsWith('--output-dir='))?.split('=')[1]
  };

  try {
    const system = new StudySummarySystem();

    const stats = await fs.stat(inputPath);

    if (stats.isDirectory()) {
      // 处理目录
      logger.info(`正在扫描目录: ${inputPath}`);
      const files = await system.getSupportedFiles(inputPath);

      if (files.length === 0) {
        logger.warn('目录中没有找到支持的文件');
        process.exit(0);
      }

      logger.info(`找到 ${files.length} 个支持的文件`);

      await system.processBatch(files, options);

    } else {
      // 处理单个文件
      await system.processFile(inputPath, options);
    }

    logger.info('\n所有任务完成！');

  } catch (error) {
    logger.error(`\n错误: ${error.message}`);
    process.exit(1);
  }
}

// 导出供其他模块使用
export { StudySummarySystem };

// 如果直接运行此文件，执行main函数
// 使用更可靠的判断方法，兼容Windows
const isMainModule = process.argv[1] && (
  import.meta.url === new URL(`file://${process.argv[1]}`).href ||
  import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))
);

if (isMainModule) {
  main();
}
