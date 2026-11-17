'use client';

import dynamic from 'next/dynamic';

const PhotoboothApp = dynamic(() => import('@/components/PhotoboothApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
      <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-semibold text-sm tracking-wide">Loading SnapBox Photobooth...</p>
    </div>
  ),
});

export default function Home() {
  return <PhotoboothApp />;
}
