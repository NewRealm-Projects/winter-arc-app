'use client';

export default function Offline() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 text-white">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">You&apos;re Offline</h1>
        <p className="mb-8 text-lg text-slate-300">
          It looks like you&apos;re not connected to the internet. Don&apos;t worry, your data is
          safe!
        </p>
        <p className="text-slate-400">
          Winter Arc will sync your progress once you&apos;re back online.
        </p>
      </div>
    </div>
  );
}
