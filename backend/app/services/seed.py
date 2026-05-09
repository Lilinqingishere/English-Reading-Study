from datetime import datetime, timezone

from sqlmodel import Session, select

from app.db import get_engine, init_db
from app.models.article import Article, LongSentence
from app.models.vocab import ArticleVocab, Vocabulary

SEED_ARTICLES: list[dict[str, object]] = [
    {
        "id": "seed_gutenberg_alice_001",
        "title": "Alice Meets the White Rabbit",
        "difficulty": "CET4",
        "content": "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do. Once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it. So she was considering in her own mind whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.",
        "translated_content": "爱丽丝坐在河岸边陪着姐姐，渐渐觉得非常无聊，因为她无事可做。她偶尔瞥一眼姐姐正在读的书，却发现里面既没有图画也没有对话。于是她心里盘算着，编一串雏菊花环是否值得她起身去采花。就在这时，一只粉红眼睛的白兔突然从她身边跑过。",
        "word_count": 85,
        "source_name": "Project Gutenberg",
        "source_url": "https://www.gutenberg.org/files/11/11-h/11-h.htm",
        "source_license": "Public Domain",
        "attribution_text": "Source: Alice's Adventures in Wonderland by Lewis Carroll, Project Gutenberg, Public Domain.",
        "analysis_model": "manual-seed",
        "analysis_prompt_version": "seed_v1",
        "vocabularies": [
            {
                "id": "seed_vocab_alice_peeped",
                "word": "peeped",
                "phonetic": "/piːpt/",
                "translation": "偷看，瞥见",
                "example_en": "Once or twice she had peeped into the book her sister was reading.",
                "example_zh": "她偶尔瞥一眼姐姐正在读的书。",
            },
            {
                "id": "seed_vocab_alice_daisy_chain",
                "word": "daisy-chain",
                "phonetic": "",
                "translation": "雏菊花环",
                "example_en": "She was considering whether making a daisy-chain would be worth the trouble.",
                "example_zh": "她在考虑编雏菊花环是否值得这么麻烦。",
            },
        ],
        "long_sentences": [
            {
                "id": "seed_sentence_alice_001",
                "english": "So she was considering in her own mind whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.",
                "chinese": "于是她心里盘算着，编一串雏菊花环是否值得她起身去采花；就在这时，一只粉红眼睛的白兔突然从她身边跑过。",
                "analysis": "主句是 she was considering，whether 引导宾语从句；when suddenly 引出突然发生的新动作。",
            }
        ],
    },
    {
        "id": "seed_gutenberg_pride_001",
        "title": "A Truth Universally Acknowledged",
        "difficulty": "IELTS",
        "content": "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered as the rightful property of some one or other of their daughters.",
        "translated_content": "凡是有钱的单身男子，总想娶位太太，这已经成了一条举世公认的真理。这样一个男子初到某个社区时，无论人们对他的感情或想法了解得多么少，周围的家庭都已经牢牢记住这条真理，认为他理所当然会成为某家女儿的归宿。",
        "word_count": 71,
        "source_name": "Project Gutenberg",
        "source_url": "https://www.gutenberg.org/files/1342/1342-h/1342-h.htm",
        "source_license": "Public Domain",
        "attribution_text": "Source: Pride and Prejudice by Jane Austen, Project Gutenberg, Public Domain.",
        "analysis_model": "manual-seed",
        "analysis_prompt_version": "seed_v1",
        "vocabularies": [
            {
                "id": "seed_vocab_pride_acknowledged",
                "word": "acknowledged",
                "phonetic": "/əkˈnɒlɪdʒd/",
                "translation": "被承认的，公认的",
                "example_en": "It is a truth universally acknowledged.",
                "example_zh": "这是一条举世公认的真理。",
            },
            {
                "id": "seed_vocab_pride_fortune",
                "word": "fortune",
                "phonetic": "/ˈfɔːrtʃən/",
                "translation": "财富，大笔财产",
                "example_en": "A single man in possession of a good fortune must be in want of a wife.",
                "example_zh": "一个拥有大笔财产的单身男子必定想娶妻。",
            },
        ],
        "long_sentences": [
            {
                "id": "seed_sentence_pride_001",
                "english": "However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered as the rightful property of some one or other of their daughters.",
                "chinese": "这样一个男子初到某个社区时，无论人们对他的感情或想法了解得多么少，周围的家庭都已经牢牢记住这条真理，认为他理所当然会成为某家女儿的归宿。",
                "analysis": "However little known 引导让步结构；主句是 this truth is so well fixed；that 引导结果状语从句。",
            }
        ],
    },
    {
        "id": "seed_gutenberg_frankenstein_001",
        "title": "A Letter from the Arctic",
        "difficulty": "CET6",
        "content": "You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings. I arrived here yesterday, and my first task is to assure my dear sister of my welfare and increasing confidence in the success of my undertaking.",
        "translated_content": "你听到没有灾难伴随着这项事业的开端，一定会感到高兴；你曾经对这项事业怀着不祥的预感。我昨天已经抵达这里，我的第一件事就是向亲爱的妹妹报平安，并告诉她我对这项事业成功的信心正在增加。",
        "word_count": 49,
        "source_name": "Project Gutenberg",
        "source_url": "https://www.gutenberg.org/files/84/84-h/84-h.htm",
        "source_license": "Public Domain",
        "attribution_text": "Source: Frankenstein; Or, The Modern Prometheus by Mary Wollstonecraft Shelley, Project Gutenberg, Public Domain.",
        "analysis_model": "manual-seed",
        "analysis_prompt_version": "seed_v1",
        "vocabularies": [
            {
                "id": "seed_vocab_frankenstein_forebodings",
                "word": "forebodings",
                "phonetic": "/fɔːrˈboʊdɪŋz/",
                "translation": "不祥的预感",
                "example_en": "You have regarded the enterprise with such evil forebodings.",
                "example_zh": "你曾经对这项事业怀着不祥的预感。",
            },
            {
                "id": "seed_vocab_frankenstein_undertaking",
                "word": "undertaking",
                "phonetic": "/ˌʌndərˈteɪkɪŋ/",
                "translation": "事业，任务",
                "example_en": "My confidence in the success of my undertaking is increasing.",
                "example_zh": "我对这项事业成功的信心正在增加。",
            },
        ],
        "long_sentences": [
            {
                "id": "seed_sentence_frankenstein_001",
                "english": "You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings.",
                "chinese": "你听到没有灾难伴随着这项事业的开端，一定会感到高兴；你曾经对这项事业怀着不祥的预感。",
                "analysis": "主句是 You will rejoice；to hear 作原因或结果补足；that 引导宾语从句，which 引导定语从句修饰 enterprise。",
            }
        ],
    },
    {
        "id": "seed_gutenberg_time_machine_001",
        "title": "The Time Traveller Explains",
        "difficulty": "IELTS",
        "content": "The Time Traveller, for so it will be convenient to speak of him, was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated. The fire burned brightly, and the soft radiance of the incandescent lights in the lilies of silver caught the bubbles that flashed and passed in our glasses.",
        "translated_content": "时间旅行者，姑且这样称呼他，正在向我们解释一个深奥的问题。他灰色的眼睛闪闪发亮，平日苍白的脸也因为兴奋而泛红。炉火明亮地燃烧着，银色百合灯中白炽灯柔和的光辉映在酒杯里一闪而过的气泡上。",
        "word_count": 64,
        "source_name": "Project Gutenberg",
        "source_url": "https://www.gutenberg.org/files/35/35-h/35-h.htm",
        "source_license": "Public Domain",
        "attribution_text": "Source: The Time Machine by H. G. Wells, Project Gutenberg, Public Domain.",
        "analysis_model": "manual-seed",
        "analysis_prompt_version": "seed_v1",
        "vocabularies": [
            {
                "id": "seed_vocab_time_machine_recondite",
                "word": "recondite",
                "phonetic": "/ˈrekəndaɪt/",
                "translation": "深奥的，晦涩的",
                "example_en": "The Time Traveller was expounding a recondite matter to us.",
                "example_zh": "时间旅行者正在向我们解释一个深奥的问题。",
            },
            {
                "id": "seed_vocab_time_machine_incandescent",
                "word": "incandescent",
                "phonetic": "/ˌɪnkænˈdesnt/",
                "translation": "白炽的，发光的",
                "example_en": "The soft radiance of the incandescent lights caught the bubbles.",
                "example_zh": "白炽灯柔和的光辉映在气泡上。",
            },
        ],
        "long_sentences": [
            {
                "id": "seed_sentence_time_machine_001",
                "english": "The fire burned brightly, and the soft radiance of the incandescent lights in the lilies of silver caught the bubbles that flashed and passed in our glasses.",
                "chinese": "炉火明亮地燃烧着，银色百合灯中白炽灯柔和的光辉映在酒杯里一闪而过的气泡上。",
                "analysis": "and 连接两个并列分句；that flashed and passed in our glasses 是定语从句，修饰 bubbles。",
            }
        ],
    },
    {
        "id": "seed_gutenberg_oz_001",
        "title": "Dorothy on the Kansas Prairie",
        "difficulty": "CET4",
        "content": "Dorothy lived in the midst of the great Kansas prairies, with Uncle Henry, who was a farmer, and Aunt Em, who was the farmer's wife. Their house was small, for the lumber to build it had to be carried by wagon many miles. There were four walls, a floor and a roof, which made one room.",
        "translated_content": "多萝茜住在堪萨斯辽阔的大草原中央，和当农夫的亨利叔叔以及农夫妻子艾姆婶婶住在一起。他们的房子很小，因为建房用的木材必须用马车从许多英里外运来。房子只有四面墙、一块地板和一个屋顶，合起来就是一个房间。",
        "word_count": 62,
        "source_name": "Project Gutenberg",
        "source_url": "https://www.gutenberg.org/files/55/55-h/55-h.htm",
        "source_license": "Public Domain",
        "attribution_text": "Source: The Wonderful Wizard of Oz by L. Frank Baum, Project Gutenberg, Public Domain.",
        "analysis_model": "manual-seed",
        "analysis_prompt_version": "seed_v1",
        "vocabularies": [
            {
                "id": "seed_vocab_oz_prairies",
                "word": "prairies",
                "phonetic": "/ˈpreriz/",
                "translation": "大草原",
                "example_en": "Dorothy lived in the midst of the great Kansas prairies.",
                "example_zh": "多萝茜住在堪萨斯辽阔的大草原中央。",
            },
            {
                "id": "seed_vocab_oz_lumber",
                "word": "lumber",
                "phonetic": "/ˈlʌmbər/",
                "translation": "木材",
                "example_en": "The lumber to build it had to be carried by wagon.",
                "example_zh": "建房用的木材必须用马车运来。",
            },
        ],
        "long_sentences": [
            {
                "id": "seed_sentence_oz_001",
                "english": "Dorothy lived in the midst of the great Kansas prairies, with Uncle Henry, who was a farmer, and Aunt Em, who was the farmer's wife.",
                "chinese": "多萝茜住在堪萨斯辽阔的大草原中央，和当农夫的亨利叔叔以及农夫妻子艾姆婶婶住在一起。",
                "analysis": "主干是 Dorothy lived；with 引出伴随对象；两个 who 引导非限制性定语从句，分别补充说明 Uncle Henry 和 Aunt Em。",
            }
        ],
    },
    {
        "id": "seed_gutenberg_treasure_001",
        "title": "The Map of Treasure Island",
        "difficulty": "CET6",
        "content": "Squire Trelawney, Dr. Livesey, and the rest of these gentlemen having asked me to write down the whole particulars about Treasure Island, from the beginning to the end, keeping nothing back but the bearings of the island, and that only because there is still treasure not yet lifted, I take up my pen and go back to the time when my father kept the Admiral Benbow inn.",
        "translated_content": "特里劳尼乡绅、利夫西医生和其他这些先生请我把关于金银岛的全部详情从头到尾写下来，除了岛的位置方位不说之外什么也不隐瞒，而这也只是因为那里仍有尚未取走的宝藏。于是我拿起笔，回到我父亲经营本鲍海军上将旅店的那段时光。",
        "word_count": 71,
        "source_name": "Project Gutenberg",
        "source_url": "https://www.gutenberg.org/files/120/120-h/120-h.htm",
        "source_license": "Public Domain",
        "attribution_text": "Source: Treasure Island by Robert Louis Stevenson, Project Gutenberg, Public Domain.",
        "analysis_model": "manual-seed",
        "analysis_prompt_version": "seed_v1",
        "vocabularies": [
            {
                "id": "seed_vocab_treasure_particulars",
                "word": "particulars",
                "phonetic": "/pərˈtɪkjələrz/",
                "translation": "详情，细节",
                "example_en": "They asked me to write down the whole particulars about Treasure Island.",
                "example_zh": "他们请我写下关于金银岛的全部详情。",
            },
            {
                "id": "seed_vocab_treasure_bearings",
                "word": "bearings",
                "phonetic": "/ˈberɪŋz/",
                "translation": "方位，位置",
                "example_en": "He kept nothing back but the bearings of the island.",
                "example_zh": "除了岛的位置方位之外，他什么也不隐瞒。",
            },
        ],
        "long_sentences": [
            {
                "id": "seed_sentence_treasure_001",
                "english": "Squire Trelawney, Dr. Livesey, and the rest of these gentlemen having asked me to write down the whole particulars about Treasure Island, from the beginning to the end, keeping nothing back but the bearings of the island, and that only because there is still treasure not yet lifted, I take up my pen and go back to the time when my father kept the Admiral Benbow inn.",
                "chinese": "特里劳尼乡绅、利夫西医生和其他这些先生请我把关于金银岛的全部详情从头到尾写下来，除了岛的位置方位不说之外什么也不隐瞒，而这也只是因为那里仍有尚未取走的宝藏。于是我拿起笔，回到我父亲经营本鲍海军上将旅店的那段时光。",
                "analysis": "前半部分是独立主格结构，说明写作原因；主句是 I take up my pen and go back；when 引导定语从句修饰 time。",
            }
        ],
    },
    {
        "id": "seed_gutenberg_moby_dick_001",
        "title": "Call Me Ishmael",
        "difficulty": "CET6",
        "content": "Call me Ishmael. Some years ago--never mind how long precisely--having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.",
        "translated_content": "叫我以实玛利吧。若干年前——具体多久就不必细说了——我口袋里几乎没有钱，岸上也没有什么特别能吸引我的东西，于是我想出海转一转，看看世界上那片水域。",
        "word_count": 43,
        "source_name": "Project Gutenberg",
        "source_url": "https://www.gutenberg.org/files/2701/2701-h/2701-h.htm",
        "source_license": "Public Domain",
        "attribution_text": "Source: Moby-Dick; or, The Whale by Herman Melville, Project Gutenberg, Public Domain.",
        "analysis_model": "manual-seed",
        "analysis_prompt_version": "seed_v1",
        "vocabularies": [
            {
                "id": "seed_vocab_moby_precisely",
                "word": "precisely",
                "phonetic": "/prɪˈsaɪsli/",
                "translation": "精确地，确切地",
                "example_en": "Never mind how long precisely.",
                "example_zh": "具体多久就不必细说了。",
            },
            {
                "id": "seed_vocab_moby_shore",
                "word": "shore",
                "phonetic": "/ʃɔːr/",
                "translation": "岸，海滨",
                "example_en": "Nothing particular interested me on shore.",
                "example_zh": "岸上没有什么特别能吸引我的东西。",
            },
        ],
        "long_sentences": [
            {
                "id": "seed_sentence_moby_001",
                "english": "Some years ago--never mind how long precisely--having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.",
                "chinese": "若干年前——具体多久就不必细说了——我口袋里几乎没有钱，岸上也没有什么特别能吸引我的东西，于是我想出海转一转，看看世界上那片水域。",
                "analysis": "主句是 I thought；having little or no money 和 nothing particular to interest me on shore 是原因背景；I would sail about... 是 thought 的宾语从句。",
            }
        ],
    },
    {
        "id": "seed_gutenberg_sherlock_001",
        "title": "Sherlock Holmes and the Woman",
        "difficulty": "CET6",
        "content": "To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler.",
        "translated_content": "对夏洛克·福尔摩斯来说，她永远是那个女人。我很少听见他用别的名字提起她。在他眼中，她让所有其他女性都黯然失色，并占据了压倒性的地位。这并不是说他对艾琳·艾德勒怀有近似爱情的感情。",
        "word_count": 45,
        "source_name": "Project Gutenberg",
        "source_url": "https://www.gutenberg.org/files/1661/1661-h/1661-h.htm",
        "source_license": "Public Domain",
        "attribution_text": "Source: The Adventures of Sherlock Holmes by Arthur Conan Doyle, Project Gutenberg, Public Domain.",
        "analysis_model": "manual-seed",
        "analysis_prompt_version": "seed_v1",
        "vocabularies": [
            {
                "id": "seed_vocab_sherlock_eclipses",
                "word": "eclipses",
                "phonetic": "/ɪˈklɪpsɪz/",
                "translation": "使黯然失色",
                "example_en": "In his eyes she eclipses the whole of her sex.",
                "example_zh": "在他眼中，她让所有其他女性都黯然失色。",
            },
            {
                "id": "seed_vocab_sherlock_akin",
                "word": "akin",
                "phonetic": "/əˈkɪn/",
                "translation": "类似的，近似的",
                "example_en": "He felt no emotion akin to love.",
                "example_zh": "他没有近似爱情的感情。",
            },
        ],
        "long_sentences": [
            {
                "id": "seed_sentence_sherlock_001",
                "english": "It was not that he felt any emotion akin to love for Irene Adler.",
                "chinese": "这并不是说他对艾琳·艾德勒怀有近似爱情的感情。",
                "analysis": "It was not that... 是否定强调结构；that 引导表语从句；akin to love 作 emotion 的后置修饰。",
            }
        ],
    },
    {
        "id": "seed_gutenberg_aesop_001",
        "title": "The Fox and the Grapes",
        "difficulty": "CET4",
        "content": "One hot summer's day a Fox was strolling through an orchard till he came to a bunch of Grapes just ripening on a vine which had been trained over a lofty branch. 'Just the thing to quench my thirst,' quoth he.",
        "translated_content": "一个炎热的夏日，一只狐狸在果园里闲逛，直到它看见一串葡萄；那串葡萄正挂在一根被架到高枝上的藤蔓上逐渐成熟。它说：“这正好可以解我的渴。”",
        "word_count": 41,
        "source_name": "Project Gutenberg",
        "source_url": "https://www.gutenberg.org/files/11339/11339-h/11339-h.htm",
        "source_license": "Public Domain",
        "attribution_text": "Source: Aesop's Fables; A New Translation by V. S. Vernon Jones, Project Gutenberg, Public Domain.",
        "analysis_model": "manual-seed",
        "analysis_prompt_version": "seed_v1",
        "vocabularies": [
            {
                "id": "seed_vocab_aesop_orchard",
                "word": "orchard",
                "phonetic": "/ˈɔːrtʃərd/",
                "translation": "果园",
                "example_en": "A Fox was strolling through an orchard.",
                "example_zh": "一只狐狸在果园里闲逛。",
            },
            {
                "id": "seed_vocab_aesop_quench",
                "word": "quench",
                "phonetic": "/kwentʃ/",
                "translation": "解渴，止住",
                "example_en": "The grapes would quench his thirst.",
                "example_zh": "葡萄可以为它解渴。",
            },
        ],
        "long_sentences": [
            {
                "id": "seed_sentence_aesop_001",
                "english": "One hot summer's day a Fox was strolling through an orchard till he came to a bunch of Grapes just ripening on a vine which had been trained over a lofty branch.",
                "chinese": "一个炎热的夏日，一只狐狸在果园里闲逛，直到它看见一串葡萄；那串葡萄正挂在一根被架到高枝上的藤蔓上逐渐成熟。",
                "analysis": "主句是 a Fox was strolling；till 引导时间状语从句；which 引导定语从句修饰 vine。",
            }
        ],
    },
]

