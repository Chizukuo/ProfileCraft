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
            <p className={`confirm-dialog-message ${isDangerous ? 'is-dangerous' : ''}`}>
                {message}
            </p>
            <div className="modal-actions">
                <button className="modal-button-secondary" onClick={onClose}>
                    {cancelText}
                </button>
                <button 
                    className={`modal-button-primary ${isDangerous ? 'modal-button-danger' : ''}`}
                    onClick={handleConfirm}
                >
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
