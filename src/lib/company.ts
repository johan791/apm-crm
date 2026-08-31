/**
 * Avsändaruppgifter för utskrivna dokument (offert, orderbekräftelse,
 * fakturaunderlag). Hämtade från APM:s Fortnox-mallar så att dokument
 * ur CRM:et ser likadana ut som de kunden redan känner igen.
 */
export const company = {
  brandName: "APM Project",
  legalName: "Arbetsplatsmiljö i Väst AB",
  tagline: "Cirkulära möbler",
  address: "Södra Larmgatan 2",
  zipCity: "411 16 Göteborg",
  country: "Sverige",
  phone: "031-797 77 60",
  email: "info@apmproject.se",
  website: "www.apmproject.se",
  bankgiro: "5537-0324",
  iban: "SE66 5000 0000 0503 7109 8912",
  bic: "ESSESESSXXX",
  orgNumber: "559269-9101",
  vatNumber: "SE559269910101",
  fSkatt: "Godkänd för F-skatt",
} as const;

/** Standardvillkor som Fortnox skriver ut på varje offert. */
export const defaultTerms = {
  // CRM:et har alltid föreslagit "30 dagar netto"; Fortnox-mallen skriver
  // "30 dagar". Ändra här om utskrifterna ska ordagrant matcha Fortnox.
  paymentTerms: "30 dagar netto",
  lateInterest: "8%",
  vatRate: 0.25,
} as const;
