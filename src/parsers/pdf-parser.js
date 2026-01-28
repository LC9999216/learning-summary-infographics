import BaseParser from './base-parser.js';
import pdf from 'pdf-parse';

export default class PDFParser extends BaseParser {
  async parse() {
    await this.validateFile();

    const dataBuffer = await import('fs').then(fs => fs.default.promises.readFile(this.filePath));
    const data = await pdf(dataBuffer);

    this.content = {
      text: data.text,
      pages: data.numpages,
      metadata: data.info,
      version: data.pdfjsVersion || null
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
