import React from 'react';

interface ActionButtonProps {
  icon: React.ReactNode;
  title: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'default' | 'delete';
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, title, onClick, variant = 'default', className = '', onMouseEnter, onMouseLeave }) => {
  const buttonClass = `action-button ${variant === 'delete' ? 'delete-action-btn' : ''} ${className}`;
  
  const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick(e);
  }

  return (
    <button className={buttonClass} title={title} onClick={handleClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {icon}
    </button>
  );
};

export default ActionButton;