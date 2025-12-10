# Design Guidelines: Task Management System

## Design Approach

**Selected Approach**: Design System (Material Design) + Linear-inspired aesthetics

**Rationale**: This is a utility-focused productivity application requiring clarity, efficiency, and professional polish. Drawing from Material Design's robust component patterns and Linear's clean, modern interface aesthetics creates an optimal balance for task management.

**Core Principles**:
- Clarity over decoration
- Information hierarchy through typography and spacing
- Efficient workflows with minimal friction
- Professional, trustworthy aesthetic

---

## Typography

**Font Family**: Inter (via Google Fonts CDN)

**Hierarchy**:
- Page Titles: 2xl (24px), font-semibold
- Section Headers: xl (20px), font-semibold
- Card Titles: lg (18px), font-medium
- Body Text: base (16px), font-normal
- Captions/Labels: sm (14px), font-medium
- Metadata: xs (12px), font-normal

**Color Applications** (structure only, colors TBD):
- Headings: Primary text color
- Body: Secondary text color
- Labels: Tertiary text color
- Links: Interactive accent

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8
- Micro spacing (gaps, padding): 2, 4
- Component spacing: 4, 6
- Section spacing: 6, 8

**Container Strategy**:
- Max-width: 7xl (1280px) for dashboards
- Centered with px-4 (mobile), px-6 (tablet), px-8 (desktop)

**Grid Systems**:
- Task Lists: Single column with full-width cards
- Admin Dashboard: 2-column layout (sidebar + main content)
- User Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

---

## Component Library

### Navigation

**Admin Sidebar** (240px fixed width):
- Vertical navigation with icon + label
- Sections: Dashboard, Tasks, Users, Profile
- Active state indicator (left border accent)
- Collapsible on mobile

**Top Bar**:
- User profile dropdown (right-aligned)
- Notification bell icon
- Logout action
- Height: 16 (64px)

### Authentication Pages

**Layout**: Centered card approach
- Max-width: md (448px)
- Card with elevated shadow
- Logo/brand at top
- Form fields with spacing-4 between
- Primary CTA button (full width)
- Secondary actions (text links, centered)

### Dashboard Cards

**Stat Cards** (Admin Dashboard):
- Grid of 3-4 cards showing metrics
- Icon + Number + Label layout
- Subtle border, light background fill
- Padding: 6

**Task Cards**:
- Full-width cards with left accent border (status indicator)
- Header: Task title (font-medium) + Status badge
- Body: Description snippet (2 lines max)
- Footer: Assignee avatar + Due date
- Hover state: subtle elevation
- Spacing between cards: 4

### Forms

**Input Fields**:
- Height: 10 (40px)
- Border: 1px with rounded corners (md)
- Padding: px-4, py-2
- Label above input (font-medium, text-sm)
- Error state: red border + error message below
- Focus state: accent border

**Buttons**:
- Primary: Full accent fill, white text, rounded-md, px-6 py-2.5
- Secondary: Border with accent color, accent text
- Disabled: Reduced opacity
- Icon buttons: Square (40px), centered icon

**Select/Dropdowns**:
- Match input field styling
- Chevron icon (right-aligned)
- Dropdown menu: elevated shadow, max-height with scroll

### Tables (Admin User Management)

**Structure**:
- Full-width responsive table
- Header row: font-medium, uppercase text-xs
- Data rows: hover state background
- Cells: px-4 py-3
- Actions column: icon buttons (edit, delete)
- Mobile: Stack as cards

### Status Badges

**Design**:
- Small rounded pills (rounded-full)
- px-3 py-1, text-xs font-medium
- TODO: Neutral treatment
- IN_PROGRESS: Accent treatment
- DONE: Success treatment

### Modals

**Structure**:
- Centered overlay with backdrop
- Max-width: lg (512px)
- Header: Title + Close button
- Body: Form or content with py-6
- Footer: Action buttons (right-aligned)

---

## Page Layouts

### Login/Register
- Centered card on full viewport
- Minimalist background (subtle pattern or gradient)
- No hero image needed

### Admin Dashboard
- Sidebar navigation (left)
- Main content area (right)
- Top bar with user actions
- Stat cards at top (3-4 metrics)
- Recent tasks table below

### Task Board (User View)
- Top bar with filters (status dropdown, search)
- Task cards in vertical list
- Floating action button (bottom-right) for quick task creation
- Empty state: Centered illustration + text

### User Management (Admin)
- Page header with "Add User" button
- User table with search/filter
- Pagination controls at bottom

---

## Images

**No hero images required** - This is a utility application focused on functionality.

**Avatar Images**:
- User profile pictures (circular, 32px or 40px)
- Placeholder: Initials on colored background
- Location: Top bar, task cards, user tables

**Empty States**:
- Simple SVG illustrations (via icon library)
- Centered with descriptive text
- Location: Empty task lists, no search results

---

## Interactions

**Minimal Animations**:
- Hover transitions: 150ms ease
- Modal entrance: fade + scale (200ms)
- Dropdown open: slide down (150ms)
- No scroll-based or complex animations

**Loading States**:
- Skeleton screens for tables/cards
- Spinner for form submissions
- Progress bar for page navigation

---

## Accessibility

- All interactive elements: min-height 40px (touch target)
- Form labels properly associated
- Focus indicators on all focusable elements
- Semantic HTML throughout
- ARIA labels for icon-only buttons
- Color contrast ratio: 4.5:1 minimum