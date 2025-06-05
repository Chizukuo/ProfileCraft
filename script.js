document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT CACHING ---
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
    const deleteElementButton = document.getElementById('deleteElementButton');

    const selectionModal = document.getElementById('selectionModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalOptionsContainer = document.getElementById('modalOptionsContainer');
    const modalCancelButton = document.getElementById('modalCancelButton');

    // --- STATE VARIABLES ---
    let currentEditTarget = null;
    let currentDataPath = null;
    let modalResolve = null;

    // --- UTILITY FUNCTIONS ---

    /**
     * Strips HTML tags from a string.
     * @param {string} html - The HTML string to strip.
     * @returns {string} The plain text content.
     */
    function stripHtml(html) {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }

    /**
     * Generates default profile data.
     * @returns {object} The default profile data structure.
     */
    const getDefaultProfileData = () => ({
        userSettings: {
            accentColor: '#FFC300',
            avatarSrc: 'https://q.qlogo.cn/g?b=qq&nk=2723258712&s=160',
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
                    { type: 'profileInfo', nickname: '小芝士', gender: '男', age: 'XX', location: '武汉', mbti: 'INTP-T', textStyles: { fontWeight: '400', fontSize: '15' } }
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
                    { type: 'tagSection', subheading: '爱好:', subheadingStyles: { fontWeight: '600', fontSize: '18' }, tags: [{ text: '音游', styles: {} }, { text: '光棒', styles: {} }], tagStyles: { fontWeight: '500', fontSize: '13' } },
                    { type: 'tagSection', subheading: '主要涉猎:', subheadingStyles: { fontWeight: '600', fontSize: '18' }, tags: [{ text: 'Love Live!', styles: {} }, { text: '少女☆歌剧 Revue Starlight', styles: {} }, { text: 'Project Sekai', styles: {} }, { text: 'BanG Dream!', styles: {} }], tagStyles: { fontWeight: '500', fontSize: '13' } },
                    {
                        type: 'groupedTagSection', // <-- 更新为 分组标签区块
                        subheading: '音游偏好:', subheadingStyles: { fontWeight: '600', fontSize: '18' },
                        arcadeLabel: '街机:', arcadeLabelStyles: { fontWeight: 'bold', fontSize: '15' },
                        arcade: [{ text: '中二节奏', styles: {} }, { text: '舞萌DX (偶尔打)', styles: {} }],
                        mobileLabel: '移动端:', mobileLabelStyles: { fontWeight: 'bold', fontSize: '15' },
                        mobile: [{ text: 'BanG Dream!', styles: {} }, { text: 'Project Sekai', styles: {} }, { text: 'ユメステ', styles: {} }, { text: 'シャニソン', styles: {} }],
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
                    {
                        type: 'tagSectionTwo', // <-- 更新为 标签区块（样式二）
                        subheading: '🎤 女声优', subheadingStyles: { fontWeight: '600', fontSize: '18' },
                        oshis: [{ text: '中岛由贵', type: 'oshi-tag', styles: { fontWeight: '400', fontSize: '14.4' } }],
                        meta: [{ text: 'and all......', type: 'oshi-meta-tag', styles: { fontWeight: '400', fontSize: '14' } }]
                    },
                    {
                        type: 'tagSectionTwo', // <-- 更新为 标签区块（样式二）
                        subheading: '💖 二次元', subheadingStyles: { fontWeight: '600', fontSize: '18' },
                        oshis: ['高坂穗乃果', '矢泽妮可', '渡边曜', '黑泽露比', '优木雪菜', '平安名堇', '户山香澄', '今井莉莎', '白金燐子', 'CHU²', 'PAREO', '朝日六花', '八幡海铃', '大场奈奈', '花里实乃理', '桃井爱莉', '小豆泽心羽', '宵崎奏', '星井美希', '如月千早', '浊心斯卡蒂'].map(name => ({ text: name, type: 'oshi-tag', styles: { fontWeight: '400', fontSize: '14.4' } })),
                        meta: [{ text: 'and more...', type: 'oshi-meta-tag', styles: { fontWeight: '400', fontSize: '14' } }]
                    }
                ]
            }
        ]
    });

    let profileData = loadData();

    /**
     * Saves profile data to local storage.
     */
    function saveData() {
        localStorage.setItem('kuolieProfileData', JSON.stringify(profileData));
    }

    /**
     * Loads profile data from local storage or returns default if invalid.
     * @returns {object} The loaded or default profile data.
     */
    function loadData() {
        const savedData = localStorage.getItem('kuolieProfileData');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                // Basic validation for saved data structure
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

    /**
     * Resets profile data to default and re-renders.
     */
    function resetToDefault() {
        if (confirm("确定要重置所有内容到默认模板吗？所有未保存的更改将丢失。")) {
            profileData = getDefaultProfileData();
            saveData();
            applyThemeColors();
            render();
        }
    }

    /**
     * Calculates the brightness of a hex color.
     * @param {string} hexColor - The hex color string (e.g., "#RRGGBB" or "#RGB").
     * @returns {number} The brightness value (0-255).
     */
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

    /**
     * Lightens a hex color by a given percentage.
     * @param {string} hex - The hex color string.
     * @param {number} percent - The percentage to lighten (0-1).
     * @returns {string} The new hex color string.
     */
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

    /**
     * Darkens a hex color by a given percentage.
     * @param {string} hex - The hex color string.
     * @param {number} percent - The percentage to darken (0-1).
     * @returns {string} The new hex color string.
     */
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

    /**
     * Applies theme colors to the document's CSS variables and updates QR codes.
     */
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
        const newTagHoverBg = lightenHexColor(accent, 0.65);

        document.documentElement.style.setProperty('--button-text-on-accent', buttonTextOnAccent);
        document.documentElement.style.setProperty('--theme-bg-page', newPageBg);
        document.documentElement.style.setProperty('--theme-tag-bg', newTagBg);
        document.documentElement.style.setProperty('--theme-tag-bg-alt', newTagBgAlt);
        document.documentElement.style.setProperty('--theme-text-strong', newTextStrong);
        document.documentElement.style.setProperty('--theme-divider', newDivider);
        document.documentElement.style.setProperty('--theme-tag-hover-bg', newTagHoverBg);
        document.documentElement.style.setProperty('--hover-bg-color', lightenHexColor(accent, 0.9));

        document.body.style.backgroundColor = newPageBg;

        // Debounce QR code generation to avoid multiple calls on rapid color changes
        if (this.qrCodeTimeout) clearTimeout(this.qrCodeTimeout);
        this.qrCodeTimeout = setTimeout(() => {
            document.querySelectorAll('.qr-code-container').forEach(qrEl => {
                if (qrEl.id) {
                    generateQRCode(profileData.userSettings.qrCodeLink, qrEl.id);
                }
            });
        }, 50);
    }

    /**
     * Generates a QR code using the QRCode.js library.
     * @param {string} link - The URL to encode in the QR code.
     * @param {string} elementId - The ID of the container element for the QR code.
     */
    function generateQRCode(link, elementId) {
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

    /**
     * Handles avatar file uploads.
     * @param {Event} event - The file input change event.
     */
    function handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profileData.userSettings.avatarSrc = e.target.result;
                render();
                saveData();
            };
            reader.readAsDataURL(file);
        }
        event.target.value = null; // Clear input to allow re-uploading same file
    }

    /**
     * Creates a DOM element with optional classes, text content, and attributes.
     * @param {string} tag - The HTML tag name.
     * @param {string[]} [classNames=[]] - An array of class names.
     * @param {string} [textContent=null] - The text content of the element.
     * @param {object} [attributes={}] - An object of attributes to set.
     * @returns {HTMLElement} The created DOM element.
     */
    function createElement(tag, classNames = [], textContent = null, attributes = {}) {
        const el = document.createElement(tag);
        if (classNames && classNames.length > 0) el.classList.add(...classNames.filter(cn => cn));
        if (textContent !== null && !attributes.innerHTML) {
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

    /**
     * Applies CSS styles from an object to a DOM element.
     * @param {HTMLElement} element - The element to apply styles to.
     * @param {object} styles - The style object (e.g., { fontWeight: '700', fontSize: '20' }).
     */
    function applyStylesToElement(element, styles) {
        if (styles) {
            if (styles.fontWeight) element.style.fontWeight = styles.fontWeight;
            if (styles.fontSize) element.style.fontSize = `${styles.fontSize}px`;
        }
    }

    /**
     * Creates an action button with a Material Icons icon and optional text.
     * @param {string} iconName - The name of the Material Icons icon.
     * @param {string} title - The title/tooltip for the button.
     * @param {Function} onClick - The click event handler.
     * @param {boolean} [hasText=false] - Whether the button should display text alongside the icon.
     * @returns {HTMLButtonElement} The created button element.
     */
    function createActionButton(iconName, title, onClick, hasText = false) {
        const btn = createElement('button', ['action-button']);
        const cleanedTitle = stripHtml(title); // Clean title for tooltip
        let buttonHTML = `<span class="material-icons-outlined">${iconName}</span>`;

        if (hasText && cleanedTitle) {
            buttonHTML += ` ${cleanedTitle}`;
        }
        btn.title = cleanedTitle;
        btn.innerHTML = buttonHTML;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick(e);
        });
        return btn;
    }

    // --- RENDERING FUNCTIONS ---

    /**
     * Renders the entire profile card UI based on `profileData`.
     */
    function render() {
        profileCardContainer.innerHTML = ''; // Clear existing content

        // Render Header
        const headerContainer = createElement('header', ['main-header-container', 'mb-12']);
        const mainTitleEl = createElement('h1', ['main-title', 'main-title-text'], null, { innerHTML: profileData.userSettings.mainTitle });
        applyStylesToElement(mainTitleEl, profileData.userSettings.mainTitleStyles);
        makeEditable(mainTitleEl, ['userSettings', 'mainTitle'], ['userSettings', 'mainTitleStyles']);

        const subtitleEl = createElement('p', ['subtitle', 'subtitle-text'], null, { innerHTML: profileData.userSettings.subtitle });
        applyStylesToElement(subtitleEl, profileData.userSettings.subtitleStyles);
        makeEditable(subtitleEl, ['userSettings', 'subtitle'], ['userSettings', 'subtitleStyles']);
        headerContainer.append(mainTitleEl, subtitleEl);
        profileCardContainer.appendChild(headerContainer);

        // Render Cards Grid
        const gridContainer = createElement('div', ['grid-container']);
        profileData.cards.forEach((cardData, cardIndex) => {
            gridContainer.appendChild(renderCard(cardData, cardIndex));
        });
        profileCardContainer.appendChild(gridContainer);

        // Render Footer
        const footer = createElement('footer', ['page-footer']);
        const footerTextEl = createElement('p', [], null, { innerHTML: profileData.userSettings.footerText });
        makeEditable(footerTextEl, ['userSettings', 'footerText'], null);
        footer.appendChild(footerTextEl);
        profileCardContainer.appendChild(footer);

        applyThemeColors(); // Apply colors after all elements are rendered
        saveData(); // Save data after rendering
    }

    /**
     * Renders a single profile card.
     * @param {object} cardData - The data for the card.
     * @param {number} cardIndex - The index of the card in the profileData.cards array.
     * @returns {HTMLElement} The rendered card element.
     */
    function renderCard(cardData, cardIndex) {
        const cardDiv = createElement('div', ['ui-card', 'p-6', 'md:p-7', cardData.layoutSpan]);
        cardDiv.dataset.cardId = cardData.id;

        const titleContainer = createElement('div', ['section-title-container']);
        const titleEl = createElement('h2', ['section-title'], null, { innerHTML: cardData.title });
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

    /**
     * Renders a single element within a profile card.
     * @param {object} elementData - The data for the element.
     * @param {number} cardIndex - The index of the parent card.
     * @param {number} elementIndex - The index of the element within its card.
     * @returns {HTMLElement} The rendered element.
     */
    function renderCardElement(elementData, cardIndex, elementIndex) {
        const basePath = ['cards', cardIndex, 'elements', elementIndex];
        let elementContainer = createElement('div', ['element-container', 'mb-4', 'relative']);

        switch (elementData.type) {
            case 'profileInfo':
                elementContainer.classList.add('profile-section-layout', 'flex-col', 'sm:flex-row', 'items-center', 'sm:items-start');

                const avatarWrapper = createElement('div', ['avatar-container', 'mb-4', 'sm:mb-0', 'flex-shrink-0']);
                const avatarImg = createElement('img', [], null, {
                    src: profileData.userSettings.avatarSrc,
                    alt: '用户头像',
                    onerror: "this.src='https://placehold.co/100x100/EFEFEF/AAAAAA?text=Error';"
                });
                avatarWrapper.appendChild(avatarImg);

                const hiddenAvatarInputId = `avatarUploadInputHidden_${cardIndex}_${elementIndex}`;
                let hiddenAvatarInput = document.getElementById(hiddenAvatarInputId);
                if (!hiddenAvatarInput) {
                    hiddenAvatarInput = createElement('input', [], null, { type: 'file', accept: 'image/*', id: hiddenAvatarInputId, style: 'display:none' });
                    document.body.appendChild(hiddenAvatarInput);
                }
                hiddenAvatarInput.onchange = handleAvatarUpload;
                avatarWrapper.addEventListener('click', () => hiddenAvatarInput.click());

                const infoDiv = createElement('div', ['flex-grow', 'sm:pl-4']);
                const fields = ['nickname', 'gender', 'age', 'location', 'mbti'];
                const labels = { 'nickname': '昵称', 'gender': '性别', 'age': '年龄', 'location': '常驻', 'mbti': 'MBTI' };

                fields.forEach(field => {
                    const p = createElement('p', ['content-text', 'mb-1']);
                    const strong = createElement('strong', [], `${labels[field]}: `);
                    const span = createElement('span', [], null, { innerHTML: elementData[field] });
                    applyStylesToElement(span, elementData.textStyles);
                    makeEditable(span, [...basePath, field], [...basePath, 'textStyles']);
                    p.append(strong, span);
                    infoDiv.appendChild(p);
                });

                const qrCodeWrapper = createElement('div', ['qr-code-wrapper', 'mt-6', 'flex', 'flex-col', 'items-center']);
                const qrCodeDisplayId = `qrCodeDisplay_${cardIndex}_${elementIndex}`;
                const qrCodeDisplay = createElement('div', ['qr-code-container'], null, { id: qrCodeDisplayId });

                const qrLinkInput = createElement('input', ['qr-code-link-input', 'mt-2'], null, { type: 'text', value: profileData.userSettings.qrCodeLink, placeholder: '二维码链接' });
                qrLinkInput.addEventListener('change', (e) => {
                    profileData.userSettings.qrCodeLink = e.target.value;
                    generateQRCode(profileData.userSettings.qrCodeLink, qrCodeDisplayId);
                    saveData();
                });
                const qrHint = createElement('p', ['text-sm', 'text-gray-500', 'mt-1'], '编辑上方链接并回车更新二维码');
                qrCodeWrapper.append(qrCodeDisplay, qrLinkInput, qrHint);
                elementContainer.append(avatarWrapper, infoDiv, qrCodeWrapper);

                // Delay QR code generation slightly to ensure element is in DOM
                setTimeout(() => generateQRCode(profileData.userSettings.qrCodeLink, qrCodeDisplayId), 0);
                break;

            case 'paragraph':
                const pEl = createElement('p', ['content-text'], null, { innerHTML: elementData.text });
                applyStylesToElement(pEl, elementData.styles);
                makeEditable(pEl, [...basePath, 'text'], [...basePath, 'styles']);
                elementContainer.appendChild(pEl);
                break;

            case 'tagSection': // 标签区块 (普通样式)
                const subH = createElement('h3', ['card-content-subheading'], null, { innerHTML: elementData.subheading });
                applyStylesToElement(subH, elementData.subheadingStyles);
                makeEditable(subH, [...basePath, 'subheading'], [...basePath, 'subheadingStyles']);
                elementContainer.appendChild(subH);

                const tagsContainer = createElement('div', ['flex', 'flex-wrap', 'gap-x-2', 'gap-y-3', 'mb-4']);
                elementData.tags.forEach((tag, tagIndex) => {
                    tagsContainer.appendChild(renderTag(tag, [...basePath, 'tags', tagIndex], elementData.tagStyles, cardIndex, elementIndex, 'tags'));
                });
                const addTagContainer = createElement('div', ['add-tag-button-container']);
                const addTagInput = createElement('input', ['add-tag-input'], null, { type: 'text', placeholder: '新标签名' });
                const addTagBtn = createActionButton('add', '添加标签', () => {
                    if (addTagInput.value.trim()) {
                        profileData.cards[cardIndex].elements[elementIndex].tags.push({ text: addTagInput.value.trim(), styles: {} });
                        addTagInput.value = '';
                        render();
                    }
                });
                addTagContainer.append(addTagInput, addTagBtn);
                tagsContainer.appendChild(addTagContainer);
                elementContainer.appendChild(tagsContainer);
                break;

            case 'groupedTagSection': // 分组标签区块 (原 musicGameSection)
                const groupedSubH = createElement('h3', ['card-content-subheading'], null, { innerHTML: elementData.subheading });
                applyStylesToElement(groupedSubH, elementData.subheadingStyles);
                makeEditable(groupedSubH, [...basePath, 'subheading'], [...basePath, 'subheadingStyles']);
                elementContainer.appendChild(groupedSubH);

                const groupedTagsContainer = createElement('div', ['flex', 'flex-wrap', 'gap-x-2', 'gap-y-3', 'mb-4']);

                // Arcade Section
                const arcadeCat = createElement('div', ['music-game-category']);
                const arcadeLabelEl = createElement('span', ['music-game-label'], null, { innerHTML: elementData.arcadeLabel });
                applyStylesToElement(arcadeLabelEl, elementData.arcadeLabelStyles);
                makeEditable(arcadeLabelEl, [...basePath, 'arcadeLabel'], [...basePath, 'arcadeLabelStyles']);
                arcadeCat.appendChild(arcadeLabelEl);
                elementData.arcade?.forEach((tag, tagIndex) => {
                    arcadeCat.appendChild(renderTag(tag, [...basePath, 'arcade', tagIndex], elementData.tagStyles, cardIndex, elementIndex, 'arcade'));
                });
                // Add input for Arcade Tags
                const addArcadeTagContainer = createElement('div', ['add-tag-button-container']);
                const addArcadeTagInput = createElement('input', ['add-tag-input'], null, { type: 'text', placeholder: '新标签名' });
                const addArcadeTagBtn = createActionButton('add', '添加标签', () => {
                    if (addArcadeTagInput.value.trim()) {
                        const arcadeTags = profileData.cards[cardIndex].elements[elementIndex].arcade || [];
                        arcadeTags.push({ text: addArcadeTagInput.value.trim(), styles: {} });
                        profileData.cards[cardIndex].elements[elementIndex].arcade = arcadeTags;
                        addArcadeTagInput.value = '';
                        render();
                    }
                });
                addArcadeTagContainer.append(addArcadeTagInput, addArcadeTagBtn);
                arcadeCat.appendChild(addArcadeTagContainer); // Append to arcade category
                groupedTagsContainer.appendChild(arcadeCat);

                // Mobile Section
                const mobileCat = createElement('div', ['music-game-category']);
                const mobileLabelEl = createElement('span', ['music-game-label'], null, { innerHTML: elementData.mobileLabel });
                applyStylesToElement(mobileLabelEl, elementData.mobileLabelStyles);
                makeEditable(mobileLabelEl, [...basePath, 'mobileLabel'], [...basePath, 'mobileLabelStyles']);
                mobileCat.appendChild(mobileLabelEl);
                elementData.mobile?.forEach((tag, tagIndex) => {
                    mobileCat.appendChild(renderTag(tag, [...basePath, 'mobile', tagIndex], elementData.tagStyles, cardIndex, elementIndex, 'mobile'));
                });
                const addMobileTagContainer = createElement('div', ['add-tag-button-container']);
                const addMobileTagInput = createElement('input', ['add-tag-input'], null, { type: 'text', placeholder: '新标签名' });
                const addMobileTagBtn = createActionButton('add', '添加标签', () => {
                    if (addMobileTagInput.value.trim()) {
                        const mobileTags = profileData.cards[cardIndex].elements[elementIndex].mobile || [];
                        mobileTags.push({ text: addMobileTagInput.value.trim(), styles: {} });
                        profileData.cards[cardIndex].elements[elementIndex].mobile = mobileTags;
                        addMobileTagInput.value = '';
                        render();
                    }
                });
                addMobileTagContainer.append(addMobileTagInput, addMobileTagBtn);
                mobileCat.appendChild(addMobileTagContainer); // Append to mobile category
                groupedTagsContainer.appendChild(mobileCat);

                elementContainer.appendChild(groupedTagsContainer);
                break;

            case 'tagSectionTwo': // 标签区块（样式二） (原 oshiSection)
                const oshiSubH = createElement('h3', ['card-content-subheading'], null, { innerHTML: elementData.subheading });
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
                const addOshiTagInput = createElement('input', ['add-tag-input'], null, { type: 'text', placeholder: '新标签名' }); // Changed placeholder
                const addOshiTagBtn = createActionButton('add', '添加标签', () => { // Changed button text
                    if (addOshiTagInput.value.trim()) {
                        profileData.cards[cardIndex].elements[elementIndex].oshis.push({ text: addOshiTagInput.value.trim(), type: 'oshi-tag', styles: { fontWeight: '400', fontSize: '14.4' } });
                        addOshiTagInput.value = '';
                        render();
                    }
                });
                addOshiTagContainer.append(addOshiTagInput, addOshiTagBtn);
                oshiTagsContainer.appendChild(addOshiTagContainer);
                elementContainer.appendChild(oshiTagsContainer);
                break;
        }

        // Add delete element button for all types except 'profileInfo'
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

    /**
     * Renders a single tag element within a tag section.
     * @param {object} tagData - The data for the tag.
     * @param {string[]} dataPath - The data path to the tag's text and styles.
     * @param {object} defaultStyles - Default styles for the tag.
     * @param {number} cardIndex - The index of the parent card.
     * @param {number} elementIndex - The index of the parent element.
     * @param {string} tagArrayName - The name of the array containing the tag (e.g., 'tags', 'arcade', 'mobile', 'oshis', 'meta').
     * @param {string} [tagClassOverride='tag'] - Override for the CSS class of the tag.
     * @returns {HTMLElement} The rendered tag element.
     */
    function renderTag(tagData, dataPath, defaultStyles, cardIndex, elementIndex, tagArrayName, tagClassOverride = 'tag') {
        const tagEl = createElement('span', [tagClassOverride], null, { innerHTML: tagData.text });
        const effectiveStyles = { ...defaultStyles, ...tagData.styles };
        applyStylesToElement(tagEl, effectiveStyles);
        makeEditable(tagEl, [...dataPath, 'text'], [...dataPath, 'styles']);

        const tagActionsContainer = createElement('div', ['tag-actions-container']);
        const deleteTagBtn = createActionButton('close', '删除标签', (e) => {
            e.stopPropagation();
            const elementsArray = profileData.cards[cardIndex].elements[elementIndex][tagArrayName];
            const tagIndex = elementsArray.indexOf(tagData); // Find by reference
            if (tagIndex > -1) {
                elementsArray.splice(tagIndex, 1);
            }
            render();
        });
        deleteTagBtn.classList.add('delete-btn', 'delete-tag-icon-btn');
        tagActionsContainer.appendChild(deleteTagBtn);
        tagEl.appendChild(tagActionsContainer);
        return tagEl;
    }

    // --- EDITING & INTERACTIVITY ---

    /**
     * Makes an element contenteditable and attaches editing controls.
     * @param {HTMLElement} element - The element to make editable.
     * @param {string[]} textDataPath - The path in `profileData` to the element's text content.
     * @param {string[]|null} styleDataPath - The path in `profileData` to the element's styles, or null if no styles.
     */
    function makeEditable(element, textDataPath, styleDataPath) {
        element.setAttribute('contenteditable', 'false');
        element.style.webkitUserModify = 'read-write';

        element.addEventListener('click', (e) => {
            e.stopPropagation();

            if (currentEditTarget && currentEditTarget !== element) {
                currentEditTarget.style.outline = 'none';
                currentEditTarget.setAttribute('contenteditable', 'false');
                saveContentEditableChanges(currentEditTarget); // Save changes from previously edited element
            }

            currentEditTarget = element;
            currentDataPath = { text: textDataPath, style: styleDataPath, type: 'html' };

            element.setAttribute('contenteditable', 'true');
            element.focus();
            element.style.outline = `2px solid ${profileData.userSettings.accentColor}`;

            const currentStyles = styleDataPath ? styleDataPath.reduce((obj, key) => obj && obj[key] !== undefined ? obj[key] : {}, profileData) : {};
            fontWeightInput.value = currentStyles.fontWeight || '400';
            fontSizeInput.value = currentStyles.fontSize || '16';

            // Position and show the edit controls popup
            if (window.innerWidth >= 768) {
                const rect = element.getBoundingClientRect();
                const popupWidth = editControlsPopup.offsetWidth || 250;
                const popupHeight = editControlsPopup.offsetHeight || 120;
                let popupTop = rect.top + window.scrollY;
                let popupLeft = rect.right + window.scrollX + 10;

                // Adjust position to keep popup within viewport
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
            } else {
                editControlsPopup.style.display = 'none';
            }

            // Determine if "Clear Content" button should be visible
            const isTextClearable = styleDataPath && !(textDataPath.includes('userSettings') && (textDataPath.includes('mainTitle') || textDataPath.includes('subtitle')));
            deleteElementButton.style.display = isTextClearable ? 'block' : 'none';
        });

        // Event listener for blur to save changes and hide popup
        element.addEventListener('blur', () => {
            // Use setTimeout to allow click events on popup controls to register first
            setTimeout(() => {
                if (currentEditTarget === element && !editControlsPopup.contains(document.activeElement)) {
                    saveContentEditableChanges(element);
                    element.style.outline = 'none';
                    element.setAttribute('contenteditable', 'false');
                    editControlsPopup.style.display = 'none';
                    currentEditTarget = null;
                    currentDataPath = null;
                }
            }, 150); // Small delay
        });

        // Event listener for input to save changes instantly (for continuous updates)
        element.addEventListener('input', () => {
            if (currentEditTarget === element) {
                saveContentEditableChanges(element);
            }
        });
    }

    /**
     * Saves changes from a contenteditable element back to `profileData`.
     * @param {HTMLElement} element - The contenteditable element.
     */
    function saveContentEditableChanges(element) {
        if (!element || !currentDataPath || !currentDataPath.text) return;

        const newHtmlContent = element.innerHTML;
        let target = profileData;
        for (let i = 0; i < currentDataPath.text.length - 1; i++) {
            if (target[currentDataPath.text[i]] === undefined) target[currentDataPath.text[i]] = {};
            target = target[currentDataPath.text[i]];
        }
        target[currentDataPath.text[currentDataPath.text.length - 1]] = newHtmlContent;
        saveData();
    }

    // --- MODAL FUNCTIONS ---

    /**
     * Opens a generic selection modal.
     * @param {string} title - The title of the modal.
     * @param {Array<object>} options - An array of objects with { text: string, value: any }.
     * @returns {Promise<any|null>} A promise that resolves with the selected value or null if canceled.
     */
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

    // --- EVENT LISTENERS ---

    accentColorPicker.addEventListener('input', (e) => {
        profileData.userSettings.accentColor = e.target.value;
        applyThemeColors();
        saveData();
    });

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
        if (currentEditTarget) {
            currentEditTarget.style.outline = 'none';
            currentEditTarget.setAttribute('contenteditable', 'false');
        }
        currentEditTarget = null;
        currentDataPath = null;
    });

    deleteElementButton.addEventListener('click', () => {
        if (!currentEditTarget || !currentDataPath || !currentDataPath.text) return;
        if (!confirm("确定要清除这个元素的内容吗？")) return;

        let target = profileData;
        for (let i = 0; i < currentDataPath.text.length - 1; i++) {
            target = target[currentDataPath.text[i]];
        }
        target[currentDataPath.text[currentDataPath.text.length - 1]] = '';
        currentEditTarget.innerHTML = '';
        saveData(); // Save the cleared content

        editControlsPopup.style.display = 'none';
        if (currentEditTarget) {
            currentEditTarget.style.outline = 'none';
            currentEditTarget.setAttribute('contenteditable', 'false');
        }
        currentEditTarget = null;
        currentDataPath = null;
    });

    // Close edit popup when clicking outside
    document.addEventListener('click', (e) => {
        if (editControlsPopup.style.display === 'flex' &&
            !editControlsPopup.contains(e.target) &&
            e.target !== currentEditTarget &&
            (!currentEditTarget || !currentEditTarget.contains(e.target))) {
            if (currentEditTarget && currentEditTarget.getAttribute('contenteditable') === 'true') {
                saveContentEditableChanges(currentEditTarget);
                currentEditTarget.style.outline = 'none';
                currentEditTarget.setAttribute('contenteditable', 'false');
            }
            editControlsPopup.style.display = 'none';
            currentEditTarget = null;
            currentDataPath = null;
        }
    });

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

    /**
     * Deletes a card from the profile data and re-renders.
     * @param {number} cardIndex - The index of the card to delete.
     */
    function deleteCard(cardIndex) {
        if (confirm(`确定要删除卡片 "${stripHtml(profileData.cards[cardIndex].title)}" 吗？`)) {
            profileData.cards.splice(cardIndex, 1);
            render();
        }
    }

    /**
     * Shows options for adding a new element to a card and adds it.
     * @param {number} cardIndex - The index of the card to add the element to.
     */
    async function showAddElementOptions(cardIndex) {
        const elementTypes = [
            { text: "段落文字", value: "paragraph" },
            { text: "标签区块", value: "tagSection" },
            { text: "标签区块（样式二）", value: "tagSectionTwo" }, 
            { text: "分组标签区块", value: "groupedTagSection" }, 
            { text: "基本信息区块", value: "profileInfo" }
        ];
        const type = await openSelectionModal("选择要添加的区块类型", elementTypes);
        if (!type) return;

        let newElement;
        const defaultTextStyles = { fontWeight: '400', fontSize: '15' };
        const defaultSubheadingStyles = { fontWeight: '600', fontSize: '18' };
        const defaultTagStyles = { fontWeight: '500', fontSize: '13' };
        const defaultOshiStyles = { fontWeight: '400', fontSize: '14.4' }; // Specific for oshi tags

        switch (type) {
            case 'paragraph':
                newElement = { type: 'paragraph', text: '新段落...', styles: { ...defaultTextStyles } };
                break;
            case 'tagSection':
                newElement = { type: 'tagSection', subheading: '新标签区块标题', subheadingStyles: { ...defaultSubheadingStyles }, tags: [{ text: '新标签', styles: {} }], tagStyles: { ...defaultTagStyles } };
                break;
            case 'tagSectionTwo': // <-- 匹配新的类型名称
                newElement = {
                    type: 'tagSectionTwo', subheading: '新标签区块标题', subheadingStyles: { ...defaultSubheadingStyles },
                    oshis: [{ text: '新标签', type: 'oshi-tag', styles: { ...defaultOshiStyles } }], // 默认为“新标签”
                    meta: []
                };
                break;
            case 'groupedTagSection': // <-- 匹配新的类型名称
                newElement = {
                    type: 'groupedTagSection',
                    subheading: '新分组标签区块标题', subheadingStyles: { ...defaultSubheadingStyles },
                    arcadeLabel: '分组一:', arcadeLabelStyles: { fontWeight: 'bold', fontSize: '15' }, // 默认标签
                    arcade: [{ text: '新分组一标签', styles: {} }],
                    mobileLabel: '分组二:', mobileLabelStyles: { fontWeight: 'bold', fontSize: '15' }, // 默认标签
                    mobile: [{ text: '新分组二标签', styles: {} }],
                    tagStyles: { ...defaultTagStyles }
                };
                break;
            case 'profileInfo':
                // Check if a profileInfo card already exists
                const hasProfileInfo = profileData.cards.some(card =>
                    card.elements.some(el => el.type === 'profileInfo')
                );
                if (hasProfileInfo) {
                    alert("一个扩列条通常只包含一个基本信息区块。请勿重复添加。");
                    return;
                }
                newElement = { type: 'profileInfo', nickname: '昵称', gender: '性别', 'age': '年龄', location: '地点', mbti: 'MBTI', textStyles: { ...defaultTextStyles } };
                break;
            default:
                alert("无效的元素类型。");
                return;
        }
        profileData.cards[cardIndex].elements.push(newElement);
        render();
    }

    // --- EXPORT FUNCTIONS ---

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
    --theme-tag-hover-bg: #FFE082; /* Added for .tag:hover */

    --ui-text-primary: #1d1d1f;
    --ui-text-secondary: #333333;
    --ui-text-tertiary: #86868b;
    --ui-bg-card: #ffffff;
    --ui-border-default: #d2d2d7;
    /* --ui-bg-interactive-hover: #FFE082;  Replaced by --theme-tag-hover-bg */
    --ui-bg-placeholder: #f0f0f5;
    --delete-red: #ef4444;
    --delete-red-hover: #dc2626;
    --button-text-on-accent: #FFFFFF; 
    --hover-bg-color: transparent; /* Set to transparent for exported view */
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "SF Pro SC", "SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, "Inter", sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--theme-bg-page);
    margin: 0;
    transition: background-color 0.3s ease-in-out;
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

