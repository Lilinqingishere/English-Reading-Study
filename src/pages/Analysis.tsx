import { useState } from 'react';
import { Search, Bookmark, Check, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { Article, Vocabulary } from '../types';

// ============ 内置精选文章库 ============
const FEATURED_ARTICLE = {
  title: 'Could urban engineers learn from dance?',
  content: `The way we travel around cities has a major impact on whether they are sustainable. Transportation is estimated to account for 30% of energy consumption in most of the world's most developed nations, so lowering the need for energy-using vehicles is essential for decreasing the environmental impact of mobility. But as more and more people move to cities, it is important to think about other kinds of sustainable travel too. The ways we travel affect our physical and mental health, our social lives, our access to work and culture, and the air we breathe. Engineers are tasked with changing how we travel round cities through urban design, but the engineering industry still works on the assumptions that led to the creation of the energy-consuming transport systems we have now: the emphasis placed solely on efficiency, speed, and quantitative data. We need radical changes, to make it healthier, more enjoyable, and less environmentally damaging to travel around cities.

Dance might hold some of the answers. That is not to suggest everyone should dance their way to work, however healthy and happy it might make us, but rather that the techniques used by choreographers to experiment with and design movement in dance could provide engineers with tools to stimulate new ideas in city-making. Richard Sennett, an influential urbanist and sociologist who has transformed ideas about the way cities are made, argues that urban design has suffered from a separation between mind and body since the introduction of the architectural blueprint.

Whereas medieval builders improvised and adapted construction through their intimate knowledge of materials and personal experience of the conditions on a site, building designs are now conceived and stored in media technologies that detach the designer from the physical and social realities they are creating. While the design practices created by these new technologies are essential for managing the technical complexity of the modern city, they have the drawback of simplifying reality in the process.

To illustrate, Sennett discusses the Peachtree Center in Atlanta, USA, a development typical of the modernist approach to urban planning prevalent in the 1970s. Peachtree created a grid of streets and towers intended as a new pedestrian-friendly downtown for Atlanta. According to Sennett, this failed because its designers had invested too much faith in computer-aided design to tell them how it would operate. They failed to take into account that purpose-built street cafés could not operate in the hot sun without the protective awnings common in older buildings, and would need energy-consuming air conditioning instead, or that its giant car park would feel so unwelcoming that it would put people off getting out of their cars. What seems entirely predictable and controllable on screen has unexpected results when translated into reality.

The same is true in transport engineering, which uses models to predict and shape the way people move through the city. Again, these models are necessary, but they are built on specific world views in which certain forms of efficiency and safety are considered and other experiences of the city ignored. Designs that seem logical in models appear counter-intuitive in the actual experience of their users. The guard rails that will be familiar to anyone who has attempted to cross a British road, for example, were an engineering solution to pedestrian safety based on models that prioritise the smooth flow of traffic. On wide major roads, they often guide pedestrians to specific crossing points and slow down their progress across the road by using staggered access points to divide the crossing into two – one for each carriageway. In doing so they make crossings feel longer, introducing psychological barriers greatly impacting those that are the least mobile, and encouraging others to make dangerous crossings to get around the guard rails. These barriers don't just make it harder to cross the road: they divide communities and decrease opportunities for healthy transport. As a result, many are now being removed, causing disruption, cost, and waste.

If their designers had had the tools to think with their bodies – like dancers – and imagine how these barriers would feel, there might have been a better solution. In order to bring about fundamental changes to the ways we use our cities, engineering will need to develop a richer understanding of why people move in certain ways, and how this movement affects them. Choreography may not seem an obvious choice for tackling this problem. Yet it shares with engineering the aim of designing patterns of movement within limitations of space. It is an art form developed almost entirely by trying out ideas with the body, and gaining instant feedback on how the results feel. Choreographers have deep understanding of the psychological, aesthetic, and physical implications of different ways of moving.

Observing the choreographer Wayne McGregor, cognitive scientist David Kirsh described how he 'thinks with the body'. Kirsh argues that by using the body to simulate outcomes, McGregor is able to imagine solutions that would not be possible using purely abstract thought. This kind of physical knowledge is valued in many areas of expertise, but currently has no place in formal engineering design processes. A suggested method for transport engineers is to improvise design solutions and get instant feedback about how they would work from their own experience of them, or model designs at full scale in the way choreographers experiment with groups of dancers. Above all, perhaps, they might learn to design for emotional as well as functional effects.`,
  translatedContent: `城市工程师能从舞蹈中汲取灵感吗？
  
  我们在城市中的出行方式对城市的可持续性有着重大影响。据估计，在世界上大多数发达国家，交通运输约占能源消耗的 30%...（请补全你提供的完整译文）`,
  coreVocabs: [
    { id: 'f1', word: 'radical', phonetic: '/ˈrædɪkl/', translation: 'adj. 彻底的；激进的；根本性的', exampleSentence: 'We need radical changes.', exampleTranslation: '我们需要彻底的变革。' },
    { id: 'f2', word: 'detach', phonetic: '/dɪˈtætʃ/', translation: 'v. 使分离；脱离', exampleSentence: 'Building designs detach the designer from reality.', exampleTranslation: '建筑设计使设计师脱离现实。' },
    { id: 'f3', word: 'counter-intuitive', phonetic: '/ˌkaʊntər ɪnˈtjuːɪtɪv/', translation: 'adj. 反直觉的；与常理相悖的', exampleSentence: 'Designs appear counter-intuitive in actual experience.', exampleTranslation: '设计在实际体验中显得反直觉。' },
    { id: 'f4', word: 'choreography', phonetic: '/ˌkɒriˈɒɡrəfi/', translation: 'n. 舞蹈编排；编舞艺术', exampleSentence: 'Choreography may not seem an obvious choice.', exampleTranslation: '编舞似乎并非显而易见之选。' }
  ],
  longSentences: [
    { id: 'fl1', english: 'Transportation is estimated to account for 30% of energy consumption...', chinese: '据估算，交通能耗占总能源消耗的30%...', analysis: '并列复合句，由so连接...' },
    { id: 'fl2', english: 'Kirsh argues that by using the body...', chinese: '柯什认为，通过用身体模拟结果...', analysis: '宾语从句 + 定语从句...' }
  ]
};

// ============ 内置通用词库（修复重复 key：development 已去重） ============
const BUILT_IN_DICT: Record<string, { phonetic: string; translation: string }> = {
  'sustainable': { phonetic: '/səˈsteɪnəbl/', translation: 'adj. 可持续的' },
  'transportation': { phonetic: '/ˌtrænspərˈteɪʃn/', translation: 'n. 运输；交通' },
  'essential': { phonetic: '/ɪˈsenʃl/', translation: 'adj. 必要的；本质的' },
  'profound': { phonetic: '/prəˈfaʊnd/', translation: 'adj. 深刻的；意义深远的' },
  'exploration': { phonetic: '/ˌekspləˈreɪʃn/', translation: 'n. 探索；勘探' },
  'mobility': { phonetic: '/moʊˈbɪləti/', translation: 'n. 流动性；移动性' },
  'urban': { phonetic: '/ˈɜːrbən/', translation: 'adj. 城市的；都市的' },
  'environmental': { phonetic: '/ɪnˌvaɪrənˈmentl/', translation: 'adj. 环境的' },
  'psychological': { phonetic: '/ˌsaɪkəˈlɒdʒɪkl/', translation: 'adj. 心理的；心理学的' },
  'significant': { phonetic: '/sɪɡˈnɪfɪkənt/', translation: 'adj. 重要的；有意义的' },
  'analysis': { phonetic: '/əˈnælɪsɪs/', translation: 'n. 分析；分解' },
  'fundamental': { phonetic: '/ˌfʌndəˈmentl/', translation: 'adj. 基本的；根本的' },
  'development': { phonetic: '/dɪˈveləpmənt/', translation: 'n. 发展；开发' },
  'experience': { phonetic: '/ɪkˈspɪəriəns/', translation: 'n. 经验；体验；v. 经历' },
  'technology': { phonetic: '/tekˈnɒlədʒi/', translation: 'n. 技术；科技' },
  'knowledge': { phonetic: '/ˈnɒlɪdʒ/', translation: 'n. 知识；学问' },
  'community': { phonetic: '/kəˈmjuːnəti/', translation: 'n. 社区；团体' },
  'opportunity': { phonetic: '/ˌɒpəˈtjuːnəti/', translation: 'n. 机会；时机' },
  'pedestrian': { phonetic: '/pəˈdestriən/', translation: 'n. 行人；adj. 行人的' },
  'influence': { phonetic: '/ˈɪnfluəns/', translation: 'n. 影响；v. 影响' },
  'construction': { phonetic: '/kənˈstrʌkʃn/', translation: 'n. 建造；建筑' },
  'introduce': { phonetic: '/ˌɪntrəˈdjuːs/', translation: 'v. 介绍；引入' },
  'design': { phonetic: '/dɪˈzaɪn/', translation: 'n. 设计；v. 设计' },
  'engineer': { phonetic: '/ˌendʒɪˈnɪə(r)/', translation: 'n. 工程师；v. 设计；建造' },
  'specific': { phonetic: '/spəˈsɪfɪk/', translation: 'adj. 具体的；特定的' },
  'major': { phonetic: '/ˈmeɪdʒə(r)/', translation: 'adj. 主要的；重要的' },
  'impact': { phonetic: '/ˈɪmpækt/', translation: 'n. 影响；冲击；v. 影响' },
  'energy': { phonetic: '/ˈenədʒi/', translation: 'n. 能量；能源' },
  'consumption': { phonetic: '/kənˈsʌmpʃn/', translation: 'n. 消耗；消费' },
  'vehicle': { phonetic: '/ˈviːəkl/', translation: 'n. 车辆；交通工具' },
  'decrease': { phonetic: '/dɪˈkriːs/', translation: 'v. 减少；降低' },
  'physical': { phonetic: '/ˈfɪzɪkl/', translation: 'adj. 身体的；物理的' },
  'mental': { phonetic: '/ˈmentl/', translation: 'adj. 精神的；心理的' },
  'culture': { phonetic: '/ˈkʌltʃə(r)/', translation: 'n. 文化；文明' },
  'industry': { phonetic: '/ˈɪndəstri/', translation: 'n. 工业；行业' },
  'emphasis': { phonetic: '/ˈemfəsɪs/', translation: 'n. 强调；重点' },
  'efficiency': { phonetic: '/ɪˈfɪʃnsi/', translation: 'n. 效率；效能' },
  'radical': { phonetic: '/ˈrædɪkl/', translation: 'adj. 彻底的；激进的' },
  'healthy': { phonetic: '/ˈhelθi/', translation: 'adj. 健康的' },
  'enjoyable': { phonetic: '/ɪnˈdʒɔɪəbl/', translation: 'adj. 愉快的；有趣的' },
  'damage': { phonetic: '/ˈdæmɪdʒ/', translation: 'v. 损害；破坏' },
  'choreography': { phonetic: '/ˌkɒriˈɒɡrəfi/', translation: 'n. 舞蹈编排；编舞艺术' },
  'choreographer': { phonetic: '/ˌkɒriˈɒɡrəfə(r)/', translation: 'n. 编舞家' },
  'architectural': { phonetic: '/ˌɑːkɪˈtektʃərəl/', translation: 'adj. 建筑的；建筑学的' },
  'blueprint': { phonetic: '/ˈbluːprɪnt/', translation: 'n. 蓝图；计划' },
  'medieval': { phonetic: '/ˌmediˈiːvl/', translation: 'adj. 中世纪的' },
  'intimate': { phonetic: '/ˈɪntɪmət/', translation: 'adj. 亲密的；密切的' },
  'conceive': { phonetic: '/kənˈsiːv/', translation: 'v. 构思；设想' },
  'detach': { phonetic: '/dɪˈtætʃ/', translation: 'v. 使分离；脱离' },
  'complexity': { phonetic: '/kəmˈpleksəti/', translation: 'n. 复杂性' },
  'simplify': { phonetic: '/ˈsɪmplɪfaɪ/', translation: 'v. 简化' },
  'illustrate': { phonetic: '/ˈɪləstreɪt/', translation: 'v. 举例说明；阐明' },
  'modernist': { phonetic: '/ˈmɒdənɪst/', translation: 'adj. 现代主义的' },
  'approach': { phonetic: '/əˈprəʊtʃ/', translation: 'n. 方法；途径；v. 接近' },
  'prevalent': { phonetic: '/ˈprevələnt/', translation: 'adj. 流行的；盛行的' },
  'predictable': { phonetic: '/prɪˈdɪktəbl/', translation: 'adj. 可预测的' },
  'controllable': { phonetic: '/kənˈtrəʊləbl/', translation: 'adj. 可控制的' },
  'unexpected': { phonetic: '/ˌʌnɪkˈspektɪd/', translation: 'adj. 意想不到的' },
  'counter-intuitive': { phonetic: '/ˌkaʊntər ɪnˈtjuːɪtɪv/', translation: 'adj. 反直觉的' },
  'prioritise': { phonetic: '/praɪˈɒrətaɪz/', translation: 'v. 优先考虑' },
  'staggered': { phonetic: '/ˈstæɡəd/', translation: 'adj. 交错的；错开的' },
  'barrier': { phonetic: '/ˈbæriə(r)/', translation: 'n. 障碍；屏障' },
  'disruption': { phonetic: '/dɪsˈrʌpʃn/', translation: 'n. 中断；扰乱' },
  'cognitive': { phonetic: '/ˈkɒɡnətɪv/', translation: 'adj. 认知的' },
  'abstract': { phonetic: '/ˈæbstrækt/', translation: 'adj. 抽象的' },
  'expertise': { phonetic: '/ˌekspɜːˈtiːz/', translation: 'n. 专门知识；专长' },
  'improvise': { phonetic: '/ˈɪmprəvaɪz/', translation: 'v. 即兴创作；临时拼凑' },
  'aesthetic': { phonetic: '/iːsˈθetɪk/', translation: 'adj. 美学的；审美的' },
  'functional': { phonetic: '/ˈfʌŋkʃənl/', translation: 'adj. 功能的；实用的' }
};

// ============ 工具函数 ============
function extractKeywords(text: string): string[] {
  const words = text.match(/[A-Za-z]+/g) ?? [];
  const stopWords = new Set([
    'the','a','an','and','or','but','if','then','else','when','while','where','who','whom','whose','which','what','why','how',
    'is','am','are','was','were','be','been','being','do','does','did','doing','have','has','had','having',
    'will','would','can','could','may','might','must','shall','should',
    'of','to','in','on','at','for','from','with','without','as','by','about','into','over','after','before','between','through',
    'this','that','these','those','it','its','they','them','their','we','our','you','your','he','him','his','she','her',
    'not','no','yes','more','most','less','least','very','also','just','than','too','so'
  ]);
  
  const counts = new Map<string, number>();
  for (const w of words) {
    const lower = w.toLowerCase();
    if (lower.length >= 4 && !stopWords.has(lower)) {
      counts.set(lower, (counts.get(lower) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

export default function Analysis() {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<Article | null>(null);
  const addArticle = useStore((state) => state.addArticle);
  const addVocabulary = useStore((state) => state.addVocabulary);
  const [saved, setSaved] = useState(false);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  
  // 自定义长难句
  const [customSentences, setCustomSentences] = useState<{ id: string; english: string; chinese: string; analysis: string }[]>([]);
  const [newEnglish, setNewEnglish] = useState('');
  const [newChinese, setNewChinese] = useState('');
  const [newAnalysis, setNewAnalysis] = useState('');

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setSaved(false);
    setCustomSentences([]);
    
    // 如果是空输入，默认展示精选文章
    const inputText = text.trim() || FEATURED_ARTICLE.content;
    const isFeatured = !text.trim();
    
    setTimeout(() => {
      const now = Date.now();
      let coreVocabs: Vocabulary[];
      let translatedContent: string;
      let longSentences: { id: string; english: string; chinese: string; analysis: string }[];
      
      if (isFeatured) {
        // 精选文章：使用预设的完整数据
        coreVocabs = FEATURED_ARTICLE.coreVocabs.map((v, i) => ({
          id: `f_${i}`,
          word: v.word,
          phonetic: v.phonetic,
          translation: v.translation,
          exampleSentence: v.exampleSentence,
          exampleTranslation: v.exampleTranslation || '',
          frequency: 1,
          isCollected: false,
          nextReviewDate: now,
          reviewCount: 0,
          addedAt: now
        }));
        translatedContent = FEATURED_ARTICLE.translatedContent;
        longSentences = FEATURED_ARTICLE.longSentences.map((s, i) => ({
          id: `fl_${i}`,
          english: s.english,
          chinese: s.chinese,
          analysis: s.analysis
        }));
      } else {
        // 用户输入的文章：用内置词库匹配
        const keywords = extractKeywords(inputText);
        coreVocabs = [];
        const matchedWords = new Set<string>();
        
        keywords.forEach((word, idx) => {
          const entry = BUILT_IN_DICT[word];
          if (entry && !matchedWords.has(word)) {
            matchedWords.add(word);
            coreVocabs.push({
              id: `u_${now}_${idx}`,
              word,
              phonetic: entry.phonetic,
              translation: entry.translation,
              exampleSentence: '',
              exampleTranslation: '',
              frequency: 1,
              isCollected: false,
              nextReviewDate: now,
              reviewCount: 0,
              addedAt: now
            });
          }
        });
        
        if (coreVocabs.length === 0) {
          coreVocabs.push({
            id: `u_${now}_0`,
            word: '未匹配',
            phonetic: '',
            translation: '内置词库暂未收录此文章的核心词，你可以手动在下方添加句子作为学习笔记。',
            exampleSentence: '',
            exampleTranslation: '',
            frequency: 0,
            isCollected: false,
            nextReviewDate: now,
            reviewCount: 0,
            addedAt: now
          });
        }
        
        // 提示用户使用浏览器翻译
        translatedContent = '翻译提示：请右键点击页面，选择“翻译成中文”，使用浏览器自带翻译功能获取译文。（浏览器翻译稳定、准确，完全免费）';
        longSentences = [];
      }
      
      setResult({
        id: Date.now().toString(),
        title: isFeatured ? FEATURED_ARTICLE.title : (inputText.split('\n')[0].substring(0, 50) + '...'),
        content: inputText,
        translatedContent,
        coreVocabs,
        longSentences,
        isCollected: false,
        addedAt: now
      });
      setIsAnalyzing(false);
    }, 400);
  };

  const handleAddCustomSentence = () => {
    if (!newEnglish.trim()) return;
    const newSentence = {
      id: `cs_${Date.now()}`,
      english: newEnglish,
      chinese: newChinese,
      analysis: newAnalysis
    };
    setCustomSentences([...customSentences, newSentence]);
    if (result) {
      setResult({ ...result, longSentences: [...result.longSentences, newSentence] });
    }
    setNewEnglish('');
    setNewChinese('');
    setNewAnalysis('');
  };

  const handleRemoveCustomSentence = (id: string) => {
    setCustomSentences(customSentences.filter(s => s.id !== id));
    if (result) {
      setResult({ ...result, longSentences: result.longSentences.filter(s => s.id !== id) });
    }
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
          输入任意英文文章，智能提取核心词汇。直接解析可查看精选范例。
        </p>
      </div>

      {!result ? (
        <div className="card flex flex-col gap-6">
          <textarea
            className="w-full h-64 p-4 border border-brand-border bg-brand-light focus:bg-white focus:border-brand-dark outline-none resize-none font-sans transition-colors duration-300 text-brand-dark"
            placeholder="在此粘贴英文文章...（留空直接解析，将展示精选范例）"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-end">
            <button onClick={handleAnalyze} disabled={isAnalyzing}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isAnalyzing ? <span className="animate-pulse">Analyzing...</span> : <><Search className="w-4 h-4" />开始解析</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-between items-center border-b border-brand-border pb-4">
            <button onClick={() => setResult(null)}
              className="text-sm text-brand-muted hover:text-brand-dark flex items-center gap-1 transition-colors">
              ← 重新输入
            </button>
            <button onClick={handleSaveArticle} disabled={saved}
              className={`flex items-center gap-2 px-4 py-2 border text-sm font-medium transition-colors ${
                saved ? 'border-green-600 text-green-600 bg-green-50' : 'border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white'
              }`}>
              {saved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {saved ? '已收藏' : '收藏全文'}
            </button>
          </div>

          {/* 原文与译文 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-sm tracking-widest text-brand-muted uppercase">原文 Original</h2>
              <div className="prose prose-sm font-serif text-brand-dark leading-relaxed whitespace-pre-wrap bg-brand-light p-6 border border-brand-border">
                {result.content}
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-sm tracking-widest text-brand-muted uppercase">译文 Translation</h2>
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
                    <button onClick={() => handleSaveWord(vocab)} disabled={savedWords.has(vocab.id)}
                      className="text-brand-muted hover:text-brand-accent transition-colors" title="加入生词本">
                      {savedWords.has(vocab.id) ? <Check className="w-5 h-5 text-green-600" /> : <Bookmark className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="font-sans text-brand-dark font-medium">{vocab.translation}</p>
                  {vocab.exampleSentence && (
                    <div className="text-sm text-brand-muted font-serif border-l-2 border-brand-border pl-3">
                      <p className="mb-1">{vocab.exampleSentence}</p>
                      <p className="font-sans opacity-80">{vocab.exampleTranslation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 长难句解析（手动添加 + 预设内容） */}
          <div className="space-y-6">
            <h2 className="text-2xl font-serif border-b border-brand-border pb-4">长难句解析 Long Sentences</h2>
            
            {/* 添加自定义长难句 */}
            <div className="bg-brand-light p-6 border border-brand-border space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider">添加你的长难句</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-brand-muted mb-1">英文原文</label>
                  <textarea className="w-full p-2 border border-brand-border bg-white focus:border-brand-dark outline-none resize-none text-sm"
                    rows={3} placeholder="粘贴你读不懂的英文句子" value={newEnglish} onChange={(e) => setNewEnglish(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-brand-muted mb-1">中文翻译</label>
                  <textarea className="w-full p-2 border border-brand-border bg-white focus:border-brand-dark outline-none resize-none text-sm"
                    rows={3} placeholder="输入你自己理解的中文翻译" value={newChinese} onChange={(e) => setNewChinese(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-brand-muted mb-1">语法结构分析</label>
                  <textarea className="w-full p-2 border border-brand-border bg-white focus:border-brand-dark outline-none resize-none text-sm"
                    rows={2} placeholder="简单分析一下句子结构" value={newAnalysis} onChange={(e) => setNewAnalysis(e.target.value)} />
                </div>
              </div>
              <button onClick={handleAddCustomSentence} disabled={!newEnglish.trim()}
                className="btn-primary flex items-center gap-2 text-sm px-4 py-2 disabled:opacity-50">
                <Plus className="w-4 h-4" />添加到解析列表
              </button>
            </div>

            {/* 展示已添加和预设的长难句 */}
            <div className="flex flex-col gap-6">
              {result.longSentences.length === 0 && <p className="text-center text-brand-muted text-sm py-8">暂无长难句。使用上方表单添加你自己的句子。</p>}
              {result.longSentences.map((sentence) => (
                <div key={sentence.id} className="bg-brand-light p-6 md:p-8 relative group">
                  <button onClick={() => handleRemoveCustomSentence(sentence.id)}
                    className="absolute top-2 right-2 text-brand-muted hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" title="删除此句">
                    <Trash2 className="w-4 h-4" />
                  </button>
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
