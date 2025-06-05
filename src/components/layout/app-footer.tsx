export function AppFooter() {
  return (
    <footer className="bg-card shadow-sm mt-auto">
      <div className="container mx-auto px-4 py-4 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} CodeCrafter. Learn, Code, Conquer.</p>
      </div>
    </footer>
  );
}