ALLOWED_SOURCE_URL_PREFIXES = (
    "https://www.gutenberg.org/",
    "https://learningenglish.voanews.com/",
)
FORBIDDEN_SOURCE_NAMES = {
    "BBC",
    "The Economist",
    "NYTimes",
    "New York Times",
    "Guardian",
    "National Geographic",
}
DIFFICULTY_VALUES = {"CET4", "CET6", "IELTS"}
REQUIRED_ARTICLE_FIELDS = (
    "id",
    "title",
    "difficulty",
    "content",
    "translated_content",
    "source_name",
    "source_url",
    "source_license",
    "attribution_text",
    "analysis_model",
    "analysis_prompt_version",
)
REQUIRED_VOCAB_FIELDS = ("id", "word", "translation", "example_en", "example_zh")
REQUIRED_SENTENCE_FIELDS = ("id", "english", "chinese", "analysis")


class SeedDataValidationError(ValueError):
    """
    Seed 数据不满足真实来源或字段完整性要求。
    """


def _required_text(item: dict[str, object], field: str, label: str, errors: list[str]) -> str:
    """
    读取必填文本字段。

    Args:
        item: 待校验对象。
        field: 字段名。
        label: 错误定位标签。
        errors: 累积错误列表。

    Returns:
        str: 去除首尾空白后的字段值。
    """

    value = item.get(field)
    if not isinstance(value, str) or not value.strip():
        errors.append(f"{label}.{field} 不能为空")
        return ""
    return value.strip()


