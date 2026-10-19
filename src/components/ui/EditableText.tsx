import React, { useState, useRef, useEffect, useCallback, CSSProperties, ElementType } from 'react';
import { createPortal } from 'react-dom';
import DOMPurify from 'dompurify';
import { Styles } from '../../types/data';
import { Bold, Italic, Underline, Strikethrough, RemoveFormatting } from 'lucide-react';
import { TEXT_COLORS, TextColor, clearFormatting, getActiveRichFormats, toggleBigText, toggleTextColor } from '../../utils/richText';
import { useTranslation } from '../../hooks/useTranslation';
import { useEditorUI } from '../../context/EditorUIContext';

// 输入停顿多久后把内容同步到数据层（之后再经 500ms 防抖写入 localStorage）
const INPUT_COMMIT_DELAY_MS = 400;

interface EditableTextProps {
    as?: ElementType;
    className?: string;
    html: string;
    styles?: Styles;
    onUpdate: (html: string) => void;
    onStyleUpdate?: (styles: Styles) => void;
}

type ToolbarAction = 'bold' | 'italic' | 'underline' | 'strikethrough' | 'big' | 'clear' | `color:${TextColor}`;

interface ActiveFormats {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    big?: boolean;
    color?: TextColor;
}

// 内部组件：格式化工具栏（选中文字时出现）：加粗 / 斜体 / 下划线 / 删除线 | 大字 | 五种颜色 | 清除格式
const TOOLBAR_WIDTH = 420;
const FormattingToolbar: React.FC<{
    position: { top: number; left: number };
    activeFormats: ActiveFormats;
    onFormat: (action: ToolbarAction) => void;
}> = ({ position, activeFormats, onFormat }) => {
    const { t } = useTranslation();
    const btn = (action: ToolbarAction, active: boolean | undefined, title: string, icon: React.ReactNode) => (
        <button type="button" className={active ? 'is-active' : ''} onClick={() => onFormat(action)} title={title} aria-pressed={Boolean(active)}>{icon}</button>
    );

    return createPortal(
        <div
            className="rich-text-toolbar is-visible"
            style={{ top: position.top, left: position.left }}
            onMouseDown={(e) => e.preventDefault()} // 防止在工具栏点击时编辑器失去焦点
        >
            {btn('bold', activeFormats.bold, t('editor.bold'), <Bold size={16} />)}
            {btn('italic', activeFormats.italic, t('editor.italic'), <Italic size={16} />)}
            {btn('underline', activeFormats.underline, t('editor.underline'), <Underline size={16} />)}
            {btn('strikethrough', activeFormats.strikethrough, t('editor.strikethrough'), <Strikethrough size={16} />)}
            <span className="toolbar-separator" />
            {btn('big', activeFormats.big, t('editor.big'), <span className="toolbar-big-icon">A+</span>)}
            <span className="toolbar-separator" />
            {TEXT_COLORS.map((color) => (
                <button
                    type="button"
                    key={color}
                    className={`toolbar-color pc-swatch-${color}${activeFormats.color === color ? ' is-active' : ''}`}
                    onClick={() => onFormat(`color:${color}`)}
                    title={t(`editor.color.${color}`)}
                    aria-pressed={activeFormats.color === color}
                />
            ))}
            <span className="toolbar-separator" />
            {btn('clear', false, t('editor.clearFormat'), <RemoveFormatting size={16} />)}
        </div>,
        document.body
    );
};


