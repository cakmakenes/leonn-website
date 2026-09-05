/**
 * Single source of truth for the restaurant's public contact details.
 *
 * These values appear in the footer, the Kontakt and Impressum pages, the
 * voucher PDF and email templates. Keeping them here means a change of address
 * or phone number is a one-line edit instead of a hunt across the codebase.
 *
 * The address and website are taken from the official brand letterhead
 * (design/Leonn - Final/Antetli). Fields the owner still has to confirm are
 * marked with a TODO so they are easy to find before launch.
 */

export const CONTACT = {
  name: "Leonn Restaurant",

  // From the brand letterhead.
  street: "Bergisch Gladbacher Str. 263",
  postalCode: "51063",
  city: "Köln",
  country: "Deutschland",

  // TODO(owner): confirm the public phone number and inbox before launch.
  phone: "+49 221 1234567",
  phoneHref: "+492211234567",
  email: "info@leonnrestaurant.com",

  website: "www.leonnrestaurant.com",
  websiteUrl: "https://www.leonnrestaurant.com",

  // TODO(owner): replace with the real profile URLs.
  instagramUrl: "https://www.instagram.com/leonnrestaurant",
  // A Google Maps place/search link for the address above.
  googleMapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Leonn+Restaurant+Bergisch+Gladbacher+Str.+263+51063+K%C3%B6ln",
};

/** "Bergisch Gladbacher Str. 263, 51063 Köln" */
export const CONTACT_ADDRESS_LINE = `${CONTACT.street}, ${CONTACT.postalCode} ${CONTACT.city}`;
