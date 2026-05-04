import { useState } from 'react';
import { BookOpen, Search, Bookmark, ChevronRight, Check } from 'lucide-react';
import { useStore } from '../store';
import { Article, Vocabulary } from '../types';

// 预设的完整学习数据
const DEMO_ARTICLE = {
  title: 'Could urban engineers learn from dance?',
  content: `The way we travel around cities has a major impact on whether they are sustainable. Transportation is estimated to account for 30% of energy consumption in most of the world's most developed nations, so lowering the need for energy-using vehicles is essential for decreasing the environmental impact of mobility. But as more and more people move to cities, it is important to think about other kinds of sustainable travel too. The ways we travel affect our physical and mental health, our social lives, our access to work and culture, and the air we breathe. Engineers are tasked with changing how we travel round cities through urban design, but the engineering industry still works on the assumptions that led to the creation of the energy-consuming transport systems we have now: the emphasis placed solely on efficiency, speed, and quantitative data. We need radical changes, to make it healthier, more enjoyable, and less environmentally damaging to travel around cities.

Dance might hold some of the answers. That is not to suggest everyone should dance their way to work, however healthy and happy it might make us, but rather that the techniques used by choreographers to experiment with and design movement in dance could provide engineers with tools to stimulate new ideas in city-making. Richard Sennett, an influential urbanist and sociologist who has transformed ideas about the way cities are made, argues that urban design has suffered from a separation between mind and body since the introduction of the architectural blueprint.

Whereas medieval builders improvised and adapted construction through their intimate knowledge of materials and personal experience of the conditions on a site, building designs are now conceived and stored in media technologies that detach the designer from the physical and social realities they are creating. While the design practices created by these new technologies are essential for managing the technical complexity of the modern city, they have the drawback of simplifying reality in the process.

To illustrate, Sennett discusses the Peachtree Center in Atlanta, USA, a development typical of the modernist approach to urban planning prevalent in the 1970s. Peachtree created a grid of streets and towers intended as a new pedestrian-friendly downtown for Atlanta. According to Sennett, this failed because its designers had invested too much faith in computer-aided design to tell them how it would operate. They failed to take into account that purpose-built street cafés could not operate in the hot sun without the protective awnings common in older buildings, and would need energy-consuming air conditioning instead, or that its giant car park would feel so unwelcoming that it would put people off getting out of their cars. What seems entirely predictable and controllable on screen has unexpected results when translated into reality.

The same is true in transport engineering, which uses models to predict and shape the way people move through the city. Again, these models are necessary, but they are built on specific world views in which certain forms of efficiency and safety are considered and other experiences of the city ignored. Designs that seem logical in models appear counter-intuitive in the actual experience of their users. The guard rails that will be familiar to anyone who has attempted to cross a British road, for example, were an engineering solution to pedestrian safety based on models that prioritise the smooth flow of traffic. On wide major roads, they often guide pedestrians to specific crossing points and slow down their progress across the road by using staggered access points to divide the crossing into two – one for each carriageway. In doing so they make crossings feel longer, introducing psychological barriers greatly impacting those that are the least mobile, and encouraging others to make dangerous crossings to get around the guard rails. These barriers don't just make it harder to cross the road: they divide communities and decrease opportunities for healthy transport. As a result, many are now being removed, causing disruption, cost, and waste.

If their designers had had the tools to think with their bodies – like dancers – and imagine how these barriers would feel, there might have been a better solution. In order to bring about fundamental changes to the ways we use our cities, engineering will need to develop a richer understanding of why people move in certain ways, and how this movement affects them. Choreography may not seem an obvious choice for tackling this problem. Yet it shares with engineering the aim of designing patterns of movement within limitations of space. It is an art form developed almost entirely by trying out ideas with the body, and gaining instant feedback on how the results feel. Choreographers have deep understanding of the psychological, aesthetic, and physical implications of different ways of moving.

Observing the choreographer Wayne McGregor, cognitive scientist David Kirsh described how he 'thinks with the body'. Kirsh argues that by using the body to simulate outcomes, McGregor is able to imagine solutions that would not be possible using purely abstract thought. This kind of physical knowledge is valued in many areas of expertise, but currently has no place in formal engineering design processes. A suggested method for transport engineers is to improvise design solutions and get instant feedback about how they would work from their own experience of them, or model designs at full scale in the way choreographers experiment with groups of dancers. Above all, perhaps, they might learn to design for emotional as well as functional effects.`,
  translatedContent: `城市工程师能从舞蹈中汲取灵感吗？

我们在城市中的出行方式对城市的可持续性有着重大影响。据估计，在世界上大多数发达国家，交通运输约占能源消耗的 30%，因此降低对耗能车辆的需求对于减少出行对环境的影响至关重要。但随着越来越多的人涌入城市，思考其他类型的可持续出行方式也变得十分重要。我们的出行方式影响着我们的身心健康、社交生活、工作和文化获取途径以及我们呼吸的空气。工程师们肩负着通过城市设计改变我们在城市中出行方式的任务，但工程行业仍基于导致如今耗能交通系统产生的那些假设开展工作：仅仅强调效率、速度和定量数据。我们需要进行彻底的变革，让在城市中出行变得更健康、更愉悦、对环境的破坏更小。

舞蹈或许能提供一些答案。这并不是说每个人都应该跳着舞去上班，尽管这或许能让我们更健康、更快乐，而是说编舞家在舞蹈中试验和设计动作时所采用的技术，能够为工程师们提供工具，激发城市规划的新思路。理查德·森尼特是一位颇具影响力的都市学家和社会学家，他改变了人们对于城市建造方式的看法，他认为自从建筑蓝图出现以来，城市设计就一直存在着思维与身体的割裂。

中世纪的建筑工人凭借对材料的深入了解以及对施工现场条件的亲身经历，能够即兴发挥并灵活调整建筑施工。而如今，建筑设计则是在媒体技术中构思和存储的，这使得设计师脱离了他们所创造的物理和社会现实。尽管这些新技术所催生的设计方法对于管理现代城市的复杂技术问题至关重要，但其弊端在于会在这个过程中简化现实。

例如，森内特讨论了美国亚特兰大的桃树中心，这是 20 世纪 70 年代盛行的现代主义城市规划方法的一个典型范例。桃树中心打造了一个由街道和塔楼组成的网格，旨在成为亚特兰大新的适合步行的市中心。据森内特所述，这一规划失败了，因为其设计师过于相信计算机辅助设计能告诉他们其运作方式。他们没有考虑到，专门建造的街边咖啡馆在没有老式建筑常见的遮阳篷的情况下，在烈日下无法营业，只能依靠耗能的空调，也没有考虑到其巨大的停车场会让人感觉不友好，从而不愿下车。在屏幕上看似完全可预测和可控的东西，一旦转化为现实，就会产生意想不到的结果。

在交通工程领域也是如此，该领域利用模型来预测和塑造人们在城市中的出行方式。同样，这些模型是必要的，但它们是基于特定的世界观构建的，在这种世界观中，某些形式的效率和安全被考虑在内，而城市中的其他体验则被忽略。在模型中看似合理的设计，在实际使用者的体验中却显得不合常理。例如，对于任何试图穿越英国道路的人来说都很熟悉的防护栏，就是基于优先考虑交通顺畅流动的模型而提出的行人安全工程解决方案。在宽阔的主要道路上，它们常常引导行人到特定的过街点，并通过错开的入口将过街过程分为两段——一段对应每条车行道，从而减缓行人的过街速度。这样一来，过街感觉更长，造成心理障碍，极大地影响了行动不便的人群，还促使其他人为了绕过防护栏而进行危险的过街行为。这些障碍不仅让过街变得更困难，还分割了社区，减少了健康出行的机会。因此，许多设施如今正在被拆除，这造成了混乱、耗费了成本，还造成了浪费。

如果设计师们能像舞者那样用身体去思考，去想象这些障碍物会给人带来怎样的感受，或许就能找到更好的解决办法。要从根本上改变我们使用城市的方式，工程学需要更深入地理解人们为何以特定方式移动，以及这种移动对他们有何影响。编舞似乎并非解决这一问题的显而易见之选。然而，它与工程学一样，都致力于在空间限制内设计出特定的移动模式。编舞是一门几乎完全通过身体实践来尝试各种想法，并即时获得反馈以了解效果如何的艺术形式。编舞家对不同移动方式所蕴含的心理、美学和物理影响有着深刻的理解。

观察编舞家韦恩·麦格雷戈，认知科学家大卫·柯什描述了他如何“用身体思考”。柯什认为，通过用身体模拟结果，麦格雷戈能够构想出仅用纯粹抽象思维无法获得的解决方案。这种身体知识在许多专业领域都受到重视，但目前却在正式的工程设计过程中没有一席之地。对交通工程师的一个建议方法是，即兴构思设计方案，并从自己的亲身体验中即时反馈其效果，或者像编舞家与舞者们试验那样，对设计进行全比例建模。也许最重要的是，他们可以学会同时为情感和功能效应而设计。`,
  coreVocabs: [
    {
      id: 'v1', word: 'radical', phonetic: '/ˈrædɪkl/',
      translation: 'adj. 彻底的；激进的；根本性的',
      exampleSentence: 'We need radical changes, to make it healthier, more enjoyable, and less environmentally damaging to travel around cities.',
      exampleTranslation: '我们需要彻底的变革，让在城市中出行变得更健康、更愉悦、对环境的破坏更小。'
    },
    {
      id: 'v2', word: 'detach', phonetic: '/dɪˈtætʃ/',
      translation: 'v. 使分离；脱离；拆开',
      exampleSentence: 'Building designs are now conceived and stored in media technologies that detach the designer from the physical and social realities they are creating.',
      exampleTranslation: '如今建筑设计在媒体技术中构思和存储，使设计师脱离了他们正在创造的物理和社会现实。'
    },
    {
      id: 'v3', word: 'counter-intuitive', phonetic: '/ˌkaʊntər ɪnˈtjuːɪtɪv/',
      translation: 'adj. 反直觉的；与常理相悖的',
      exampleSentence: 'Designs that seem logical in models appear counter-intuitive in the actual experience of their users.',
      exampleTranslation: '在模型中看似合理的设计，在实际使用者的体验中显得不合常理。'
    },
    {
      id: 'v4', word: 'choreography', phonetic: '/ˌkɒriˈɒɡrəfi/',
      translation: 'n. 舞蹈编排；编舞艺术',
      exampleSentence: 'Choreography may not seem an obvious choice for tackling this problem.',
      exampleTranslation: '编舞似乎并非解决这一问题的显而易见之选。'
    }
  ],
  longSentences: [
    {
      id: 'ls1',
      english: 'Transportation is estimated to account for 30% of energy consumption in most of the world\'s most developed nations, so lowering the need for energy-using vehicles is essential for decreasing the environmental impact of mobility.',
      chinese: '据估算，在全球大多数发达国家中，交通能耗占总能源消耗的 30%，因此减少对耗能交通工具的需求，对于降低出行方式对环境的影响至关重要。',
      analysis: '并列复合句，由 so 连接两个分句；前半句主干：Transportation is estimated to account for 30% of energy consumption（被动语态）；后半句主语为动名词短语 lowering the need for energy-using vehicles，系表结构 is essential for 作谓语。'
    },
    {
      id: 'ls2',
      english: 'Kirsh argues that by using the body to simulate outcomes, McGregor is able to imagine solutions that would not be possible using purely abstract thought.',
      chinese: '柯什认为，麦格雷戈通过身体模拟实际效果，能够构思出仅靠纯粹抽象思维无法得出的解决方案。',
      analysis: '主句主语 Kirsh，谓语 argues，后接that 引导的宾语从句；从句中 by using... 作方式状语；从句主干：McGregor is able to imagine solutions；后面嵌套that 引导的定语从句，修饰先行词 solutions。'
    }
  ]
};

