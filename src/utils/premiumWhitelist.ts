
// Premium access whitelist for testing and admin users
export const PREMIUM_WHITELIST_EMAILS = [
  "spidey0001k@gmail.com",
  "friend1@example.com", 
  "friend2@example.com",
  "tester99@example.com"
];

export const isEmailWhitelisted = (email: string): boolean => {
  return PREMIUM_WHITELIST_EMAILS.includes(email.toLowerCase());
};

export const shouldGrantPremiumAccess = (email?: string): boolean => {
  if (!email) return false;
  return isEmailWhitelisted(email);
};
