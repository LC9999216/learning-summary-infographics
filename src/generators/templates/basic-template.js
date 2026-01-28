import { createCanvas } from '@napi-rs/canvas';

export default class BasicTemplate {
  constructor() {
    this.layout = {
      title: { x: 0.05, y: 0.04, width: 0.9, height: 0.12 },
      summary: { x: 0.05, y: 0.18, width: 0.6, height: 0.4 },
      keyPoints: { x: 0.7, y: 0.18, width: 0.25, height: 0.75 },
      metadata: { x: 0.05, y: 0.92, width: 0.9, height: 0.06 }
    };
  }

  async draw(ctx, content, metadata, options) {
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    // 绘制标题
    this.drawTitle(ctx, content.title || metadata.title || '学习总结', canvasWidth, canvasHeight);

    // 绘制主要内容（总结）
    this.drawSummaryBox(ctx, content.summary || '', canvasWidth, canvasHeight);

    // 绘制关键点
    this.drawKeyPointsBox(ctx, content.keyPoints || [], canvasWidth, canvasHeight);

    // 绘制底部元数据
    this.drawMetadata(ctx, metadata, canvasWidth, canvasHeight);
  }

  drawTitle(ctx, title, canvasWidth, canvasHeight) {
    const { x, y } = this.layout.title;

    // 绘制标题背景
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight * 0.14);

    // 绘制标题
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const titleText = this.truncateText(title, 30);
    ctx.fillText(
      titleText,
      x * canvasWidth + (this.layout.title.width * canvasWidth) / 2,
      y * canvasHeight + (this.layout.title.height * canvasHeight) / 2
    );

    // 绘制装饰线
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvasWidth * 0.1, canvasHeight * 0.13);
    ctx.lineTo(canvasWidth * 0.9, canvasHeight * 0.13);
    ctx.stroke();
  }

  drawSummaryBox(ctx, summary, canvasWidth, canvasHeight) {
    const { x, y, width, height } = this.layout.summary;

    // 绘制背景框
    ctx.fillStyle = '#f8f9fa';
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 2;
    this.roundRect(ctx, x * canvasWidth, y * canvasHeight, width * canvasWidth, height * canvasHeight, 10);
    ctx.fill();
    ctx.stroke();

    // 绘制小标题
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 28px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('内容概述', x * canvasWidth + 20, y * canvasHeight + 20);

    // 绘制总结内容
    ctx.fillStyle = '#34495e';
    ctx.font = '20px "Microsoft YaHei", sans-serif';

    const summaryText = this.truncateText(summary, 200);
    const lines = this.wrapText(ctx, summaryText, width * canvasWidth - 40);

    lines.forEach((line, index) => {
      if (index < 15) { // 最多显示15行
        ctx.fillText(
          line,
          x * canvasWidth + 20,
          y * canvasHeight + 60 + index * 28
        );
      }
    });

    // 绘制图标装饰
    this.drawIcon(ctx, '📝', x * canvasWidth + 20, y * canvasHeight + 20, 28);
  }

  drawKeyPointsBox(ctx, points, canvasWidth, canvasHeight) {
    const { x, y, width, height } = this.layout.keyPoints;

    // 绘制背景框
    ctx.fillStyle = '#fff3e0';
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 2;
    this.roundRect(ctx, x * canvasWidth, y * canvasHeight, width * canvasWidth, height * canvasHeight, 10);
    ctx.fill();
    ctx.stroke();

    // 绘制小标题
    ctx.fillStyle = '#e65100';
    ctx.font = 'bold 28px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('关键要点', x * canvasWidth + 20, y * canvasHeight + 20);

    // 绘制关键点列表
    ctx.fillStyle = '#424242';
    ctx.font = '20px "Microsoft YaHei", sans-serif';

    points.slice(0, 10).forEach((point, index) => {
      const pointText = this.truncateText(point, 40);
      const pointNum = (index + 1).toString();

      // 绘制序号圆圈
      ctx.beginPath();
      ctx.arc(x * canvasWidth + 30, y * canvasHeight + 70 + index * 40, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#ff9800';
      ctx.fill();

      // 绘制序号
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        pointNum,
        x * canvasWidth + 30,
        y * canvasHeight + 70 + index * 40
      );

      // 绘制要点文本
      ctx.fillStyle = '#424242';
      ctx.font = '20px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(
        pointText,
        x * canvasWidth + 55,
        y * canvasHeight + 60 + index * 40
      );
    });

    // 绘制图标装饰
    this.drawIcon(ctx, '💡', x * canvasWidth + 20, y * canvasHeight + 20, 28);
  }

  drawMetadata(ctx, metadata, canvasWidth, canvasHeight) {
    const { x, y } = this.layout.metadata;

    ctx.fillStyle = '#607d8b';
    ctx.fillRect(0, y * canvasHeight, canvasWidth, canvasHeight * 0.08);

    const date = metadata.date || new Date().toLocaleDateString('zh-CN');
    const source = metadata.source || '未知来源';

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `生成日期: ${date}  |  来源: ${source}`,
      canvasWidth / 2,
      y * canvasHeight + (canvasHeight * 0.08) / 2
    );
  }

  wrapText(ctx, text, maxWidth) {
    const words = text.split('');
    const lines = [];
    let currentLine = '';

    for (const char of words) {
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
      return text || '';
    }
    return text.substring(0, maxLength) + '...';
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  drawIcon(ctx, icon, x, y, size) {
    ctx.font = `${size}px "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(icon, x, y);
  }
}
