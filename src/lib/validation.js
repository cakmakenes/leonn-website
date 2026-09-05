/**
 * Server-side input validation.
 *
 * The client forms do their own validation for UX, but that is trivially
 * bypassed, so every public write endpoint must re-validate here.
 * Error messages are in German because they are surfaced to end users.
 */

const RESTAURANT_TIME_ZONE = "Europe/Berlin";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const PHONE_PATTERN = /^[\d\s+()/.-]{5,30}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const LIMITS = {
  name: 100,
  email: 254,
  phone: 30,
  specialRequests: 1000,
  voucherMessage: 400,
  minGuests: 1,
  maxGuests: 20,
  minAmount: 10,
  maxAmount: 1000,
  reservationLeadMinutes: 15,
  maxDaysAhead: 365,
};

/** Collapses whitespace, strips control characters and enforces a max length. */
export function sanitizeText(value, maxLength) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function isValidEmail(value) {
  return typeof value === "string" && value.length <= LIMITS.email && EMAIL_PATTERN.test(value);
}

/** Current date in the restaurant's time zone as YYYY-MM-DD. */
function todayInRestaurantTz() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: RESTAURANT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Current wall-clock minutes since midnight in the restaurant's time zone. */
function nowMinutesInRestaurantTz() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: RESTAURANT_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  const [hours, minutes] = parts.split(":").map(Number);
  return hours * 60 + minutes;
}

function daysBetweenIsoDates(fromIso, toIso) {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  return Math.round((to - from) / 86400000);
}

/**
 * Validates the public reservation payload.
 * Returns { errors: string[], data } where `data` is safe to persist.
 */
export function validateReservationInput(body) {
  const errors = [];

  if (!body || typeof body !== "object") {
    return { errors: ["Ungültige Anfrage."], data: null };
  }

  const name = sanitizeText(body.name, LIMITS.name);
  const email = sanitizeText(body.email, LIMITS.email).toLowerCase();
  const phone = sanitizeText(body.phone, LIMITS.phone);
  const date = sanitizeText(body.date, 10);
  const time = sanitizeText(body.time, 5);
  const specialRequests = sanitizeText(body.specialRequests, LIMITS.specialRequests);
  const guests = Number(body.guests);

  if (name.length < 2) errors.push("Bitte geben Sie Ihren Namen an.");
  if (!isValidEmail(email)) errors.push("Bitte geben Sie eine gültige E-Mail-Adresse an.");
  if (!PHONE_PATTERN.test(phone)) errors.push("Bitte geben Sie eine gültige Telefonnummer an.");

  if (!Number.isInteger(guests) || guests < LIMITS.minGuests || guests > LIMITS.maxGuests) {
    errors.push(
      `Die Personenanzahl muss zwischen ${LIMITS.minGuests} und ${LIMITS.maxGuests} liegen.`
    );
  }

  if (!DATE_PATTERN.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    errors.push("Bitte geben Sie ein gültiges Datum an.");
  }
  if (!TIME_PATTERN.test(time)) {
    errors.push("Bitte geben Sie eine gültige Uhrzeit an.");
  }

  if (errors.length === 0) {
    const today = todayInRestaurantTz();

    if (date < today) {
      errors.push("Das Datum liegt in der Vergangenheit.");
    } else if (daysBetweenIsoDates(today, date) > LIMITS.maxDaysAhead) {
      errors.push("Reservierungen sind maximal ein Jahr im Voraus möglich.");
    } else if (date === today) {
      const [hours, minutes] = time.split(":").map(Number);
      if (hours * 60 + minutes < nowMinutesInRestaurantTz() + LIMITS.reservationLeadMinutes) {
        errors.push("Bitte wählen Sie eine Uhrzeit, die mindestens 15 Minuten in der Zukunft liegt.");
      }
    }
  }

  if (errors.length > 0) return { errors, data: null };

  return {
    errors: [],
    data: {
      name,
      email,
      phone,
      // Stored as UTC midnight; `time` carries the wall-clock time separately.
      date: new Date(`${date}T00:00:00.000Z`),
      time,
      guests,
      specialRequests,
    },
  };
}

/**
 * Validates the voucher checkout payload.
 * `amountCents` is the authoritative value handed to Stripe.
 */
export function validateCheckoutInput(body) {
  const errors = [];

  if (!body || typeof body !== "object") {
    return { errors: ["Ungültige Anfrage."], data: null };
  }

  const buyerName = sanitizeText(body.buyerName, LIMITS.name);
  const buyerEmail = sanitizeText(body.buyerEmail, LIMITS.email).toLowerCase();
  const recipientName = sanitizeText(body.recipientName, LIMITS.name);
  const recipientEmail = sanitizeText(body.recipientEmail, LIMITS.email).toLowerCase();
  const message = sanitizeText(body.message, LIMITS.voucherMessage);

  const rawAmount = typeof body.amount === "string" ? body.amount.replace(",", ".") : body.amount;
  const amount = Number(rawAmount);
  const amountCents = Math.round(amount * 100);

  if (buyerName.length < 2) errors.push("Bitte geben Sie Ihren Namen an.");
  if (!isValidEmail(buyerEmail)) errors.push("Bitte geben Sie eine gültige E-Mail-Adresse an.");
  if (!isValidEmail(recipientEmail)) {
    errors.push("Bitte geben Sie eine gültige E-Mail-Adresse des Empfängers an.");
  }

  if (!Number.isFinite(amount)) {
    errors.push("Bitte geben Sie einen gültigen Betrag an.");
  } else if (amount < LIMITS.minAmount || amount > LIMITS.maxAmount) {
    errors.push(`Der Betrag muss zwischen ${LIMITS.minAmount} € und ${LIMITS.maxAmount} € liegen.`);
  } else if (Math.abs(amountCents - amount * 100) > 1e-6) {
    errors.push("Der Betrag darf maximal zwei Dezimalstellen haben.");
  }

  if (errors.length > 0) return { errors, data: null };

  return {
    errors: [],
    data: { amountCents, buyerName, buyerEmail, recipientName, recipientEmail, message },
  };
}

