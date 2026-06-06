import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { useT } from "@/i18n/LanguageContext";
import Footer from "@/components/Footer";

export default function PrivacyPolicyPage() {
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
            {t.privacyTitle}
          </h1>

          {[t.privacyP1, t.privacyP2, t.privacyP3, t.privacyP4, t.privacyP5, t.privacyP6].map(
            (para, i) => (
              <p key={i} className="text-foreground/80 leading-relaxed">
                {para}
              </p>
            )
          )}
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
