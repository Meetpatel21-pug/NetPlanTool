import React, { useState, useRef, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';

export interface ClaySelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

export interface ClaySelectProps {
  value: string;
  onChange: (value: string) => void;
  options: ClaySelectOption[];
  placeholder?: string;
  id?: string;
  name?: string;
  ariaLabel?: string;
  variant?: 'filter' | 'form';
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  dropdownStyle?: React.CSSProperties;
}

export const ClaySelect: React.FC<ClaySelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  id,
  name,
  ariaLabel,
  variant = 'form',
  icon,
  disabled = false,
  className = '',
  style,
  dropdownStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Adjust highlight index when opened
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, value, options]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listboxRef.current && highlightedIndex >= 0) {
      const items = listboxRef.current.querySelectorAll('[role="option"]');
      if (items[highlightedIndex]) {
        (items[highlightedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex].value);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const isFilter = variant === 'filter';

  return (
    <div
      ref={wrapperRef}
      className={`clay-select-wrapper ${isFilter ? 'clay-select-filter' : 'clay-select-form'} ${className}`}
      style={{
        position: 'relative',
        display: isFilter ? 'inline-block' : 'block',
        width: isFilter ? 'auto' : '100%',
        minWidth: 0,
        maxWidth: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* Hidden Native Select for Browser Forms & Accessibility */}
      <select
        id={selectId}
        name={name}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: 0,
          height: 0,
          margin: 0,
          padding: 0,
          zIndex: -1,
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Styled Interactive Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={`${selectId}-button`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`clay-select-trigger ${isFilter ? 'filter-trigger' : 'form-trigger'} ${isOpen ? 'active' : ''}`}
        style={{
          width: '100%',
          minWidth: 0,
          maxWidth: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
          {icon && <span className="clay-select-icon">{icon}</span>}
          {selectedOption ? (
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
              <span style={{ fontWeight: isFilter ? 600 : 500, color: 'var(--text-white)' }}>
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && !isFilter && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>
                  ({selectedOption.sublabel})
                </span>
              )}
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>
          )}
        </div>

        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-secondary)', flexShrink: 0 }}
        >
          <ChevronDown className={isFilter ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        </motion.span>
      </button>

      {/* Custom Claymorphic Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={listboxRef}
            role="listbox"
            id={`${selectId}-listbox`}
            aria-activedescendant={
              highlightedIndex >= 0 && highlightedIndex < options.length
                ? `${selectId}-option-${highlightedIndex}`
                : undefined
            }
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="clay-select-dropdown"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              zIndex: 9999,
              minWidth: isFilter ? '200px' : '100%',
              width: isFilter ? 'max-content' : '100%',
              maxHeight: '260px',
              overflowY: 'auto',
              background: '#f8f4fc',
              border: '2px solid rgba(255, 255, 255, 0.95)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 16px 36px rgba(90, 60, 140, 0.22), 0 4px 12px rgba(0, 0, 0, 0.08)',
              padding: '0.35rem',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              ...dropdownStyle,
            }}
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={opt.value}
                  id={`${selectId}-option-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`clay-select-option ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: isFilter ? '0.45rem 0.75rem' : '0.55rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: isFilter ? '0.825rem' : '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    background: isSelected
                      ? 'rgba(155, 109, 255, 0.18)'
                      : isHighlighted
                      ? 'rgba(155, 109, 255, 0.08)'
                      : 'transparent',
                    color: isSelected ? 'var(--accent-indigo)' : 'var(--text-white)',
                    fontWeight: isSelected ? 700 : 500,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    {opt.icon && <span style={{ flexShrink: 0 }}>{opt.icon}</span>}
                    <div>
                      <span>{opt.label}</span>
                      {opt.sublabel && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: isSelected ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                            marginLeft: '0.4rem',
                            opacity: 0.85,
                          }}
                        >
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      style={{ color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}
                    >
                      <Check className="w-4 h-4 text-purple-600" />
                    </motion.span>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
