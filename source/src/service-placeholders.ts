export const SERVICE_PLACEHOLDER_LINES = [
  {
    zh: '这个位置空着，老板急得睡不着',
    en: "This spot is empty and the boss can't sleep",
  },
  {
    zh: '虚位以待，先到先得',
    en: 'Your name here, first come first served',
  },
  {
    zh: '我们在等一位靠谱的你',
    en: 'Waiting for someone reliable, maybe you',
  },
  {
    zh: '此处招商，比租铺面便宜多了',
    en: 'Cheaper than renting a shopfront',
  },
  {
    zh: '空着也是空着，不如放你的店',
    en: "It's empty anyway, why not your business",
  },
] as const;

const SERVICE_TAB_OFFSETS: Record<string, number> = {
  home: 0,
  trades: 3,
  daily: 1,
  pets: 4,
  advisors: 2,
};

export function servicePlaceholderLine(tab: string, index: number) {
  const offset = SERVICE_TAB_OFFSETS[tab] ?? 0;
  return SERVICE_PLACEHOLDER_LINES[(offset + index) % SERVICE_PLACEHOLDER_LINES.length];
}
