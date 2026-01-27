export default function RootLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background-secondary flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
