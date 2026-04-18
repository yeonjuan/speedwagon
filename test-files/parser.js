function parseDate(str) {
  const match = str.match(/^\d{4}-\d{2}-\d{2}$/);
  return match ? new Date(str) : null;
}

function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str);
}

function normalizeDate(str) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  return null;
}
