import type { ReactNode } from 'react';

/**
 * 把段落文本按"两个及以上换行"切成块。
 *
 * 后端返回的英文原文 / 中文译文常常用空行分段；这里统一在前端切块，
 * 让阅读拓展和阅读分析两个页面用同一种断句逻辑，避免长文挤成一坨。
 */
export function splitTextBlocks(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

/**
 * 渲染原文 / 译文文本块。
 *
 * - 文本为空时显示 fallback 占位文字。
 * - 否则按 splitTextBlocks 切块后用 <p> 渲染，保留段间留白。
 *
 * @param text 文本内容。
 * @param fallback 文本为空时的占位文案。
 * @param className 透传到每个 <p> 上的 className。
 */
export function renderTextBlocks(text: string, fallback: string, className = ''): ReactNode {
  const blocks = splitTextBlocks(text);
  if (blocks.length === 0) {
    return <p className="text-brand-muted">{fallback}</p>;
  }

  return blocks.map((block, index) => (
    <p key={`${index}-${block.slice(0, 24)}`} className={className}>
      {block}
    </p>
  ));
}
