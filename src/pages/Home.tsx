import { Link } from 'react-router-dom';
import { BookOpen, BookText, BrainCircuit, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col gap-24">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto py-16 md:py-24 px-4">
        <h1 className="text-5xl md:text-7xl font-serif text-brand-dark leading-tight mb-8">
          Elevate Your English <br />
          <span className="italic text-brand-accent">Reading Mastery</span>
        </h1>
        <p className="text-lg md:text-xl text-brand-muted max-w-2xl mx-auto leading-relaxed mb-12 font-sans font-light">
          专为四六级与雅思备考者打造的极简阅读分析平台。
          沉浸式的阅读体验，深度的词汇解析，以及基于艾宾浩斯曲线的智能复习。
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/analysis" className="btn-primary inline-flex items-center justify-center gap-2">
            开始阅读分析
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link to="/extension" className="btn-secondary inline-flex items-center justify-center gap-2">
            浏览拓展阅读
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        <div className="card flex flex-col gap-6 items-start group">
          <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center group-hover:bg-brand-accent group-hover:text-white transition-colors duration-500">
            <BookOpen className="w-6 h-6 text-brand-dark group-hover:text-white transition-colors duration-500" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-semibold mb-3">深度阅读分析</h3>
            <p className="text-brand-muted font-sans text-sm leading-relaxed">
              输入或粘贴任意英文阅读题目，系统自动生成中英对照全文、核心词汇解析与长难句拆解。
            </p>
          </div>
        </div>

        <div className="card flex flex-col gap-6 items-start group">
          <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center group-hover:bg-brand-accent group-hover:text-white transition-colors duration-500">
            <BookText className="w-6 h-6 text-brand-dark group-hover:text-white transition-colors duration-500" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-semibold mb-3">优质外刊拓展</h3>
            <p className="text-brand-muted font-sans text-sm leading-relaxed">
              精心挑选适合不同阶段的优质外文阅读材料，一键体验与阅读分析相同的解析功能。
            </p>
          </div>
        </div>

        <div className="card flex flex-col gap-6 items-start group">
          <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center group-hover:bg-brand-accent group-hover:text-white transition-colors duration-500">
            <BrainCircuit className="w-6 h-6 text-brand-dark group-hover:text-white transition-colors duration-500" />
          </div>
          <div>
            <h3 className="text-xl font-serif font-semibold mb-3">智能词汇复习</h3>
            <p className="text-brand-muted font-sans text-sm leading-relaxed">
              基于艾宾浩斯遗忘曲线，对收藏的词汇进行智能排期，让记忆更高效、更牢固。
            </p>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="bg-brand-dark text-white py-24 px-8 mt-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
          <span className="font-serif text-[20rem] leading-none select-none text-white">&ldquo;</span>
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="font-serif text-3xl md:text-4xl leading-relaxed mb-8 italic">
            Reading is to the mind what exercise is to the body.
          </p>
          <p className="font-sans text-brand-muted tracking-widest uppercase text-sm">
            Joseph Addison
          </p>
        </div>
      </section>
    </div>
  );
}