export default function Analysis() {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<Article | null>(null);
  const addArticle = useStore((state) => state.addArticle);
  const addVocabulary = useStore((state) => state.addVocabulary);
  const [saved, setSaved] = useState(false);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  const handleAnalyze = () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setSaved(false);

    // 模拟加载过程，让体验更真实
    setTimeout(() => {
      const now = Date.now();
      const coreVocabs: Vocabulary[] = DEMO_ARTICLE.coreVocabs.map(v => ({
        ...v,
        frequency: 1,
        isCollected: false,
        nextReviewDate: now,
        reviewCount: 0,
        addedAt: now
      }));

      const mockResult: Article = {
        id: Date.now().toString(),
        title: DEMO_ARTICLE.title,
        content: text,
        translatedContent: DEMO_ARTICLE.translatedContent,
        coreVocabs,
        longSentences: DEMO_ARTICLE.longSentences,
        isCollected: false,
        addedAt: now
      };
      setResult(mockResult);
      setIsAnalyzing(false);
    }, 800);
  };

  const handleSaveArticle = () => {
    if (result) {
      addArticle({ ...result, isCollected: true });
      setSaved(true);
    }
  };

  const handleSaveWord = (vocab: Vocabulary) => {
    addVocabulary({ ...vocab, isCollected: true });
    setSavedWords(new Set([...savedWords, vocab.id]));
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-serif mb-4">阅读分析</h1>
        <p className="text-brand-muted font-sans text-sm">
          输入您的英文段落，获取深度解析与核心词汇
        </p>
      </div>

      {!result ? (
        <div className="card flex flex-col gap-6">
          <textarea
            className="w-full h-64 p-4 border border-brand-border bg-brand-light focus:bg-white focus:border-brand-dark outline-none resize-none font-sans transition-colors duration-300 text-brand-dark"
            placeholder="在此粘贴您的英文阅读文章..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !text.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <span className="animate-pulse">Analyzing...</span>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  开始解析
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-between items-center border-b border-brand-border pb-4">
            <button 
              onClick={() => setResult(null)}
              className="text-sm text-brand-muted hover:text-brand-dark flex items-center gap-1 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              重新输入
            </button>
            <button 
              onClick={handleSaveArticle}
              disabled={saved}
              className={`flex items-center gap-2 px-4 py-2 border text-sm font-medium transition-colors ${
                saved 
                  ? 'border-green-600 text-green-600 bg-green-50' 
                  : 'border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white'
              }`}
            >
              {saved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {saved ? '已收藏' : '收藏全文'}
            </button>
          </div>

          {/* 中英对照 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-sm font-sans tracking-widest text-brand-muted uppercase">原文 Original</h2>
              <div className="prose prose-sm font-serif text-brand-dark leading-relaxed whitespace-pre-wrap bg-brand-light p-6 border border-brand-border">
                {result.content}
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-sm font-sans tracking-widest text-brand-muted uppercase">译文 Translation</h2>
              <div className="prose prose-sm font-sans text-brand-muted leading-relaxed whitespace-pre-wrap bg-brand-light p-6 border border-brand-border">
                {result.translatedContent}
              </div>
            </div>
          </div>

          {/* 核心词汇 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-serif border-b border-brand-border pb-4">核心词汇 Core Vocabulary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {result.coreVocabs.map((vocab) => (
                <div key={vocab.id} className="card p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-brand-accent">{vocab.word}</h3>
                      <span className="text-sm text-brand-muted font-sans">{vocab.phonetic}</span>
                    </div>
                    <button 
                      onClick={() => handleSaveWord(vocab)}
                      disabled={savedWords.has(vocab.id)}
                      className="text-brand-muted hover:text-brand-accent transition-colors"
                      title="加入生词本"
                    >
                      {savedWords.has(vocab.id) ? <Check className="w-5 h-5 text-green-600" /> : <Bookmark className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="font-sans text-brand-dark font-medium">{vocab.translation}</p>
                  <div className="text-sm text-brand-muted font-serif border-l-2 border-brand-border pl-3">
                    <p className="mb-1">{vocab.exampleSentence}</p>
                    <p className="font-sans opacity-80">{vocab.exampleTranslation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 长难句解析 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-serif border-b border-brand-border pb-4">长难句解析 Long Sentences</h2>
            <div className="flex flex-col gap-6">
              {result.longSentences.map((sentence) => (
                <div key={sentence.id} className="bg-brand-light p-6 md:p-8">
                  <p className="font-serif text-lg leading-relaxed text-brand-dark mb-4">{sentence.english}</p>
                  <p className="font-sans text-brand-muted mb-6">{sentence.chinese}</p>
                  <div className="bg-white p-4 border border-brand-border text-sm font-sans text-brand-dark leading-relaxed">
                    <span className="font-bold text-brand-accent mr-2">结构分析:</span>
                    {sentence.analysis}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
