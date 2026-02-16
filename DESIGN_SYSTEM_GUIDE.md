# Design System Reference Guide

## Color Palette

### Primary Colors
- **Dark Slate**: `#0f172a` - Primary dark color
- **Slate**: `#1e293b` - Secondary dark color
- **Light Slate**: `#64748b` - Secondary text

### Neutral Colors
- **White**: `#ffffff`
- **Very Light**: `#f8fafc` - Background
- **Light**: `#f1f5f9` - Secondary background
- **Border**: `#e2e8f0` - Borders
- **Muted Text**: `#94a3b8` - Placeholder, muted text

### Status Colors
| Status | Primary | Dark | Gradient |
|--------|---------|------|----------|
| Active | #10b981 | #059669 | #10b981 → #059669 |
| Inactive | #f59e0b | #d97706 | #f59e0b → #d97706 |
| Pending | #06b6d4 | #0891b2 | #06b6d4 → #0891b2 |
| Cancelled | #ef4444 | #dc2626 | #ef4444 → #dc2626 |
| Expired | #8b5cf6 | #7c3aed | #8b5cf6 → #7c3aed |
| Success | #10b981 | #059669 | #f0fdf4 → #dcfce7 |
| Error | #ef4444 | #dc2626 | #fef2f2 → #fee2e2 |
| Warning | #f59e0b | #d97706 | #fffbeb → #fef3c7 |
| Info | #06b6d4 | #0891b2 | #ecf0ff → #dbeafe |

## Typography Scale

```
H1: 2.5rem (40px) - 700 weight - Letter-spacing: -0.02em
H2: 2rem (32px) - 700 weight - Letter-spacing: -0.01em
H3: 1.75rem (28px) - 600 weight
H4: 1.5rem (24px) - 600 weight
H5: 1.25rem (20px) - 600 weight
H6: 1.125rem (18px) - 600 weight
Body: 0.95rem (15px) - Line-height: 1.6
Body Small: 0.875rem (14px) - Line-height: 1.57
Caption: 0.8125rem (13px) - 500 weight - Letter-spacing: 0.01em
```

## Spacing Scale (8px base)

```
4px    = 0.5x
8px    = 1x   (base)
12px   = 1.5x
16px   = 2x
20px   = 2.5x
24px   = 3x
28px   = 3.5x
32px   = 4x
40px   = 5x
48px   = 6x
```

## Shadow Scale

```
Subtle:  0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)
Soft:    0 2px 8px rgba(15, 23, 42, 0.12)
Medium:  0 4px 12px rgba(15, 23, 42, 0.15)
Strong:  0 10px 25px rgba(0, 0, 0, 0.1)
Deep:    0 20px 60px rgba(0, 0, 0, 0.25)
```

## Border Radius Scale

```
4px   - Small elements
8px   - Buttons, small inputs
10px  - Input fields
12px  - Cards, containers
16px  - Large cards, modals
```

## Animation Timing

```
Standard:    300ms cubic-bezier(0.4, 0, 0.2, 1)
Quick:       200ms cubic-bezier(0.4, 0, 0.2, 1)
Slow:        400ms cubic-bezier(0.4, 0, 0.2, 1)
Loading:     800ms linear (for spin animation)
```

## Button States

### Primary Button
```css
Default:   Linear gradient #0f172a → #1e293b, white text, shadow
Hover:     translateY(-2px), enhanced shadow
Active:    translateY(0), reduced shadow
Disabled:  70% opacity
```

### Secondary Button
```css
Default:   #f1f5f9 background, #0f172a text, #e2e8f0 border
Hover:     #e2e8f0 background, #cbd5e1 border, translateY(-2px)
Active:    translateY(0)
Disabled:  opacity 0.6
```

## Input Field States

```
Resting:   1.5px #e2e8f0 border, #f8fafc background
Hover:     1.5px #cbd5e1 border, white background
Focus:     2px #0f172a border, white background, shadow ring
Error:     1.5px #fecaca border, #fef2f2 background
Disabled:  1.5px #e2e8f0 border, #f1f5f9 background, opacity 0.6
```

## Card Styling

```
Border:        1px solid #e2e8f0
Radius:        12-16px
Background:    #ffffff
Default Shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)
Hover Shadow:  0 10px 25px rgba(0, 0, 0, 0.1), 0 0 0 1px #e2e8f0
Hover Effect:  translateY(-4px)
Transition:    all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
```

## Table Header Styling

```
Background:    Linear gradient #0f172a → #1e293b
Text Color:    #ffffff
Text Weight:   700
Font Size:     0.875rem (14px)
Letter-spacing: 0.01em
Padding:       16px 20px
Border-bottom: 2px solid rgba(255, 255, 255, 0.1)
```

## Responsive Breakpoints

```
Large Desktop: 1200px+
Desktop:       768px - 1199px
Tablet:        480px - 767px
Mobile:        < 480px
```

## Badge/Chip Styling

```
Padding:       6px 14px
Border-radius: 8px
Font-size:    12px
Font-weight:  600-700
Letter-spacing: 0.01em
Border:       1px solid (status color dependent)
```

## Gradient Examples

### Primary Gradient
```css
linear-gradient(135deg, #0f172a 0%, #1e293b 100%)
```

### Success Gradient
```css
linear-gradient(135deg, #10b981 0%, #059669 100%)
```

### Success Background Gradient
```css
linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)
```

### Stat Card Active
```css
linear-gradient(135deg, #0f172a 0%, #1e293b 100%)
with shine effect on hover
```

## Accessibility Notes

- **Contrast Ratios**: All text meets WCAG AA standards (4.5:1 for normal text)
- **Focus States**: Clear, visible focus indicators on all interactive elements
- **Color Not Only**: Status indicators use both color and icons/borders
- **Font Sizes**: Minimum 14px for body text, 16px for inputs
- **Touch Targets**: Minimum 44px height for touch-friendly buttons

## Recommended Font: Inter

For best results, add to your HTML:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Then set in CSS:
```css
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}
```

---

**Design System Version**: 1.0
**Last Updated**: January 25, 2026
