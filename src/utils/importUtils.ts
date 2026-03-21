import { ProfileData, CardData, CardElement, UserSettings } from '../types/data';
import { getDefaultProfileData } from './data';
import { showNotification } from './exportUtils';
import { loadTranslations, createT } from './i18n';
import { Locale } from '../context/LocaleContext';

// 简单判断是否是 Tintro 格式
const isTintroConfig = (data: any): boolean => {
    return data && data.personalInfo && Array.isArray(data.cards) && data.globalCardStyles;
};

// 简单判断是否是 ProfileCraft 格式
const isProfileCraftConfig = (data: any): boolean => {
    return data && data.userSettings && Array.isArray(data.cards);
};

export const parseTintroToProfileData = (tintroData: any): ProfileData => {
    const defaultData = getDefaultProfileData();
    const globalFontFamily = tintroData.globalCardStyles?.fontFamily && tintroData.globalCardStyles.fontFamily !== 'sans' 
        ? tintroData.globalCardStyles.fontFamily 
        : undefined;

    const mainTitleStyles = { ...defaultData.userSettings.mainTitleStyles };
    const subtitleStyles = { ...defaultData.userSettings.subtitleStyles };

    if (globalFontFamily) {
        mainTitleStyles.fontFamily = globalFontFamily;
        subtitleStyles.fontFamily = globalFontFamily;
    }

    const userSettings: UserSettings = {
        ...defaultData.userSettings,
        mainTitle: tintroData.personalInfo?.nickname || '未命名',
        mainTitleStyles,
        subtitle: tintroData.personalInfo?.bio || '',
        subtitleStyles,
        accentColor: tintroData.personalInfo?.headerColor || defaultData.userSettings.accentColor,
        // Tintro 不支持某些头像/二维码等，这里保留默认值
    };

    let tintroCards = tintroData.cards || [];
    const layoutOrder = tintroData.globalCardStyles?.layoutOrder || 'normal';
    if (layoutOrder === 'reversed') {
        const dualCards = tintroCards.filter((c: any) => c.type === 'dual');
        const singleCards = tintroCards.filter((c: any) => c.type !== 'dual');
        tintroCards = [...dualCards, ...singleCards];
    }

    const cards: CardData[] = tintroCards.map((tintroCard: any, index: number) => {
        let layoutSpan = 'profile-card-span';
        let w = 1;
        
        if (tintroCard.type === 'dual') {
            layoutSpan = 'about-me-card-span';
            w = 2;
        }

        const elements: CardElement[] = [];
        
        if (tintroCard.content) {
            // Tintro 中的换行用 \n 表示，我们转换成 HTML 的 <br>
            const formattedText = tintroCard.content.replace(/\n/g, '<br>');
            
            elements.push({
                type: 'paragraph',
                text: formattedText,
                styles: {
                    textAlign: tintroCard.textAlign !== 'default' ? tintroCard.textAlign : (tintroData.globalCardStyles?.textAlign || 'left'),
                    color: tintroCard.textColor || tintroData.globalCardStyles?.textColor || undefined,
                    fontFamily: globalFontFamily,
                    // Tintro 的文字颜色如果需要支持，可以提取，但优先适配 ProfileCraft 主题
                }
            });
        }

        const titleStyles = {
            fontWeight: '600',
            fontSize: '22',
            fontFamily: globalFontFamily,
            color: tintroCard.textColor || tintroData.globalCardStyles?.textColor || undefined,
        };

        return {
            id: `card_${Date.now()}_${index}`,
            title: tintroCard.title || '',
            titleStyles,
            layoutSpan,
            layout: { i: `card_${Date.now()}_${index}`, x: (index * w) % 3, y: Infinity, w, h: 10 },
            elements
        };
    });

    return {
        userSettings,
        cards
    };
};

export const importConfig = async (file: File, locale: Locale, onSuccess: (data: ProfileData) => void) => {
    const translations = await loadTranslations(locale);
    const t = createT(translations);

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const result = e.target?.result as string;
            const parsedData = JSON.parse(result);

            if (isProfileCraftConfig(parsedData)) {
                onSuccess(parsedData as ProfileData);
                showNotification(t('notification.importSuccess') || 'Import successful!', 'success');
            } else if (isTintroConfig(parsedData)) {
                const convertedData = parseTintroToProfileData(parsedData);
                onSuccess(convertedData);
                showNotification(t('notification.importSuccess') || 'Tintro config imported successfully!', 'success');
            } else {
                throw new Error('Invalid format');
            }
        } catch (error) {
            console.error('Import error:', error);
            showNotification(t('notification.importError') || 'Failed to import config. Invalid format.', 'error');
        }
    };
    reader.onerror = () => {
        showNotification(t('notification.importError') || 'Failed to read file.', 'error');
    };
    reader.readAsText(file);
};