/* Text elements: cursor and user-modify for exported (non-editable) view */
.main-title-text, .subtitle-text, .section-title, .content-text, .card-content-subheading, .tag, .oshi-tag, .oshi-meta-tag, .music-game-label {
    cursor: default !important; 
    -webkit-user-modify: read-only !important; 
    user-select: text !important;
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out, transform 0.2s ease-in-out, border-color 0.2s ease-in-out;
}
/* Hover effects for exported static HTML - Text elements will NOT change background on hover */
.main-title-text:hover, .subtitle-text:hover, .section-title:hover, .content-text:hover, .card-content-subheading:hover, .music-game-label:hover {
    background-color: transparent !important; /* No background change for text on hover in export */
}
.tag:hover {
    background-color: var(--theme-tag-hover-bg) !important; /* Specific hover for tags */
    transform: translateY(-1px);
}
.oshi-tag:hover {
    background-color: var(--theme-accent) !important;
    color: var(--ui-bg-card) !important;
    transform: translateY(-1px);
}
.oshi-meta-tag:hover {
    border-color: var(--theme-tag-hover-bg) !important; /* Use consistent hover derived color */
    transform: translateY(-1px);
}


.ui-card {
    background-color: var(--ui-bg-card);
    border-radius: 20px;
    border: 1px solid var(--ui-border-default); 
    box-shadow: 0px 3px 8px rgba(0, 0, 0, 0.07), 0px 1px 1px rgba(0, 0, 0, 0.05);
    transition: box-shadow 0.3s ease-in-out;
    overflow: hidden; 
    position: relative; 
}
.ui-card:hover {
    box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.08), 0px 4px 8px rgba(0, 0, 0, 0.06);
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

        const editorElementsSelectors = '.editor-toolbar, .edit-popup, .card-actions-container, .element-container > .action-button.delete-element-btn, .tag-actions-container, .action-button.text-with-icon[title*="区块"], .action-button.text-with-icon[title*="标签"], .add-tag-button-container, input[type="file"], [id^="avatarUploadInputHidden_"], .qr-code-link-input, .qr-code-wrapper p:last-child';
        tempContainer.querySelectorAll(editorElementsSelectors).forEach(el => el.remove());

        const potentiallyEditableSelectors = '.main-title-text, .subtitle-text, .section-title, .content-text, .card-content-subheading, .tag, .oshi-tag, .oshi-meta-tag, .music-game-label, .profile-section-layout span, .page-footer p';
        tempContainer.querySelectorAll(potentiallyEditableSelectors).forEach(el => {
            el.removeAttribute('contenteditable');
            el.style.removeProperty('-webkit-user-modify');
            el.style.removeProperty('outline');
        });

        const footerP = tempContainer.querySelector('.page-footer p');
        if (footerP) {
            const originalFooterHTML = profileData.userSettings.footerText;
            const poweredByLink = " | Powered by <a href='https://chizukuo.github.io/ProfileCraft/' target='_blank' rel='noopener noreferrer' style='color: var(--theme-accent); text-decoration: underline;'>ProfileCraft</a>";
            footerP.innerHTML = originalFooterHTML + poweredByLink;
        }

        // Dynamically get current computed styles for theme variables
        const computedStyle = getComputedStyle(document.documentElement);
        const getCssVar = (name) => computedStyle.getPropertyValue(name).trim();

        let themeStyleBlock = '<style>:root {';
        themeStyleBlock += `--theme-accent: ${profileData.userSettings.accentColor};`;
        themeStyleBlock += `--theme-bg-page: ${getCssVar('--theme-bg-page')};`;
        themeStyleBlock += `--theme-tag-bg: ${getCssVar('--theme-tag-bg')};`;
        themeStyleBlock += `--theme-tag-bg-alt: ${getCssVar('--theme-tag-bg-alt')};`;
        themeStyleBlock += `--theme-text-strong: ${getCssVar('--theme-text-strong')};`;
        themeStyleBlock += `--theme-divider: ${getCssVar('--theme-divider')};`;
        themeStyleBlock += `--ui-text-primary: #1d1d1f; --ui-text-secondary: #333333; --ui-text-tertiary: #86868b; --ui-bg-card: #ffffff;`;
        themeStyleBlock += `--ui-border-default: #d2d2d7;`;
        themeStyleBlock += `--delete-red: #ef4444; --delete-red-hover: #dc2626;`;
        themeStyleBlock += `--button-text-on-accent: ${getCssVar('--button-text-on-accent')};`;
        themeStyleBlock += `--hover-bg-color: transparent;`; // Ensure this is transparent for export
        themeStyleBlock += `--theme-tag-hover-bg: ${getCssVar('--theme-tag-hover-bg')};`;
        themeStyleBlock += `}\n </style>`;

        const googleFontsLink = `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`;
        const materialIconsLink = `<link href="https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined" rel="stylesheet">`;

        const fullHtml = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>导出的扩列条</title>${googleFontsLink}${materialIconsLink}<style>${INLINED_CSS_STYLES}</style>${themeStyleBlock}</head><body><div id="profileCardContainer" class="py-10 px-4 md:px-6 lg:px-8">${tempContainer.innerHTML}</div></body></html>`;

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

        // Store original styles to restore later
        const originalDisplayStyles = [];
        elementsToHideTemporarily.forEach(el => {
            originalDisplayStyles.push({ element: el, display: el.style.display });
            el.style.setProperty('display', 'none', 'important');
        });

        // Store and remove outline/contenteditable
        const outlinedElements = profileCardContainer.querySelectorAll('[style*="outline"]');
        const originalOutlines = [];
        outlinedElements.forEach(el => {
            originalOutlines.push({ element: el, outline: el.style.outline });
            el.style.outline = 'none';
        });

        const editableElements = profileCardContainer.querySelectorAll('[contenteditable="true"]');
        const originalContenteditables = [];
        editableElements.forEach(el => {
            originalContenteditables.push({ element: el, contenteditable: el.getAttribute('contenteditable'), userModify: el.style.webkitUserModify });
            el.setAttribute('contenteditable', 'false');
            el.style.removeProperty('-webkit-user-modify');
        });

        const originalPageStyles = {
            paddingTop: document.body.style.paddingTop,
            backgroundColor: document.body.style.backgroundColor,
            profileContainerMarginTop: profileCardContainer.style.marginTop
        };

        // Apply temporary styles for screenshot
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
                const computedStyleCloned = getComputedStyle(document.documentElement); // Get from original doc to ensure consistency
                const getCssVarCloned = (name) => computedStyleCloned.getPropertyValue(name).trim();

                // Apply computed CSS variables to the cloned document's root
                clonedRoot.style.setProperty('--theme-accent', profileData.userSettings.accentColor);
                clonedRoot.style.setProperty('--theme-bg-page', getCssVarCloned('--theme-bg-page'));
                clonedRoot.style.setProperty('--theme-tag-bg', getCssVarCloned('--theme-tag-bg'));
                clonedRoot.style.setProperty('--theme-tag-bg-alt', getCssVarCloned('--theme-tag-bg-alt'));
                clonedRoot.style.setProperty('--theme-text-strong', getCssVarCloned('--theme-text-strong'));
                clonedRoot.style.setProperty('--theme-divider', getCssVarCloned('--theme-divider'));
                clonedRoot.style.setProperty('--button-text-on-accent', getCssVarCloned('--button-text-on-accent'));
                clonedRoot.style.setProperty('--ui-border-default', getCssVarCloned('--ui-border-default'));
                clonedRoot.style.setProperty('--hover-bg-color', 'transparent'); // Force transparent for image export
                clonedRoot.style.setProperty('--theme-tag-hover-bg', getCssVarCloned('--theme-tag-hover-bg'));

                clonedDoc.body.style.backgroundColor = getCssVarCloned('--theme-bg-page');
                clonedDoc.body.style.paddingTop = '0px';

                const clonedProfileContainer = clonedDoc.getElementById('profileCardContainer');
                if (clonedProfileContainer) {
                    clonedProfileContainer.style.paddingTop = getComputedStyle(profileCardContainer).paddingTop;
                    clonedProfileContainer.style.paddingBottom = getComputedStyle(profileCardContainer).paddingBottom;
                    clonedProfileContainer.style.paddingLeft = getComputedStyle(profileCardContainer).paddingLeft;
                    clonedProfileContainer.style.paddingRight = getComputedStyle(profileCardContainer).paddingRight;
                    clonedProfileContainer.style.marginTop = '0px';
                }

                clonedDoc.querySelectorAll(elementsToHideSelectors).forEach(el => el.remove());
                clonedDoc.querySelectorAll('[contenteditable="true"]').forEach(el => el.setAttribute('contenteditable', 'false'));
                clonedDoc.querySelectorAll('[style*="-webkit-user-modify"]').forEach(el => el.style.removeProperty('-webkit-user-modify'));
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
            // Restore original styles
            originalDisplayStyles.forEach(({ element, display }) => element.style.display = display);
            originalOutlines.forEach(({ element, outline }) => element.style.outline = outline);
            originalContenteditables.forEach(({ element, contenteditable, userModify }) => {
                element.setAttribute('contenteditable', contenteditable);
                if (userModify) element.style.webkitUserModify = userModify;
            });

            document.body.style.paddingTop = originalPageStyles.paddingTop;
            document.body.style.backgroundColor = originalPageStyles.backgroundColor;
            profileCardContainer.style.marginTop = originalPageStyles.profileContainerMarginTop;
        });
    });

    resetButton.addEventListener('click', resetToDefault);

    // --- INITIALIZATION ---
    applyThemeColors();
    render();

    // Console art
    window.onload = function () {
        const art = `

 ▄████▄   ██░ ██  ██▓▒███████▒ █    ██  ██ ▄█▀ █    ██  ▒█████  
