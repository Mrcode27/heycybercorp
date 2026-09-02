export type SiteSettings = {
  theme: Theme;
  ringColors: string[];
  fluidColors: string[];
  heroAnimation: HeroAnimation;
  fluidColorMode: FluidColorMode;
  /** Whether the fluid cursor trail runs at all. Default: on. */
  fluidEnabled: boolean;
  /** Strength of the fluid trail, 0–100. */
  fluidDensity: number;
  /** Ambient digital-rain backdrop below the hero. */
  cyberRain: boolean;
  /** Colours of the digital-rain glyphs. */
  cyberRainColors: string[];
  /** Opacity of the rain layer, 0–100. */
  cyberRainOpacity: number;
  /** Enable email notifications for broadcast messages. Default: false. */
  broadcastEmailEnabled: boolean;
};