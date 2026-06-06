import { Youtube } from "lucide-react";
import { useLocation } from "wouter";
import { useT } from "@/i18n/LanguageContext";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.15 8.15 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
    </svg>
  );
}

export default function Footer() {
  const t = useT();
  const [, setLocation] = useLocation();
  return (
    <footer className="mt-16 pb-8 border-t border-border/40 pt-8 text-center">
      <p className="text-sm text-muted-foreground/50 mb-4 max-w-xs mx-auto leading-relaxed">
        {t.footerTagline}
      </p>
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => setLocation("/about")}
          className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          {t.navAbout}
        </button>
        <span className="text-muted-foreground/25 select-none">·</span>
        <button
          onClick={() => setLocation("/privacy")}
          className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          {t.navPrivacy}
        </button>
      </div>
      <p className="text-xs text-muted-foreground/40 font-medium uppercase tracking-widest mb-4">
        Follow Quran Word Quest
      </p>
      <div className="flex items-center justify-center gap-6 flex-wrap">
        <a
          href="https://www.youtube.com/@QuranWordQuest"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-primary transition-colors"
        >
          <Youtube className="w-4 h-4" />
          YouTube
        </a>
        <span className="text-muted-foreground/25 select-none">·</span>
        <a
          href="https://www.instagram.com/quranwordquest"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-primary transition-colors"
        >
          <InstagramIcon className="w-4 h-4" />
          Instagram
        </a>
        <span className="text-muted-foreground/25 select-none">·</span>
        <a
          href="https://www.tiktok.com/@quranwordquest"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-primary transition-colors"
        >
          <TikTokIcon className="w-4 h-4" />
          TikTok
        </a>
      </div>
    </footer>
  );
}
