// Fixed-page-size, page-number-based pagination (research.md: MongoDB strategy, SC-009)
const DEFAULT_PAGE_SIZE = 20;

function parsePageParam(rawPage) {
  const page = Number.parseInt(rawPage, 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function getPagination(query, pageSize = DEFAULT_PAGE_SIZE) {
  const page = parsePageParam(query?.page);
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip, limit: pageSize };
}

function buildPaginatedResult({ items, page, pageSize, totalItems }) {
  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  };
}

module.exports = { DEFAULT_PAGE_SIZE, getPagination, buildPaginatedResult };
