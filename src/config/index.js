import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

class Config {
  constructor() {
    this.loadConfig();
  }

  loadConfig() {
    this.api = {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
      }
    };

    this.ocr = {
      language: process.env.OCR_LANGUAGE || 'chi_sim+eng'
    };

    this.output = {
      directory: process.env.OUTPUT_DIR || './output',
      imageFormat: process.env.IMAGE_FORMAT || 'png',
      imageQuality: parseInt(process.env.IMAGE_QUALITY) || 90
    };

    this.infographic = {
      width: parseInt(process.env.INFO_WIDTH) || 1920,
      height: parseInt(process.env.INFO_HEIGHT) || 1080,
      template: process.env.INFO_TEMPLATE || 'basic'
    };

    this.summary = {
      maxLength: parseInt(process.env.MAX_LENGTH) || 500,
      detailLevel: process.env.DETAIL_LEVEL || 'medium',
      language: process.env.SUMMARY_LANGUAGE || 'zh'
    };
  }

  get(path) {
    const keys = path.split('.');
    let value = this;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  validate() {
    const errors = [];

    if (!this.api.openai.apiKey) {
      errors.push('OPENAI_API_KEY is not set in .env file');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default new Config();