def validate_seed_articles(seed_articles: list[dict[str, object]] | None = None) -> None:
    """
    校验阅读拓展 seed 数据质量。

    Args:
        seed_articles: 待校验 seed 列表；为空时校验内置 SEED_ARTICLES。

    Raises:
        SeedDataValidationError: 当来源、授权或字段完整性不满足要求。
    """

    articles = SEED_ARTICLES if seed_articles is None else seed_articles
    errors: list[str] = []
    seen_article_ids: set[str] = set()
    seen_source_urls: set[str] = set()

    for index, item in enumerate(articles):
        label = f"SEED_ARTICLES[{index}]"
        for field in REQUIRED_ARTICLE_FIELDS:
            _required_text(item, field, label, errors)

        article_id = str(item.get("id", "")).strip()
        if article_id in seen_article_ids:
            errors.append(f"{label}.id 重复：{article_id}")
        seen_article_ids.add(article_id)

        difficulty = str(item.get("difficulty", "")).strip()
        if difficulty not in DIFFICULTY_VALUES:
            errors.append(f"{label}.difficulty 非法：{difficulty}")

        word_count = item.get("word_count")
        if not isinstance(word_count, int) or word_count <= 0:
            errors.append(f"{label}.word_count 必须为正整数")

        source_name = str(item.get("source_name", "")).strip()
        if source_name in FORBIDDEN_SOURCE_NAMES:
            errors.append(f"{label}.source_name 使用了禁止来源：{source_name}")

        source_url = str(item.get("source_url", "")).strip()
        if source_url in seen_source_urls:
            errors.append(f"{label}.source_url 重复：{source_url}")
        seen_source_urls.add(source_url)
        if source_url and not source_url.startswith(ALLOWED_SOURCE_URL_PREFIXES):
            errors.append(f"{label}.source_url 不在允许来源范围：{source_url}")

        vocabularies = item.get("vocabularies")
        if not isinstance(vocabularies, list) or not vocabularies:
            errors.append(f"{label}.vocabularies 至少需要 1 个核心词")
        else:
            for vocab_index, vocab in enumerate(vocabularies):
                vocab_label = f"{label}.vocabularies[{vocab_index}]"
                if not isinstance(vocab, dict):
                    errors.append(f"{vocab_label} 必须是对象")
                    continue
                for field in REQUIRED_VOCAB_FIELDS:
                    _required_text(vocab, field, vocab_label, errors)

        long_sentences = item.get("long_sentences")
        if not isinstance(long_sentences, list) or not long_sentences:
            errors.append(f"{label}.long_sentences 至少需要 1 条长难句")
        else:
            for sentence_index, sentence in enumerate(long_sentences):
                sentence_label = f"{label}.long_sentences[{sentence_index}]"
                if not isinstance(sentence, dict):
                    errors.append(f"{sentence_label} 必须是对象")
                    continue
                for field in REQUIRED_SENTENCE_FIELDS:
                    _required_text(sentence, field, sentence_label, errors)

    if errors:
        raise SeedDataValidationError("；".join(errors))


