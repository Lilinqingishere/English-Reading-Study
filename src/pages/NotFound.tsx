import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * NotFound · 404 页面
 *
 * 设计意图（page-spec §7 / ui-style-guide §1）：
 * - 沿用博物馆铭牌的克制语言：大量留白 + 衬线大字 + 印刷感分隔线
 * - 全程仅使用 brand-* 单色系，禁止任何渐变、霓虹、玻璃拟态
 * - 仅在 CTA 按钮上引入克制的 hover 位移作为「高交互」线索
 * - 上铭牌副标 → 数字 → 分隔线 → 中文主文 → 引导文 → CTA 的纵向节奏，
 *   模仿博物馆藏品说明牌的层级
 */
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md mx-auto text-center flex flex-col items-center gap-8 px-4 py-12">
        {/* 上方铭牌副标：印刷品感的小字 */}
        <p className="font-sans text-[11px] tracking-[0.4em] uppercase text-brand-muted">
          Error · Page Not Found
        </p>

        {/* 数字 404：博物馆藏品编号感 */}
        <h1 className="font-serif text-[8rem] md:text-[10rem] leading-none text-brand-accent select-none">
          404
        </h1>

        {/* 印刷感分隔线 */}
        <div className="w-12 h-px bg-brand-border" />

        {/* 主文：italic 衬线 */}
        <p className="font-serif text-2xl md:text-3xl text-brand-dark italic">
          页面不存在或已移除
        </p>

        {/* 引导文：克制的解释 */}
        <p className="font-sans text-sm text-brand-muted leading-relaxed max-w-sm">
          您所访问的页面可能已被归档、移动，或从未存在。请回到首页继续阅读。
        </p>

        {/* CTA：唯一的交互锚点，hover 时箭头向左微移作为视觉反馈 */}
        <Link
          to="/"
          className="btn-primary inline-flex items-center gap-2 group mt-2"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-300 ease-out group-hover:-translate-x-1" />
          回到首页
        </Link>
      </div>
    </div>
  );
}
