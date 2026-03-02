import { ExternalLink } from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  url: string;
  icon?: string;
  order_index: number;
}

interface MenuPageProps {
  link: {
    name: string;
    headline?: string;
    subtitle?: string;
    description?: string;
    theme_bg_color?: string;
    theme_text_color?: string;
    theme_button_bg?: string;
    theme_button_text?: string;
    theme_font?: string;
  };
  menuItems: MenuItem[];
}

const FONT_MAP: Record<string, string> = {
  Inter: "'Inter', sans-serif",
  Roboto: "'Roboto', sans-serif",
  Playfair: "'Playfair Display', serif",
  Lato: "'Lato', sans-serif",
  "Open Sans": "'Open Sans', sans-serif",
  Bebas: "'Bebas Neue', sans-serif",
  Cinzel: "'Cinzel', serif",
  "Space Mono": "'Space Mono', monospace",
  Comfortaa: "'Comfortaa', cursive",
};

export const MenuPage = ({ link, menuItems }: MenuPageProps) => {
  const bgColor = link.theme_bg_color || "#0f172a";
  const textColor = link.theme_text_color || "#f8fafc";
  const btnBg = link.theme_button_bg || "#22c55e";
  const btnText = link.theme_button_text || "#ffffff";
  const fontFamily = FONT_MAP[link.theme_font || "Inter"] || "'Inter', sans-serif";

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-12"
      style={{ backgroundColor: bgColor, color: textColor, fontFamily }}
    >
      {/* Google Fonts */}
      <link
        href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(link.theme_font || "Inter")}:wght@400;600;700&display=swap`}
        rel="stylesheet"
      />

      <div className="w-full max-w-md space-y-6">
        {/* Profile section */}
        <div className="text-center space-y-3">
          <div
            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: btnBg, color: btnText }}
          >
            {(link.headline || link.name).charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold">{link.headline || link.name}</h1>
          {(link.description || link.subtitle) && (
            <p className="text-sm opacity-80">{link.description || link.subtitle}</p>
          )}
        </div>

        {/* Menu items */}
        <div className="space-y-3">
          {menuItems
            .sort((a, b) => a.order_index - b.order_index)
            .map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full px-5 py-4 rounded-xl text-center font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                style={{
                  backgroundColor: btnBg,
                  color: btnText,
                }}
              >
                <span className="flex-1 text-center">{item.label}</span>
                <ExternalLink className="w-4 h-4 opacity-60 shrink-0" />
              </a>
            ))}
        </div>

        {menuItems.length === 0 && (
          <p className="text-center text-sm opacity-50">Nenhum link adicionado ainda</p>
        )}
      </div>
    </div>
  );
};
