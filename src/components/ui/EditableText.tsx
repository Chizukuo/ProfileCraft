import React, { useState, useRef, useEffect, useCallback, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Styles } from '../../types/data';
import { Bold, Italic, Underline, Strikethrough } from 'lucide-react';

interface EditableTextProps {
    as?: keyof JSX.IntrinsicElements;
    className?: string;
    html: string;
    styles?: Styles;
    onUpdate: (html: string) => void;
    // onStyleUpdate 已不再需要，因为可编辑样式功能被移除
    onStyleUpdate?: (styles: Styles) => void;
}

// 内部组件：格式化工具栏
// **重构**: 移除了字号和字体功能
const FormattingToolbar: React.FC<{
    position: { top: number; left: number };
    activeFormats: { [key: string]: boolean };
    onFormat: (command: string) => void;
}> = ({ position, activeFormats, onFormat }) => {
    
    return createPortal(
        <div
            className="rich-text-toolbar is-visible"
            style={{ top: position.top, left: position.left }}
            onMouseDown={(e) => e.preventDefault()} // 防止在工具栏点击时编辑器失去焦点
        >
            <button className={activeFormats.bold ? 'is-active' : ''} onClick={() => onFormat('bold')} title="加粗"><Bold size={16} /></button>
            <button className={activeFormats.italic ? 'is-active' : ''} onClick={() => onFormat('italic')} title="斜体"><Italic size={16} /></button>
            <button className={activeFormats.underline ? 'is-active' : ''} onClick={() => onFormat('underline')} title="下划线"><Underline size={16} /></button>
            <button className={activeFormats.strikethrough ? 'is-active' : ''} onClick={() => onFormat('strikethrough')} title="删除线"><Strikethrough size={16} /></button>
        </div>,
        document.body
    );
};


// 主组件：可编辑文本
const EditableText: React.FC<EditableTextProps> = ({ as: Component = 'div', className, html, styles, onUpdate, onStyleUpdate }) => {
    const textRef = useRef<HTMLElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [toolbarState, setToolbarState] = useState<{
        show: boolean;
        position: { top: number; left: number };
        activeFormats: { [key: string]: boolean };
    }>({ show: false, position: { top: 0, left: 0 }, activeFormats: {} });

    // 当外部 html prop 更改时同步 DOM（仅在未聚焦时以避免覆盖用户输入）
    useEffect(() => {
        if (textRef.current && html !== textRef.current.innerHTML && !isFocused) {
            textRef.current.innerHTML = html;
        }
    }, [html, isFocused]);

    // **重构**: 直接在渲染时计算样式对象。
    // 虽然编辑功能被移除，但现有的样式（如默认样式）仍会应用。
    const computedStyles: CSSProperties = {};
    if (styles) {
        if (styles.fontWeight) computedStyles.fontWeight = styles.fontWeight;
        if (styles.fontSize) computedStyles.fontSize = `${styles.fontSize}px`;
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
        
        const toolbarWidth = 150; // 工具栏宽度现在变小了
        const top = effectiveRect.top + window.scrollY - 55;
        const left = effectiveRect.left + window.scrollX + (effectiveRect.width / 2) - (toolbarWidth / 2);

        setToolbarState({
            show: true,
            position: { top: Math.max(10, top), left: Math.max(10, left) },
            activeFormats: {
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
                strikethrough: document.queryCommandState('strikethrough'),
            },
        });
    }, [isFocused, toolbarState.show]);

    const handleFocus = () => {
        setIsFocused(true);
        setTimeout(updateToolbarPositionAndState, 10);
    };
    
    const handleBlur = () => {
        setTimeout(() => {
            if (!document.activeElement?.closest('.rich-text-toolbar')) {
                setIsFocused(false);
                setToolbarState(prev => ({ ...prev, show: false }));
                if (textRef.current) {
                    const newHtml = textRef.current.innerHTML;
                    if (newHtml !== html) {
                        onUpdate(newHtml);
                    }
                }
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

    const handleFormat = (command: string) => {
        document.execCommand(command, false, undefined);
        textRef.current?.focus(); 
        updateToolbarPositionAndState();
    };
    
    return (
        <>
            <Component
                ref={textRef as any}
                className={`${className || ''} ${isFocused ? 'is-focused' : ''}`.trim()}
                style={computedStyles} // 直接应用计算好的样式
                dangerouslySetInnerHTML={{ __html: html }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                contentEditable={true}
                suppressContentEditableWarning={true}
                onMouseUp={updateToolbarPositionAndState}
                onKeyUp={updateToolbarPositionAndState}
            />
            {toolbarState.show && (
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
