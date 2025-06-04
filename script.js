document.addEventListener('DOMContentLoaded', () => {
    const profileCardContainer = document.getElementById('profileCardContainer');
    const accentColorPicker = document.getElementById('accentColorPicker');
    const exportHtmlButton = document.getElementById('exportHtmlButton');
    const exportImageButton = document.getElementById('exportImageButton');
    const addCardButton = document.getElementById('addCardButton');
    const resetButton = document.getElementById('resetButton');

    const editControlsPopup = document.getElementById('editControlsPopup');
    const fontWeightInput = document.getElementById('fontWeightInput');
    const fontSizeInput = document.getElementById('fontSizeInput');
    const applyTextChangesButton = document.getElementById('applyTextChanges');
    const deleteElementButton = document.getElementById('deleteElementButton'); // This is "Clear Content"

    const selectionModal = document.getElementById('selectionModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalOptionsContainer = document.getElementById('modalOptionsContainer');
    const modalCancelButton = document.getElementById('modalCancelButton');

    let currentEditTarget = null; 
    let currentDataPath = null; 
    let modalResolve = null;

    // --- UTILITY FUNCTIONS ---
    function stripHtml(html) {
       let tmp = document.createElement("DIV");
       tmp.innerHTML = html;
       return tmp.textContent || tmp.innerText || "";
    }

    const getDefaultProfileData = () => ({
        userSettings: {
            accentColor: '#FFC300',
            avatarSrc: 'https://placehold.co/100x100/EFEFEF/AAAAAA?text=头像',
            qrCodeLink: 'https://qm.qq.com/q/fVHvvY6jGo',
            mainTitle: '小芝士',
            mainTitleStyles: { fontWeight: '700', fontSize: '40' }, 
            subtitle: 'ID: chizukuo',
            subtitleStyles: { fontWeight: '500', fontSize: '20' },
            footerText: `&copy; ${new Date().getFullYear()} 小芝士.`
        },
        cards: [
            {
                id: `card_${Date.now()}_1`,
                title: '基本信息',
                titleStyles: { fontWeight: '600', fontSize: '22' },
                layoutSpan: 'profile-card-span', 
                elements: [
                    { type: 'profileInfo', nickname: '小芝士', gender: '男', age: '05后', location: '武汉', mbti: 'INTP-T', textStyles: { fontWeight: '400', fontSize: '15' } }
                ]
            },
            {
                id: `card_${Date.now()}_2`,
                title: '关于我',
                titleStyles: { fontWeight: '600', fontSize: '22' },
                layoutSpan: 'about-me-card-span',
                elements: [
                    { type: 'paragraph', text: '<strong>女声优痴</strong> | 成分非常复杂，广泛涉猎。Weiss Schwarz 还在入门。偶尔看看地偶', styles: { fontWeight: '400', fontSize: '15' } },
                    { type: 'paragraph', text: '“自适应在纯良和厄介中切换。”', styles: { fontWeight: '400', fontSize: '15' } },
                    { type: 'tagSection', subheading: '爱好:', subheadingStyles: { fontWeight: '600', fontSize: '18' }, tags: [{text:'音游', styles:{}}, {text:'光棒', styles:{}}], tagStyles: { fontWeight: '500', fontSize: '13' } },
                    { type: 'tagSection', subheading: '主要涉猎:', subheadingStyles: { fontWeight: '600', fontSize: '18' }, tags: [{text:'Love Live!', styles:{}}, {text:'少女☆歌剧 Revue Starlight', styles:{}}, {text:'Project Sekai', styles:{}}, {text:'BanG Dream!', styles:{}}], tagStyles: { fontWeight: '500', fontSize: '13' } },
                    { 
                        type: 'musicGameSection', 
                        subheading: '音游偏好:', subheadingStyles: { fontWeight: '600', fontSize: '18' },
                        arcadeLabel: '街机:', arcadeLabelStyles: { fontWeight: 'bold', fontSize: '15'}, 
                        arcade: [{text:'中二节奏', styles:{}}, {text:'舞萌DX (偶尔打)', styles:{}}],
                        mobileLabel: '移动端:', mobileLabelStyles: { fontWeight: 'bold', fontSize: '15'}, 
                        mobile: [{text:'BanG Dream!', styles:{}}, {text:'Project Sekai', styles:{}}, {text:'ユメステ', styles:{}}, {text:'シャニソン', styles:{}}],
                        tagStyles: { fontWeight: '500', fontSize: '13' }
                    }
                ]
            },
            {
                id: `card_${Date.now()}_3`,
                title: '我的推し',
                titleStyles: { fontWeight: '600', fontSize: '22' },
                layoutSpan: 'oshi-card-span',
                elements: [
                    { type: 'oshiSection', subheading: '🎤 女声优', subheadingStyles: { fontWeight: '600', fontSize: '18' },
                        oshis: [{ text: '中岛由贵', type: 'oshi-tag', styles: { fontWeight: '400', fontSize: '14.4' } }],
                        meta: [{ text: 'and all......', type: 'oshi-meta-tag', styles: { fontWeight: '400', fontSize: '14' } }]
                    },
                    { type: 'oshiSection', subheading: '💖 二次元', subheadingStyles: { fontWeight: '600', fontSize: '18' },
                        oshis: ['高坂穗乃果', '矢泽妮可', '渡边曜', '黑泽露比', '优木雪菜', '平安名堇', '户山香澄', '今井莉莎', '白金燐子', 'CHU²', 'PAREO', '朝日六花', '八幡海铃', '大场奈奈', '花里实乃理', '桃井爱莉', '小豆泽心羽', '宵崎奏', '星井美希', '如月千早', '浊心斯卡蒂'].map(name => ({text: name, type: 'oshi-tag', styles: { fontWeight: '400', fontSize: '14.4' }})),
                        meta: [{ text: 'and more...', type: 'oshi-meta-tag', styles: { fontWeight: '400', fontSize: '14' } }]
                    }
                ]
            }
        ]
    });

    let profileData = loadData();

    function saveData() {
        localStorage.setItem('kuolieProfileData', JSON.stringify(profileData));
    }

    function loadData() {
        const savedData = localStorage.getItem('kuolieProfileData');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                if (parsedData && parsedData.userSettings && parsedData.cards) {
                    return parsedData;
                } else {
                    console.warn("保存的数据结构无效，重置为默认值。");
                    return getDefaultProfileData();
                }
            } catch (e) {
                console.error("解析保存的数据时出错，重置为默认值。", e);
                return getDefaultProfileData();
            }
        }
        return getDefaultProfileData();
    }
    
    function resetToDefault() {
        if (confirm("确定要重置所有内容到默认模板吗？所有未保存的更改将丢失。")) {
            profileData = getDefaultProfileData();
            saveData();
            applyThemeColors();
            render();
        }
    }

    function applyThemeColors() {
        const accent = profileData.userSettings.accentColor;
        document.documentElement.style.setProperty('--theme-accent', accent);
        const newPageBg = lightenHexColor(accent, 0.95); 
        const newTagBg = lightenHexColor(accent, 0.8);
        const newTagBgAlt = lightenHexColor(accent, 0.5);
        const newTextStrong = darkenHexColor(accent, 0.4); 
        const newDivider = lightenHexColor(accent, 0.2);
        const accentBrightness = getBrightness(accent);
        const buttonTextOnAccent = accentBrightness > 128 ? '#000000' : '#FFFFFF'; 
        document.documentElement.style.setProperty('--button-text-on-accent', buttonTextOnAccent);

        document.documentElement.style.setProperty('--theme-bg-page', newPageBg);
        document.documentElement.style.setProperty('--theme-tag-bg', newTagBg);
        document.documentElement.style.setProperty('--theme-tag-bg-alt', newTagBgAlt);
        document.documentElement.style.setProperty('--theme-text-strong', newTextStrong);
        document.documentElement.style.setProperty('--theme-divider', newDivider);
        document.body.style.backgroundColor = newPageBg;
        const qrCodeDisplays = document.querySelectorAll('.qr-code-container');
        qrCodeDisplays.forEach(qrEl => {
            if (qrEl.id) { 
                 generateQRCode(profileData.userSettings.qrCodeLink, qrEl.id);
            } else {
                const firstQrCanvas = document.querySelector('.qr-code-container canvas, .qr-code-container img');
                if (firstQrCanvas && firstQrCanvas.parentElement.id) {
                     generateQRCode(profileData.userSettings.qrCodeLink, firstQrCanvas.parentElement.id);
                } else {
                    const defaultQrContainer = document.querySelector('#qrCodeDisplay_0_0'); 
                    if (defaultQrContainer) generateQRCode(profileData.userSettings.qrCodeLink, defaultQrContainer.id);
                }
            }
        });
    }
    function getBrightness(hexColor) {
        hexColor = hexColor.replace(/^#/, '');
        if (hexColor.length === 3) {
            hexColor = hexColor.split('').map(char => char + char).join('');
        }
        const r = parseInt(hexColor.substring(0, 2), 16);
        const g = parseInt(hexColor.substring(2, 4), 16);
        const b = parseInt(hexColor.substring(4, 6), 16);
        return (r * 299 + g * 587 + b * 114) / 1000;
    }


    function lightenHexColor(hex, percent) {
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) { 
            hex = hex.split('').map(char => char + char).join('');
        }
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const newR = Math.min(255, Math.floor(r + (255 - r) * percent));
        const newG = Math.min(255, Math.floor(g + (255 - g) * percent));
        const newB = Math.min(255, Math.floor(b + (255 - b) * percent));
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    function darkenHexColor(hex, percent) {
        hex = hex.replace(/^#/, '');
         if (hex.length === 3) { 
            hex = hex.split('').map(char => char + char).join('');
        }
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const newR = Math.max(0, Math.floor(r * (1 - percent)));
        const newG = Math.max(0, Math.floor(g * (1 - percent)));
        const newB = Math.max(0, Math.floor(b * (1 - percent)));
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    
    accentColorPicker.addEventListener('input', (e) => {
        profileData.userSettings.accentColor = e.target.value;
        applyThemeColors();
        saveData();
    });

    function render() {
        profileCardContainer.innerHTML = ''; 
        const headerContainer =createElement('header', ['main-header-container', 'mb-12']);
        const mainTitleEl = createElement('h1', ['main-title', 'main-title-text'], null, {innerHTML: profileData.userSettings.mainTitle});
        applyStylesToElement(mainTitleEl, profileData.userSettings.mainTitleStyles);
        makeEditable(mainTitleEl, ['userSettings', 'mainTitle'], ['userSettings', 'mainTitleStyles']);
        const subtitleEl = createElement('p', ['subtitle', 'subtitle-text'], null, {innerHTML: profileData.userSettings.subtitle});
        applyStylesToElement(subtitleEl, profileData.userSettings.subtitleStyles);
        makeEditable(subtitleEl, ['userSettings', 'subtitle'], ['userSettings', 'subtitleStyles']);
        headerContainer.append(mainTitleEl, subtitleEl);
        profileCardContainer.appendChild(headerContainer);
        const gridContainer = createElement('div', ['grid-container']);
        profileData.cards.forEach((cardData, cardIndex) => {
            gridContainer.appendChild(renderCard(cardData, cardIndex));
        });
        profileCardContainer.appendChild(gridContainer);
        const footer = createElement('footer', ['page-footer']);
        const footerTextEl = createElement('p', [], null, {innerHTML: profileData.userSettings.footerText}); 
        makeEditable(footerTextEl, ['userSettings', 'footerText'], null);
        footer.appendChild(footerTextEl);
        profileCardContainer.appendChild(footer);
        applyThemeColors(); 
        saveData();
    }

    function renderCard(cardData, cardIndex) {
        const cardDiv = createElement('div', ['ui-card', 'p-6', 'md:p-7', cardData.layoutSpan]);
        cardDiv.dataset.cardId = cardData.id;
        const titleContainer = createElement('div', ['section-title-container']);
        const titleEl = createElement('h2', ['section-title'], null, {innerHTML: cardData.title});
        applyStylesToElement(titleEl, cardData.titleStyles);
        makeEditable(titleEl, ['cards', cardIndex, 'title'], ['cards', cardIndex, 'titleStyles']);
        titleContainer.appendChild(titleEl);
        cardDiv.appendChild(titleContainer);
        const cardActions = createElement('div', ['card-actions-container']);
        const deleteCardBtn = createActionButton('close', '删除此卡片', () => deleteCard(cardIndex)); 
        deleteCardBtn.classList.add('delete-btn', 'delete-card-btn'); 
        cardActions.appendChild(deleteCardBtn);
        cardDiv.appendChild(cardActions);
        const contentWrapper = createElement('div', ['card-content-wrapper']);
        cardData.elements.forEach((elementData, elementIndex) => {
            contentWrapper.appendChild(renderCardElement(elementData, cardIndex, elementIndex));
        });
        cardDiv.appendChild(contentWrapper);
        const addElementToCardButton = createActionButton('add_circle_outline', '添加新区块到此卡片', () => showAddElementOptions(cardIndex), true);
        addElementToCardButton.classList.add('mt-4', 'mx-auto', 'block', 'text-with-icon'); 
        cardDiv.appendChild(addElementToCardButton);
        return cardDiv;
    }

    function renderCardElement(elementData, cardIndex, elementIndex) {
        const basePath = ['cards', cardIndex, 'elements', elementIndex];
        let elementContainer = createElement('div', ['element-container', 'mb-4', 'relative']); 
        switch (elementData.type) {
            case 'profileInfo':
                elementContainer.classList.add('profile-section-layout', 'flex-col', 'sm:flex-row', 'items-center', 'sm:items-start');
                const avatarWrapper = createElement('div', ['avatar-container', 'mb-4', 'sm:mb-0', 'flex-shrink-0']);
                const avatarImg = createElement('img');
                avatarImg.src = profileData.userSettings.avatarSrc;
                avatarImg.alt = '用户头像';
                avatarImg.onerror = () => { avatarImg.src = 'https://placehold.co/100x100/EFEFEF/AAAAAA?text=Error'; };
                avatarWrapper.appendChild(avatarImg);
                const hiddenAvatarInputId = `avatarUploadInputHidden_${cardIndex}_${elementIndex}`;
                let hiddenAvatarInput = document.getElementById(hiddenAvatarInputId);
                if (!hiddenAvatarInput) { 
                    hiddenAvatarInput = createElement('input', [], null, {type: 'file', accept:'image/*', id: hiddenAvatarInputId, style:'display:none'});
                    document.body.appendChild(hiddenAvatarInput); 
                }
                hiddenAvatarInput.onchange = handleAvatarUpload; 
                avatarWrapper.addEventListener('click', () => hiddenAvatarInput.click());
                const infoDiv = createElement('div', ['flex-grow', 'sm:pl-4']);
                const fields = ['nickname', 'gender', 'age', 'location', 'mbti'];
                const labels = {'nickname':'昵称', 'gender':'性别', 'age':'年龄', 'location':'常驻', 'mbti':'MBTI'};
                fields.forEach(field => {
                    const p = createElement('p', ['content-text', 'mb-1']);
                    const strong = createElement('strong', [], `${labels[field]}: `);
                    const span = createElement('span', [], null, {innerHTML: elementData[field]});
                    applyStylesToElement(span, elementData.textStyles); 
                    makeEditable(span, [...basePath, field], [...basePath, 'textStyles']); 
                    p.append(strong, span);
                    infoDiv.appendChild(p);
                });
                const qrCodeWrapper = createElement('div', ['qr-code-wrapper', 'mt-6', 'flex', 'flex-col', 'items-center']);
                const qrCodeDisplay = createElement('div', ['qr-code-container']);
                qrCodeDisplay.id = `qrCodeDisplay_${cardIndex}_${elementIndex}`; 
                const qrLinkInput = createElement('input', ['qr-code-link-input', 'mt-2'], null, {type: 'text', value: profileData.userSettings.qrCodeLink, placeholder: '二维码链接'});
                qrLinkInput.addEventListener('change', (e) => {
                    profileData.userSettings.qrCodeLink = e.target.value;
                    generateQRCode(profileData.userSettings.qrCodeLink, qrCodeDisplay.id);
                    saveData();
                });
                const qrHint = createElement('p', ['text-sm', 'text-gray-500', 'mt-1'], '编辑上方链接并回车更新二维码');
                qrCodeWrapper.append(qrCodeDisplay, qrLinkInput, qrHint);
                elementContainer.append(avatarWrapper, infoDiv, qrCodeWrapper);
                setTimeout(() => generateQRCode(profileData.userSettings.qrCodeLink, qrCodeDisplay.id), 0);
                break;
            case 'paragraph':
                const pEl = createElement('p', ['content-text'], null, {innerHTML: elementData.text}); 
                applyStylesToElement(pEl, elementData.styles);
                makeEditable(pEl, [...basePath, 'text'], [...basePath, 'styles']);
                elementContainer.appendChild(pEl);
                break;
            case 'tagSection':
            case 'musicGameSection': 
                const subH = createElement('h3', ['card-content-subheading'], null, {innerHTML: elementData.subheading});
                applyStylesToElement(subH, elementData.subheadingStyles);
                makeEditable(subH, [...basePath, 'subheading'], [...basePath, 'subheadingStyles']);
                elementContainer.appendChild(subH);
                const tagsContainer = createElement('div', ['flex', 'flex-wrap', 'gap-x-2', 'gap-y-3', 'mb-4']);
                if (elementData.type === 'musicGameSection') {
                    const arcadeCat = createElement('div', ['music-game-category']);
                    const arcadeLabelEl = createElement('span', ['music-game-label'], null, { innerHTML: elementData.arcadeLabel });
                    applyStylesToElement(arcadeLabelEl, elementData.arcadeLabelStyles);
                    makeEditable(arcadeLabelEl, [...basePath, 'arcadeLabel'], [...basePath, 'arcadeLabelStyles']);
                    arcadeCat.appendChild(arcadeLabelEl);
                    if (elementData.arcade && elementData.arcade.length > 0) {
                        elementData.arcade.forEach((tag, tagIndex) => {
                            arcadeCat.appendChild(renderTag(tag, [...basePath, 'arcade', tagIndex], elementData.tagStyles, cardIndex, elementIndex, 'arcade'));
                        });
                    }
                    tagsContainer.appendChild(arcadeCat);

                    const mobileCat = createElement('div', ['music-game-category']);
                    const mobileLabelEl = createElement('span', ['music-game-label'], null, { innerHTML: elementData.mobileLabel });
                    applyStylesToElement(mobileLabelEl, elementData.mobileLabelStyles);
                    makeEditable(mobileLabelEl, [...basePath, 'mobileLabel'], [...basePath, 'mobileLabelStyles']);
                    mobileCat.appendChild(mobileLabelEl);
                    if (elementData.mobile && elementData.mobile.length > 0) {
                        elementData.mobile.forEach((tag, tagIndex) => {
                            mobileCat.appendChild(renderTag(tag, [...basePath, 'mobile', tagIndex], elementData.tagStyles, cardIndex, elementIndex, 'mobile'));
                        });
                    }
                    tagsContainer.appendChild(mobileCat);

                    const addMusicTagContainer = createElement('div', ['add-tag-button-container']);
                    const addMusicTagInput = createElement('input', ['add-tag-input'], null, {type: 'text', placeholder: '新标签名(移动端)'});
                    const addMusicTagBtn = createActionButton('add', '添加标签', () => {
                        if (addMusicTagInput.value.trim()) {
                            if (!profileData.cards[cardIndex].elements[elementIndex].mobile) profileData.cards[cardIndex].elements[elementIndex].mobile = [];
                            profileData.cards[cardIndex].elements[elementIndex].mobile.push({text: addMusicTagInput.value.trim(), styles: {}});
                            addMusicTagInput.value = ''; 
                            render();
                        }
                    });
                    addMusicTagContainer.append(addMusicTagInput, addMusicTagBtn);
                    tagsContainer.appendChild(addMusicTagContainer);
                } else { 
                    elementData.tags.forEach((tag, tagIndex) => {
                        tagsContainer.appendChild(renderTag(tag, [...basePath, 'tags', tagIndex], elementData.tagStyles, cardIndex, elementIndex, 'tags'));
                    });
                    const addTagContainer = createElement('div', ['add-tag-button-container']);
                    const addTagInput = createElement('input', ['add-tag-input'], null, {type: 'text', placeholder: '新标签名'});
                    const addTagBtn = createActionButton('add', '添加标签', () => {
                        if (addTagInput.value.trim()) {
                            profileData.cards[cardIndex].elements[elementIndex].tags.push({text: addTagInput.value.trim(), styles: {}});
                            addTagInput.value = ''; 
                            render();
                        }
                    });
                    addTagContainer.append(addTagInput, addTagBtn);
                    tagsContainer.appendChild(addTagContainer);
                }
                elementContainer.appendChild(tagsContainer);
                break;
            case 'oshiSection':
                const oshiSubH = createElement('h3', ['card-content-subheading'], null, {innerHTML: elementData.subheading});
                applyStylesToElement(oshiSubH, elementData.subheadingStyles);
                makeEditable(oshiSubH, [...basePath, 'subheading'], [...basePath, 'subheadingStyles']);
                elementContainer.appendChild(oshiSubH);
                const oshiTagsContainer = createElement('div', ['oshi-tag-container']);
                elementData.oshis.forEach((tag, tagIndex) => {
                    oshiTagsContainer.appendChild(renderTag(tag, [...basePath, 'oshis', tagIndex], tag.styles, cardIndex, elementIndex, 'oshis', tag.type));
                });
                elementData.meta.forEach((tag, tagIndex) => { 
                    oshiTagsContainer.appendChild(renderTag(tag, [...basePath, 'meta', tagIndex], tag.styles, cardIndex, elementIndex, 'meta', tag.type));
                });
                const addOshiTagContainer = createElement('div', ['add-tag-button-container']);
                const addOshiTagInput = createElement('input', ['add-tag-input'], null, {type: 'text', placeholder: '新推し名'});
                const addOshiTagBtn = createActionButton('add', '添加推し', () => {
                    if (addOshiTagInput.value.trim()) {
                        profileData.cards[cardIndex].elements[elementIndex].oshis.push({text: addOshiTagInput.value.trim(), type: 'oshi-tag', styles: { fontWeight: '400', fontSize: '14.4' }});
                        addOshiTagInput.value = ''; 
                        render();
                    }
                });
                addOshiTagContainer.append(addOshiTagInput, addOshiTagBtn);
                oshiTagsContainer.appendChild(addOshiTagContainer);
                elementContainer.appendChild(oshiTagsContainer);
                break;
        }
        if (elementData.type !== 'profileInfo') {
            const deleteElementBtnIcon = createActionButton('close', '删除此区块', () => {
                if (confirm(`确定要删除此区块吗？`)) {
                    profileData.cards[cardIndex].elements.splice(elementIndex, 1);
                    render();
                }
            });
            deleteElementBtnIcon.classList.add('delete-btn', 'delete-element-btn');
            elementContainer.appendChild(deleteElementBtnIcon); 
        }
        return elementContainer;
    }

    function renderTag(tagData, dataPath, defaultStyles, cardIndex, elementIndex, tagArrayName, tagClassOverride = 'tag') {
        const tagEl = createElement('span', [tagClassOverride], null, {innerHTML: tagData.text}); 
        const effectiveStyles = { ...defaultStyles, ...tagData.styles }; 
        applyStylesToElement(tagEl, effectiveStyles);
        makeEditable(tagEl, [...dataPath, 'text'], [...dataPath, 'styles']); 
        const tagActionsContainer = createElement('div', ['tag-actions-container']);
        const deleteTagBtn = createActionButton('close', '删除标签', (e) => { 
            e.stopPropagation(); 
            const parts = dataPath; 
            let arrayToModify = profileData;
            for(let i = 0; i < parts.length -1; i++) {
                arrayToModify = arrayToModify[parts[i]];
            }
            const itemIndex = parts[parts.length-1];
            arrayToModify.splice(itemIndex, 1);
            render();
        });
        deleteTagBtn.classList.add('delete-btn', 'delete-tag-icon-btn'); 
        tagActionsContainer.appendChild(deleteTagBtn);
        tagEl.appendChild(tagActionsContainer);
        return tagEl;
    }

    function generateQRCode(link, elementId = 'qrCodeDisplay_0_0') { 
        const qrElement = document.getElementById(elementId);
        if (!qrElement) {
            console.warn(`QR code element with ID ${elementId} not found.`);
            return;
        }
        qrElement.innerHTML = ''; 
        try {
            new QRCode(qrElement, {
                text: link,
                width: 128,
                height: 128,
                colorDark: getComputedStyle(document.documentElement).getPropertyValue('--theme-text-strong').trim() || "#000000",
                colorLight: getComputedStyle(document.documentElement).getPropertyValue('--theme-bg-page').trim() || "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } catch (e) {
            console.error("生成二维码出错:", e);
            qrElement.textContent = "QR生成失败";
        }
    }
    
    function handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profileData.userSettings.avatarSrc = e.target.result;
                render(); 
                saveData();
            }
            reader.readAsDataURL(file);
        }
         event.target.value = null; 
    }

    function makeEditable(element, textDataPath, styleDataPath) { 
        element.setAttribute('contenteditable', 'false'); 
        element.style.webkitUserModify = 'read-write'; 

        element.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            if(currentEditTarget && currentEditTarget !== element) {
                 currentEditTarget.style.outline = 'none'; 
                 currentEditTarget.setAttribute('contenteditable', 'false'); 
            }
            currentEditTarget = element;
            currentDataPath = { text: textDataPath, style: styleDataPath, type: 'html' }; 
            element.setAttribute('contenteditable', 'true');
            element.focus(); 
            element.style.outline = `2px solid ${profileData.userSettings.accentColor}`; 

            const currentStyles = styleDataPath ? styleDataPath.reduce((obj, key) => obj && obj[key] !== undefined ? obj[key] : {}, profileData) : {};
            fontWeightInput.value = currentStyles.fontWeight || '400';
            fontSizeInput.value = currentStyles.fontSize || '16'; 
            
            const rect = element.getBoundingClientRect();
            const popupWidth = editControlsPopup.offsetWidth || 250; 
            const popupHeight = editControlsPopup.offsetHeight || 120; 
            let popupTop = rect.top + window.scrollY;
            let popupLeft = rect.right + window.scrollX + 10; 

            if (popupLeft + popupWidth > document.documentElement.scrollWidth) { 
                popupLeft = rect.left + window.scrollX - popupWidth - 10; 
            }
             if (popupLeft < 0) { 
                popupLeft = 10; 
            }

            if (popupTop + popupHeight > (window.innerHeight + window.scrollY)) { 
                 popupTop = rect.top + window.scrollY - popupHeight - 5; 
            }
            if (popupTop < window.scrollY) { 
                popupTop = window.scrollY + 10;
            }
             if (popupTop < 0) popupTop = 10; 

            editControlsPopup.style.left = `${popupLeft}px`;
            editControlsPopup.style.top = `${popupTop}px`;
            editControlsPopup.style.display = 'flex';
            const isTextClearable = styleDataPath && !(textDataPath.includes('userSettings') && (textDataPath.includes('mainTitle') || textDataPath.includes('subtitle')));
            deleteElementButton.style.display = isTextClearable ? 'block' : 'none';
        });

        element.addEventListener('blur', () => {
            setTimeout(() => {
                if (currentEditTarget === element && editControlsPopup.style.display === 'none') {
                    saveContentEditableChanges(element);
                    element.style.outline = 'none'; 
                    element.setAttribute('contenteditable', 'false');
                } else if (currentEditTarget === element) {
                     saveContentEditableChanges(element);
                }
            }, 100); 
        });
        element.addEventListener('input', () => { 
            if (currentEditTarget === element) {
                saveContentEditableChanges(element);
            }
        });
    }

    function saveContentEditableChanges(element) {
        if (!element || !currentDataPath || !currentDataPath.text) return;
        
        const newHtmlContent = element.innerHTML;
        let textObj = profileData;
        for (let i = 0; i < currentDataPath.text.length - 1; i++) {
            if (textObj[currentDataPath.text[i]] === undefined) textObj[currentDataPath.text[i]] = {};
            textObj = textObj[currentDataPath.text[i]];
        }
        textObj[currentDataPath.text[currentDataPath.text.length - 1]] = newHtmlContent;
        saveData(); 
    }
    
    applyTextChangesButton.addEventListener('click', () => { 
        if (!currentEditTarget || !currentDataPath) return;
        
        saveContentEditableChanges(currentEditTarget); 

        const newFontWeight = fontWeightInput.value;
        const newFontSize = fontSizeInput.value;

        if (currentDataPath.style) {
            let styleObj = profileData;
            for (let i = 0; i < currentDataPath.style.length - 1; i++) {
                 if (styleObj[currentDataPath.style[i]] === undefined) styleObj[currentDataPath.style[i]] = {};
                styleObj = styleObj[currentDataPath.style[i]];
            }
             if (!styleObj[currentDataPath.style[currentDataPath.style.length - 1]]) {
                styleObj[currentDataPath.style[currentDataPath.style.length - 1]] = {}; 
            }
            styleObj[currentDataPath.style[currentDataPath.style.length - 1]].fontWeight = newFontWeight;
            styleObj[currentDataPath.style[currentDataPath.style.length - 1]].fontSize = newFontSize;
        }
        if (currentEditTarget) {
            currentEditTarget.style.fontWeight = newFontWeight;
            currentEditTarget.style.fontSize = `${newFontSize}px`;
        }
        saveData(); 
        
        editControlsPopup.style.display = 'none';
        if(currentEditTarget) {
            currentEditTarget.style.outline = 'none';
            currentEditTarget.setAttribute('contenteditable', 'false');
        }
        currentEditTarget = null;
        currentDataPath = null;
    });
    
    deleteElementButton.addEventListener('click', () => { // "Clear Content"
        if (!currentEditTarget || !currentDataPath || !currentDataPath.text) return;
        if (!confirm("确定要清除这个元素的内容吗？")) return;
        let textObj = profileData;
        for (let i = 0; i < currentDataPath.text.length - 1; i++) {
            textObj = textObj[currentDataPath.text[i]];
        }
        textObj[currentDataPath.text[currentDataPath.text.length - 1]] = ''; 
        currentEditTarget.innerHTML = ''; 
        saveContentEditableChanges(currentEditTarget); 
        editControlsPopup.style.display = 'none';
        if(currentEditTarget) {
            currentEditTarget.style.outline = 'none';
            currentEditTarget.setAttribute('contenteditable', 'false');
        }
        currentEditTarget = null;
        currentDataPath = null;
    });

    document.addEventListener('click', (e) => {
        if (editControlsPopup.style.display === 'flex' && !editControlsPopup.contains(e.target) && e.target !== currentEditTarget && (!currentEditTarget || !currentEditTarget.contains(e.target)) ) {
            if(currentEditTarget && currentEditTarget.getAttribute('contenteditable') === 'true') {
                saveContentEditableChanges(currentEditTarget); 
                currentEditTarget.style.outline = 'none'; 
                currentEditTarget.setAttribute('contenteditable', 'false');
            }
            editControlsPopup.style.display = 'none';
            currentEditTarget = null;
            currentDataPath = null;
        }
    });
    
    function createElement(tag, classNames = [], textContent = null, attributes = {}) {
        const el = document.createElement(tag);
        if (classNames && classNames.length > 0) el.classList.add(...classNames.filter(cn => cn)); 
        if (textContent && !attributes.innerHTML) { 
             el.textContent = textContent;
        }
        for (const key in attributes) {
            if (key === 'innerHTML') {
                el.innerHTML = attributes[key];
            } else {
                el.setAttribute(key, attributes[key]);
            }
        }
        return el;
    }

    function applyStylesToElement(element, styles) {
        if (styles) {
            element.style.fontWeight = styles.fontWeight || '';
            element.style.fontSize = styles.fontSize ? `${styles.fontSize}px` : '';
        }
    }
    
    function createActionButton(iconName, title, onClick, hasText = false) {
        const btn = createElement('button', ['action-button']);
        let buttonHTML = `<span class="material-icons-outlined">${iconName}</span>`;
        if (hasText && title) { 
            buttonHTML += ` ${title.replace(/<[^>]*>?/gm, '')}`; 
            btn.title = title.replace(/<[^>]*>?/gm, ''); 
        } else {
            btn.title = title.replace(/<[^>]*>?/gm, '');
        }
        btn.innerHTML = buttonHTML; 
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick(e);
        });
        return btn;
    }

    function openSelectionModal(title, options) { 
        return new Promise((resolve) => {
            modalResolve = resolve;
            modalTitle.textContent = title;
            modalOptionsContainer.innerHTML = '';
            options.forEach(opt => {
                const optButton = createElement('button', [], opt.text);
                optButton.addEventListener('click', () => {
                    selectionModal.style.display = 'none';
                    if (modalResolve) modalResolve(opt.value);
                });
                modalOptionsContainer.appendChild(optButton);
            });
            selectionModal.style.display = 'flex';
        });
    }
    modalCancelButton.addEventListener('click', () => {
        selectionModal.style.display = 'none';
        if (modalResolve) modalResolve(null); 
    });

    addCardButton.addEventListener('click', async () => {
        const cardSizeOptions = [
            { text: "1 列宽度 (窄)", value: "profile-card-span" },
            { text: "2 列宽度 (中)", value: "about-me-card-span" },
            { text: "3 列宽度 (宽)", value: "oshi-card-span" }
        ];
        const selectedLayoutSpan = await openSelectionModal("选择新卡片的宽度", cardSizeOptions);
        if (!selectedLayoutSpan) return; 
        const newCardId = `card_${Date.now()}_${profileData.cards.length + 1}`;
        profileData.cards.push({
            id: newCardId,
            title: '新卡片标题',
            titleStyles: { fontWeight: '600', fontSize: '22' },
            layoutSpan: selectedLayoutSpan, 
            elements: [
                { type: 'paragraph', text: '新段落内容...', styles: { fontWeight: '400', fontSize: '15' } }
            ]
        });
        render();
    });

    function deleteCard(cardIndex) { 
        if (confirm(`确定要删除卡片 "${stripHtml(profileData.cards[cardIndex].title)}" 吗？`)) {
            profileData.cards.splice(cardIndex, 1);
            render();
        }
    }
    
    async function showAddElementOptions(cardIndex) {
        const elementTypes = [
            { text: "段落文字", value: "paragraph" },
            { text: "标签区块", value: "tagSection" },
            { text: "推し区块", value: "oshiSection" },
            { text: "基本信息区块", value: "profileInfo" }
        ];
        const type = await openSelectionModal("选择要添加的区块类型", elementTypes);
        if (!type) return; 
        let newElement;
        const defaultTextStyles = { fontWeight: '400', fontSize: '15' };
        const defaultSubheadingStyles = { fontWeight: '600', fontSize: '18' };
        const defaultTagStyles = { fontWeight: '500', fontSize: '13' };
        switch (type.toLowerCase()) {
            case 'paragraph':
                newElement = { type: 'paragraph', text: '新段落...', styles: { ...defaultTextStyles } };
                break;
            case 'tagsection':
                newElement = { type: 'tagSection', subheading: '新标签区块标题', subheadingStyles: {...defaultSubheadingStyles}, tags: [{text:'新标签', styles:{}}], tagStyles: {...defaultTagStyles} };
                break;
            case 'oshisection':
                 newElement = { type: 'oshiSection', subheading: '新推し区块标题', subheadingStyles: {...defaultSubheadingStyles},
                        oshis: [{ text: '新推し', type: 'oshi-tag', styles: { fontWeight: '400', fontSize: '14.4' } }],
                        meta: [] 
                    };
                break;
            case 'profileinfo': 
                newElement = { type: 'profileInfo', nickname: '昵称', gender: '性别', age: '年龄', location: '地点', mbti: 'MBTI', textStyles: { fontWeight: '400', fontSize: '15' } };
                break;
            default:
                alert("无效的元素类型。"); 
                return;
        }
        profileData.cards[cardIndex].elements.push(newElement);
        render();
    }

    const INLINED_CSS_STYLES = `
/* 基本变量和页面背景 */
:root {
    /* Default theme values, will be overridden by JS-generated themeStyleBlock if user changes colors */
    --theme-accent: #FFC300; 
    --theme-tag-bg: #FFF5CC; 
    --theme-tag-bg-alt: #FFE082; 
    --theme-bg-page: #FFFDF5; 
    --theme-text-strong: #8B4513; 
    --theme-divider: #D4A017; 

    --ui-text-primary: #1d1d1f;
    --ui-text-secondary: #333333;
    --ui-text-tertiary: #86868b;
    --ui-bg-card: #ffffff;
    --ui-border-default: #d2d2d7;
    --ui-bg-interactive-hover: #FFE082; 
    --ui-bg-placeholder: #f0f0f5;
    --delete-red: #ef4444;
    --delete-red-hover: #dc2626;
    --button-text-on-accent: #FFFFFF; 
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "SF Pro SC", "SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, "Inter", sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--theme-bg-page);
    margin: 0;
    transition: background-color 0.3s ease;
}

.material-icons, .material-icons-outlined {
  font-family: 'Material Icons';
  font-weight: normal;
  font-style: normal;
  font-size: 1.1em; 
  display: inline-block;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;
  vertical-align: middle;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: 'liga';
}

#profileCardContainer { 
    width: 100%;
    max-width: 1024px; 
    margin: 0 auto; 
    box-sizing: border-box;
    padding-top: 2.5rem; 
    padding-bottom: 2.5rem;
}

.main-header-container {
    margin-bottom: 2.5rem;
    text-align: center;
    position: relative;
}

.main-title-text, .subtitle-text, .section-title, .content-text, .card-content-subheading, .tag, .oshi-tag, .oshi-meta-tag, .music-game-label {
    cursor: default; 
}
/* Hover effects for exported static HTML */
.main-title-text:hover, .subtitle-text:hover, .section-title:hover, .content-text:hover, .card-content-subheading:hover, .music-game-label:hover {
    background-color: rgba(255, 195, 0, 0.1); /* Example hover, consider using a theme variable */
}
.tag:hover {
    background-color: var(--ui-bg-interactive-hover);
    transform: translateY(-1px);
}
.oshi-tag:hover {
    background-color: var(--theme-accent);
    color: var(--ui-bg-card);
    transform: translateY(-1px);
}
.oshi-meta-tag:hover {
    border-color: var(--ui-bg-interactive-hover);
    transform: translateY(-1px);
}


.ui-card {
    background-color: var(--ui-bg-card);
    border-radius: 20px;
    border: 1px solid var(--ui-border-default); 
    box-shadow: 0px 3px 8px rgba(0, 0, 0, 0.07), 0px 1px 1px rgba(0, 0, 0, 0.05);
    overflow: hidden; 
    position: relative; 
}

.section-title-container {
    position: relative;
}
.section-title {
    font-size: 1.375rem; 
    font-weight: 600;
    color: var(--ui-text-primary);
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--theme-divider);
}

.content-text {
    color: var(--ui-text-secondary);
    line-height: 1.65;
    font-size: 0.9375rem; 
}

.content-text strong {
    color: var(--ui-text-primary); 
    font-weight: bold; 
}

.tag, .oshi-tag, .oshi-meta-tag {
    display: inline-block;
    padding: 0.3rem 0.8rem;
    border-radius: 8px;
    font-size: 0.8125rem; 
    font-weight: 500;
    margin: 0.25rem;
    position: relative;
}

.tag {
    background-color: var(--theme-tag-bg);
    color: var(--theme-text-strong);
}

.oshi-tag {
    background-color: var(--theme-tag-bg-alt);
    color: var(--theme-text-strong);
    padding: 0.35rem 0.9rem;
    font-size: 0.9rem; 
    font-weight: 400;
}

.oshi-meta-tag {
    background-color: transparent;
    color: var(--theme-text-strong);
    padding: 0.35rem 0.9rem;
    font-size: 0.875rem; 
    font-style: italic;
    font-weight: 400;
    border: 1px dashed var(--theme-accent);
}

.card-content-subheading {
    font-weight: 600;
    color: var(--ui-text-primary);
    font-size: 1.125rem; 
    margin-bottom: 0.75rem;
    margin-top: 1rem;
}
.music-game-label {
    font-weight: bold;
    display: block; 
    margin-bottom: 0.25rem;
    color: var(--ui-text-primary);
}

.avatar-container {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    overflow: hidden;
    background-color: var(--ui-bg-placeholder);
    border: 2px solid var(--theme-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
    position: relative;
}
.avatar-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.qr-code-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    margin-top: 1rem;
}
.qr-code-container {
    width: 128px; 
    height: 128px;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background-color: var(--theme-bg-page); 
}

.music-game-category {
    margin-bottom: 0.5rem; 
}
.music-game-category strong { 
    display: block; 
    margin-bottom: 0.25rem;
}

.main-title {
    font-size: 2.5rem; 
    font-weight: 700;
    color: var(--ui-text-primary);
    text-align: center;
    margin-bottom: 0.25rem;
}
.subtitle {
    font-size: 1.25rem; 
    color: var(--ui-text-tertiary);
    text-align: center;
    margin-bottom: 2.5rem;
    font-weight: 500;
}
.grid-container {
    display: grid;
    gap: 1.75rem; 
}

@media (min-width: 640px) {
    .profile-section-layout {
        display: flex;
        align-items: center;
    }
    .avatar-container {
        margin-right: 1.5rem;
        margin-bottom: 0;
    }
}
@media (min-width: 768px) {
    .grid-container {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
@media (min-width: 1024px) {
    .grid-container {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .profile-card-span { grid-column: span 1 / span 1; }
    .about-me-card-span { grid-column: span 2 / span 2; }
    .oshi-card-span { grid-column: span 3 / span 3; }
}

.page-footer {
    text-align: center;
    font-size: 0.875rem;
    color: var(--ui-text-tertiary);
    margin-top: 4rem;
    padding-bottom: 2rem;
}

/* TailwindCSS class overrides */
.p-6 { padding: 1.5rem; }
.md\\:p-7 { padding: 1.75rem; } 
.mb-12 { margin-bottom: 3rem; }
.mt-6 { margin-top: 1.5rem; }
.flex-shrink-0 { flex-shrink: 0; }
.sm\\:pl-4 { padding-left: 1rem; } 
.text-sm { font-size: 0.875rem; }
.text-gray-500 { color: var(--ui-text-tertiary); } 
.mt-2 { margin-top: 0.5rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.font-semibold { font-weight: 600; }
.text-lg { font-size: 1.125rem; }
.text-gray-700 { color: var(--ui-text-primary); } 
.gap-x-2 { column-gap: 0.5rem; }
.gap-y-3 { row-gap: 0.75rem; }
.flex { display: flex; }
.flex-wrap { flex-wrap: wrap; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.flex-grow { flex-grow: 1; }
.block { display: block; }
.mx-auto { margin-left: auto; margin-right: auto; }
.mt-4 { margin-top: 1rem; }
.mt-1 { margin-top: 0.25rem; }
.py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; } 
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.md\\:px-6 { }
.lg\\:px-8 { }
`;

    exportHtmlButton.addEventListener('click', async () => {
        const tempContainer = document.createElement('div');
        const originalProfileContainer = document.getElementById('profileCardContainer');
        tempContainer.innerHTML = originalProfileContainer.innerHTML;

        const editorElementsSelectors = '.edit-popup, .card-actions-container, .element-container > .action-button.delete-element-btn, .tag-actions-container, .action-button.text-with-icon[title*="区块"], .action-button.text-with-icon[title*="标签"], .add-tag-button-container, input[type="file"], [id^="avatarUploadInputHidden_"], .qr-code-link-input, .qr-code-wrapper p:last-child';
        tempContainer.querySelectorAll(editorElementsSelectors).forEach(el => el.remove());
        tempContainer.querySelectorAll('[style*="outline"]').forEach(el => el.style.outline = '');
        tempContainer.querySelectorAll('[contenteditable="true"]').forEach(el => {
            el.removeAttribute('contenteditable'); 
            el.style.webkitUserModify = ''; 
        });
        tempContainer.querySelectorAll('.main-title-text, .subtitle-text, .section-title, .content-text, .card-content-subheading, .tag, .oshi-tag, .oshi-meta-tag, .music-game-label').forEach(el => {
            el.style.cursor = 'default'; 
        });
        tempContainer.querySelectorAll('.avatar-container::after').forEach(el => { /* CSS pseudo-elements are hard to remove from JS clone if not inline */ });


        let themeStyleBlock = '<style>:root {';
        themeStyleBlock += `--theme-accent: ${profileData.userSettings.accentColor};`;
        themeStyleBlock += `--theme-bg-page: ${getComputedStyle(document.documentElement).getPropertyValue('--theme-bg-page').trim()};`;
        themeStyleBlock += `--theme-tag-bg: ${getComputedStyle(document.documentElement).getPropertyValue('--theme-tag-bg').trim()};`;
        themeStyleBlock += `--theme-tag-bg-alt: ${getComputedStyle(document.documentElement).getPropertyValue('--theme-tag-bg-alt').trim()};`;
        themeStyleBlock += `--theme-text-strong: ${getComputedStyle(document.documentElement).getPropertyValue('--theme-text-strong').trim()};`;
        themeStyleBlock += `--theme-divider: ${getComputedStyle(document.documentElement).getPropertyValue('--theme-divider').trim()};`;
        themeStyleBlock += `--ui-text-primary: #1d1d1f; --ui-text-secondary: #333333; --ui-text-tertiary: #86868b; --ui-bg-card: #ffffff;`;
        themeStyleBlock += `--ui-border-default: #d2d2d7;`; 
        themeStyleBlock += `--delete-red: #ef4444; --delete-red-hover: #dc2626;`; 
        themeStyleBlock += `--button-text-on-accent: ${getComputedStyle(document.documentElement).getPropertyValue('--button-text-on-accent').trim()};`;
        themeStyleBlock += `}\n </style>`;
        
        const embeddedMainStyles = `<style>\n${INLINED_CSS_STYLES}\n</style>`;
        const googleFontsLink = `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`;
        const materialIconsLink = `<link href="https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined" rel="stylesheet">`;

        const fullHtml = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>导出的扩列条</title>${googleFontsLink}${materialIconsLink}${embeddedMainStyles}${themeStyleBlock}</head><body><div id="profileCardContainer" class="py-10 px-4 md:px-6 lg:px-8">${tempContainer.innerHTML}</div></body></html>`;
        
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = '扩列条.html';
        link.click();
        URL.revokeObjectURL(link.href);
    });

    exportImageButton.addEventListener('click', () => {
        const elementsToHideSelectors = '.editor-toolbar, .edit-popup, .card-actions-container, .element-container > .action-button.delete-element-btn, .tag-actions-container, .action-button.text-with-icon[title*="区块"], .action-button.text-with-icon[title*="标签"], .add-tag-button-container, .qr-code-link-input, .qr-code-wrapper p:last-child, [id^="avatarUploadInputHidden_"]';
        const elementsToHideTemporarily = document.querySelectorAll(elementsToHideSelectors);
        elementsToHideTemporarily.forEach(el => el.style.setProperty('display', 'none', 'important'));
        profileCardContainer.querySelectorAll('[style*="outline"]').forEach(el => el.style.outline = 'none');
        profileCardContainer.querySelectorAll('[contenteditable="true"]').forEach(el => el.setAttribute('contenteditable', 'false'));


        const originalPageStyles = {
            paddingTop: document.body.style.paddingTop,
            backgroundColor: document.body.style.backgroundColor,
            profileContainerMarginTop: profileCardContainer.style.marginTop 
        };
        
        document.body.style.paddingTop = '0px'; 
        profileCardContainer.style.marginTop = '0px'; 
        document.body.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-bg-page').trim();
        
        html2canvas(profileCardContainer, { 
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--theme-bg-page').trim(),
            scale: 1.5, 
            useCORS: true, 
            logging: true,
            onclone: (clonedDoc) => {
                const clonedRoot = clonedDoc.documentElement;
                clonedRoot.style.setProperty('--theme-accent', profileData.userSettings.accentColor);
                clonedRoot.style.setProperty('--theme-bg-page', getComputedStyle(document.documentElement).getPropertyValue('--theme-bg-page').trim());
                clonedRoot.style.setProperty('--theme-tag-bg', getComputedStyle(document.documentElement).getPropertyValue('--theme-tag-bg').trim());
                clonedRoot.style.setProperty('--theme-tag-bg-alt', getComputedStyle(document.documentElement).getPropertyValue('--theme-tag-bg-alt').trim());
                clonedRoot.style.setProperty('--theme-text-strong', getComputedStyle(document.documentElement).getPropertyValue('--theme-text-strong').trim());
                clonedRoot.style.setProperty('--theme-divider', getComputedStyle(document.documentElement).getPropertyValue('--theme-divider').trim());
                clonedRoot.style.setProperty('--button-text-on-accent', getComputedStyle(document.documentElement).getPropertyValue('--button-text-on-accent').trim());
                clonedRoot.style.setProperty('--ui-border-default', getComputedStyle(document.documentElement).getPropertyValue('--ui-border-default').trim());


                clonedDoc.body.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--theme-bg-page').trim();
                clonedDoc.body.style.paddingTop = '0px'; 
                const clonedProfileContainer = clonedDoc.getElementById('profileCardContainer'); 
                 if(clonedProfileContainer) { 
                    clonedProfileContainer.style.paddingTop = getComputedStyle(profileCardContainer).paddingTop; 
                    clonedProfileContainer.style.paddingBottom = getComputedStyle(profileCardContainer).paddingBottom;
                    clonedProfileContainer.style.paddingLeft = getComputedStyle(profileCardContainer).paddingLeft;
                    clonedProfileContainer.style.paddingRight = getComputedStyle(profileCardContainer).paddingRight;
                    clonedProfileContainer.style.marginTop = '0px'; 
                }
                clonedDoc.querySelectorAll(elementsToHideSelectors).forEach(el => el.remove());
                 clonedDoc.querySelectorAll('[contenteditable="true"]').forEach(el => el.setAttribute('contenteditable', 'false')); 
            }
        }).then(canvas => {
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = '扩列条.png';
            link.click();
        }).catch(err => {
            console.error("导出图片失败:", err);
            alert("导出图片失败，请查看控制台获取更多信息。");
        }).finally(() => {
             elementsToHideTemporarily.forEach(el => el.style.display = '');
             document.body.style.paddingTop = originalPageStyles.paddingTop;
             document.body.style.backgroundColor = originalPageStyles.backgroundColor;
             profileCardContainer.style.marginTop = originalPageStyles.profileContainerMarginTop;
        });
    });
    
    resetButton.addEventListener('click', resetToDefault);

    applyThemeColors(); 
    render(); 
});