// 主组件：可编辑文本
const EditableText: React.FC<EditableTextProps> = ({ as: Component = 'div', className, html, styles, onUpdate }) => {
    const textRef = useRef<HTMLElement>(null);
    const { isPreview } = useEditorUI();
    const [isFocused, setIsFocused] = useState(false);
    const commitTimerRef = useRef<number | null>(null);
    // 总是用最新的 html / onUpdate，避免延迟提交时拿到旧闭包（例如卡片索引已变化）
    const latestRef = useRef({ html, onUpdate });
    latestRef.current = { html, onUpdate };

    const commit = useCallback(() => {
        if (commitTimerRef.current !== null) {
            window.clearTimeout(commitTimerRef.current);
            commitTimerRef.current = null;
        }
        if (!textRef.current) return;
        const newHtml = textRef.current.innerHTML;
        if (newHtml !== latestRef.current.html) {
            latestRef.current.onUpdate(newHtml);
        }
    }, []);

    const handleInput = () => {
        if (commitTimerRef.current !== null) window.clearTimeout(commitTimerRef.current);
        commitTimerRef.current = window.setTimeout(commit, INPUT_COMMIT_DELAY_MS);
    };

    // 卸载前提交尚未同步的输入
    useEffect(() => () => {
        if (commitTimerRef.current !== null) commit();
    }, [commit]);
    const [toolbarState, setToolbarState] = useState<{
        show: boolean;
        position: { top: number; left: number };
        activeFormats: ActiveFormats;
    }>({ show: false, position: { top: 0, left: 0 }, activeFormats: {} });

    // 当外部 html prop 更改时同步 DOM（仅在未聚焦时以避免覆盖用户输入）
    useEffect(() => {
        if (textRef.current && html !== textRef.current.innerHTML && !isFocused) {
            textRef.current.innerHTML = DOMPurify.sanitize(html, { ADD_TAGS: ['br'] });
        }
    }, [html, isFocused]);

    // **重构**: 直接在渲染时计算样式对象。
    // 虽然编辑功能被移除，但现有的样式（如默认样式）仍会应用。
    const computedStyles: CSSProperties = {};
    if (styles) {
        if (styles.fontWeight) computedStyles.fontWeight = styles.fontWeight;
        // --pc-font-scale 来自外观设置里的“字号缩放”
        if (styles.fontSize) computedStyles.fontSize = `calc(${styles.fontSize}px * var(--pc-font-scale, 1))`;
        if (styles.fontFamily) computedStyles.fontFamily = styles.fontFamily;
    }

    const updateToolbarPositionAndState = useCallback(() => {
        const selection = window.getSelection();
        if (!isFocused || !selection || selection.rangeCount === 0 || !textRef.current || !textRef.current.contains(selection.anchorNode)) {
            if (toolbarState.show) setToolbarState(prev => ({ ...prev, show: false }));
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const effectiveRect = (rect.width === 0 && rect.height === 0) ? textRef.current.getBoundingClientRect() : rect;
        
        const width = Math.min(TOOLBAR_WIDTH, document.documentElement.clientWidth - 20);
        const toolbarHeight = width < TOOLBAR_WIDTH ? 90 : 55;
        const top = effectiveRect.top >= toolbarHeight + 10
            ? effectiveRect.top + window.scrollY - toolbarHeight
            : effectiveRect.bottom + window.scrollY + 8;
        const left = effectiveRect.left + window.scrollX + (effectiveRect.width / 2) - (width / 2);
        const maxLeft = window.scrollX + document.documentElement.clientWidth - width - 10;
        const rich = getActiveRichFormats(textRef.current);

        setToolbarState({
            show: true,
            position: { top: Math.max(10, top), left: Math.max(10, Math.min(left, maxLeft)) },
            activeFormats: {
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
                strikethrough: document.queryCommandState('strikethrough'),
                big: rich.big,
                color: rich.color,
            },
        });
    }, [isFocused, toolbarState.show]);

    const handleFocus = () => {
        setIsFocused(true);
        setTimeout(updateToolbarPositionAndState, 10);
    };
    
    const handleBlur = () => {
        commit();
        setTimeout(() => {
            if (!document.activeElement?.closest('.rich-text-toolbar')) {
                setIsFocused(false);
                setToolbarState(prev => ({ ...prev, show: false }));
            }
        }, 200);
    };

    useEffect(() => {
        const handleInteraction = () => {
            if (isFocused) {
                updateToolbarPositionAndState();
            }
        };
        document.addEventListener('selectionchange', handleInteraction);
        window.addEventListener('scroll', handleInteraction, true);

        return () => {
            document.removeEventListener('selectionchange', handleInteraction);
            window.removeEventListener('scroll', handleInteraction, true);
        };
    }, [isFocused, updateToolbarPositionAndState]);

    const handleFormat = (action: ToolbarAction) => {
        const root = textRef.current;
        if (!root) return;
        if (action === 'big') toggleBigText(root);
        else if (action === 'clear') clearFormatting(root);
        else if (action.startsWith('color:')) toggleTextColor(root, action.slice(6) as TextColor);
        else document.execCommand(action, false, undefined);
        root.focus();
        updateToolbarPositionAndState();
        handleInput();
    };
    
    return (
        <>
            <Component
                ref={textRef as any}
                className={`${className || ''} ${isFocused ? 'is-focused' : ''}`.trim()}
                style={computedStyles} // 直接应用计算好的样式
                onFocus={handleFocus}
                onBlur={handleBlur}
                onInput={handleInput}
                // 预览模式下只读，和导出效果一致
                contentEditable={!isPreview}
                suppressContentEditableWarning={true}
                onMouseUp={updateToolbarPositionAndState}
                onKeyUp={updateToolbarPositionAndState}
            />
            {toolbarState.show && !isPreview && (
                <FormattingToolbar
                    position={toolbarState.position}
                    activeFormats={toolbarState.activeFormats}
                    onFormat={handleFormat}
                />
            )}
        </>
    );
};

export default EditableText;
