import { useMemo, useState } from "react";
import { matchesAllWords, searchHaystack, searchWords } from "../utils/searchMatch";

interface VariantSearchProps<T> {
  label: string;
  items: T[];
  getId: (item: T) => string;
  /** The readable name shown to the person. */
  getLabel: (item: T) => string;
  /** Extra text that can be typed to find an item but is never displayed (e.g. the SKU). */
  getSearchText?: (item: T) => string;
  /** Id of the chosen item, or "" when nothing is chosen. */
  selectedId: string;
  onSelect: (item: T) => void;
  onClear: () => void;
  placeholder?: string;
  maxResults?: number;
}

/**
 * Type-ahead search over existing variants. Every word typed must appear somewhere in the
 * name (any order), so "biret geberdin" finds "medebegna-biret-geberdin".
 */
export function VariantSearch<T>({
  label,
  items,
  getId,
  getLabel,
  getSearchText,
  selectedId,
  onSelect,
  onClear,
  placeholder,
  maxResults = 8,
}: VariantSearchProps<T>) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const indexed = useMemo(
    () => items.map((item) => ({ item, haystack: searchHaystack(`${getLabel(item)} ${getSearchText?.(item) ?? ""}`) })),
    [items, getLabel, getSearchText],
  );

  const words = searchWords(query);
  const results =
    words.length === 0
      ? []
      : indexed.filter((entry) => matchesAllWords(entry.haystack, words)).slice(0, maxResults);

  const selected = selectedId ? items.find((item) => getId(item) === selectedId) : undefined;

  function choose(item: T) {
    onSelect(item);
    setQuery("");
    setOpen(false);
    setActive(0);
  }

  if (selected) {
    return (
      <div className="variant-search">
        <span className="variant-search-label">{label}</span>
        <div className="variant-search-selected">
          <strong>{getLabel(selected)}</strong>
          <button type="button" className="btn-link" onClick={onClear}>
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="variant-search">
      <label>
        {label}
        <input
          type="search"
          value={query}
          placeholder={placeholder ?? "Type a name…"}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && results.length > 0}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && results.length > 0) {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && open && results[active]) {
              e.preventDefault(); // do not submit the surrounding form
              choose(results[active].item);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
      </label>

      {open && words.length > 0 && (
        <ul className="variant-search-list" role="listbox">
          {results.length === 0 ? (
            <li className="variant-search-empty">No match. Fill in the details below instead.</li>
          ) : (
            results.map((entry, index) => (
              <li
                key={getId(entry.item)}
                role="option"
                aria-selected={index === active}
                className={index === active ? "variant-search-option active" : "variant-search-option"}
                // mousedown (not click) so the choice lands before the input loses focus
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(entry.item);
                }}
                onMouseEnter={() => setActive(index)}
              >
                {getLabel(entry.item)}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
