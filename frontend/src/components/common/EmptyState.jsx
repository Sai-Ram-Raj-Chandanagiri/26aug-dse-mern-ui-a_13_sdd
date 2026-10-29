// Reusable "no results" state (FR-025) — announced via role="status" rather than color/icon alone
// (Constitution Principle II) so a keyword search or type filter yielding zero matches is still a
// 200-with-empty-items success state, not an error.
export default function EmptyState({ message = "No results found." }) {
  return (
    <p role="status" className="text-muted-foreground">
      {message}
    </p>
  );
}
