import { ProfileData, CardTemplate, ElementTemplate } from '../types/data';
// We are now using a URL for the default avatar, so the local import is removed.

export const getDefaultProfileData = (): ProfileData => ({
    userSettings: {
        accentColor: '#FFC300',
        // UPDATED: Using the provided image URL for the default avatar.
        avatarSrc: 'https://q.qlogo.cn/g?b=qq&nk=2723258712&s=160',
        qrCodeLink: 'https://qm.qq.com/q/fVHvvY6jGo',
        mainTitle: '小芝士',
        mainTitleStyles: { fontWeight: '700', fontSize: '40', fontFamily: '' },
        subtitle: 'ID: chizukuo',
        subtitleStyles: { fontWeight: '500', fontSize: '20', fontFamily: '' },
        footerText: `&copy; ${new Date().getFullYear()} 小芝士.`
    },
    cards: [
        {
            id: `card_${Date.now()}_1`,
            title: '基本信息',
            titleStyles: { fontWeight: '600', fontSize: '22', fontFamily: '' },
            layoutSpan: 'profile-card-span',
            elements: [
                { type: 'profileInfo', nickname: '小芝士', gender: '男', age: 'XX', location: '武汉', mbti: 'INTP-T', textStyles: { fontWeight: '400', fontSize: '15', fontFamily: '' } }
            ]
        },
        {
            id: `card_${Date.now()}_2`,
            title: '关于我',
            titleStyles: { fontWeight: '600', fontSize: '22', fontFamily: '' },
            layoutSpan: 'about-me-card-span',
            elements: [
                { type: 'paragraph', text: '<strong>女声优痴</strong> | 成分非常复杂，广泛涉猎。Weiss Schwarz 还在入门。偶尔看看地偶', styles: { fontWeight: '400', fontSize: '15', fontFamily: '' } },
                { type: 'paragraph', text: '“自适应在纯良和厄介中切换。”', styles: { fontWeight: '400', fontSize: '15', fontFamily: '' } },
                { type: 'tagSection', subheading: '爱好:', subheadingStyles: { fontWeight: '600', fontSize: '18', fontFamily: '' }, tags: [{ text: '音游' }, { text: '光棒' }], tagStyles: { fontWeight: '500', fontSize: '13', fontFamily: '' } },
                { type: 'tagSection', subheading: '主要涉猎:', subheadingStyles: { fontWeight: '600', fontSize: '18', fontFamily: '' }, tags: [{ text: 'Love Live!' }, { text: '少女☆歌剧 Revue Starlight' }, { text: 'Project Sekai' }, { text: 'BanG Dream!' }], tagStyles: { fontWeight: '500', fontSize: '13', fontFamily: '' } },
                {
                    type: 'groupedTagSection',
                    subheading: '音游偏好:', subheadingStyles: { fontWeight: '600', fontSize: '18', fontFamily: '' },
                    arcadeLabel: '街机:', arcadeLabelStyles: { fontWeight: 'bold', fontSize: '15', fontFamily: '' },
                    arcade: [{ text: '中二节奏' }, { text: '舞萌DX (偶尔打)' }],
                    mobileLabel: '移动端:', mobileLabelStyles: { fontWeight: 'bold', fontSize: '15', fontFamily: '' },
                    mobile: [{ text: 'BanG Dream!' }, { text: 'Project Sekai' }, { text: 'ユメステ' }, { text: 'シャニソン' }],
                    tagStyles: { fontWeight: '500', fontSize: '13', fontFamily: '' }
                }
            ]
        },
        {
            id: `card_${Date.now()}_3`,
            title: '我的推し',
            titleStyles: { fontWeight: '600', fontSize: '22', fontFamily: '' },
            layoutSpan: 'oshi-card-span',
            elements: [
                {
                    type: 'tagSectionTwo',
                    subheading: '🎤 女声优', subheadingStyles: { fontWeight: '600', fontSize: '18', fontFamily: '' },
                    oshis: [{ text: '中岛由贵', type: 'oshi-tag' }],
                    meta: [{ text: 'and all......', type: 'oshi-meta-tag' }]
                },
                {
                    type: 'tagSectionTwo',
                    subheading: '💖 二次元', subheadingStyles: { fontWeight: '600', fontSize: '18', fontFamily: '' },
                    oshis: ['高坂穗乃果', '矢泽妮可', '渡边曜', '黑泽露比', '优木雪菜', '平安名堇', '户山香澄', '今井莉莎', '白金燐子', 'CHU²', 'PAREO', '朝日六花', '八幡海铃', '大场奈奈', '花里实乃理', '桃井爱莉', '小豆泽心羽', '宵崎奏', '星井美希', '如月千早', '浊心斯卡蒂'].map(name => ({ text: name, type: 'oshi-tag' })),
                    meta: [{ text: 'and more...', type: 'oshi-meta-tag' }]
                }
            ]
        }
    ]
});