def seed_extension_articles(user_id: int = 1) -> int:
    """
    写入阅读拓展 seed 文章。

    Args:
        user_id: 文章所属演示用户 ID。

    Returns:
        int: 本次新写入文章数量。
    """

    validate_seed_articles()
    init_db()
    inserted_count = 0
    now = datetime.now(timezone.utc)
    with Session(get_engine()) as session:
        for item in SEED_ARTICLES:
            existing = session.exec(select(Article).where(Article.id == item["id"])).first()
            if existing is not None:
                continue

            article = Article(
                id=str(item["id"]),
                user_id=user_id,
                source_type="extension",
                title=str(item["title"]),
                content=str(item["content"]),
                translated_content=str(item["translated_content"]),
                difficulty=str(item["difficulty"]),
                word_count=int(item["word_count"]),
                source_name=str(item["source_name"]),
                source_url=str(item["source_url"]),
                source_license=str(item["source_license"]),
                attribution_text=str(item["attribution_text"]),
                fetched_at=now,
                analysis_model=str(item["analysis_model"]),
                analysis_prompt_version=str(item["analysis_prompt_version"]),
            )
            session.add(article)
            session.flush()

            for seq, sentence in enumerate(item["long_sentences"]):
                session.add(
                    LongSentence(
                        id=str(sentence["id"]),
                        article_id=article.id,
                        english=str(sentence["english"]),
                        chinese=str(sentence["chinese"]),
                        analysis=str(sentence["analysis"]),
                        seq=seq,
                    )
                )

            for seq, vocab in enumerate(item["vocabularies"]):
                vocabulary = session.exec(
                    select(Vocabulary).where(
                        Vocabulary.user_id == user_id,
                        Vocabulary.word == str(vocab["word"]),
                    )
                ).first()
                if vocabulary is None:
                    vocabulary = Vocabulary(
                        id=str(vocab["id"]),
                        user_id=user_id,
                        word=str(vocab["word"]),
                        phonetic=str(vocab["phonetic"]),
                        translation=str(vocab["translation"]),
                        example_en=str(vocab["example_en"]),
                        example_zh=str(vocab["example_zh"]),
                        source_article_id=article.id,
                        is_collected=False,
                    )
                    session.add(vocabulary)
                    session.flush()
                session.add(ArticleVocab(article_id=article.id, vocab_id=vocabulary.id, seq=seq))

            inserted_count += 1

        session.commit()

    return inserted_count


if __name__ == "__main__":
    count = seed_extension_articles()
    print(f"seeded {count} extension articles")
