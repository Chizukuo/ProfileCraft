import React from 'react';
import Modal from './Modal';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
}

/**
 * 确认对话框组件
 * 用于替代原生的 window.confirm()
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = '确认',
    cancelText = '取消',
    isDangerous = false
}) => {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <p style={{ 
                color: isDangerous ? 'var(--delete-red)' : 'var(--ui-text-secondary)',
                fontSize: '1rem',
                lineHeight: '1.6',
                margin: 0
            }}>
                {message}
            </p>
            <div className="modal-actions">
                <button className="modal-button-secondary" onClick={onClose}>
                    {cancelText}
                </button>
                <button 
                    className="modal-button-primary" 
                    onClick={handleConfirm}
                    style={isDangerous ? {
                        backgroundColor: 'var(--delete-red)',
                        borderColor: 'var(--delete-red)'
                    } : undefined}
                >
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
