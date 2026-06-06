import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { useT } from "@/i18n/LanguageContext";
import Footer from "@/components/Footer";

export default function AboutPage() {
  const [, setLocation] = useLocation();
  const t = useT();

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center py-10 px-4 bg-background text-foreground">
      <div className="max-w-2xl w-full flex flex-col gap-8">

        <motion.button
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          onClick={() => setLocation("/")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors self-start text-sm font-medium"
          aria-label="Home"
        >
          <Home className="w-4 h-4" />
          {t.home}
        </motion.button>

        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-5"
        >
          <h1
            className="text-2xl md:text-3xl font-serif font-bold tracking-tight"
            style={{ color: "var(--game-coral, #FF6B6B)" }}
          >
            {t.aboutTitle}
          </h1>

          <p className="text-foreground/80 leading-relaxed">{t.aboutP1}</p>

          <div>
            <p className="text-foreground/80 leading-relaxed mb-3">{t.aboutP2}</p>
            <ul className="space-y-2">
              {[t.aboutBullet1, t.aboutBullet2, t.aboutBullet3, t.aboutBullet4, t.aboutBullet5].map(
                (bullet, i) => (
                  <li key={i} className="flex items-start gap-3 text-foreground/80">
                    <span
                      className="mt-2 w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: "var(--game-coral, #FF6B6B)" }}
                    />
                    {bullet}
                  </li>
                )
              )}
            </ul>
          </div>

          <p className="text-foreground/80 leading-relaxed">{t.aboutP3}</p>

          <p className="text-foreground/60 italic leading-relaxed border-t border-border pt-5">
            {t.aboutDua}
          </p>
        </motion.article>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.12 }}
          onClick={() => setLocation("/")}
          className="self-center px-6 py-2.5 rounded-full border border-border text-sm font-medium text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-all"
        >
          {t.backToHome}
        </motion.button>

        <Footer />
      </div>
    </div>
  );
}
