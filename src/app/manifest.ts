import type { MetadataRoute } from "next";

/**
 * The app manifest: what a phone needs to install Blind Box on its home
 * screen and open it like an app — full screen, no browser bars, in the
 * app's own colours, with its own icon.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Blind Box",
    short_name: "Blind Box",
    description: "Open a blind box, keep what you pull, and ship it for real.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#08080b",
    theme_color: "#08080b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
