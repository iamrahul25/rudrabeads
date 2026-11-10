import catalog from './catalog.json';

export const business = catalog.business;

export type Review = (typeof business.testimonials.reviews)[number];

const companyImages: Record<string, number> = {
  'assets/company/stock.webp': require('../../assets/company/stock.webp'),
  'assets/company/signboard.webp': require('../../assets/company/signboard.webp'),
  'assets/company/office.webp': require('../../assets/company/office.webp'),
};

export const companyPhotos = business.about.photos.map((photo) => ({
  ...photo,
  source: companyImages[photo.image] ?? null,
}));

export const telUrl = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

export const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${business.location.lat},${business.location.lng}`;

export const whatsappUrl = (message?: string) =>
  `https://wa.me/${business.whatsapp}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
