export default class TextCleaner {
  static async clean(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    let cleaned = text;

    // 移除多余的空白字符（但保留段落分隔）
    cleaned = cleaned.replace(/[ \t]+/g, ' ');

    // 移除过多的空行
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // 移除常见的PDF提取伪影
    cleaned = this.removePDFArtifacts(cleaned);

    // 移除特殊字符（保留基本标点和中文）
    cleaned = cleaned.replace(/[^\w\s\u4e00-\u9fff\u3000-\u303f\uff00-\uffef.,!?;:()\-'"'"''「」『』【】、。！？；：]/g, '');

    // 清理重复字符（如连续的点号）
    cleaned = cleaned.replace(/([.。!！?？])\1{2,}/g, '$1');

    return cleaned.trim();
  }

  static removePDFArtifacts(text) {
    // 移除页码模式（如"第1页"）
    text = text.replace(/^第?\d+[页Pp]\s*$/gm, '');

    // 移除日期页脚
    text = text.replace(/^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}\s*$/gm, '');

    // 移除常见的页眉页脚模式
    text = text.replace(/^(www\.[^\s]+|http[^\s]+)\s*$/gm, '');

    // 移除空括号
    text = text.replace(/\(\s*\)/g, '');
    text = text.replace(/（\s*）/g, '');
    text = text.replace(/【\s*】/g, '');

    return text;
  }

  static removeDuplicates(text) {
    const paragraphs = text.split(/\n+/);
    const seen = new Set();
    const unique = [];

    for (const para of paragraphs) {
      const normalized = para.trim().replace(/\s+/g, '');
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        unique.push(para.trim());
      }
    }

    return unique.join('\n\n');
  }

  static truncateText(text, maxLength = 4000) {
    if (text.length <= maxLength) {
      return text;
    }

    // 智能截取：在段落边界处截断
    const truncated = text.substring(0, maxLength);
    const lastNewline = truncated.lastIndexOf('\n');

    if (lastNewline > maxLength * 0.8) {
      return text.substring(0, lastNewline) + '\n\n[内容已截断...]';
    }

    return truncated + '...';
  }

  static extractFirstParagraph(text) {
    const paragraphs = text.split(/\n+/).filter(p => p.trim());
    return paragraphs[0]?.trim() || '';
  }

  static splitIntoChunks(text, chunkSize = 3000, overlap = 200) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = start + chunkSize;

      // 尝试在句子或段落边界处分割
      if (end < text.length) {
        const lastSentence = text.lastIndexOf('。', end);
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);

        const splitPoint = Math.max(lastSentence, lastPeriod, lastNewline);

        if (splitPoint > start + chunkSize * 0.5) {
          end = splitPoint + 1;
        }
      }

      chunks.push(text.substring(start, end).trim());
      start = end - overlap;
    }

    return chunks;
  }
}
