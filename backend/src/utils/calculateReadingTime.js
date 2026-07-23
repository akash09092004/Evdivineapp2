const calculateReadingTime = (content) => {
  const words = String(content || '')
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  if (!words) {
    return 1;
  }

  return Math.max(1, Math.ceil(words / 200));
};

module.exports = { calculateReadingTime };
