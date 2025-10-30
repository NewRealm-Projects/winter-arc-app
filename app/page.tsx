export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-winter-500 to-winter-700">
      <div className="text-center">
        <div className="text-6xl mb-4">❄️</div>
        <h1 className="text-white text-2xl font-bold mb-4">Winter Arc</h1>
        <p className="text-winter-200 mb-6">Next.js Migration erfolgreich!</p>
        <div className="space-y-2">
          <p className="text-sm text-winter-300">✅ Next.js 15 App Router</p>
          <p className="text-sm text-winter-300">✅ TypeScript konfiguriert</p>
          <p className="text-sm text-winter-300">✅ Tailwind CSS aktiv</p>
          <p className="text-sm text-winter-300">⏳ Database Migration folgt</p>
        </div>
      </div>
    </div>
  );
}