▒██▀ ▀█  ▓██░ ██▒▓██▒▒ ▒ ▒ ▄▀░ ██  ▓██▒ ██▄█▒  ██  ▓██▒▒██▒  ██▒
▒▓█    ▄ ▒██▀▀██░▒██▒░ ▒ ▄▀▒░ ▓██  ▒██░▓███▄░ ▓██  ▒██░▒██░  ██▒
▒▓▓▄ ▄██▒░▓█ ░██ ░██░  ▄▀▒   ░▓▓█  ░██░▓██ █▄ ▓▓█  ░██░▒██   ██░
▒ ▓███▀ ░░▓█▒░██▓░██░▒███████▒▒▒█████▓ ▒██▒ █▄▒▒█████▓ ░ ████▓▒░
░ ░▒ ▒  ░ ▒ ░░▒░▒░▓  ░▒▒ ▓░▒░▒░▒▓▒ ▒ ▒ ▒ ▒▒ ▓▒░▒▓▒ ▒ ▒ ░ ▒░▒░▒░ 
  ░  ▒    ▒ ░▒░ ░ ▒ ░░░▒ ▒ ░ ▒░░▒░ ░ ░ ░ ░▒ ▒░░░▒░ ░ ░   ░ ▒ ▒░ 
░         ░  ░░ ░ ▒ ░░ ░ ░ ░ ░ ░░░ ░ ░ ░ ░░ ░  ░░░ ░ ░ ░ ░ ░ ▒  
░ ░       ░  ░  ░ ░    ░ ░       ░     ░  ░      ░         ░ ░  
░                    ░                                        

            芝士扩列条编辑器V1.0
            chizukuo@icloud.com

                                                
`;
        console.log('%c' + art, 'color: #00ff99; font-weight: bold; font-size: 11px;');
    };
});