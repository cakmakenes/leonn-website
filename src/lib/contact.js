/**
 * Single source of truth for the restaurant's public contact details.
 *
 * These values appear in the footer, the Kontakt and Impressum pages, the
 * voucher PDF and email templates. Keeping them here means a change of address
 * or phone number is a one-line edit instead of a hunt across the codebase.
 *
 * The address and website are taken from the official brand letterhead
 * (design/Leonn - Final/Antetli). No email address is published, on the owner's
 * request, to avoid spam.
 */

export const CONTACT = {
  name: "Leonn Restaurant",

  // From the brand letterhead.
  street: "Bergisch Gladbacher Straße 261–263",
  postalCode: "51063",
  city: "Köln",
  country: "Deutschland",

  phone: "02443 9124069",
  phoneHref: "+4924439124069",

  website: "www.leonnrestaurant.com",
  websiteUrl: "https://www.leonnrestaurant.com",

  instagramUrl: "https://www.instagram.com/leonn.restaurant",
  googleMapsUrl: "https://maps.app.goo.gl/cTvdFSddYRzERyL26?g_st=ic",
};

/** "Bergisch Gladbacher Straße 261–263, 51063 Köln" */
export const CONTACT_ADDRESS_LINE = `${CONTACT.street}, ${CONTACT.postalCode} ${CONTACT.city}`;
