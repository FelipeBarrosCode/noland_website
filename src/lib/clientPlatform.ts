export type MobileOperatingSystem = "iOS" | "Android" | null;

export function detectMobileOperatingSystem(
  platform: string,
  userAgent: string,
  maxTouchPoints = 0,
): MobileOperatingSystem {
  const fingerprint = `${platform} ${userAgent}`.toLowerCase();

  if (/android/u.test(fingerprint)) return "Android";
  if (/iphone|ipad|ipod/u.test(fingerprint)) return "iOS";
  // Desktop-mode iPads report MacIntel, but ordinary touch laptops must stay desktop.
  if (platform.toLowerCase() === "macintel" && maxTouchPoints > 1) return "iOS";
  return null;
}

export function detectNavigatorMobileOperatingSystem(): MobileOperatingSystem {
  if (typeof navigator === "undefined") return null;

  return detectMobileOperatingSystem(
    navigator.platform ?? "",
    navigator.userAgent ?? "",
    navigator.maxTouchPoints ?? 0,
  );
}

export type DesktopOperatingSystem = "Windows" | "macOS" | "Linux" | "Unknown";

export function detectDesktopOperatingSystem(platform: string, userAgent: string): DesktopOperatingSystem {
  const fingerprint = `${platform} ${userAgent}`.toLowerCase();

  if (/android|iphone|ipad|ipod/u.test(fingerprint)) return "Unknown";
  if (/windows|win32|win64/u.test(fingerprint)) return "Windows";
  if (/macintosh|mac os|macintel|macarm/u.test(fingerprint)) return "macOS";
  if (/linux|x11/u.test(fingerprint)) return "Linux";
  return "Unknown";
}

export function detectNavigatorOperatingSystem(): DesktopOperatingSystem {
  if (typeof navigator === "undefined") return "Unknown";

  const browserNavigator = navigator as Navigator & { userAgentData?: { platform?: string } };
  return detectDesktopOperatingSystem(
    browserNavigator.userAgentData?.platform ?? browserNavigator.platform ?? "",
    browserNavigator.userAgent ?? "",
  );
}
