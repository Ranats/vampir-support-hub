import HomePage from "../HomePage";
import LanguagePreferenceRedirect from "../LanguagePreferenceRedirect";

export default function Home() {
  return (
    <>
      <LanguagePreferenceRedirect page="home" />
      <HomePage locale="ja" />
    </>
  );
}
