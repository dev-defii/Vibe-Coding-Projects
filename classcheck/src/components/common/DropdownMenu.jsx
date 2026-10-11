import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * A dropdown menu rendered in a portal so it is never clipped by ancestor
 * containers that use `overflow: hidden` (e.g. `.card`).
 *
 * @param {{ triggerRef: React.RefObject<HTMLElement>, isOpen: boolean, onClose: () => void, align?: 'right' | 'left', minWidth?: number, children: React.ReactNode }} props
 */
export default function DropdownMenu({
  triggerRef,
  isOpen,
  onClose,
  align = 'right',
  minWidth = 200,
  children,
}) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Keep the menu aligned with the trigger button on resize/scroll
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const update = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      const left = align === 'right' ? rect.right : rect.left;
      setPosition({ top: rect.bottom + 6, left });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen, triggerRef, align]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      onClose();
    };

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const transform = align === 'right' ? 'translateX(-100%)' : 'translateX(0)';

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform,
        backgroundColor: 'var(--white)',
        border: '1px solid var(--slate-200)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        minWidth: `${minWidth}px`,
        zIndex: 1000,
        padding: '6px',
      }}
    >
      {children}
    </div>,
    document.body
  );
}