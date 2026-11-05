// v5 scrapbook palette: teal -> navy ink, emerald -> tomato orange
module.exports = { content: ['./src/**/*.{tsx,ts}'], theme: { extend: {
  colors: {
    teal: { 50:'#EEF0F7',100:'#DDE1EE',200:'#BCC3DC',300:'#8E99C2',400:'#6575A8',500:'#45558E',600:'#36447A',700:'#29335C',800:'#222A4D',900:'#1A203B',950:'#12172B' },
    emerald: { 50:'#FFF1EB',100:'#FFE0D3',200:'#FFC2A8',300:'#FB9C77',400:'#F27A4E',500:'#E4572E',600:'#C94520',700:'#A9381A',800:'#86301A',900:'#6B2918' },
  },
  borderRadius: { lg:'4px', xl:'6px', '2xl':'8px' },
  boxShadow: { sm:'2px 2px 0 #1C1C1C', md:'3px 4px 0 #1C1C1C', xl:'5px 6px 0 #1C1C1C', '2xl':'6px 8px 0 #1C1C1C' },
  fontFamily: { sans: ['"Noto Sans SC"','system-ui','"PingFang SC"','"Microsoft YaHei"','sans-serif'] },
} }, plugins: [] };
