import { ProfileData, CardTemplate, ElementTemplate, CardElement } from '../types/data';

export const getDefaultProfileData = (): ProfileData => ({
    userSettings: {
        accentColor: '#FFC300',
        avatarSrc: 'https://q.qlogo.cn/g?b=qq&nk=2723258712&s=160',
        qrCodeLink: 'https://qm.qq.com/q/fVHvvY6jGo',
        mainTitle: '小芝士',
        mainTitleStyles: { fontWeight: '700', fontSize: '40', fontFamily: '' },
        subtitle: 'ID: chizukuo',
        subtitleStyles: { fontWeight: '500', fontSize: '20', fontFamily: '' },
        footerText: `&copy; ${new Date().getFullYear()} 小芝士.`,
        theme: 'default' // 默认主题，可根据需要更改
    },
    cards: [
        {
            id: `card_${Date.now()}_1`,
            title: '基本信息',
            titleStyles: { fontWeight: '600', fontSize: '22', fontFamily: '' },
            layoutSpan: 'profile-card-span',
            layout: { i: `card_${Date.now()}_1`, x: 0, y: 0, w: 1, h: 10 },
            elements: [
                { type: 'avatar', size: 'md', shape: 'circle' },
                {
                    type: 'infoList',
                    items: [
                        { label: '昵称', value: '小芝士' },
                        { label: '性别', value: '男' },
                        { label: '年龄', value: 'XX' },
                        { label: '常驻', value: '武汉' },
                        { label: 'MBTI', value: 'INTP-T' },
                    ],
                    textStyles: { fontWeight: '400', fontSize: '15', fontFamily: '' }
                },
                { type: 'qrCode' }
            ]
        },
        {
            id: `card_${Date.now()}_2`,
            title: '关于我',
            titleStyles: { fontWeight: '600', fontSize: '22', fontFamily: '' },
            layoutSpan: 'about-me-card-span',
            layout: { i: `card_${Date.now()}_2`, x: 1, y: 0, w: 2, h: 10 },
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
            layout: { i: `card_${Date.now()}_3`, x: 0, y: 10, w: 3, h: 10 },
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
// 模板文案走 i18n（templates.*），插入时按当前语言生成

const TITLE_STYLES = { fontWeight: '600', fontSize: '22', fontFamily: '' };
const TEXT_STYLES = { fontWeight: '400', fontSize: '15', fontFamily: '' };
const SUBHEADING_STYLES = { fontWeight: '600', fontSize: '18', fontFamily: '' };
const TAG_STYLES = { fontWeight: '500', fontSize: '13', fontFamily: '' };
const LABEL_STYLES = { fontWeight: 'bold', fontSize: '15', fontFamily: '' };

const paragraph = (text: string): CardElement => ({ type: 'paragraph', text, styles: { ...TEXT_STYLES } });

// 顺序即“添加区块”面板里的顺序，按 group 分组显示
export const ELEMENT_TEMPLATES: ElementTemplate[] = [
    { id: 'heading', group: 'text', build: (t) => ({ type: 'heading', text: t('templates.headingText'), size: 'md', styles: { fontWeight: '700', fontFamily: '' } }) },
    { id: 'paragraph', group: 'text', build: (t) => paragraph(t('templates.paragraphText')) },
    { id: 'divider', group: 'text', build: () => ({ type: 'divider', variant: 'line' }) },
    { id: 'avatar', group: 'profile', build: () => ({ type: 'avatar', size: 'md', shape: 'circle' }) },
    {
        id: 'infoList', group: 'profile',
        build: (t) => ({
            type: 'infoList',
            items: [
                { label: t('templates.labelNickname'), value: t('templates.valueNickname') },
                { label: t('templates.labelGender'), value: t('templates.valueSecret') },
                { label: t('templates.labelLocation'), value: t('templates.valueLocation') },
                { label: 'MBTI', value: 'INFP' },
            ],
            textStyles: { ...TEXT_STYLES },
        }),
    },
    { id: 'qrCode', group: 'profile', build: () => ({ type: 'qrCode' }) },
    {
        id: 'tagSection', group: 'tags',
        build: (t) => ({
            type: 'tagSection',
            subheading: t('templates.tagHeading'),
            subheadingStyles: { ...SUBHEADING_STYLES },
            tags: [{ text: t('templates.tag1') }, { text: t('templates.tag2') }],
            tagStyles: { ...TAG_STYLES },
        }),
    },
    {
        id: 'oshiSection', group: 'tags',
        build: (t) => ({
            type: 'tagSectionTwo',
            subheading: t('templates.oshiHeading'),
            subheadingStyles: { ...SUBHEADING_STYLES },
            oshis: [{ text: t('templates.oshiName'), type: 'oshi-tag' }],
            meta: [{ text: 'and more...', type: 'oshi-meta-tag' }],
        }),
    },
    {
        id: 'groupedTagSection', group: 'tags',
        build: (t) => ({
            type: 'groupedTagSection',
            subheading: t('templates.groupedHeading'),
            subheadingStyles: { ...SUBHEADING_STYLES },
            arcadeLabel: t('templates.group1'),
            arcadeLabelStyles: { ...LABEL_STYLES },
            arcade: [{ text: t('templates.tag1') }],
            mobileLabel: t('templates.group2'),
            mobileLabelStyles: { ...LABEL_STYLES },
            mobile: [{ text: t('templates.tag2') }],
            tagStyles: { ...TAG_STYLES },
        }),
    },
    { id: 'imageGallery', group: 'media', build: () => ({ type: 'imageGallery', images: [], columns: 3 }) },
];

const elementTemplate = (id: string) => ELEMENT_TEMPLATES.find((tpl) => tpl.id === id)!;

export const CARD_TEMPLATES: CardTemplate[] = [
    {
        id: 'profileCard',
        build: (t) => ({ width: 1, title: t('templates.newCardTitle'), titleStyles: { ...TITLE_STYLES }, layoutSpan: 'profile-card-span', elements: [paragraph(t('templates.paragraphText'))] }),
    },
    {
        id: 'aboutMeCard',
        build: (t) => ({ width: 2, title: t('templates.aboutMeTitle'), titleStyles: { ...TITLE_STYLES }, layoutSpan: 'about-me-card-span', elements: [paragraph(t('templates.aboutMeText'))] }),
    },
    {
        id: 'oshiCard',
        build: (t) => ({ width: 3, title: t('templates.oshiTitle'), titleStyles: { ...TITLE_STYLES }, layoutSpan: 'oshi-card-span', elements: [elementTemplate('oshiSection').build(t)] }),
    },
    {
        id: 'wishCard',
        build: (t) => ({ width: 2, title: t('templates.wishTitle'), titleStyles: { ...TITLE_STYLES }, layoutSpan: 'about-me-card-span', elements: [paragraph(t('templates.wishText'))] }),
    },
    {
        id: 'boundaryCard',
        build: (t) => ({ width: 1, title: t('templates.boundaryTitle'), titleStyles: { ...TITLE_STYLES }, layoutSpan: 'profile-card-span', elements: [paragraph(t('templates.boundaryText'))] }),
    },
    {
        id: 'galleryCard',
        build: (t) => ({ width: 3, title: t('templates.galleryTitle'), titleStyles: { ...TITLE_STYLES }, layoutSpan: 'oshi-card-span', elements: [elementTemplate('imageGallery').build(t)] }),
    },
    {
        id: 'profileInfoCard',
        build: (t) => ({ width: 1, title: t('templates.profileInfoTitle'), titleStyles: { ...TITLE_STYLES }, layoutSpan: 'profile-card-span', elements: ['avatar', 'infoList', 'qrCode'].map(id => elementTemplate(id).build(t)) }),
    },
];
