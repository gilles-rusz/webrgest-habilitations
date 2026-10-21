import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Web RG Est / Habilitations",
    short_name: "RG Habilitations",
    description: "Habilitations du personnel par poste, papiers signés et planning de rotation automatique.",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: "#141729",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
