export type Product = {
  id: string;
  name: string;
  mukhi: number;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  image: number;
  category: 'rudraksha' | 'malas' | 'bracelets' | 'pendants' | 'accessories' | 'sphatik';
  benefits: string[];
  description: string;
};

export type Category = {
  id: string;
  name: string;
  image: number;
  count: number;
};

export const products: Product[] = [
  {
    id: '1',
    name: '1 Mukhi Rudraksha',
    mukhi: 1,
    price: 4999,
    originalPrice: 6499,
    rating: 4.9,
    reviews: 128,
    image: require('../../assets/products/bead-1.jpg'),
    category: 'rudraksha',
    benefits: ['Enhances focus', 'Supports meditation', 'Promotes clarity'],
    description:
      'Certified 1 Mukhi Rudraksha bead, carefully selected for natural mukhi lines and smooth finish.',
  },
  {
    id: '2',
    name: '5 Mukhi Rudraksha',
    mukhi: 5,
    price: 799,
    originalPrice: 999,
    rating: 4.8,
    reviews: 412,
    image: require('../../assets/products/bead-2.jpg'),
    category: 'rudraksha',
    benefits: ['Calms the mind', 'Supports wellness', 'Daily wear friendly'],
    description:
      'Popular 5 Mukhi Rudraksha ideal for everyday wear, lab-checked and naturally sourced.',
  },
  {
    id: '3',
    name: '2 Mukhi Rudraksha',
    mukhi: 2,
    price: 1299,
    originalPrice: 1599,
    rating: 4.7,
    reviews: 96,
    image: require('../../assets/products/img-2.jpg'),
    category: 'rudraksha',
    benefits: ['Harmony', 'Emotional balance', 'Relationship peace'],
    description: 'Two-faced Rudraksha representing unity and balanced energy.',
  },
  {
    id: '4',
    name: '3 Mukhi Rudraksha',
    mukhi: 3,
    price: 899,
    originalPrice: 1199,
    rating: 4.6,
    reviews: 84,
    image: require('../../assets/products/img-4.jpg'),
    category: 'rudraksha',
    benefits: ['Confidence', 'Release of past stress', 'Fresh beginnings'],
    description: '3 Mukhi Rudraksha known for rejuvenating energy and clarity.',
  },
  {
    id: '5',
    name: '7 Mukhi Rudraksha',
    mukhi: 7,
    price: 1499,
    originalPrice: 1899,
    rating: 4.8,
    reviews: 157,
    image: require('../../assets/products/img-5.jpg'),
    category: 'rudraksha',
    benefits: ['Prosperity', 'Stability', 'Grounded focus'],
    description: 'Premium 7 Mukhi bead with deep natural grooves.',
  },
  {
    id: '6',
    name: '9 Mukhi Rudraksha',
    mukhi: 9,
    price: 2199,
    originalPrice: 2699,
    rating: 4.7,
    reviews: 63,
    image: require('../../assets/products/img-7.jpg'),
    category: 'rudraksha',
    benefits: ['Courage', 'Protection', 'Inner strength'],
    description: 'Powerful 9 Mukhi Rudraksha for dedicated spiritual practice.',
  },
  {
    id: '7',
    name: 'Classic Rudraksha Mala',
    mukhi: 5,
    price: 2499,
    originalPrice: 2999,
    rating: 4.9,
    reviews: 220,
    image: require('../../assets/products/mala-1.jpg'),
    category: 'malas',
    benefits: ['Japa practice', 'Daily meditation', '108 beads'],
    description: 'Hand-knotted 108-bead Rudraksha mala with silk tassel.',
  },
  {
    id: '8',
    name: 'Meditation Mala',
    mukhi: 5,
    price: 2799,
    originalPrice: 3299,
    rating: 4.8,
    reviews: 141,
    image: require('../../assets/products/mala-2.jpg'),
    category: 'malas',
    benefits: ['Deep meditation', 'Breath focus', 'Sacred ritual'],
    description: 'Premium mala coiled finish, ideal for gifting and puja.',
  },
  {
    id: '9',
    name: 'Carved Gift Box',
    mukhi: 0,
    price: 699,
    originalPrice: 899,
    rating: 4.5,
    reviews: 52,
    image: require('../../assets/products/box-1.jpg'),
    category: 'accessories',
    benefits: ['Premium packaging', 'Gift ready', 'Keepsake storage'],
    description: 'Hand-carved wooden keepsake box for sacred beads.',
  },
  {
    id: '10',
    name: 'Wooden Keepsake Box',
    mukhi: 0,
    price: 799,
    originalPrice: 999,
    rating: 4.6,
    reviews: 38,
    image: require('../../assets/products/box-2.jpg'),
    category: 'accessories',
    benefits: ['Protective storage', 'Elegant finish', 'Gift pairing'],
    description: 'Dark wood box with floral carving and metal clasp.',
  },
];

export const categories: Category[] = [
  {
    id: 'rudraksha',
    name: 'Rudraksha',
    image: require('../../assets/products/bead-2.jpg'),
    count: 48,
  },
  {
    id: 'malas',
    name: 'Malas',
    image: require('../../assets/products/mala-1.jpg'),
    count: 18,
  },
  {
    id: 'bracelets',
    name: 'Bracelets',
    image: require('../../assets/products/img-9.jpg'),
    count: 22,
  },
  {
    id: 'pendants',
    name: 'Pendants',
    image: require('../../assets/products/img-16.jpg'),
    count: 15,
  },
  {
    id: 'accessories',
    name: 'Accessories',
    image: require('../../assets/products/box-1.jpg'),
    count: 12,
  },
  {
    id: 'sphatik',
    name: 'Sphatik',
    image: require('../../assets/products/img-10.jpg'),
    count: 9,
  },
];

export const mukhiFilters = ['All', '1 Mukhi', '2 Mukhi', '3 Mukhi', '5 Mukhi', '7 Mukhi', '9 Mukhi'];

export function formatINR(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

export function getProductById(id: string) {
  return products.find((item) => item.id === id);
}
