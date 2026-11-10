import { buildEnquiryMessage, emptyEnquiry, validateEnquiry, type Enquiry } from '@/lib/enquiry';

const valid: Enquiry = {
  name: 'Asha Verma',
  mobile: '+91 98765 43210',
  email: '',
  requirement: '100 pieces of 5 Mukhi Nepali Rudraksha',
};

describe('enquiry', () => {
  it('requires name, mobile and requirement but not email', () => {
    expect(validateEnquiry(valid)).toEqual({});
    expect(Object.keys(validateEnquiry(emptyEnquiry)).sort()).toEqual(['mobile', 'name', 'requirement']);
  });

  it('rejects an invalid email only when one is given', () => {
    expect(validateEnquiry({ ...valid, email: 'nope' }).email).toBeDefined();
    expect(validateEnquiry({ ...valid, email: 'asha@example.in' }).email).toBeUndefined();
  });

  it('builds a WhatsApp message with normalized mobile and optional email', () => {
    expect(buildEnquiryMessage(valid, 'Rudra Beads')).toBe(
      [
        'Hello Rudra Beads, I have an enquiry.',
        '',
        'Requirement: 100 pieces of 5 Mukhi Nepali Rudraksha',
        '',
        'Name: Asha Verma',
        'Mobile: 9876543210',
      ].join('\n'),
    );
    expect(buildEnquiryMessage({ ...valid, email: ' asha@example.in ' }, 'Rudra Beads')).toContain(
      'Email: asha@example.in',
    );
  });
});
