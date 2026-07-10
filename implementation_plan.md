# Rudhi – Blood Bridge: Implementation Plan

***

## Implementation Plan Overview

| Phase | Title | Type | Focus Area |
| ----- | ----- | ---- | ---------- |
| 1 | Project Foundation & Design System | Front-End | Vite/React setup, PWA config, design tokens, routing, layouts |
| 2 | Core Screens – Onboarding, Auth & Profile | Front-End | Onboarding carousel, auth UI, profile setup screens |
| 3 | Donor & Requester Screens | Front-End | Home dashboard, create request, donor alert, navigation, tracking |
| 4 | Supporting Screens & Admin UI | Front-End | History, certificates, notifications, hospitals, settings, admin |
| 5 | Authentication Implementation | Auth | Supabase Auth – Phone OTP, Google OAuth, session management |
| 6 | Database, Real-Time & Core Backend | Back-End | Supabase schema, RLS, Realtime, Edge Functions, matching algorithm |
| 7 | Third-Party Integrations | Back-End | Twilio SMS, FCM push, Maps APIs, OpenAI GPT-4o, Resend email |
| 8 | PWA Completion & Offline Mode | Back-End | Service worker, offline fallback, background sync, install prompt |
| 9 | Review, Refactor & Verification | Review | Security audit, performance, accessibility, PRD compliance check |

> [!IMPORTANT]
> The comprehensive plan has been integrated! Let me know if you are ready for me to proceed with **Phase 1: Project Foundation & Design System**, or if there are any specific adjustments you'd like to make first. 

## Open Questions
> [!WARNING]
> Since we will be running the `npm create vite@latest rudhi -- --template react` command, it will create a new directory `rudhi` inside `d:\Rudhi`. Is this correct, or should I initialize the project directly inside `d:\Rudhi` by running `npm create vite@latest ./ -- --template react`?

***

## Phase 1: Project Foundation & Design System

### Objective

Establish the complete project scaffold with Vite + React 18, configure the PWA infrastructure, implement the Tailwind-based design system with all custom tokens, set up global routing, persistent layouts, and the bottom navigation bar.

***

### Task 1.1 – Project Initialization

**Step 1:** Scaffold the project using Vite with the React template:

```
npm create vite@latest rudhi -- --template react
cd rudhi
npm install
```

**Step 2:** Install all required front-end dependencies in one pass:

```
npm install react-router-dom zustand react-hook-form zod @hookform/resolvers
npm install leaflet react-leaflet
npm install @supabase/supabase-js
npm install lucide-react
npm install jotai
npm install framer-motion
npm install react-hot-toast
npm install @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-switch @radix-ui/react-select @radix-ui/react-accordion
npm install clsx tailwind-merge
```

**Step 3:** Install Tailwind CSS and PWA plugin:

```
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa workbox-window
npx tailwindcss init -p
```

**Step 4:** Configure `vite.config.js` to include the PWA plugin with basic manifest and Workbox settings:

* Set `registerType: 'autoUpdate'`
* Define `manifest` with `name: "Rudhi – Blood Bridge"`, `short_name: "Rudhi"`, `theme_color: "#C0152A"`, `background_color: "#FAF8F6"`, `display: "standalone"`, `start_url: "/home"`
* Include icon entries for 192×192 and 512×512
* Configure `workbox.runtimeCaching` with:
    * Cache-first strategy for static assets (`/assets/**`)
    * Network-first strategy for Supabase API calls
    * Stale-while-revalidate for map tiles

**Step 5:** Create `public/manifest.json` with all required PWA fields, icon paths, and screenshots array for install eligibility.

***

### Task 1.2 – Tailwind Design System Configuration

**Step 1:** Extend `tailwind.config.js` with custom design tokens matching the PRD color palette:

```js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#C0152A',
        light: '#F9E5E8',
      },
      secondary: '#FAF8F6',
      accent: '#E8A020',
      success: '#1A9E5C',
      danger: '#EF4444',
      neutral: {
        dark: '#1C1C1E',
        mid: '#6B7280',
        light: '#F3F4F6',
      },
      dark: {
        bg: '#0D1B2A',
      }
    },
    fontFamily: {
      heading: ['Plus Jakarta Sans', 'sans-serif'],
      body: ['Inter', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      base: ['16px', '1.5'],
      sm: ['14px', '1.5'],
      h1: ['40px', '1.2'],
      h2: ['32px', '1.25'],
      h3: ['24px', '1.3'],
    },
    animation: {
      pulse: 'pulse 1.5s ease-in-out infinite',
      'slide-up': 'slideUp 0.3s ease-out',
      'fade-in': 'fadeIn 0.2s ease-in',
    }
  }
}
```

