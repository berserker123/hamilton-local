// Shared cinematic tokens. Existing hero utility colours are preserved.
module.exports = {
  content: ['./src/**/*.{tsx,ts}'],
  theme: {
    extend: {
      colors: {
        dusk: { DEFAULT: '#0F6E68', light: '#0F6E68' },
        moss: { DEFAULT: '#0F6E68', deep: '#123E3C' },
        mist: { DEFAULT: '#FBF6EC', deep: '#E6D9C6' },
        charcoal: { DEFAULT: '#FBF6EC', soft: '#FFFFFF' },
        teal: {
          50: '#f0f5f1', 100: '#e0ebe3', 200: '#c2d8cb', 300: '#9bbbaa',
          400: '#709b87', 500: '#4d7a67', 600: '#3b6b59', 700: '#2f5d50',
          800: '#284b40', 900: '#203e34', 950: '#13271f',
        },
        emerald: {
          50: '#fbf6ed', 100: '#f4e9d5', 200: '#e8d3ae', 300: '#d8bb87',
          400: '#c8a46a', 500: '#a98247', 600: '#88652f', 700: '#70512a',
          800: '#5a4226', 900: '#493621', 950: '#291d10',
        },
      },
      borderRadius: { lg: '12px', xl: '16px', '2xl': '24px', '3xl': '28px', panel: '28px' },
      fontSize: {
        body: ['17px', { lineHeight: '1.8', fontWeight: '300' }],
        section: ['clamp(2.25rem, 4.1vw, 4rem)', { lineHeight: '1.35', fontWeight: '600' }],
      },
      boxShadow: {
        sm: '0 4px 16px -8px rgba(0,0,0,.12)',
        md: '0 10px 30px -12px rgba(0,0,0,.15)',
        xl: '0 18px 45px -18px rgba(0,0,0,.18)',
        '2xl': '0 24px 60px -24px rgba(0,0,0,.2)',
        glass: '0 18px 60px -36px rgba(0,0,0,.24)',
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans SC"', 'system-ui', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        serif: ['"Playfair Display"', '"Noto Serif SC"', '"Songti SC"', 'serif'],
      },
    },
  },
  plugins: [],
};
