import { useMemo, useState } from 'react';

export const useDeleteHoverState = () => {
  const [isDeleteHovered, setIsDeleteHovered] = useState(false);
  const [isContainerHovered, setIsContainerHovered] = useState(false);

  const containerHoverHandlers = useMemo(() => ({
    onMouseEnter: () => setIsContainerHovered(true),
    onMouseLeave: () => setIsContainerHovered(false),
  }), []);

  const deleteHoverHandlers = useMemo(() => ({
    onMouseEnter: () => setIsDeleteHovered(true),
    onMouseLeave: () => setIsDeleteHovered(false),
  }), []);

  return {
    isDeleteHovered,
    isContainerHovered,
    containerHoverHandlers,
    deleteHoverHandlers,
  };
};
