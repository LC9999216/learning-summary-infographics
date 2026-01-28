import BaseParser from './base-parser.js';
import officeParser from 'officeparser';

export default class PPTParser extends BaseParser {
  async parse() {
    await this.validateFile();

    try {
      const data = await officeParser.parseOfficeAsync(this.filePath);

      this.content = {
        text: this.extractTextFromPPT(data),
        raw: data
      };

      return this.content;
    } catch (error) {
      // Fallback: try a simpler extraction
      this.content = {
        text: '[PPT文件解析需要额外处理]\n\n当前使用的是基础解析器，对于复杂的PPT文件，建议使用其他工具或手动提取内容。',
        raw: null
      };
      return this.content;
    }
  }

  extractTextFromPPT(data) {
    if (typeof data === 'string') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => {
        if (typeof item === 'string') return item;
        if (item.text) return item.text;
        return '';
      }).filter(Boolean).join('\n\n');
    }

    if (data && typeof data === 'object') {
      const result = [];

      // 尝试从常见字段提取
      if (data.slides) {
        data.slides.forEach((slide, i) => {
          result.push(`\n--- 第${i + 1}页 ---`);
          if (slide.text) result.push(slide.text);
          if (slide.title) result.push(slide.title);
        });
      }

      if (data.text) result.push(data.text);

      return result.length > 0 ? result.join('\n') : JSON.stringify(data, null, 2);
    }

    return '';
  }

  async extractText() {
    if (!this.content) {
      await this.parse();
    }
    return this.content.text;
  }
}
