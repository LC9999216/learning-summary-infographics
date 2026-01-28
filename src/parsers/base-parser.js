import fs from 'fs/promises';
import { fileExists, getFileExtension } from '../utils/file-utils.js';

export default class BaseParser {
  constructor(filePath, options = {}) {
    this.filePath = filePath;
    this.options = options;
    this.content = null;
    this.extension = getFileExtension(filePath);
  }

  async validateFile() {
    if (!await fileExists(this.filePath)) {
      throw new Error(`File does not exist: ${this.filePath}`);
    }

    const stats = await fs.stat(this.filePath);
    if (stats.size === 0) {
      throw new Error(`File is empty: ${this.filePath}`);
    }

    return true;
  }

  async parse() {
    throw new Error('parse() must be implemented by subclass');
  }

  async extractText() {
    throw new Error('extractText() must be implemented by subclass');
  }

  async extractImages() {
    throw new Error('extractImages() must be implemented by subclass');
  }

  getContent() {
    if (!this.content) {
      throw new Error('Content not parsed yet. Call parse() first.');
    }
    return this.content;
  }
}
