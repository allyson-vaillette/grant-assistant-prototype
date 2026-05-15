import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      /* ── Colors ── */
      colors: {
        /* shadcn/ui semantic tokens */
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        /* GA 2.0 raw tokens — reference CSS custom properties directly */
        canvas:  "var(--canvas)",
        surface: "var(--surface)",
        subtle:  "var(--subtle)",

        olive: {
          dark: "var(--olive-dark)",
          mid:  "var(--olive-mid)",
          pale: "var(--olive-pale)",
        },

        ink: {
          DEFAULT:   "var(--ink)",
          secondary: "var(--ink-secondary)",
          tertiary:  "var(--ink-tertiary)",
        },

        "ga-amber": {
          DEFAULT: "var(--amber)",
          light:   "var(--amber-light)",
        },

        "ga-slate": {
          DEFAULT: "var(--slate)",
          light:   "var(--slate-light)",
        },

        "ga-blue": {
          DEFAULT: "var(--blue)",
          light:   "var(--blue-light)",
        },
      },

      /* ── Border radius ── */
      borderRadius: {
        pill:       "var(--radius-pill)",
        card:       "var(--radius-card)",
        button:     "var(--radius-button)",
        input:      "var(--radius-input)",
        "icon-tile":"var(--radius-icon-tile)",
        lg:         "var(--radius)",
        md:         "calc(var(--radius) - 2px)",
        sm:         "calc(var(--radius) - 4px)",
      },

      /* ── Font family ── */
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "-apple-system",
          "SF Pro Display",
          "system-ui",
          "sans-serif",
        ],
      },

      /* ── Type scale (mirrors Design Tokens artboard) ── */
      fontSize: {
        "display": ["19px", { lineHeight: "1.3",  fontWeight: "500", letterSpacing: "-0.02em" }],
        "heading":  ["15px", { lineHeight: "1.4",  fontWeight: "500", letterSpacing: "-0.01em" }],
        "body":     ["13px", { lineHeight: "1.5",  fontWeight: "400" }],
        "label":    ["11px", { lineHeight: "1.4",  fontWeight: "500", letterSpacing: "0.07em"  }],
        "meta":     ["11px", { lineHeight: "1.4",  fontWeight: "400" }],
      },

      /* ── Spacing additions (4-base; 22 is a GA-specific step) ── */
      spacing: {
        "5.5": "22px",
      },

      /* ── Animations (shadcn accordion + GA base duration) ── */
      transitionDuration: {
        DEFAULT: "200ms",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)"  },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