// --- TEMPLATES ---

export const CARD_TEMPLATES: CardTemplate[] = [
    {
        name: '常规卡片',
        description: '一个标准的单栏卡片，适合各种内容。',
        data: {
            title: '新卡片标题',
            titleStyles: { fontWeight: '600', fontSize: '22', fontFamily: '' },
            layoutSpan: 'profile-card-span',
            elements: [
                { type: 'paragraph', text: '新段落内容...', styles: { fontWeight: '400', fontSize: '15', fontFamily: '' } }
            ]
        }
    },
    {
        name: '双栏卡片',
        description: '一个更宽的双栏卡片，用于详细介绍。',
        data: {
            title: '关于我',
            titleStyles: { fontWeight: '600', fontSize: '22', fontFamily: '' },
            layoutSpan: 'about-me-card-span',
            elements: [
                { type: 'paragraph', text: '在这里写下更多关于你的介绍。', styles: { fontWeight: '400', fontSize: '15', fontFamily: '' } }
            ]
        }
    },
    {
        name: '三栏卡片',
        description: '一个通栏卡片，最适合展示你的热爱。',
        data: {
            title: '我的最爱',
            titleStyles: { fontWeight: '600', fontSize: '22', fontFamily: '' },
            layoutSpan: 'oshi-card-span',
            elements: [
                 {
                    type: 'tagSectionTwo',
                    subheading: 'Subheading', subheadingStyles: { fontWeight: '600', fontSize: '18', fontFamily: '' },
                    oshis: [{ text: 'Oshi Name', type: 'oshi-tag' }],
                    meta: [{ text: 'Meta info', type: 'oshi-meta-tag' }]
                }
            ]
        }
    }
];

export const ELEMENT_TEMPLATES: ElementTemplate[] = [
    {
        name: '段落',
        description: '一个简单的文本区块。',
        data: {
            type: 'paragraph',
            text: '在这里编辑你的文本...',
            styles: { fontWeight: '400', fontSize: '15', fontFamily: '' }
        }
    },
    {
        name: '标签区块',
        description: '用于展示一系列相关的标签。',
        data: {
            type: 'tagSection',
            subheading: '标签组标题',
            subheadingStyles: { fontWeight: '600', fontSize: '18', fontFamily: '' },
            tags: [{ text: '标签1' }, { text: '标签2' }],
            tagStyles: { fontWeight: '500', fontSize: '13', fontFamily: '' }
        }
    },
    {
        name: '标签区块2',
        description: '模板上面的推区块',
        data: {
            type: 'tagSectionTwo',
            subheading: '输入标题', subheadingStyles: { fontWeight: '600', fontSize: '18', fontFamily: '' },
            oshis: [{ text: '输入标签', type: 'oshi-tag' }],
            meta: [{ text: 'and more...', type: 'oshi-meta-tag' }]
        }
    },
    {
        name: '分组标签区块',
        description: '适合分类展示标签，例如音游。',
        data: {
            type: 'groupedTagSection',
            subheading: '分组标签标题', subheadingStyles: { fontWeight: '600', fontSize: '18', fontFamily: '' },
            arcadeLabel: '分组1:', arcadeLabelStyles: { fontWeight: 'bold', fontSize: '15', fontFamily: '' },
            arcade: [{ text: '标签A' }],
            mobileLabel: '分组2:', mobileLabelStyles: { fontWeight: 'bold', fontSize: '15', fontFamily: '' },
            mobile: [{ text: '标签B' }],
            tagStyles: { fontWeight: '500', fontSize: '13', fontFamily: '' }
        }
    }
];
