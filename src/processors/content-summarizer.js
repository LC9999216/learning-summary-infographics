import TextCleaner from './text-cleaner.js';
import logger from '../utils/logger.js';

export default class ContentSummarizer {
  constructor(apiService, options = {}) {
    this.apiService = apiService;
    this.options = {
      maxLength: options.maxLength || 500,
      detailLevel: options.detailLevel || 'medium',
      language: options.language || 'zh',
      ...options
    };
  }

  async summarize(text, context = {}) {
    logger.info('开始生成内容总结...');

    // 预处理文本
    const cleanedText = await this.preprocessText(text);

    if (cleanedText.length < 50) {
      return cleanedText; // 文本太短，直接返回
    }

    // 截取适合API处理的长度
    const processText = TextCleaner.truncateText(cleanedText, 4000);

    try {
      const summary = await this.apiService.generateSummary({
        text: processText,
        maxLength: this.options.maxLength,
        detailLevel: this.options.detailLevel,
        language: this.options.language,
        ...context
      });

      logger.success('总结生成完成');
      return summary;

    } catch (error) {
      logger.error(`总结生成失败: ${error.message}`);
      throw error;
    }
  }

  async extractKeyPoints(text, count = 5) {
    logger.info(`开始提取${count}个关键要点...`);

    const cleanedText = await this.preprocessText(text);
    const processText = TextCleaner.truncateText(cleanedText, 4000);

    try {
      const keyPoints = await this.apiService.extractKeyPoints({
        text: processText,
        count: count,
        language: this.options.language
      });

      logger.success(`关键要点提取完成，共${keyPoints.length}个`);
      return keyPoints;

    } catch (error) {
      logger.error(`关键要点提取失败: ${error.message}`);
      throw error;
    }
  }

  async generateTitle(text) {
    const cleanedText = await this.preprocessText(text);
    const processText = TextCleaner.truncateText(cleanedText, 1000);

    try {
      const title = await this.apiService.generateTitle(processText);
      return title || '学习总结';
    } catch (error) {
      logger.warn(`标题生成失败，使用默认标题: ${error.message}`);
      return '学习总结';
    }
  }

  async preprocessText(text) {
    return await TextCleaner.clean(text);
  }

  async summarizeLongText(text, maxChunks = 3) {
    logger.info('开始处理长文本...');

    const cleanedText = await this.preprocessText(text);

    if (cleanedText.length <= 4000) {
      return {
        summary: await this.summarize(cleanedText),
        keyPoints: await this.extractKeyPoints(cleanedText)
      };
    }

    // 分块处理
    const chunks = TextCleaner.splitIntoChunks(cleanedText, 3000, 200).slice(0, maxChunks);

    logger.info(`长文本分为${chunks.length}个块进行处理`);

    const results = await Promise.all(
      chunks.map(chunk => this.summarize(chunk))
    );

    // 合并总结
    const combinedSummary = results.join('\n\n');

    // 从合并的总结中提取关键点
    const finalSummary = await this.summarize(combinedSummary, {
      detailLevel: 'medium'
    });

    const keyPoints = await this.extractKeyPoints(combinedSummary);

    return {
      summary: finalSummary,
      keyPoints: keyPoints
    };
  }
}
