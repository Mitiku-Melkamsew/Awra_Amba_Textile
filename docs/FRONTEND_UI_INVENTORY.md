# Frontend UI Inventory & Baseline Audit

**Project:** Awra Amba Textile (web frontend)  
**Date:** November 2026  
**Status:** Baseline Established (Phase 0 Complete)

---

## 1. Button Classes

| Class name | Occurrences in `App.css` | TSX usages | Chosen Canonical? | Role / Notes |
|------------|--------------------------|------------|-------------------|--------------|
| `.btn` | 3 | 119 | ✅ **Canonical Base** | Base button reset, flex alignment, gap, font-weight, focus-visible |
| `.btn-primary` | 8 | 33 | ✅ **Canonical Variant** | Primary brand button (`--brand` terracotta background, white text) |
| `.btn-primary-rust` | 14 | 21 | ⚠️ Alias → `.btn-primary` | Duplicate of primary button. Target for phase 4 deletion. |
| `.btn-secondary` | 2 | 31 | ✅ **Canonical Variant** | Secondary action (`--surface` white, `--border-strong`, text) |
| `.btn-secondary-white` | 3 | 29 | ⚠️ Alias → `.btn-secondary` | Duplicate of secondary button. Target for phase 4 deletion. |
| `.btn-danger` | 2 | 0 | ✅ **Canonical Variant** | Destructive action (`--red` / `#dc2626`) |
| `.btn-ghost` | 2 | 10 | ✅ **Canonical Variant** | Low-contrast ghost action (transparent, hover surface) |
| `.btn-sm` | 13 | 21 | ✅ **Canonical Size** | Compact button padding (`--space-1 var(--space-3)`) |
| `.btn-lg` | 0 | 0 | ✅ **Canonical Size** | Large hero/CTA button padding (`--space-3 var(--space-6)`) |
| `.btn-link` | 4 | 3 | ✅ **Canonical Variant** | Text link button |
| `.btn-link-action` | 1 | 1 | ⚠️ Alias → `.btn-link` | Duplicate of link button. |
| `.btn-toggle-filter` | 2 | 1 | ⚠️ Alias → `.btn-ghost` | Specialized filter toggle, migrate to `.tab-pill` / `.btn-ghost` |
| `.btn-browse-warp` | 1 | 1 | ⚠️ Alias → `.btn-secondary.btn-sm` | Specific form action button |

---

## 2. Badge & Status Classes

| Class name | Occurrences in `App.css` | TSX usages | Chosen Canonical? | Role / Notes |
|------------|--------------------------|------------|-------------------|--------------|
| `.status-pill` | 1 | 19 | ✅ **Canonical Family** | Rounded pill container with indicator dot |
| `.badge` | 14 | 84 | ✅ **Canonical Family** | Standard badge for counts, tags, status |
| `.badge--success` | 0 (scattered ad-hoc) | 0 | ✅ **Canonical Modifier** | Green palette (`--green-bg`, `--green-fg`, `--green-border`) |
| `.badge--warning` | 0 (scattered ad-hoc) | 0 | ✅ **Canonical Modifier** | Amber palette (`--amber-bg`, `--amber-fg`, `--amber-border`) |
| `.badge--danger` | 0 (scattered ad-hoc) | 0 | ✅ **Canonical Modifier** | Red palette (`--red-bg`, `--red-fg`, `--red-border`) |
| `.badge--info` | 0 (scattered ad-hoc) | 0 | ✅ **Canonical Modifier** | Blue palette (`--blue-bg`, `--blue-fg`, `--blue-border`) |
| `.badge--neutral` | 0 (scattered ad-hoc) | 0 | ✅ **Canonical Modifier** | Slate palette (`--surface-subtle`, `--text-muted`) |
| `.badge-status-*` | 3 | 4 | ⚠️ Migrate to canonical | Stock level badges (`-in`, `-low`, `-out`) |
| `.badge-action-*` | 5 | 8 | ⚠️ Migrate to canonical | Audit log action badges (`-created`, `-changed`, etc.) |

---

## 3. Master-Detail Grids

| Class name | Occurrences in `App.css` | TSX usages | Pages using it | Canonical Mapping |
|------------|--------------------------|------------|----------------|-------------------|
| `.prices-master-detail-grid` | 3 | 2 | `PricesPage.tsx` | ⚠️ Alias → `.master-detail` |
| `.catalog-master-detail-grid` | 9 | 1 | `CatalogPage.tsx` | ⚠️ Alias → `.master-detail` |
| `.rules-master-detail-grid` | 1 | 1 | `QualityRulesPage.tsx` | ⚠️ Alias → `.master-detail` |
| `.master-detail` | 0 | 0 | *Target canonical* | ✅ `grid-template-columns: minmax(260px, 320px) 1fr; gap: var(--space-6);` |

---

## 4. Spacing Scale Baseline

Identified dominant spacing in CSS and inline styles:
- `4px` (dominant in pills, compact badges) → `--space-1: 0.25rem`
- `8px` (dominant in buttons, input padding, small gaps) → `--space-2: 0.5rem`
- `12px` (dominant in table cells, card sub-paddings) → `--space-3: 0.75rem`
- `16px` (standard card padding, grid gaps) → `--space-4: 1rem`
- `20px` (section gaps, medium container padding) → `--space-5: 1.25rem`
- `24px` (card padding, master-detail gap) → `--space-6: 1.5rem`
- `32px` (page header margins, large gutters) → `--space-8: 2rem`
- `40px` (layout top margins) → `--space-10: 2.5rem`
- `48px` (section separators) → `--space-12: 3rem`

---

## 5. Type Scale & Fractional Px Elimination

Current codebase contains arbitrary fractional font sizes:
- `10.5px`, `11px`, `11.5px` (found in subtexts and tags) → Map to `--text-xs: 0.75rem` (12px)
- `12.5px`, `13px`, `13.5px` (found in table cells, form labels) → Map to `--text-sm: 0.875rem` (14px)
- `14.5px`, `15px`, `16px` (found in body, inputs) → Map to `--text-base: 1rem` (16px)
- `17px`, `18px` (found in subheadings) → Map to `--text-lg: 1.125rem` (18px)
- `21px`, `22px` (found in card headers) → Map to `--text-xl: 1.25rem` (20px)
- `24px`, `26px` (found in section titles) → Map to `--text-2xl: 1.5rem` (24px)
- `30px`, `32px`, `40px`, `44px` (found in page titles) → Map to `--text-3xl: 1.875rem` (30px) & display sizes

---

## 6. Execution Rules
1. Every alias introduced in Phase 2 must carry `/* ALIAS — delete after Phase 4 */`.
2. Aliases must be purged once TSX call sites migrate in Phase 4.
3. No raw hex or fractional font sizes in new/modified code.
