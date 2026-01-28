import axios from 'axios';
import logger from '../utils/logger.js';

export default class LLMService {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.model = config.model || 'gpt-3.5-turbo';
    this.timeout = config.timeout || 60000;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  async generateSummary(params) {
    const prompt = this.buildSummaryPrompt(params);

    logger.debug('Generating summary...');

    const response = await this.callAPI({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的内容总结助手，擅长提取核心信息和生成简洁易懂的总结。请用通俗易懂的语言进行总结。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: Math.max((params.maxLength || 500) * 2, 800),  // 增加token避免被截断
      temperature: 0.5
    });

    // 兼容不同的响应格式
    if (response.choices && response.choices[0]) {
      const message = response.choices[0].message;
      let content = message?.content;

      // 智谱AI GLM-4.7：如果content为空，尝试从reasoning_content提取
      if (!content && message?.reasoning_content) {
        // 从推理内容中提取最后几行（通常答案在最后）
        const lines = message.reasoning_content.split('\n');
        // 简单策略：取最后一段作为答案
        const lastSection = lines.slice(-10).join('\n');
        content = lastSection;
      }

      if (content && typeof content === 'string') {
        return content.trim();
      }
    }
    throw new Error('API返回的数据格式不正确或content为空');
  }

  async extractKeyPoints(params) {
    const prompt = this.buildKeyPointsPrompt(params);

    logger.debug('Extracting key points...');

    const response = await this.callAPI({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: '你是一个信息提取专家，能够准确识别文本中的关键要点。请用简洁明了的语言提取要点。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.4
    });

    // 兼容不同的响应格式
    let content;
    if (response.choices && response.choices[0]) {
      const message = response.choices[0].message;
      content = message?.content;

      // 智谱AI GLM-4.7：如果content为空，尝试从reasoning_content提取
      if (!content && message?.reasoning_content) {
        // 从推理内容中提取最后几行（通常答案在最后）
        const lines = message.reasoning_content.split('\n');
        // 简单策略：取最后一段作为答案
        const lastSection = lines.slice(-10).join('\n');
        content = lastSection;
      }

      if (!content || typeof content !== 'string') {
        throw new Error('API返回的content不是有效字符串');
      }
    } else {
      throw new Error('API返回的数据格式不正确');
    }

    const keyPoints = this.parseKeyPoints(content, params.count || 5);
    logger.debug('解析到的关键要点:', keyPoints);
    return keyPoints;
  }

  async translate(params) {
    logger.debug('Translating text...');

    const response = await this.callAPI({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的翻译助手，能够准确翻译文本内容。'
        },
        {
          role: 'user',
          content: `将以下文本翻译成${params.targetLang === 'zh' ? '中文' : '英文'}：\n\n${params.text}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.2
    });

    // 兼容不同的响应格式
    if (response.choices && response.choices[0]) {
      const message = response.choices[0].message;
      let content = message?.content;

      // 智谱AI GLM-4.7：如果content为空，尝试从reasoning_content提取
      if (!content && message?.reasoning_content) {
        // 从推理内容中提取最后几行（通常答案在最后）
        const lines = message.reasoning_content.split('\n');
        // 简单策略：取最后一段作为答案
        const lastSection = lines.slice(-10).join('\n');
        content = lastSection;
      }

      if (content && typeof content === 'string') {
        return content.trim();
      }
    }
    throw new Error('API返回的数据格式不正确或content为空');
  }

  async generateTitle(text) {
    logger.debug('Generating title...');

    const response = await this.callAPI({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的标题生成助手，能够为文本生成简洁准确的标题。'
        },
        {
          role: 'user',
          content: `请为以下内容生成一个简洁的标题（不要超过20字）：\n\n${text.substring(0, 500)}`
        }
      ],
      max_tokens: 200,  // 增加token避免被截断
      temperature: 0.5
    });

    // 兼容不同的响应格式
    if (response.choices && response.choices[0]) {
      const message = response.choices[0].message;
      let title = message?.content;

      // 智谱AI GLM-4.7：如果content为空，尝试从reasoning_content提取
      if (!title && message?.reasoning_content) {
        // 从推理内容末尾提取标题（通常在最后）
        const lines = message.reasoning_content.split('\n');
        const lastLine = lines[lines.length - 1];
        title = lastLine || lines[lines.length - 2] || '';
      }

      if (title && typeof title === 'string') {
        return title.trim();
      }
    }
    return '学习总结';
  }

  buildSummaryPrompt(params) {
    const lengthMap = {
      low: '非常简短（1-2句话）',
      medium: '适中（3-5句话）',
      high: '详细（包含更多细节）'
    };

    return `请对以下内容进行${lengthMap[params.detailLevel] || '适中'}的总结：

原文：
${params.text}

要求：
1. 提取核心信息
2. 语言简洁明了，通俗易懂
3. 使用${params.language === 'zh' ? '中文' : '英文'}回答
4. 长度控制在${params.maxLength || 500}字以内`;
  }

  buildKeyPointsPrompt(params) {
    return `请从以下文本中提取${params.count || 5}个关键要点：

原文：
${params.text}

要求：
1. 每个要点简洁明了
2. 按重要性排序
3. 使用${params.language === 'zh' ? '中文' : '英文'}回答
4. 以列表形式输出，每行一个要点`;
  }

  parseKeyPoints(content, count) {
    const lines = content
      .split('\n')
      .map(line => {
        // 移除列表标记
        return line
          .replace(/^[\d\-\*•\.\)]+\s*/, '')
          .replace(/^\s*第?\d+[个项点]?\s*[:：]?\s*/, '')
          .trim();
      })
      .filter(line => line.length > 0 && line.length < 200);

    return lines.slice(0, count);
  }

  async callAPI(payload) {
    // 根据baseUrl判断API提供商，使用正确的端点
    let endpoint;
    if (this.baseUrl.includes('bigmodel.cn')) {
      // 智谱AI端点
      endpoint = this.baseUrl.endsWith('/') ?
        `${this.baseUrl}api/paas/v4/chat/completions` :
        `${this.baseUrl}/api/paas/v4/chat/completions`;
    } else {
      // OpenAI兼容端点
      endpoint = this.baseUrl.endsWith('/') ?
        `${this.baseUrl}chat/completions` :
        `${this.baseUrl}/chat/completions`;
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.post(
          endpoint,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            timeout: this.timeout
          }
        );

        logger.debug('API响应:', JSON.stringify(response.data, null, 2));
        return response.data;

      } catch (error) {
        if (attempt === this.maxRetries) {
          this.handleError(error);
        }

        logger.warn(`API调用失败，第${attempt}次重试... (${error.message})`);

        if (error.response?.status === 429) {
          // Rate limit - wait longer
          await this.sleep(this.retryDelay * attempt * 2);
        } else {
          await this.sleep(this.retryDelay * attempt);
        }
      }
    }
  }

  handleError(error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        throw new Error('API密钥无效，请检查OPENAI_API_KEY配置');
      } else if (status === 429) {
        throw new Error('API调用频率超限，请稍后再试');
      } else if (status === 500) {
        throw new Error('API服务器错误，请稍后再试');
      }

      throw new Error(`API调用失败 (${status}): ${data?.error?.message || error.message}`);
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('API请求超时，请检查网络连接');
    } else {
      throw new Error(`API调用失败: ${error.message}`);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  validateConfig() {
    if (!this.apiKey) {
      throw new Error('API密钥未配置，请在.env文件中设置OPENAI_API_KEY');
    }
    return true;
  }
}
