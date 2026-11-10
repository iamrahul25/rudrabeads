export type RudrakshaGuide = {
  id: string;
  title: string;
  summary: string;
  image: number;
  /** Source pixel size; drives aspect ratio and the zoomed viewer width. */
  width: number;
  height: number;
};

export const rudrakshaGuides: RudrakshaGuide[] = [
  {
    id: 'mukhi-benefits',
    title: 'Choose Your Right Rudraksha',
    summary: '1–14 Mukhi with ruling deity and key benefits of each.',
    image: require('../../assets/guides/mukhi-benefits-guide.webp'),
    width: 935,
    height: 1024,
  },
  {
    id: 'types',
    title: 'Types of Rudraksha',
    summary: '1–21 Mukhi plus Gauri Shankar, Ganesh, Garbh Gauri, Trijuti and Savar Naag.',
    image: require('../../assets/guides/rudraksha-types-guide.webp'),
    width: 682,
    height: 1024,
  },
  {
    id: 'zodiac',
    title: 'Rudraksha for Zodiac Signs',
    summary: 'Recommended mukhi, deity and benefits for all 12 rashis.',
    image: require('../../assets/guides/zodiac-guide.webp'),
    width: 935,
    height: 1024,
  },
];
