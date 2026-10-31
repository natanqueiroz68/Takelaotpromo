// api/_dates.js
// Standardized South African (Africa/Johannesburg, UTC+2) date handling for Takealot.
// Guarantees:
// 1. Order Date is strictly based on Africa/Johannesburg timezone (SAST: UTC+2).
// 2. Estimated Delivery Date = Order Date + exactly 8 calendar days.
// 3. Immutability: Once computed and stored, dates never change.

'use strict';

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Extracts calendar date (year, month 1-12, day 1-31) in Africa/Johannesburg (UTC+2).
 */
function getJohannesburgDateParts(d) {
  let dateObj = d instanceof Date ? d : (d ? new Date(d) : new Date());
  if (isNaN(dateObj.getTime())) dateObj = new Date();

  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Johannesburg',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour12: false,
    });
    const parts = dtf.formatToParts(dateObj);
    const p = {};
    for (let i = 0; i < parts.length; i++) {
      p[parts[i].type] = parts[i].value;
    }
    return {
      year: parseInt(p.year, 10),
      month: parseInt(p.month, 10),
      day: parseInt(p.day, 10),
    };
  } catch (_) {
    // SAST is UTC+2 with no daylight saving time
    const jhbDate = new Date(dateObj.getTime() + 2 * 3600 * 1000);
    return {
      year: jhbDate.getUTCFullYear(),
      month: jhbDate.getUTCMonth() + 1,
      day: jhbDate.getUTCDate(),
    };
  }
}

/**
 * Computes deterministic order and delivery date representations in Africa/Johannesburg.
 * Formula: Estimated Delivery Date = Order Date + 8 calendar days.
 */
function computeOrderDates(orderDateInput, existingDeliveryDate) {
  const parts = getJohannesburgDateParts(orderDateInput);
  const jhbYear = parts.year;
  const jhbMonth = parts.month; // 1-12
  const jhbDay = parts.day;     // 1-31

  // Midday UTC anchors guarantee timezone-immune calendar day representation
  const orderAnchor = new Date(Date.UTC(jhbYear, jhbMonth - 1, jhbDay, 12, 0, 0));

  let deliveryAnchor;
  if (existingDeliveryDate) {
    const edParts = getJohannesburgDateParts(existingDeliveryDate);
    deliveryAnchor = new Date(Date.UTC(edParts.year, edParts.month - 1, edParts.day, 12, 0, 0));
  } else {
    // Exactly 8 calendar days after order date
    deliveryAnchor = new Date(Date.UTC(jhbYear, jhbMonth - 1, jhbDay + 8, 12, 0, 0));
  }

  const oDayOfWeek = DAYS_SHORT[orderAnchor.getUTCDay()];
  const oMonthName = MONTHS_SHORT[orderAnchor.getUTCMonth()];
  const oDay = orderAnchor.getUTCDate();
  const oYear = orderAnchor.getUTCFullYear();

  const dDayOfWeekShort = DAYS_SHORT[deliveryAnchor.getUTCDay()];
  const dDayOfWeekLong = DAYS_LONG[deliveryAnchor.getUTCDay()];
  const dMonthNameShort = MONTHS_SHORT[deliveryAnchor.getUTCMonth()];
  const dMonthNameLong = MONTHS_LONG[deliveryAnchor.getUTCMonth()];
  const dDay = deliveryAnchor.getUTCDate();
  const dYear = deliveryAnchor.getUTCFullYear();

  const rawInput = orderDateInput instanceof Date ? orderDateInput : (orderDateInput ? new Date(orderDateInput) : null);
  const receivedIso = (rawInput && !isNaN(rawInput.getTime())) ? rawInput.toISOString() : new Date().toISOString();

  return {
    received_date: receivedIso,
    delivery_date: deliveryAnchor.toISOString(),
    order_date_formatted: `${oDayOfWeek}, ${oDay} ${oMonthName} ${oYear}`,
    delivery_date_formatted: `${dDayOfWeekShort}, ${dDay} ${dMonthNameShort} ${dYear}`,
    delivery_date_long: `${dDayOfWeekLong}, ${dDay} ${dMonthNameLong} ${dYear}`,
    delivery_date_iso: deliveryAnchor.toISOString().slice(0, 10),
  };
}

module.exports = {
  getJohannesburgDateParts,
  computeOrderDates,
};
