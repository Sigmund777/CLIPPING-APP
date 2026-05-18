/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            fontFamily: {
                heading: ['Outfit', 'ui-sans-serif', 'system-ui'],
                body: ['Manrope', 'ui-sans-serif', 'system-ui'],
                mono: ['JetBrains Mono', 'ui-monospace'],
            },
            colors: {
                // Brand: teal/cyan neon (was "volt yellow"). Kept the name `volt` so existing
                // class names work unchanged after the rebrand.
                volt: {
                    DEFAULT: '#22D3EE',
                    50: '#ECFEFF',
                    100: '#CFFAFE',
                    200: '#A5F3FC',
                    300: '#67E8F9',
                    400: '#22D3EE',
                    500: '#06B6D4',
                    600: '#0891B2',
                    700: '#0E7490',
                },
                // Second accent: vibrant purple — used for primary CTAs and brand emphasis.
                purple: {
                    DEFAULT: '#A855F7',
                    50: '#FAF5FF',
                    100: '#F3E8FF',
                    200: '#E9D5FF',
                    300: '#D8B4FE',
                    400: '#C084FC',
                    500: '#A855F7',
                    600: '#9333EA',
                    700: '#7E22CE',
                    800: '#6B21A8',
                },
                ink: {
                    950: '#0A0A12',
                    900: '#0F0F1A',
                    800: '#171724',
                    700: '#22222F',
                    600: '#363645',
                },
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
                popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
                primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
                secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
                muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
                accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
                destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
            },
            backgroundImage: {
                'brand-glow': 'radial-gradient(ellipse at top, rgba(168,85,247,0.20), transparent 60%), radial-gradient(ellipse at bottom right, rgba(34,211,238,0.18), transparent 55%)',
                'brand-cta': 'linear-gradient(135deg, #A855F7 0%, #22D3EE 100%)',
                'brand-cta-hover': 'linear-gradient(135deg, #C084FC 0%, #67E8F9 100%)',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            keyframes: {
                'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
                'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
                'pulse-glow': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
                'marquee': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
                'fade-up': { '0%': { opacity: 0, transform: 'translateY(20px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
                'shimmer': { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
                'marquee': 'marquee 30s linear infinite',
                'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
                'shimmer': 'shimmer 2.5s linear infinite',
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
