import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-xl text-center space-y-4 font-body text-[#0e0f0c]">
      <h2 className="text-3xl font-heading font-black text-[#0e0f0c]">Page non trouvée 404</h2>
      <p className="text-xs text-[#868685]">La page que vous cherchez n'existe pas ou a été déplacée.</p>
      <Link href="/" className="button-tanit-primary inline-block text-xs">
        Retourner à l'accueil TanitMarket
      </Link>
    </div>
  );
}
