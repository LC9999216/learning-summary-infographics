import logger from '../utils/logger.js';

export default class MarkdownGenerator {
  constructor(options = {}) {
    this.options = {
      format: options.format || 'standard',
      includeMetadata: options.includeMetadata !== false,
      ...options
    };
  }

  async generate(content, metadata = {}) {
    logger.info('开始生成Markdown文档...');

    let markdown = '';

    // 添加标题
    markdown += this.generateTitle(content, metadata);

    // 添加元数据
    if (this.options.includeMetadata) {
      markdown += this.generateMetadata(metadata);
    }

    // 添加分隔线
    markdown += '\n---\n\n';

    // 添加概述
    if (content.summary) {
      markdown += this.generateSummary(content.summary);
    }

    // 添加关键点
    if (content.keyPoints && content.keyPoints.length > 0) {
      markdown += this.generateKeyPoints(content.keyPoints);
    }

    // 添加详细内容（如果有）
    if (content.details) {
      markdown += this.generateDetails(content.details);
    }

    // 添加来源信息
    if (metadata.source) {
      markdown += this.generateSourceInfo(metadata.source);
    }

    logger.success('Markdown文档生成完成');
    return markdown;
  }

  generateTitle(content, metadata) {
    const title = content.title || metadata.title || '学习总结';
    return `# ${title}\n\n`;
  }

  generateMetadata(metadata) {
    let meta = '<details>\n';
    meta += '<summary>📋 文档信息</summary>\n\n';

    if (metadata.date) {
      meta += `- **生成日期**: ${metadata.date}\n`;
    }
    if (metadata.source) {
      meta += `- **资料来源**: ${metadata.source}\n`;
    }
    if (metadata.author) {
      meta += `- **作者**: ${metadata.author}\n`;
    }

    meta += '\n</details>\n\n';
    return meta;
  }

  generateSummary(summary) {
    let section = '## 📖 内容概述\n\n';
    section += `${summary}\n\n`;
    return section;
  }

  generateKeyPoints(points) {
    let section = '## 🔑 关键要点\n\n';

    points.forEach((point, index) => {
      section += `${index + 1}. ${point}\n`;
    });

    section += '\n';
    return section;
  }

  generateDetails(details) {
    let section = '## 📚 详细内容\n\n';

    if (Array.isArray(details)) {
      details.forEach((item, index) => {
        section += `### ${item.title || `第${index + 1}节`}\n\n`;
        section += `${item.content}\n\n`;
      });
    } else {
      section += `${details}\n\n`;
    }

    return section;
  }

  generateSourceInfo(source) {
    return `\n---\n\n**资料来源**: ${source}\n`;
  }

  async saveToFile(markdown, outputPath) {
    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, markdown, 'utf-8');
    return outputPath;
  }
}
