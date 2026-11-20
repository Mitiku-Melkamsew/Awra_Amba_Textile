import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  matchesAllWords,
  searchHaystack,
  searchWords,
} from "../../utils/searchMatch";

export interface SearchOption {
  id: string | number;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: { bg: string; text: string };
  disabled?: boolean;
}

export interface SearchableSelectProps {
  value: string | number | null | undefined;
  onChange: (value: string, option?: SearchOption) => void;
  options: SearchOption[];
  placeholder?: string;
  onAddNew?: (query: string) => void;
  addNewLabel?: string;
  disabled?: boolean;
  required?: boolean;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  maxResults?: number;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Search or select…",
  onAddNew,
  addNewLabel = "Add new",
  disabled = false,
  required = false,
  style,
  inputStyle,
  maxResults = 25,
}: SearchableSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(() => {
    if (value === undefined || value === null || value === "") return null;
    return options.find((opt) => String(opt.id) === String(value)) ?? null;
  }, [value, options]);

  const selectedLabel = selectedOption ? selectedOption.title : "";

  const [query, setQuery] = useState(selectedLabel);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Sync display text when value changes from outside while not actively typing
  useEffect(() => {
    if (!isTyping) {
      setQuery(selectedLabel);
    }
  }, [selectedLabel, isTyping]);

  // Index options for multi-word search
  const indexed = useMemo(() => {
    return options.map((opt) => {
      const haystack = searchHaystack(
        `${opt.title} ${opt.subtitle || ""} ${opt.badge || ""}`,
      );
      return {
        option: opt,
        idStr: String(opt.id),
        haystack,
      };
    });
  }, [options]);

  const words = useMemo(() => {
    if (!isTyping || query === selectedLabel) return [];
    return searchWords(query);
  }, [query, isTyping, selectedLabel]);

  const filteredResults = useMemo(() => {
    if (words.length === 0) {
      return indexed.slice(0, maxResults);
    }
    return indexed
      .filter((x) => matchesAllWords(x.haystack, words))
      .slice(0, maxResults);
  }, [indexed, words, maxResults]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
        setIsTyping(false);
        setQuery(selectedLabel);
      }
    }
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [selectedLabel]);

  const handleSelect = (opt: SearchOption) => {
    if (opt.disabled) return;
    onChange(String(opt.id), opt);
    setQuery(opt.title);
    setIsTyping(false);
    setDropdownOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setQuery("");
    setIsTyping(true);
    setDropdownOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        boxSizing: "border-box",
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          width: "100%",
        }}
      >
        {/* Search icon */}
        <span
          style={{
            position: "absolute",
            left: "10px",
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>

        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsTyping(true);
            setDropdownOpen(true);
          }}
          onFocus={(e) => {
            if (!disabled) {
              setDropdownOpen(true);
              e.target.select();
            }
          }}
          style={{
            width: "100%",
            padding: "0.55rem 1.8rem 0.55rem 2.1rem",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            fontSize: "13.5px",
            background: disabled ? "#f8fafc" : "#ffffff",
            boxSizing: "border-box",
            textOverflow: "ellipsis",
            outline: "none",
            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            ...inputStyle,
          }}
        />

        {/* Clear button */}
        {(query || value) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            title="Clear selection"
            style={{
              position: "absolute",
              right: "8px",
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "13px",
              padding: "2px 4px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Hidden input for HTML form validation if required */}
      {required && (
        <input
          type="text"
          style={{
            opacity: 0,
            width: 0,
            height: 0,
            position: "absolute",
            pointerEvents: "none",
          }}
          value={value ? String(value) : ""}
          onChange={() => {}}
          required
        />
      )}

      {/* Dropdown Menu */}
      {dropdownOpen && !disabled && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 9999,
            marginTop: "4px",
            background: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            maxHeight: "260px",
            overflowY: "auto",
          }}
        >
          {filteredResults.length === 0 ? (
            <div style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
              <div
                style={{
                  fontSize: "12.5px",
                  color: "#64748b",
                  marginBottom: onAddNew ? "0.6rem" : "0",
                }}
              >
                No matching results for &quot;{query}&quot;
              </div>
              {onAddNew && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setDropdownOpen(false);
                    onAddNew(query);
                  }}
                  style={{
                    background: "#c2410c",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "6px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + {addNewLabel} &quot;{query}&quot;
                </button>
              )}
            </div>
          ) : (
            <div>
              {filteredResults.map(({ option, idStr }) => {
                const isSelected = String(value) === idStr;
                return (
                  <div
                    key={idStr}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(option);
                    }}
                    style={{
                      padding: "0.55rem 0.85rem",
                      cursor: option.disabled ? "not-allowed" : "pointer",
                      opacity: option.disabled ? 0.6 : 1,
                      borderBottom: "1px solid #f1f5f9",
                      background: isSelected ? "#fff7ed" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!option.disabled && !isSelected) {
                        e.currentTarget.style.background = "#f8fafc";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!option.disabled && !isSelected) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1, marginRight: "0.5rem" }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: isSelected ? 700 : 600,
                          color: isSelected ? "#c2410c" : "#0f172a",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {option.title}
                      </div>
                      {option.subtitle && (
                        <div
                          style={{
                            fontSize: "11.5px",
                            color: "#64748b",
                            marginTop: "1px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {option.subtitle}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      {option.badge && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "0.15rem 0.45rem",
                            borderRadius: "4px",
                            background: option.badgeColor?.bg || "#f1f5f9",
                            color: option.badgeColor?.text || "#475569",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {option.badge}
                        </span>
                      )}
                      {isSelected && (
                        <span style={{ color: "#c2410c", fontWeight: 700, fontSize: "14px" }}>
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Bottom quick-add action if onAddNew is available */}
              {onAddNew && (
                <div
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setDropdownOpen(false);
                    onAddNew(query);
                  }}
                  style={{
                    padding: "0.6rem 0.85rem",
                    borderTop: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#c2410c",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fff7ed")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}
                >
                  <span>+</span> {addNewLabel}…
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
