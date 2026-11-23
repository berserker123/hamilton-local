// Merchant submission channel for the Local Services directory (ADR-0004).
// Google Form for merchant submissions (ADR-0004). If emptied, buttons fall back to email.
export const SERVICES_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfILpqAyeKCNnUVod7FQJf3L11V7xO7eOOHYLdvqzMDdgvt0Q/viewform';
export const SERVICES_CONTACT_EMAIL = 'adminhamiltonlocal@gmail.com';

export const servicesJoinHref = () => SERVICES_FORM_URL || 'mailto:' + SERVICES_CONTACT_EMAIL;
export const servicesJoinIsExternal = () => Boolean(SERVICES_FORM_URL);
