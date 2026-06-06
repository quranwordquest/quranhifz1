import { Switch, Route } from "wouter";
import { LanguageProvider } from "@/i18n/LanguageContext";
import SurahSelectionPage from "@/pages/SurahSelectionPage";
import SurahModePage from "@/pages/SurahModePage";
import AyahListPage from "@/pages/AyahListPage";
import ArrangeAyahsPage from "@/pages/ArrangeAyahsPage";
import RandomChallengePage from "@/pages/RandomChallengePage";
import PuzzlePage from "@/pages/PuzzlePage";
import AboutPage from "@/pages/AboutPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import NotFound from "@/pages/not-found";

export default function App() {
  return (
    <LanguageProvider>
      <Switch>
        <Route path="/" component={SurahSelectionPage} />
        <Route path="/surah/:surahNumber" component={SurahModePage} />
        <Route path="/surah/:surahNumber/word" component={AyahListPage} />
        <Route path="/arrange/:surahNumber/:from" component={ArrangeAyahsPage} />
        <Route path="/challenge" component={RandomChallengePage} />
        <Route path="/challenge/:difficulty" component={RandomChallengePage} />
        <Route path="/puzzle/:surahNumber/:ayahNumber" component={PuzzlePage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/privacy" component={PrivacyPolicyPage} />
        <Route component={NotFound} />
      </Switch>
    </LanguageProvider>
  );
}