/** Voucher codes are always LEONN- followed by 6-12 uppercase base32 characters. */
export function normalizeVoucherCode(value) {
  const code = sanitizeText(value, 32).toUpperCase().replace(/\s/g, "");
  return /^LEONN-[A-Z2-9]{6,12}$/.test(code) ? code : null;
}

/** Redemption amount in euros, max two decimals, strictly positive. */
export function parseRedemptionAmount(value) {
  const raw = typeof value === "string" ? value.replace(",", ".") : value;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const cents = Math.round(amount * 100);
  if (Math.abs(cents - amount * 100) > 1e-6) return null;
  if (cents > LIMITS.maxAmount * 100) return null;
  return cents / 100;
}

/* ------------------------------------------------------------------------- */
/* Menu administration                                                       */
/* ------------------------------------------------------------------------- */

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

export const MENU_LIMITS = {
  categoryName: 60,
  itemName: 120,
  itemDescription: 500,
  // A four-digit price is already implausible for a restaurant; the cap exists
  // to stop a typo like "2500" (meant as 25,00) from being stored silently.
  maxPriceEuro: 9999.99,
  maxBulkIds: 500,
};

export function isValidObjectId(value) {
  return typeof value === "string" && OBJECT_ID_PATTERN.test(value);
}

/**
 * Accepts "12.50", "12,50", "12" and returns integer cents, or null.
 * Rejects anything with more than two decimals rather than rounding it, so the
 * admin sees the value they typed being refused instead of silently changed.
 */
export function parsePriceToCents(value) {
  if (value === null || value === undefined || value === "") return null;

  const raw = String(value).trim().replace(",", ".");
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(raw)) return null;

  const euros = Number(raw);
  if (!Number.isFinite(euros) || euros < 0 || euros > MENU_LIMITS.maxPriceEuro) return null;

  return Math.round(euros * 100);
}

/** Form checkboxes arrive as "true"/"false"/"on"; JSON sends real booleans. */
function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  const text = String(value).toLowerCase();
  if (["true", "1", "on", "yes"].includes(text)) return true;
  if (["false", "0", "off", "no"].includes(text)) return false;
  return fallback;
}

/**
 * Validates a category create/update payload.
 * With `partial: true` only the supplied keys are validated and returned, which
 * is what PATCH needs.
 */
export function validateCategoryInput(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!body || typeof body !== "object") {
    return { errors: ["Ungültige Anfrage."], data: null };
  }

  const hasName = body.name !== undefined;
  if (hasName || !partial) {
    const name = sanitizeText(body.name, MENU_LIMITS.categoryName);
    if (name.length < 2) {
      errors.push("Der Kategoriename muss mindestens 2 Zeichen lang sein.");
    } else {
      data.name = name;
    }
  }

  if (body.isVisible !== undefined) {
    data.isVisible = parseBoolean(body.isVisible, true);
  } else if (!partial) {
    data.isVisible = true;
  }

  if (errors.length > 0) return { errors, data: null };
  return { errors: [], data };
}

/**
 * Validates a menu item create/update payload.
 * The image is handled separately: it arrives as a file, not as a field.
 */
export function validateMenuItemInput(body, { partial = false } = {}) {
  const errors = [];
  const data = {};

  if (!body || typeof body !== "object") {
    return { errors: ["Ungültige Anfrage."], data: null };
  }

  if (body.categoryId !== undefined || !partial) {
    if (!isValidObjectId(body.categoryId)) {
      errors.push("Bitte wählen Sie eine gültige Kategorie.");
    } else {
      data.categoryId = body.categoryId;
    }
  }

  if (body.name !== undefined || !partial) {
    const name = sanitizeText(body.name, MENU_LIMITS.itemName);
    if (name.length < 2) {
      errors.push("Der Produktname muss mindestens 2 Zeichen lang sein.");
    } else {
      data.name = name;
    }
  }

  if (body.description !== undefined || !partial) {
    data.description = sanitizeText(body.description, MENU_LIMITS.itemDescription);
  }

  if (body.price !== undefined || !partial) {
    const priceCents = parsePriceToCents(body.price);
    if (priceCents === null) {
      errors.push("Bitte geben Sie einen gültigen Preis an (max. zwei Dezimalstellen).");
    } else {
      data.priceCents = priceCents;
    }
  }

  if (body.isVisible !== undefined) {
    data.isVisible = parseBoolean(body.isVisible, true);
  } else if (!partial) {
    data.isVisible = true;
  }

  if (errors.length > 0) return { errors, data: null };
  return { errors: [], data };
}

/** Validates a reorder payload: a bounded array of distinct object ids. */
export function validateIdOrder(value) {
  if (!Array.isArray(value) || value.length === 0) return null;
  if (value.length > MENU_LIMITS.maxBulkIds) return null;
  if (!value.every(isValidObjectId)) return null;

  const unique = [...new Set(value)];
  return unique.length === value.length ? unique : null;
}
