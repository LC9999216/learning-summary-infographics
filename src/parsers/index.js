import path from 'path';
import PDFParser from './pdf-parser.js';
import WordParser from './word-parser.js';
import PPTParser from './ppt-parser.js';
import ImageParser from './image-parser.js';
import { getFileExtension } from '../utils/file-utils.js';

const SUPPORTED_EXTENSIONS = {
  '.pdf': PDFParser,
  '.doc': WordParser,
  '.docx': WordParser,
  '.ppt': PPTParser,
  '.pptx': PPTParser,
  '.jpg': ImageParser,
  '.jpeg': ImageParser,
  '.png': ImageParser,
  '.bmp': ImageParser,
  '.tiff': ImageParser,
  '.tif': ImageParser,
  '.gif': ImageParser,
  '.webp': ImageParser
};

export class ParserFactory {
  static getParser(filePath, options = {}) {
    const ext = getFileExtension(filePath);

    const ParserClass = SUPPORTED_EXTENSIONS[ext];

    if (!ParserClass) {
      throw new Error(
        `不支持的文件格式: ${ext}\n` +
        `支持的格式: ${Object.keys(SUPPORTED_EXTENSIONS).join(', ')}`
      );
    }

    return new ParserClass(filePath, options);
  }

  static getSupportedExtensions() {
    return Object.keys(SUPPORTED_EXTENSIONS);
  }

  static isSupported(filePath) {
    return SUPPORTED_EXTENSIONS[getFileExtension(filePath)] !== undefined;
  }
}

export default ParserFactory;
