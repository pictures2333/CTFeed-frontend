import { APP_CONFIG } from "../../config";

type HomePageProps = {
  onLogin: () => void;
};

export default function HomePage({ onLogin }: HomePageProps) {
  return (
    <main className="home">
      <div className="home-card">
        <img className="logo" src={APP_CONFIG.logoUrl} alt={APP_CONFIG.appTitle} />
        <h1>{APP_CONFIG.appTitle}</h1>
        <button className="primary" type="button" onClick={onLogin}>
          Login with Discord
        </button>
      </div>
    </main>
  );
}
