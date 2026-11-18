// Details shown on the privacy notice. Set these in your hosting settings (see .env.example)
// and have the notice reviewed by someone qualified before you rely on it.
export const site = {
  operator: import.meta.env.VITE_OPERATOR_NAME || "the CivicLens team",
  contactEmail: (import.meta.env.VITE_CONTACT_EMAIL as string | undefined) || "",
  privacyUpdated: "18 November 2026",
};
