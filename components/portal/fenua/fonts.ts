// Fenua Studio's fonts, for the client spaces shown in its brand: Cabinet Grotesk
// for titles, General Sans for text. Same files as fenua-studio-site/app/fonts.ts,
// under their own variable names so they never replace Redline's on the page.
import localFont from "next/font/local";

export const fenuaDisplay = localFont({
  variable: "--fenua-display",
  display: "swap",
  src: [
    { path: "./fonts/CabinetGrotesk-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/CabinetGrotesk-Bold.woff2", weight: "700", style: "normal" },
  ],
});

export const fenuaBody = localFont({
  variable: "--fenua-body",
  display: "swap",
  src: [
    { path: "./fonts/GeneralSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/GeneralSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/GeneralSans-Semibold.woff2", weight: "600", style: "normal" },
  ],
});
