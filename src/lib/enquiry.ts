import { isValidEmail, isValidPhone, normalizePhone } from '@/lib/orders';

export type Enquiry = {
  name: string;
  mobile: string;
  email: string;
  requirement: string;
};

export type EnquiryErrors = Partial<Record<keyof Enquiry, string>>;

export const emptyEnquiry: Enquiry = { name: '', mobile: '', email: '', requirement: '' };

export function validateEnquiry(enquiry: Enquiry): EnquiryErrors {
  const errors: EnquiryErrors = {};
  if (!enquiry.requirement.trim()) errors.requirement = 'Please enter requirement.';
  if (!isValidPhone(enquiry.mobile)) errors.mobile = 'Please enter a valid 10-digit mobile number.';
  if (enquiry.email.trim() && !isValidEmail(enquiry.email)) errors.email = 'Please enter a valid email id.';
  if (enquiry.name.trim().length < 2) errors.name = 'Please enter your name.';
  return errors;
}

export function buildEnquiryMessage(enquiry: Enquiry, businessName: string) {
  const lines = [
    `Hello ${businessName}, I have an enquiry.`,
    '',
    `Requirement: ${enquiry.requirement.trim()}`,
    '',
    `Name: ${enquiry.name.trim()}`,
    `Mobile: ${normalizePhone(enquiry.mobile)}`,
  ];
  if (enquiry.email.trim()) lines.push(`Email: ${enquiry.email.trim()}`);
  return lines.join('\n');
}
