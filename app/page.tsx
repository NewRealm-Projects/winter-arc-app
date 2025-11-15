import { Suspense } from 'react';
import { HomePage } from './components/HomePage';

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-winter-500 to-winter-700">
      <div className="text-center">
        <div className="text-6xl mb-4">❄️</div>
        <div className="text-white text-lg font-semibold">Winter Arc</div>
        <div className="text-winter-200 mt-2">Wird geladen ...</div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomePage />
    </Suspense>
  );
}
