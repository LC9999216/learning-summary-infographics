import { createCanvas } from '@napi-rs/canvas';
import BasicTemplate from './templates/basic-template.js';
import logger from '../utils/logger.js';

const TEMPLATES = {
  basic: BasicTemplate
};

export default class InfographicGenerator {
  constructor(options = {}) {
    this.options = {
      width: options.width || 1920,
      height: options.height || 1080,
      backgroundColor: options.backgroundColor || '#ffffff',
      template: options.template || 'basic',
      ...options
    };

    this.template = this.loadTemplate(this.options.template);
  }

  async generate(content, metadata = {}) {
    logger.info('开始生成信息图...');

    try {
      const canvas = createCanvas(this.options.width, this.options.height);
      const ctx = canvas.getContext('2d');

      // 绘制背景
      this.drawBackground(ctx);

      // 应用模板
      await this.template.draw(ctx, content, metadata, this.options);

      // 生成图片
      const buffer = await canvas.encode('png');

      logger.success('信息图生成完成');

      return {
        buffer,
        format: 'png',
        width: this.options.width,
        height: this.options.height
      };

    } catch (error) {
      logger.error(`信息图生成失败: ${error.message}`);
      throw error;
    }
  }

  drawBackground(ctx) {
    ctx.fillStyle = this.options.backgroundColor;
    ctx.fillRect(0, 0, this.options.width, this.options.height);
  }

  loadTemplate(templateName) {
    const TemplateClass = TEMPLATES[templateName];

    if (!TemplateClass) {
      logger.warn(`模板 "${templateName}" 不存在，使用默认模板`);
      return new BasicTemplate();
    }

    return new TemplateClass();
  }

  async saveToFile(result, outputPath) {
    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, result.buffer);
    return outputPath;
  }

  getSupportedTemplates() {
    return Object.keys(TEMPLATES);
  }
}
