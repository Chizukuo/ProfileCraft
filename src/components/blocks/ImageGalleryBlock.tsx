import React, { useRef, useState } from 'react';
import { GalleryImage, ImageGalleryElement } from '../../types/data';
import EditableText from '../ui/EditableText';
import { X, ImagePlus, Type, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useElementActions } from '../../hooks/useElementActions';
import { compressImage, IMAGE_PRESETS } from '../../utils/image';
import { showNotification } from '../../utils/notify';
import BlockShell, { BlockProps } from './BlockShell';
import { AddButton, SegmentedControl, SettingRow, SwitchControl, ToolButton } from '../ui/EditorControls';

const COLUMN_OPTIONS = [1, 2, 3, 4];
const stripTags = (html?: string) => html?.replace(/<[^>]*>/g, '') || '';

const ImageGalleryBlock: React.FC<BlockProps<ImageGalleryElement>> = ({ element, cardIndex, elementIndex, ...shell }) => {
    const { update, updateWithUndo } = useElementActions<ImageGalleryElement>(cardIndex, elementIndex);
    const { t } = useTranslation();
    const addInputRef = useRef<HTMLInputElement>(null);
    const replaceInputRef = useRef<HTMLInputElement>(null);
    const replaceIndexRef = useRef<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const updateImages = (fn: (images: GalleryImage[]) => GalleryImage[]) => update(el => ({ images: fn(el.images) }));

    const readFiles = async (files: File[]) => {
        setIsUploading(true);
        try {
            const result: string[] = [];
            for (const file of files) result.push(await compressImage(file, IMAGE_PRESETS.gallery));
            return result;
        } catch (error) {
            console.error('Image upload failed:', error);
            showNotification(t('notification.imageError'), 'error');
            return [];
        } finally {
            setIsUploading(false);
        }
    };

    const handleAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = '';
        if (!files.length) return;
        const srcs = await readFiles(files);
        if (srcs.length) updateImages(images => [...images, ...srcs.map(src => ({ src }))]);
    };

    // 点击图片 = 更换图片，与头像、二维码一致
    const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const index = replaceIndexRef.current;
        e.target.value = '';
        if (!file || index === null) return;
        const [src] = await readFiles([file]);
        if (src) updateImages(images => images.map((img, i) => (i === index ? { ...img, src } : img)));
    };

    const moveImage = (index: number, delta: -1 | 1) => {
        updateImages(images => {
            const target = index + delta;
            if (target < 0 || target >= images.length) return images;
            const next = [...images];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    };

    const toggleCaption = (index: number) => updateImages(images => images.map((img, i) => {
        if (i !== index) return img;
        if (img.caption === undefined) return { ...img, caption: t('block.captionPlaceholder') };
        const withoutCaption = { ...img };
        delete withoutCaption.caption;
        return withoutCaption;
    }));

    return (
        <BlockShell
            title={t('blockTypes.imageGallery')}
            className={`image-gallery-block${element.images.length ? '' : ' is-empty-gallery'}`}
            {...shell}
            settings={() => (
                <>
                    <SettingRow label={t('block.columns')}>
                        <SegmentedControl value={element.columns} options={COLUMN_OPTIONS.map(n => ({ value: n, label: n }))} onChange={(columns) => update({ columns })} />
                    </SettingRow>
                    <SettingRow label={t('block.cropSquare')}>
                        <SwitchControl label={t('block.cropSquare')} checked={Boolean(element.crop)} onChange={(crop) => update({ crop })} />
                    </SettingRow>
                </>
            )}
        >
            <div className={`image-gallery ${element.crop ? 'is-cropped' : ''}`} style={{ '--gallery-cols': element.columns } as React.CSSProperties}>
                {element.images.map((image, index) => (
                    <figure className="gallery-item pc-item" key={`${index}-${image.src.length}`}>
                        <button
                            type="button"
                            className="gallery-image-btn pc-replaceable"
                            aria-label={t('block.replaceImage')}
                            onClick={() => {
                                replaceIndexRef.current = index;
                                replaceInputRef.current?.click();
                            }}
                        >
                            {element.crop ? (
                                // 裁切用背景图实现：html2canvas 不支持 object-fit，导出 PNG 时 <img> 会被拉伸
                                <div className="gallery-thumb" role="img" aria-label={stripTags(image.caption)} style={{ backgroundImage: `url("${image.src}")` }} />
                            ) : (
                                <img src={image.src} alt={stripTags(image.caption)} loading="lazy" />
                            )}
                        </button>
                        {image.caption !== undefined && (
                            <EditableText
                                as="figcaption"
                                className="gallery-caption"
                                html={image.caption}
                                onUpdate={(html) => updateImages(images => images.map((img, i) => (i === index ? { ...img, caption: html } : img)))}
                            />
                        )}
                        <div className="gallery-item-actions pc-item-delete editor-only">
                            <ToolButton size="sm" icon={<ChevronLeft size={12} />} title={t('block.moveLeft')} disabled={index === 0} onClick={() => moveImage(index, -1)} />
                            <ToolButton size="sm" icon={<ChevronRight size={12} />} title={t('block.moveRight')} disabled={index === element.images.length - 1} onClick={() => moveImage(index, 1)} />
                            <ToolButton size="sm" icon={<Type size={12} />} active={image.caption !== undefined} title={image.caption !== undefined ? t('block.removeCaption') : t('block.addCaption')} onClick={() => toggleCaption(index)} />
                            <ToolButton
                                size="sm"
                                danger
                                icon={<X size={12} />}
                                title={t('block.deleteImage')}
                                onClick={() => updateWithUndo(el => ({ images: el.images.filter((_, i) => i !== index) }), 'deleteImage')}
                            />
                        </div>
                    </figure>
                ))}

                <AddButton
                    variant="tile"
                    icon={<ImagePlus size={20} />}
                    label={isUploading ? t('block.uploading') : t('block.addImages')}
                    disabled={isUploading}
                    onClick={() => addInputRef.current?.click()}
                />
            </div>
            <input ref={addInputRef} type="file" accept="image/*" multiple className="hidden-file-input" onChange={handleAdd} />
            <input ref={replaceInputRef} type="file" accept="image/*" className="hidden-file-input" onChange={handleReplace} />
        </BlockShell>
    );
};

export default ImageGalleryBlock;
