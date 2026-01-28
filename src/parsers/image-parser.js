import BaseParser from './base-parser.js';
import Tesseract from 'tesseract.js';

export default class ImageParser extends BaseParser {
  constructor(filePath, options = {}) {
    super(filePath, options);
    this.language = options.language || 'chi_sim+eng';
  }

  async parse() {
    await this.validateFile();

    console.log('正在进行OCR文字识别，这可能需要一些时间...');

    try {
      const worker = await Tesseract.createWorker({
        logger: (m) => {
          if (m.status === 'recognizing text') {
            process.stdout.write(`\r进度: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      await worker.loadLanguage(this.language);
      await worker.initialize(this.language);

      const { data } = await worker.recognize(this.filePath);

      await worker.terminate();

      console.log('\r完成OCR识别              ');

      this.content = {
        text: data.text,
        confidence: data.confidence,
        words: data.words,
        lines: data.lines
      };

      return this.content;

    } catch (error) {
      throw new Error(`OCR识别失败: ${error.message}`);
    }
  }

  async extractText() {
    if (!this.content) {
      await this.parse();
    }
    return this.content.text;
  }
}