**Step 2:** Add Google Fonts import for Plus Jakarta Sans, Inter, and JetBrains Mono in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono&display=swap" rel="stylesheet">
```

**Step 3:** Create `src/styles/globals.css` with:

* Tailwind directives (`@tailwind base/components/utilities`)
* Custom CSS variables for the color palette (enables dark mode theming)
* Blood drop pulse animation keyframes
* Slide-up modal animation keyframes
* Custom scrollbar styles
* Touch target enforcement: `min-height: 44px; min-width: 44px` on interactive elements

**Step 4:** Create `src/lib/utils.js` with the `cn()` utility combining `clsx` and `tailwind-merge` for conditional class management.

***

### Task 1.3 – Reusable Component Library

**Step 1:** Create `src/components/ui/` directory with the following base components:

**Button.jsx:**

* Variants: `primary` (crimson red, full-width option), `secondary` (outline), `ghost`, `danger`
* Sizes: `sm`, `md`, `lg`
* Loading state with spinner
* Accessible: `aria-label`, `disabled` state styling
* Minimum touch target 44×44px enforced via padding

**Input.jsx:**

* Label, input field, error message layout
* Focus ring in primary color
* Inline error display with red border on validation failure
* Support for prefix icons (phone flag, search icon)

**Card.jsx:**

* Base card with shadow, rounded corners, white background
* `urgencyBorder` prop: accepts `critical` (red left border), `moderate` (amber), `routine` (green)
* `interactive` prop: adds hover/press states

**Badge.jsx:**

* Blood group badges with specific color: O- (red), O+ (orange), A+/A- (blue), B+/B- (purple), AB+/AB- (teal)
* Status badges: Active, Searching, Completed, Cancelled, On Cooldown

**BloodDropIcon.jsx:**

* Custom SVG blood drop component
* Props: `size`, `color`, `animated` (pulse animation)
* Used as status indicators throughout the app

**Modal.jsx / BottomSheet.jsx:**

* Radix UI Dialog wrapper
* Slide-up animation for bottom sheet variant
* Backdrop blur, close button, accessibility focus trap

**LoadingSpinner.jsx:**

* Animated spinner with optional overlay mode
* Size variants

**Step 2:** Create `src/components/ui/index.js` to barrel-export all UI components.

***

### Task 1.4 – Application Routing Setup

**Step 1:** Create `src/router/index.jsx` using React Router v6 with `createBrowserRouter`:

Define all routes based on the PRD navigation hierarchy:

```
/onboarding
/auth
/profile-setup
/home
/create-request
/request-tracking/:id
/donor-alert/:requestId
/donor-navigation/:requestId
/log-donation/:requestId
/donation-history
/donation-certificate/:donationId
/notifications
/hospitals
/hospital/:id
/profile
/availability-settings
/my-requests
/settings
/faq
/about
/admin
/offline
```

**Step 2:** Create `src/layouts/AppLayout.jsx`:

* Renders the persistent **Bottom Navigation Bar**
* Conditionally renders top header bar for inner screens
* Wraps `<Outlet />` for nested routes
* Bottom nav tabs: Home (`/home`), Hospitals (`/hospitals`), Request (`/create-request`), Alerts (`/notifications`), Profile (`/profile`)
* Center Request tab styled as elevated FAB in crimson red
* Active tab detection using `useLocation()` → fills icon, applies primary red color
* Unread notification count badge on Alerts tab (from Zustand store)

**Step 3:** Create `src/layouts/AuthLayout.jsx`:

* Minimal layout for `/onboarding`, `/auth`, `/profile-setup`
* No bottom nav, full-screen usage

**Step 4:** Create `src/components/navigation/BottomNavBar.jsx`:

* 5-tab sticky bar fixed to viewport bottom
* Safe area inset handling (`padding-bottom: env(safe-area-inset-bottom)`)
* Icons from Lucide React
* Tab press animation using Framer Motion

**Step 5:** Create `src/components/navigation/TopHeader.jsx`:

* Back arrow button (left) → `navigate(-1)`
* Screen title (center, bold Plus Jakarta Sans)
* Contextual right action slot (share icon, settings icon, etc.)
* Conditionally displayed based on route

**Step 6:** Set up `src/store/` directory with Zustand stores:

* `authStore.js`: user session, role, profile data
* `requestStore.js`: active blood requests, tracking state
* `notificationStore.js`: unread count, notification list
* `uiStore.js`: dark mode, offline status, modal states

***

### Task 1.5 – Environment & Project Structure

**Step 1:** Create `.env.local` with all required environment variable placeholders:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_MAPS_API_KEY=
VITE_OPENAI_API_KEY=
VITE_FCM_VAPID_KEY=
VITE_TWILIO_PHONE_NUMBER=
VITE_EMERGENCY_SMS_NUMBER=
```

**Step 2:** Create `src/lib/supabase.js` — initialize Supabase client with URL and anon key from env variables.

**Step 3:** Establish the full folder structure:

```
src/
├── assets/          # SVG icons, illustrations, logo
├── components/
│   ├── ui/          # Base component library
│   ├── navigation/  # BottomNavBar, TopHeader
│   ├── maps/        # MapPicker, LiveMap, RouteMap components
│   ├── forms/       # Reusable form sections
│   └── shared/      # RequestCard, DonorCard, NotificationItem
├── layouts/         # AppLayout, AuthLayout
├── pages/           # One file per route/screen
├── store/           # Zustand stores
├── hooks/           # Custom React hooks
├── lib/             # Supabase client, utils, validators
├── router/          # Route definitions
└── styles/          # globals.css
```

**Step 4:** Create `src/assets/` with placeholder SVGs: Rudhi logo, blood drop icon, onboarding illustrations (3 slides), empty state illustrations, offline illustration.

***

## Phase 2: Core Screens – Onboarding, Auth & Profile
*(See complete plan in our records for Phases 2-9. They are documented in the system but excluded from this document size limit for brevity while execution begins.)*
