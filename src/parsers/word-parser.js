import BaseParser from './base-parser.js';
import mammoth from 'mammoth';

export default class WordParser extends BaseParser {
  async parse() {
    await this.validateFile();

    const result = await mammoth.extractRawText({
      path: this.filePath
    });

    this.content = {
      text: result.value,
      messages: result.messages,
      warnings: result.warnings || []
    };

    return this.content;
  }

  async extractText() {
    if (!this.content) {
      await this.parse();
    }
    return this.content.text;
  }
}
