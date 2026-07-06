Design a complete multi-page frontend for a French-language cybersecurity e-learning platform called heycybercorp targeting African and European markets.

INSPIRATION: Take strong visual inspiration from use the html code below as ref for the home page  — replicate its layout structure, spacing rhythm, component style, and overall visual hierarchy. Adapt it to fit the heycybercorp brand and content below.

BRAND COLORS (strictly use only these — replace whatever colors the reference site uses):
- Primary Dark Background: #121A17
- Deepest Background: #080C0A
- Accent Green: #009150
- Accent Teal/Cyan: #0097B2
- Forest Green: #004630
- Pure Dark: #000202
- Text: white and light gray on dark backgrounds

DESIGN STYLE:
- Dark mode only
- Cybersecurity / tech aesthetic
- French language interface throughout
- Keep the same layout DNA as the inspiration site but make it feel like a premium hacking/security academy

PAGES TO DESIGN (all of them):

1. LANDING PAGE
- Hero section with tagline, subtitle, and two CTAs (Découvrir nos formations / Voir les tarifs)
- Course preview cards (Débutant, Intermédiaire, Hacking)
- Pricing preview with Afrique/Europe toggle
- Quote request form
- Footer with LinkedIn, Facebook, YouTube

2. COURSES PAGE
- Catalogue in 3 tiers with locked/unlocked card states
- Level filter bar

3. PRICING PAGE
- Region toggle: Afrique / Europe
- 3 plan cards: Débutant / Intermédiaire / Hacking Pro
- Africa: 15,000 FCFA / 30,000 FCFA / 45,000 FCFA
- Europe: 40€ / 60€ / 80€
- Feature comparison table

4. ENTERPRISE PAGE
- Company story, team section, contact, social links

5. CONTACT PAGE
- Form: Nom, Email, Sujet, Message

6. AUTH PAGES
- Login and Register (with region selector: Afrique / Europe)

7. USER DASHBOARD
- Plan status, renewal date, course progress cards, sidebar nav

8. ADMIN PANEL
- Sidebar: Users, Courses, Subscriptions, Reports
- Course and user management tables

TYPOGRAPHY: Match the type scale of the inspiration site. Use Inter or Space Grotesk as fallback.
COMPONENTS: Replicate the card style, button style, and navigation pattern from the reference — but apply the heycybercorp color palette and cybersecurity aesthetic throughout.




## home
<!DOCTYPE html>

<html class="dark" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>hycyber | Maîtrisez l'Art de la Cyberdéfense</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&amp;family=Inter:wght@300;400;500;600&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind Configuration -->
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                "on-background": "#dce5df",
                "primary-fixed-dim": "#6add93",
                "on-tertiary-fixed-variant": "#11513a",
                "tertiary-fixed": "#b2f0d1",
                "surface-container": "#19211e",
                "secondary-container": "#199eb9",
                "on-surface-variant": "#bdcabd",
                "surface-container-lowest": "#08100d",
                "inverse-surface": "#dce5df",
                "on-secondary-fixed": "#001f26",
                "on-error": "#690005",
                "surface-container-low": "#151d1a",
                "secondary": "#66d5f1",
                "on-tertiary-fixed": "#002114",
                "on-error-container": "#ffdad6",
                "outline": "#879488",
                "surface-tint": "#6add93",
                "on-secondary-fixed-variant": "#004e5d",
                "tertiary-container": "#629d81",
                "on-secondary-container": "#002e38",
                "secondary-fixed": "#aeecff",
                "surface-container-high": "#242c28",
                "surface-variant": "#2e3733",
                "on-primary-container": "#003117",
                "outline-variant": "#3e4a40",
                "on-tertiary": "#003826",
                "tertiary-fixed-dim": "#97d3b5",
                "surface-dim": "#0d1512",
                "primary-container": "#2aa561",
                "on-primary": "#00391c",
                "primary": "#6add93",
                "error-container": "#93000a",
                "surface": "#0d1512",
                "surface-container-highest": "#2e3733",
                "on-primary-fixed-variant": "#00522b",
                "background": "#0d1512",
                "tertiary": "#97d3b5",
                "on-surface": "#dce5df",
                "inverse-on-surface": "#2a322f",
                "on-tertiary-container": "#003120",
                "error": "#ffb4ab",
                "primary-fixed": "#86faad",
                "on-primary-fixed": "#00210e",
                "secondary-fixed-dim": "#66d5f1",
                "on-secondary": "#003641",
                "surface-bright": "#333b37",
                "inverse-primary": "#006d3b"
            },
            "borderRadius": {
                "DEFAULT": "0.125rem",
                "lg": "0.25rem",
                "xl": "0.5rem",
                "full": "0.75rem"
            },
            "spacing": {
                "margin-mobile": "20px",
                "margin-desktop": "64px",
                "unit": "4px",
                "gutter": "24px",
                "container-max": "1280px"
            },
            "fontFamily": {
                "body-md": ["Inter"],
                "code-sm": ["JetBrains Mono"],
                "headline-lg": ["Space Grotesk"],
                "headline-lg-mobile": ["Space Grotesk"],
                "headline-xl": ["Space Grotesk"],
                "body-lg": ["Inter"],
                "label-mono": ["JetBrains Mono"]
            },
            "fontSize": {
                "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                "code-sm": ["13px", {"lineHeight": "18px", "fontWeight": "400"}],
                "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                "headline-lg-mobile": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                "headline-xl": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                "label-mono": ["14px", {"lineHeight": "20px", "letterSpacing": "0.05em", "fontWeight": "500"}]
            }
          },
        },
      }
    </script>
<style>
        body {
            background-color: #000202;
            background-image: 
                linear-gradient(to right, #121A17 1px, transparent 1px),
                linear-gradient(to bottom, #121A17 1px, transparent 1px);
            background-size: 40px 40px;
            color: #dce5df;
        }

        .cyber-glow-primary {
            box-shadow: 0 0 15px rgba(0, 145, 80, 0.4);
        }
        
        .cyber-glow-secondary {
            box-shadow: 0 0 15px rgba(0, 151, 178, 0.2);
        }

        .glass-panel {
            background: rgba(18, 26, 23, 0.75);
            backdrop-filter: blur(16px);
            border: 1px solid #004630;
        }

        .terminal-container {
            background: #000202;
            border-top: 2px solid #009150;
        }

        .cursor-blink {
            animation: blink 1s infinite;
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
        }

        .scroll-reveal {
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.6s ease-out;
        }

        .scroll-reveal.active {
            opacity: 1;
            transform: translateY(0);
        }
    </style>
</head>
<body class="font-body-md selection:bg-primary/30 selection:text-primary">
<!-- TopNavBar -->
<nav class="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm">
<div class="flex items-center justify-between px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
<div class="font-headline-lg text-headline-lg font-bold text-primary tracking-tighter">
                hycyber
            </div>
<div class="hidden md:flex items-center gap-8">
<a class="font-body-md text-body-md text-primary font-bold border-b-2 border-primary pb-1" href="#">Formations</a>
<a class="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Tarifs</a>
<a class="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Entreprise</a>
<a class="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Contact</a>
</div>
<button class="bg-primary-container text-on-primary-container px-6 py-2 rounded-lg font-bold hover:bg-primary transition-all active:scale-95">
                Connexion
            </button>
</div>
</nav>
<!-- Hero Section -->
<section class="relative min-h-screen flex items-center pt-24 overflow-hidden">
<div class="absolute inset-0 z-0 opacity-40">

</div>
<div class="relative z-10 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
<div class="space-y-8">
<div class="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-primary font-label-mono text-label-mono">
<span class="material-symbols-outlined text-[14px]">shield</span>
                    STATUS: SECURE_ENVIRONMENT_ALPHA
                </div>
<h1 class="font-headline-xl text-headline-xl lg:text-[64px] leading-tight text-white">
                    Maîtrisez l'Art de la <span class="text-primary italic">Cyberdéfense</span>
</h1>
<p class="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
                    Formations de pointe pour les talents africains et européens. Apprenez auprès des experts du renseignement et de la sécurité offensive.
                </p>
<div class="flex flex-wrap gap-4 pt-4">
<button class="px-8 py-4 bg-[#009150] text-white rounded-lg font-bold cyber-glow-primary hover:brightness-110 transition-all flex items-center gap-2 group">
                        Découvrir nos formations
                        <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
</button>
<button class="px-8 py-4 border border-[#0097B2] text-[#0097B2] rounded-lg font-bold hover:bg-[#0097B2]/10 transition-all">
                        Voir les tarifs
                    </button>
</div>
<div class="flex items-center gap-6 pt-8">
<div class="flex -space-x-3">
<img class="w-10 h-10 rounded-full border-2 border-background object-cover" data-alt="A professional headshot of a diverse cybersecurity expert in a dark, high-tech studio environment with subtle green rim lighting, representing the African tech community. High-end portrait photography style, dark aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhwrTEA_K5aY3h1iXBfWqJB2bdJ_dHKDcFvV5RGwVHdXhJMHjDl-cvrE3-bZqPw887ioECkWRpDcIg1JSZwB08sFQCIMFrVDe_j90OQeIDIuQ7sDGITUuOAee5OaNI_0cg2DgwMVmIylE0TPX4VKwu0ZFuXxCjs_f2pTt-Vl6SuQfZAoTnqawC4rmkdciffpdetgnSCJB1hb7h7nKZY6GnhqTlHz8RyPasji4tGsufJFVE78eF02rqiSL2Zi6PFwnGp9h4PYreV3SP"/>
<img class="w-10 h-10 rounded-full border-2 border-background object-cover" data-alt="A professional headshot of a technical female cybersecurity specialist with glasses, illuminated by the blue glow of digital screens in a dark, minimalist office. Professional, technical, and authoritative atmosphere." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdLP6EkYnmPG7HiD0u33TXPCqFhxmEKgNMiHcnVz2kVlbuZOQRFv4p1S3YBKqwTbDdiqEm0gVqk2tYCTDVXcrVZcc-hlpn0y2l6n4hr7hvF4k0oBX9sS0zL9b23w5NCCUbt68FFFzugC8OzAkuGP3PVw_jtJWqkSzQZ8prjm15FIygDXOKCCKynokpK0eq2y1zU8VFpmdc_0SKxHkhjEWICjGdWfqkfub0rGOPOmZApDm3zF3ZcE4l9wpVGerpPfd8o0oBVZMkvwLa"/>
<img class="w-10 h-10 rounded-full border-2 border-background object-cover" data-alt="A close-up portrait of a senior security architect in a dark tech-focused environment with subtle grid line reflections on his face. Cinematic lighting, sharp focus, professional cybersecurity aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuACJKeoYW6CMDESdG_vbZ8sqmHAt9MUaxscoM-UwCYneGCJcDvKlZobGFnAUGRd-SbZHvz4ExmkpkjrzpSl1mmW4couWk7YI6VtFD-5c0dbqtmIQk6TTlpMG7TfnnuYnMqM0hITEiEJuzoSqy87Ais6Ugww5HWgw-O3IISD-fpEALa5H4zYtE3QdlmfvgJzMUmFysx4W_WKlHF1D3dLxZgiZA2TrX0itjZe0-K_F62RUk3KA0TTyQnC9sCi4l8Hf_gk2rhS0Gw-1JvN"/>
</div>
<div class="text-on-surface-variant text-sm font-label-mono uppercase tracking-widest">
                        +500 Étudiants Formés en 2024
                    </div>
</div>
</div>
<div class="hidden lg:block relative">
<div class="terminal-container rounded-lg p-1 shadow-2xl overflow-hidden border border-outline-variant">
<div class="bg-surface-container-high px-4 py-2 flex items-center gap-2 border-b border-outline-variant">
<div class="flex gap-1.5">
<div class="w-3 h-3 rounded-full bg-error"></div>
<div class="w-3 h-3 rounded-full bg-secondary"></div>
<div class="w-3 h-3 rounded-full bg-primary"></div>
</div>
<div class="flex-1 text-center font-label-mono text-xs opacity-60">hycyber_terminal -- v2.0.4</div>
</div>
<div class="p-6 font-code-sm text-primary-fixed-dim bg-[#000202] min-h-[300px]">
<p class="mb-2"><span class="text-secondary">$</span> ssh admin@hycyber-academy</p>
<p class="mb-2 text-on-surface-variant italic">Connecting to secure training node...</p>
<p class="mb-2 text-primary">✓ Authenticated via SecureID</p>
<p class="mb-2"><span class="text-secondary">$</span> list --available-modules</p>
<div class="grid grid-cols-2 gap-x-4 gap-y-1 mb-4">
<p>1. Intrusion_Testing.sh</p>
<p>2. SOC_Operations.py</p>
<p>3. Crypto_Analysis.c</p>
<p>4. Forensic_Tools.go</p>
</div>
<p><span class="text-secondary">$</span> run Training_Sequence --mode=intensive<span class="cursor-blink">_</span></p>
</div>
</div>
<div class="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/20 blur-3xl rounded-full"></div>
<div class="absolute -top-6 -left-6 w-32 h-32 bg-secondary/20 blur-3xl rounded-full"></div>
</div>
</div>
</section>
<!-- Course Preview Section -->
<section class="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto overflow-hidden">
<div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
<div class="max-w-2xl">
<div class="text-primary font-label-mono mb-4 flex items-center gap-2">
<span class="h-px w-8 bg-primary"></span>
                    CATALOGUE DE FORMATIONS
                </div>
<h2 class="font-headline-lg text-headline-xl text-white">Préparez-vous aux Menaces de Demain</h2>
</div>
<p class="text-on-surface-variant font-body-md max-w-md">
                Des programmes immersifs conçus par des praticiens du terrain, allant de l'initiation au hacking éthique avancé.
            </p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
<!-- Beginner Card -->
<div class="glass-panel p-8 rounded-xl group hover:border-primary transition-all duration-500 relative overflow-hidden flex flex-col h-full">
<div class="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
<div class="w-full h-full bg-cover" data-alt="A detailed digital abstract pattern of interconnected server nodes and glowing data lines in deep greens and blacks, representing a foundational network architecture. Minimalist technical aesthetic." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuAX3SYb54rVXDbcMSBPUQdzXgvk7xzEE6_YB8CUIHIEO3pbPWEgIRvJZRXSUHbWNJq-dPaZAO99tN3eX1CxZPUckABXK6faSXZksEn45Ox0432zQXipojThugkfukiwcC9RD8YLgOGkCEZ3LO7SxR9k37K3qj9QrXzj7A1e6HBb-C3iJDv7PXBcQVPGkRCVH9u8GG8NdFV4zi0LCrm_WzgGlNwy2VmlsAADUd-xnk9EflEfQ6p8p9W3JqTiX3ETRcYr2cKRJ3iV-HTv')"></div>
</div>
<div class="relative z-10">
<div class="w-12 h-12 rounded bg-surface-variant flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined">verified_user</span>
</div>
<h3 class="font-headline-lg text-white mb-4">Débutant</h3>
<p class="text-on-surface-variant mb-8 flex-1">
                        Les bases fondamentales de la sécurité informatique, les protocoles réseaux et l'hygiène numérique.
                    </p>
<div class="flex items-center justify-between mt-auto">
<span class="text-primary font-label-mono">12 Modules</span>
<a class="text-white hover:text-primary transition-colors flex items-center gap-2 group-hover:translate-x-2 transition-transform" href="#">
                            Détails <span class="material-symbols-outlined text-sm">east</span>
</a>
</div>
</div>
</div>
<!-- Intermediate Card -->
<div class="glass-panel p-8 rounded-xl group border-secondary/50 hover:border-secondary transition-all duration-500 relative overflow-hidden flex flex-col h-full">
<div class="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
<div class="w-full h-full bg-cover" data-alt="A complex digital circuit board layout with glowing cyan pathways and miniature microchip elements. Technical blueprint style with a dark, sophisticated cybersecurity focus." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDF0LXB4YyNnOSyLAtKXKGy1d_O19rZ7NuXbqNOnjHHhbTHrW1gwp1DwRBbxzYY0u6qxdsdv5yRW4B7CL0OuEk2wqUyzojtVfYZPRrk9-zxP_fSLE1RXd7wkK3D06l6R2p3RG4CadJJYKry9sQW---nj-CAzP2FM7PdOBZLGpLS_LNqsfMqg-nptudd7QdHMUWcueXqzNR68Lgeh-4xK_XEa9jnyKceoTxX3ber44ureYv7G3oBXLghI9M-5yyvbuTZQ2dH-eAhtn3G')"></div>
</div>
<div class="relative z-10">
<div class="w-12 h-12 rounded bg-surface-variant flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined">security</span>
</div>
<h3 class="font-headline-lg text-white mb-4">Intermédiaire</h3>
<p class="text-on-surface-variant mb-8 flex-1">
                        Analyse des vulnérabilités, protection des terminaux et sécurisation des environnements cloud.
                    </p>
<div class="flex items-center justify-between mt-auto">
<span class="text-secondary font-label-mono">24 Modules</span>
<a class="text-white hover:text-secondary transition-colors flex items-center gap-2 group-hover:translate-x-2 transition-transform" href="#">
                            Détails <span class="material-symbols-outlined text-sm">east</span>
</a>
</div>
</div>
</div>
<!-- Hacking Card -->
<div class="glass-panel p-8 rounded-xl group border-primary/30 hover:border-primary transition-all duration-500 relative overflow-hidden flex flex-col h-full bg-primary/5">
<div class="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
<div class="w-full h-full bg-cover" data-alt="A stylized matrix-like visualization of cascading green code and encrypted data packets moving through a dark 3D digital space. Cyber-offensive hacking aesthetic." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuAZPnjc7WtP4sbfM8xj41zSQ3K7R7ld8rU0LCC4kKFk6o6LFAad3P9xdbjlcyDOmsIu1bhfpK1jQyYNXKvNZJuba_oqpvE0v4CaorgU12tHg1YnkVvgZFa2YOPuks-ae60D_fcG9CtA69R-F63HdxGbplbWJxsJMkUuEXaHlTIPtAujxkheNB-Lzr8mwyJXRBkafvMPLDioNkwIVx9EyM8pSM7WL2mnBNLQxXEPVf-wSD28lHkaJVboc-OMCMmPZisSeEydjzsxMnCk')"></div>
</div>
<div class="relative z-10">
<div class="w-12 h-12 rounded bg-primary/20 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined">terminal</span>
</div>
<h3 class="font-headline-lg text-white mb-4">Hacking Éthique</h3>
<p class="text-on-surface-variant mb-8 flex-1">
                        Test d'intrusion, exploitation avancée, ingénierie inverse et Red Teaming de haut niveau.
                    </p>
<div class="flex items-center justify-between mt-auto">
<span class="text-primary font-label-mono">Professional</span>
<a class="text-white hover:text-primary transition-colors flex items-center gap-2 group-hover:translate-x-2 transition-transform" href="#">
                            Détails <span class="material-symbols-outlined text-sm">east</span>
</a>
</div>
</div>
</div>
</div>
</section>
<!-- Pricing Preview Section -->
<section class="py-24 bg-surface-container-low border-y border-outline-variant/30">
<div class="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center">
<h2 class="font-headline-xl text-headline-xl text-white mb-6">Investissez dans votre Futur</h2>
<p class="text-on-surface-variant mb-12 max-w-2xl mx-auto">
                Des tarifs adaptés pour démocratiser l'accès à l'expertise cyber, quel que soit votre continent.
            </p>
<!-- Region Toggle -->
<div class="flex items-center justify-center gap-4 mb-16">
<span class="font-label-mono text-on-surface-variant transition-opacity opacity-100" id="label-europe">Europe</span>
<button class="relative w-16 h-8 rounded-full bg-surface-container-highest border border-outline-variant p-1 transition-all" id="region-toggle">
<div class="absolute left-1 w-6 h-6 rounded-full bg-primary transition-all duration-300" id="toggle-thumb"></div>
</button>
<span class="font-label-mono text-on-surface-variant opacity-50 transition-opacity" id="label-afrique">Afrique</span>
</div>
<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
<!-- Pricing Card Basic -->
<div class="bg-surface-dim p-10 rounded-xl border border-outline-variant/30 flex flex-col">
<div class="font-label-mono text-primary mb-4">STARTER</div>
<div class="flex items-baseline gap-1 mb-8">
<span class="font-headline-xl text-white price-value" data-africa="250.000 FCFA" data-europe="499€">499€</span>
<span class="text-on-surface-variant text-sm">/formation</span>
</div>
<ul class="space-y-4 mb-10 flex-1">
<li class="flex items-center gap-3 text-on-surface"><span class="material-symbols-outlined text-primary text-sm">check_circle</span>Accès à vie</li>
<li class="flex items-center gap-3 text-on-surface"><span class="material-symbols-outlined text-primary text-sm">check_circle</span>Support communautaire</li>
<li class="flex items-center gap-3 text-on-surface-variant opacity-60"><span class="material-symbols-outlined text-sm">cancel</span>Certification officielle</li>
</ul>
<button class="w-full py-3 rounded-lg border border-outline text-white hover:bg-surface-variant transition-all">Choisir Starter</button>
</div>
<!-- Pricing Card Professional -->
<div class="bg-surface-container-highest p-10 rounded-xl border-2 border-primary relative overflow-hidden flex flex-col transform lg:scale-105 shadow-2xl">
<div class="absolute top-4 right-4 bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded">POPULAIRE</div>
<div class="font-label-mono text-primary mb-4">PROFESSIONAL</div>
<div class="flex items-baseline gap-1 mb-8">
<span class="font-headline-xl text-white price-value" data-africa="600.000 FCFA" data-europe="1200€">1200€</span>
<span class="text-on-surface-variant text-sm">/formation</span>
</div>
<ul class="space-y-4 mb-10 flex-1">
<li class="flex items-center gap-3 text-on-surface"><span class="material-symbols-outlined text-primary text-sm">check_circle</span>Accès à vie</li>
<li class="flex items-center gap-3 text-on-surface"><span class="material-symbols-outlined text-primary text-sm">check_circle</span>Certification hycyber</li>
<li class="flex items-center gap-3 text-on-surface"><span class="material-symbols-outlined text-primary text-sm">check_circle</span>Labs pratiques (VMs)</li>
<li class="flex items-center gap-3 text-on-surface"><span class="material-symbols-outlined text-primary text-sm">check_circle</span>Mentorat 1-on-1</li>
</ul>
<button class="w-full py-4 rounded-lg bg-primary text-on-primary font-bold hover:brightness-110 cyber-glow-primary transition-all">S'inscrire</button>
</div>
<!-- Pricing Card Enterprise -->
<div class="bg-surface-dim p-10 rounded-xl border border-outline-variant/30 flex flex-col">
<div class="font-label-mono text-secondary mb-4">ENTERPRISE</div>
<div class="font-headline-xl text-white mb-2">Sur Devis</div>
<p class="text-on-surface-variant mb-8">Solutions sur mesure pour les équipes de sécurité et ministères.</p>
<ul class="space-y-4 mb-10 flex-1">
<li class="flex items-center gap-3 text-on-surface"><span class="material-symbols-outlined text-secondary text-sm">check_circle</span>Formations sur site</li>
<li class="flex items-center gap-3 text-on-surface"><span class="material-symbols-outlined text-secondary text-sm">check_circle</span>Cyber Ranges privés</li>
<li class="flex items-center gap-3 text-on-surface"><span class="material-symbols-outlined text-secondary text-sm">check_circle</span>Audit de compétences</li>
</ul>
<button class="w-full py-3 rounded-lg border border-outline text-white hover:bg-surface-variant transition-all">Contacter Sales</button>
</div>
</div>
</div>
</section>
<!-- Quote Request Form Section -->
<section class="py-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
<div class="glass-panel rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
<div class="p-12 lg:p-16 bg-primary/5 border-r border-outline-variant/30">
<h2 class="font-headline-xl text-white mb-6">Besoin d'un programme spécifique ?</h2>
<p class="text-on-surface-variant mb-12">
                    Nos experts analysent vos besoins pour créer des parcours de montée en compétences personnalisés pour vos collaborateurs.
                </p>
<div class="space-y-6">
<div class="flex items-start gap-4">
<div class="mt-1 w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary">
<span class="material-symbols-outlined text-sm">mail</span>
</div>
<div>
<div class="text-white font-medium">Email Direct</div>
<div class="text-on-surface-variant text-sm">contact@hycyber.com</div>
</div>
</div>
<div class="flex items-start gap-4">
<div class="mt-1 w-6 h-6 rounded bg-secondary/20 flex items-center justify-center text-secondary">
<span class="material-symbols-outlined text-sm">location_on</span>
</div>
<div>
<div class="text-white font-medium">Bureaux</div>
<div class="text-on-surface-variant text-sm">Paris, Dakar, Casablanca</div>
</div>
</div>
</div>
</div>
<div class="p-12 lg:p-16">
<form class="space-y-6">
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
<div class="space-y-2">
<label class="font-label-mono text-xs uppercase tracking-tighter text-on-surface-variant">Nom Complet</label>
<input class="w-full bg-[#000202] border-outline-variant text-white focus:border-secondary focus:ring-0 rounded p-3 transition-colors" placeholder="Jean Dupont" type="text"/>
</div>
<div class="space-y-2">
<label class="font-label-mono text-xs uppercase tracking-tighter text-on-surface-variant">Email Professionnel</label>
<input class="w-full bg-[#000202] border-outline-variant text-white focus:border-secondary focus:ring-0 rounded p-3 transition-colors" placeholder="jean@entreprise.com" type="email"/>
</div>
</div>
<div class="space-y-2">
<label class="font-label-mono text-xs uppercase tracking-tighter text-on-surface-variant">Type de Formation</label>
<select class="w-full bg-[#000202] border-outline-variant text-white focus:border-secondary focus:ring-0 rounded p-3 transition-colors">
<option>Audit &amp; Pentesting</option>
<option>Sécurité Cloud</option>
<option>Réponse aux Incidents</option>
<option>Autre (Préciser)</option>
</select>
</div>
<div class="space-y-2">
<label class="font-label-mono text-xs uppercase tracking-tighter text-on-surface-variant">Votre Message</label>
<textarea class="w-full bg-[#000202] border-outline-variant text-white focus:border-secondary focus:ring-0 rounded p-3 transition-colors" placeholder="Décrivez votre projet..." rows="4"></textarea>
</div>
<button class="w-full py-4 bg-secondary text-on-secondary font-bold rounded-lg hover:brightness-110 cyber-glow-secondary transition-all" type="submit">
                        Envoyer ma demande
                    </button>
</form>
</div>
</div>
</section>
<!-- Footer -->
<footer class="bg-surface-container-lowest border-t border-outline-variant/20 w-full py-12">
<div class="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto gap-8">
<div class="text-primary font-headline-lg-mobile text-headline-lg-mobile font-bold">
                hycyber
            </div>
<div class="flex flex-wrap justify-center gap-6 md:gap-12">
<a class="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#">LinkedIn</a>
<a class="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#">Facebook</a>
<a class="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#">YouTube</a>
<a class="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#">Mentions Légales</a>
<a class="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" href="#">Confidentialité</a>
</div>
<div class="font-body-md text-body-md text-on-surface-variant text-center md:text-right">
                © 2024 hycyber. Protégez votre futur.
            </div>
</div>
</footer>
<script>
        // Pricing Region Toggle Logic
        const toggleBtn = document.getElementById('region-toggle');
        const toggleThumb = document.getElementById('toggle-thumb');
        const priceValues = document.querySelectorAll('.price-value');
        const labelEurope = document.getElementById('label-europe');
        const labelAfrique = document.getElementById('label-afrique');
        
        let isEurope = true;

        toggleBtn.addEventListener('click', () => {
            isEurope = !isEurope;
            
            if (isEurope) {
                toggleThumb.style.left = '4px';
                labelEurope.classList.remove('opacity-50');
                labelAfrique.classList.add('opacity-50');
                priceValues.forEach(el => {
                    el.textContent = el.getAttribute('data-europe');
                });
            } else {
                toggleThumb.style.left = '32px';
                labelEurope.classList.add('opacity-50');
                labelAfrique.classList.remove('opacity-50');
                priceValues.forEach(el => {
                    el.textContent = el.getAttribute('data-africa');
                });
            }
        });

        // Simple Scroll Reveal Effect
        const observerOptions = {
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        document.querySelectorAll('section, .glass-panel').forEach(el => {
            el.classList.add('scroll-reveal');
            observer.observe(el);
        });

        // Micro-interactions for form focus
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.querySelector('label').style.color = '#0097B2';
            });
            input.addEventListener('blur', () => {
                input.parentElement.querySelector('label').style.color = '';
            });
        });
    </script>
</body></html> 
NB: make the sh panel in the hero section  real and interactive i want you to make some haking commands usable there like ls help  cat with some few files like a real simulation 

## formations


<!DOCTYPE html>

<html class="dark" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>hycyber | Catalogue des Formations</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;family=JetBrains+Mono:wght@400;500&amp;family=Space+Grotesk:wght@600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                "on-background": "#dce5df",
                "primary-fixed-dim": "#6add93",
                "on-tertiary-fixed-variant": "#11513a",
                "tertiary-fixed": "#b2f0d1",
                "surface-container": "#19211e",
                "secondary-container": "#199eb9",
                "on-surface-variant": "#bdcabd",
                "surface-container-lowest": "#08100d",
                "inverse-surface": "#dce5df",
                "on-secondary-fixed": "#001f26",
                "on-error": "#690005",
                "surface-container-low": "#151d1a",
                "secondary": "#66d5f1",
                "on-tertiary-fixed": "#002114",
                "on-error-container": "#ffdad6",
                "outline": "#879488",
                "surface-tint": "#6add93",
                "on-secondary-fixed-variant": "#004e5d",
                "tertiary-container": "#629d81",
                "on-secondary-container": "#002e38",
                "secondary-fixed": "#aeecff",
                "surface-container-high": "#242c28",
                "surface-variant": "#2e3733",
                "on-primary-container": "#003117",
                "outline-variant": "#3e4a40",
                "on-tertiary": "#003826",
                "tertiary-fixed-dim": "#97d3b5",
                "surface-dim": "#0d1512",
                "primary-container": "#2aa561",
                "on-primary": "#00391c",
                "primary": "#6add93",
                "error-container": "#93000a",
                "surface": "#0d1512",
                "surface-container-highest": "#2e3733",
                "on-primary-fixed-variant": "#00522b",
                "background": "#0d1512",
                "tertiary": "#97d3b5",
                "on-surface": "#dce5df",
                "inverse-on-surface": "#2a322f",
                "on-tertiary-container": "#003120",
                "error": "#ffb4ab",
                "primary-fixed": "#86faad",
                "on-primary-fixed": "#00210e",
                "secondary-fixed-dim": "#66d5f1",
                "on-secondary": "#003641",
                "surface-bright": "#333b37",
                "inverse-primary": "#006d3b"
            },
            "borderRadius": {
                "DEFAULT": "0.125rem",
                "lg": "0.25rem",
                "xl": "0.5rem",
                "full": "0.75rem"
            },
            "spacing": {
                "margin-mobile": "20px",
                "margin-desktop": "64px",
                "unit": "4px",
                "gutter": "24px",
                "container-max": "1280px"
            },
            "fontFamily": {
                "body-md": ["Inter"],
                "code-sm": ["JetBrains Mono"],
                "headline-lg": ["Space Grotesk"],
                "headline-lg-mobile": ["Space Grotesk"],
                "headline-xl": ["Space Grotesk"],
                "body-lg": ["Inter"],
                "label-mono": ["JetBrains Mono"]
            },
            "fontSize": {
                "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                "code-sm": ["13px", {"lineHeight": "18px", "fontWeight": "400"}],
                "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                "headline-lg-mobile": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                "headline-xl": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                "label-mono": ["14px", {"lineHeight": "20px", "letterSpacing": "0.05em", "fontWeight": "500"}]
            }
          },
        },
      }
    </script>
<style>
        body {
            background-color: #000202;
            color: #dce5df;
        }
        .cyber-glow-border {
            position: relative;
            transition: all 0.3s ease;
        }
        .cyber-glow-border::after {
            content: '';
            position: absolute;
            inset: -1px;
            border-radius: inherit;
            background: linear-gradient(45deg, #009150, transparent, #0097B2);
            z-index: -1;
            opacity: 0.3;
            transition: opacity 0.3s ease;
        }
        .cyber-glow-border:hover::after {
            opacity: 1;
            filter: blur(4px);
        }
        .glass-panel {
            background: rgba(18, 26, 23, 0.8);
            backdrop-filter: blur(12px);
            border: 1px solid #121A17;
        }
        .active-filter {
            background-color: #2aa561;
            color: #003117;
            box-shadow: 0 0 15px rgba(106, 221, 147, 0.3);
        }
    </style>
</head>
<body class="font-body-md bg-background">
<!-- TopNavBar -->
<header class="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm">
<div class="flex items-center justify-between px-margin-desktop py-4 max-w-container-max mx-auto">
<div class="font-headline-lg text-headline-lg font-bold text-primary tracking-tighter">hycyber</div>
<nav class="hidden md:flex gap-8">
<a class="text-primary font-bold border-b-2 border-primary pb-1 font-body-md text-body-md" href="#">Formations</a>
<a class="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md" href="#">Tarifs</a>
<a class="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md" href="#">Entreprise</a>
<a class="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md" href="#">Contact</a>
</nav>
<button class="bg-primary text-on-primary px-6 py-2 rounded-lg font-bold hover:scale-95 transition-all duration-300">Connexion</button>
</div>
</header>
<main class="pt-32 pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
<!-- Header & Filter Section -->
<section class="mb-16">
<div class="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
<div>
<h1 class="font-headline-xl text-headline-xl text-primary mb-4">Académie de Cyberdéfense</h1>
<p class="text-on-surface-variant font-body-lg text-body-lg max-w-2xl">Maîtrisez l'art de la guerre numérique à travers nos parcours certifiants. Du novice à l'expert en intrusion.</p>
</div>
<div class="glass-panel p-2 flex gap-2 rounded-xl">
<button class="active-filter px-6 py-2 rounded font-label-mono text-label-mono transition-all">Tous</button>
<button class="hover:bg-surface-variant px-6 py-2 rounded font-label-mono text-label-mono transition-all text-on-surface-variant">Débutant</button>
<button class="hover:bg-surface-variant px-6 py-2 rounded font-label-mono text-label-mono transition-all text-on-surface-variant">Intermédiaire</button>
<button class="hover:bg-surface-variant px-6 py-2 rounded font-label-mono text-label-mono transition-all text-on-surface-variant">Avancé</button>
</div>
</div>
</section>
<!-- Fondamentaux Tier -->
<section class="mb-20">
<div class="flex items-center gap-4 mb-8">
<span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">shield</span>
<h2 class="font-headline-lg text-headline-lg">01. Fondamentaux</h2>
<div class="h-[1px] flex-grow bg-outline-variant/30"></div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
<!-- Course Card 1 -->
<div class="glass-panel p-6 rounded-xl cyber-glow-border flex flex-col h-full group cursor-pointer">
<div class="relative w-full h-48 mb-6 overflow-hidden rounded">
<div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" data-alt="A cinematic, high-tech digital workspace featuring glowing green holographic computer screens displaying complex network nodes and lines of code in a dark, moody cybersecurity operations center. The aesthetic is ultra-modern and minimalist with deep black surfaces and vibrant emerald accents. Soft volumetric lighting highlights technical gear on a sleek black desk." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuC2Mmfq83Z-YjI3yJ8udkfjAVjx_O0JgE6YPpTRhonfNStLcKp2DjdD17CyZReupa32F2fT8xbvuwJfAmRZROMgS-z3mWLdeJWyWylgvCjnNwGi-MpMx4hs6CnY6fnkL2Vlj1llaA3W5osNggYnrxzLN3G24LrVbgDnT-PKlOHfP9Mb_6euVGwuauXm2R36xIcVO0j143xky-xrtxRKrZI7I_RoFU-iH58C5zH0V1G5szdjkRH7UU6BtNk54VKk4RPOhUudReNc5f5N')"></div>
<div class="absolute top-3 right-3 bg-primary/20 backdrop-blur-md border border-primary/40 px-3 py-1 rounded-sm">
<span class="material-symbols-outlined text-primary text-sm">lock_open</span>
</div>
</div>
<div class="flex items-center gap-2 mb-3">
<span class="bg-primary/10 text-primary px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border border-primary/20 rounded-sm">Débutant</span>
<span class="text-on-surface-variant font-code-sm text-code-sm">12 Modules</span>
</div>
<h3 class="font-headline-lg text-headline-lg-mobile mb-3 text-on-surface">Introduction aux Réseaux Sec</h3>
<p class="text-on-surface-variant font-body-md text-body-md mb-6 flex-grow">Comprendre les protocoles TCP/IP et la topologie des réseaux critiques pour identifier les vulnérabilités de base.</p>
<div class="flex justify-between items-center mt-auto pt-6 border-t border-outline-variant/20">
<span class="font-code-sm text-code-sm text-secondary">READY_TO_LAUNCH</span>
<span class="material-symbols-outlined text-primary group-hover:translate-x-2 transition-transform">arrow_forward</span>
</div>
</div>
<!-- Course Card 2 -->
<div class="glass-panel p-6 rounded-xl cyber-glow-border flex flex-col h-full group cursor-pointer">
<div class="relative w-full h-48 mb-6 overflow-hidden rounded">
<div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" data-alt="Close up shot of a sleek mechanical keyboard with translucent keys illuminated by deep cyan and teal backlighting in a pitch-black room. Minimalist tech setup with a focus on precision and high-end hardware, suggesting a professional hacking environment. The style is sharp, clean, and futuristic with a cold, controlled atmosphere." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCj9TlPvvF0JaOCcsG9OboAD_WSBsiQeXC8wYxx92ecekRWUj13RcuAfkXNyqseRqgFOX7Epx_U4wTdMXqKrX1e-RC6dYaUaVVTAWTeAzR6jB8KGtir3jqr3SKLiQV3gB6BvpHthEmmaTvCQq5zircl4nBnl8zz7Mua-GLtit2othx1yigwtCS3v20fx1KiCu2rrTi_SLXDT86GiPFJYQIU_0iFdOdGSKVj_KzW5XwHFXiXh93A7ClPuikWu0gu13DfmsIA47aE7Twj')"></div>
<div class="absolute top-3 right-3 bg-primary/20 backdrop-blur-md border border-primary/40 px-3 py-1 rounded-sm">
<span class="material-symbols-outlined text-primary text-sm">lock_open</span>
</div>
</div>
<div class="flex items-center gap-2 mb-3">
<span class="bg-primary/10 text-primary px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border border-primary/20 rounded-sm">Débutant</span>
<span class="text-on-surface-variant font-code-sm text-code-sm">08 Modules</span>
</div>
<h3 class="font-headline-lg text-headline-lg-mobile mb-3 text-on-surface">Ligne de Commande Linux</h3>
<p class="text-on-surface-variant font-body-md text-body-md mb-6 flex-grow">Maîtrisez le terminal, le scripting Bash et la gestion des permissions dans un environnement Unix sécurisé.</p>
<div class="flex justify-between items-center mt-auto pt-6 border-t border-outline-variant/20">
<span class="font-code-sm text-code-sm text-secondary">READY_TO_LAUNCH</span>
<span class="material-symbols-outlined text-primary group-hover:translate-x-2 transition-transform">arrow_forward</span>
</div>
</div>
<!-- Course Card 3 -->
<div class="glass-panel p-6 rounded-xl cyber-glow-border flex flex-col h-full group cursor-pointer">
<div class="relative w-full h-48 mb-6 overflow-hidden rounded">
<div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" data-alt="A futuristic biometric security interface glowing with electric teal light on a dark glass surface. Digital fingerprints and retina scan patterns are displayed as fine, sharp lines. The environment is dark and sterile, emphasizing high-security protocols and advanced identification technology. High contrast between deep blacks and bright cyan glows." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBz1ASWVltvbMWoenl5GP7Z4EpISlJJwMFlk86m_BlbSlkz2SUbQ4q2x-VkQdqKgTzqnPLXTG6sYwfht-BHkMHpeSDqarnQQBe9Kr4TcyvHxysdaqNkPC5m5XB4p0fSTdiDICGGBAi7sc8IvSWpoOi4SoMQtaEM7fnzHA51dBVnv9KwoEm4FVVTCBrylGkFtnHrFPcFSVtXxRydVPPbiRwnZIIFSTSAHnTlkWc7WRHcedhmX0rtyhHizL6BK17N-jkn1qWyDterNfL1')"></div>
<div class="absolute top-3 right-3 bg-on-surface-variant/20 backdrop-blur-md border border-outline-variant/40 px-3 py-1 rounded-sm">
<span class="material-symbols-outlined text-on-surface-variant text-sm">lock</span>
</div>
</div>
<div class="flex items-center gap-2 mb-3">
<span class="bg-secondary/10 text-secondary px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border border-secondary/20 rounded-sm">Intermédiaire</span>
<span class="text-on-surface-variant font-code-sm text-code-sm">15 Modules</span>
</div>
<h3 class="font-headline-lg text-headline-lg-mobile mb-3 text-on-surface">Cryptographie Appliquée</h3>
<p class="text-on-surface-variant font-body-md text-body-md mb-6 flex-grow">Les mathématiques derrière le chiffrement AES, RSA et les protocoles d'échange de clés modernes.</p>
<div class="flex justify-between items-center mt-auto pt-6 border-t border-outline-variant/20">
<span class="font-code-sm text-code-sm text-on-surface-variant opacity-50">LOCKED_BY_PREREQ</span>
<span class="material-symbols-outlined text-on-surface-variant">lock</span>
</div>
</div>
</div>
</section>
<!-- Spécialiste Tier -->
<section class="mb-20">
<div class="flex items-center gap-4 mb-8">
<span class="material-symbols-outlined text-secondary" style="font-variation-settings: 'FILL' 1;">terminal</span>
<h2 class="font-headline-lg text-headline-lg">02. Spécialiste</h2>
<div class="h-[1px] flex-grow bg-outline-variant/30"></div>
</div>
<div class="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
<!-- Large Feature Card -->
<div class="glass-panel p-8 rounded-xl cyber-glow-border flex flex-col md:flex-row gap-8 group cursor-pointer">
<div class="w-full md:w-1/2 overflow-hidden rounded relative">
<div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" data-alt="A dark, abstract visualization of a cyber attack in progress with sharp red and green laser-like data streams clashing in a 3D digital space. Fine grid lines provide a sense of structure. The lighting is dramatic, highlighting the high stakes of a digital security breach. The palette focuses on deep blacks, sharp primary greens, and emergency reds." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuANqyAPQa9NwWOudEPzss-z2TQ14_6WYhNN2VDCKfA2GHN2WXNS_Hbwqh8u6wliRi3DuAdmzcmsYF5gNEpfcMdrU5ghetftO9TJsYkl1DS8fkucXy_JfB6mrK9l16JCaBapJHoMnniX1e-ZdL6Xmi9QzMYQlQ2ActRYV5x22PYOScJOyJt_h1qfTDeKqiXDxMNL5LqLy5F-H0Bf34SU-k08DKO6l_iLU9EM5KDWGpMerIBbnawAAj4LCJWlD08LJBvM_7YwXfrCSX-9')"></div>
</div>
<div class="w-full md:w-1/2 flex flex-col">
<div class="flex items-center gap-2 mb-4">
<span class="bg-secondary/10 text-secondary px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border border-secondary/20 rounded-sm">Intermédiaire</span>
<span class="text-on-surface-variant font-code-sm text-code-sm">24 Modules</span>
</div>
<h3 class="font-headline-lg text-headline-lg-mobile mb-4 text-on-surface">Penetration Testing : Web</h3>
<p class="text-on-surface-variant font-body-md text-body-md mb-8">Exploitation de vulnérabilités OWASP Top 10, SQL injection et XSS dans des environnements de laboratoire contrôlés.</p>
<div class="mt-auto">
<div class="w-full bg-surface-variant h-1 rounded-full mb-4 overflow-hidden">
<div class="bg-primary h-full w-1/3 shadow-[0_0_10px_rgba(106,221,147,0.5)]"></div>
</div>
<div class="flex justify-between items-center">
<span class="font-code-sm text-code-sm text-primary">EN_COURS [33%]</span>
<span class="material-symbols-outlined text-primary group-hover:translate-x-2 transition-transform">play_circle</span>
</div>
</div>
</div>
</div>
<!-- Another Feature Card -->
<div class="glass-panel p-8 rounded-xl cyber-glow-border flex flex-col md:flex-row gap-8 group cursor-pointer opacity-80">
<div class="w-full md:w-1/2 overflow-hidden rounded relative">
<div class="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 grayscale" data-alt="Macro photography of complex integrated circuit board with glowing teal data paths. The chips are metallic and matte black, set against a dark background with subtle grid lines. The look is highly technical, detailed, and industrial, evoking the internal hardware architecture of a secure server. Minimalist and sharp focus." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCpf5uHOs8Zh0J0f-3jMsb37bi_FUR0efZ8N2F095Z1gP2PGQmDrI2lBzJnEBa1PORXb5jDqLqjkP1tuk87HOMj0ClHW3gGCQTG9CmjMBAqH34NLtiJaQhsmKCKSgklCcH1eeh_fV_xyF_KrE1EVWz12pqWwsfbcd_5_wYOb4Rg-7P2esxwmoODw-kAGj5HQD2yrtF3CwqS6gVEgMlZ43fpvAN2YhINrummMAirGknbufDWyVbkBentFx4a-a539gupOMjab_bnYiz_')"></div>
</div>
<div class="w-full md:w-1/2 flex flex-col">
<div class="flex items-center gap-2 mb-4">
<span class="bg-secondary/10 text-secondary px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border border-secondary/20 rounded-sm">Intermédiaire</span>
<span class="text-on-surface-variant font-code-sm text-code-sm">18 Modules</span>
</div>
<h3 class="font-headline-lg text-headline-lg-mobile mb-4 text-on-surface">SOC &amp; Incident Response</h3>
<p class="text-on-surface-variant font-body-md text-body-md mb-8">Analyse de logs SIEM, détection d'anomalies et mise en place de stratégies de remédiation post-attaque.</p>
<div class="mt-auto">
<div class="flex justify-between items-center border-t border-outline-variant/20 pt-6">
<span class="font-code-sm text-code-sm text-on-surface-variant">LOCKED_BY_SUBSCRIPTION</span>
<span class="material-symbols-outlined text-on-surface-variant">lock</span>
</div>
</div>
</div>
</div>
</div>
</section>
<!-- Expert Tier -->
<section>
<div class="flex items-center gap-4 mb-8">
<span class="material-symbols-outlined text-error" style="font-variation-settings: 'FILL' 1;">warning</span>
<h2 class="font-headline-lg text-headline-lg">03. Expert</h2>
<div class="h-[1px] flex-grow bg-outline-variant/30"></div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
<!-- Expert Course -->
<div class="glass-panel p-6 rounded-xl cyber-glow-border flex flex-col h-full group cursor-pointer bg-error-container/5 border-error/20">
<div class="flex items-center gap-2 mb-3">
<span class="bg-error/10 text-error px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold border border-error/20 rounded-sm">Avancé</span>
<span class="text-on-surface-variant font-code-sm text-code-sm">30 Modules</span>
</div>
<h3 class="font-headline-lg text-headline-lg-mobile mb-3 text-error">Reverse Engineering</h3>
<p class="text-on-surface-variant font-body-md text-body-md mb-6">Désassemblage de malwares, analyse de binaires et exploitation de corruption mémoire sous x64.</p>
<div class="mt-auto p-4 bg-surface-container rounded font-code-sm text-code-sm text-on-surface-variant border-l-2 border-error italic">
                        "Un niveau de maîtrise requis pour les unités d'élite de défense."
                    </div>
<div class="flex justify-between items-center mt-6 pt-6 border-t border-outline-variant/20">
<span class="font-code-sm text-code-sm text-error">ACCESS_RESTRICTED</span>
<span class="material-symbols-outlined text-error">lock</span>
</div>
</div>
<!-- Placeholder for more -->
<div class="border-2 border-dashed border-outline-variant/20 rounded-xl flex items-center justify-center p-12 text-center group">
<div class="flex flex-col items-center gap-4 opacity-30 group-hover:opacity-60 transition-opacity">
<span class="material-symbols-outlined text-4xl">add_circle</span>
<p class="font-label-mono text-label-mono">NOUVEAU CONTENU EXPERT<br/>EN DÉPLOIEMENT...</p>
</div>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="w-full py-12 bg-surface-container-lowest border-t border-outline-variant/20">
<div class="flex flex-col md:flex-row justify-between items-center px-margin-desktop max-w-container-max mx-auto gap-8">
<div class="flex flex-col gap-2 text-center md:text-left">
<div class="text-primary font-headline-lg-mobile">hycyber</div>
<div class="text-on-surface-variant font-body-md text-body-md opacity-60">© 2024 hycyber. Protégez votre futur.</div>
</div>
<div class="flex flex-wrap justify-center gap-6">
<a class="text-on-surface-variant hover:text-secondary transition-colors font-body-md text-body-md" href="#">LinkedIn</a>
<a class="text-on-surface-variant hover:text-secondary transition-colors font-body-md text-body-md" href="#">Facebook</a>
<a class="text-on-surface-variant hover:text-secondary transition-colors font-body-md text-body-md" href="#">YouTube</a>
<a class="text-on-surface-variant hover:text-secondary transition-colors font-body-md text-body-md" href="#">Mentions Légales</a>
<a class="text-on-surface-variant hover:text-secondary transition-colors font-body-md text-body-md" href="#">Confidentialité</a>
</div>
</div>
</footer>
<script>
        // Simple interaction for filter buttons
        const filters = document.querySelectorAll('.glass-panel button');
        filters.forEach(btn => {
            btn.addEventListener('click', () => {
                filters.forEach(f => {
                    f.classList.remove('active-filter');
                    f.classList.add('text-on-surface-variant');
                });
                btn.classList.add('active-filter');
                btn.classList.remove('text-on-surface-variant');
            });
        });

        // Atmospheric terminal blinking cursor effect could be added if needed, 
        // but for a course page, keeping interaction focus on the cards is better.
    </script>
</body></html>

## tarifs 


<!DOCTYPE html>

<html class="dark" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Tarifs | hycyber - Excellence en Cybersécurité</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&amp;family=Inter:wght@300;400;500;600&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "on-background": "#dce5df",
                    "primary-fixed-dim": "#6add93",
                    "on-tertiary-fixed-variant": "#11513a",
                    "tertiary-fixed": "#b2f0d1",
                    "surface-container": "#19211e",
                    "secondary-container": "#199eb9",
                    "on-surface-variant": "#bdcabd",
                    "surface-container-lowest": "#08100d",
                    "inverse-surface": "#dce5df",
                    "on-secondary-fixed": "#001f26",
                    "on-error": "#690005",
                    "surface-container-low": "#151d1a",
                    "secondary": "#66d5f1",
                    "on-tertiary-fixed": "#002114",
                    "on-error-container": "#ffdad6",
                    "outline": "#879488",
                    "surface-tint": "#6add93",
                    "on-secondary-fixed-variant": "#004e5d",
                    "tertiary-container": "#629d81",
                    "on-secondary-container": "#002e38",
                    "secondary-fixed": "#aeecff",
                    "surface-container-high": "#242c28",
                    "surface-variant": "#2e3733",
                    "on-primary-container": "#003117",
                    "outline-variant": "#3e4a40",
                    "on-tertiary": "#003826",
                    "tertiary-fixed-dim": "#97d3b5",
                    "surface-dim": "#0d1512",
                    "primary-container": "#2aa561",
                    "on-primary": "#00391c",
                    "primary": "#6add93",
                    "error-container": "#93000a",
                    "surface": "#0d1512",
                    "surface-container-highest": "#2e3733",
                    "on-primary-fixed-variant": "#00522b",
                    "background": "#0d1512",
                    "tertiary": "#97d3b5",
                    "on-surface": "#dce5df",
                    "inverse-on-surface": "#2a322f",
                    "on-tertiary-container": "#003120",
                    "error": "#ffb4ab",
                    "primary-fixed": "#86faad",
                    "on-primary-fixed": "#00210e",
                    "secondary-fixed-dim": "#66d5f1",
                    "on-secondary": "#003641",
                    "surface-bright": "#333b37",
                    "inverse-primary": "#006d3b"
            },
            "borderRadius": {
                    "DEFAULT": "0.125rem",
                    "lg": "0.25rem",
                    "xl": "0.5rem",
                    "full": "0.75rem"
            },
            "spacing": {
                    "margin-mobile": "20px",
                    "margin-desktop": "64px",
                    "unit": "4px",
                    "gutter": "24px",
                    "container-max": "1280px"
            },
            "fontFamily": {
                    "body-md": ["Inter"],
                    "code-sm": ["JetBrains Mono"],
                    "headline-lg": ["Space Grotesk"],
                    "headline-lg-mobile": ["Space Grotesk"],
                    "headline-xl": ["Space Grotesk"],
                    "body-lg": ["Inter"],
                    "label-mono": ["JetBrains Mono"]
            },
            "fontSize": {
                    "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                    "code-sm": ["13px", {"lineHeight": "18px", "fontWeight": "400"}],
                    "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                    "headline-lg-mobile": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                    "headline-xl": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                    "label-mono": ["14px", {"lineHeight": "20px", "letterSpacing": "0.05em", "fontWeight": "500"}]
            }
          },
        },
      }
    </script>
<style>
        body { background-color: #000202; }
        .cyber-grid {
            background-image: linear-gradient(to right, #121A17 1px, transparent 1px),
                              linear-gradient(to bottom, #121A17 1px, transparent 1px);
            background-size: 40px 40px;
        }
        .glass-card {
            background: rgba(8, 12, 10, 0.8);
            backdrop-filter: blur(12px);
            border: 1px solid #121A17;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card:hover {
            border-color: #009150;
            box-shadow: 0 0 20px rgba(0, 145, 80, 0.15);
            transform: translateY(-4px);
        }
        .glow-primary {
            box-shadow: 0 0 15px rgba(106, 221, 147, 0.3);
        }
        .glow-text-primary {
            text-shadow: 0 0 8px rgba(106, 221, 147, 0.5);
        }
        .cursor-blink::after {
            content: '_';
            animation: blink 1s infinite;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        
        /* Hide scrollbar but keep functionality */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="font-body-md text-on-surface selection:bg-primary/30 selection:text-primary">
<!-- TopNavBar -->
<nav class="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm">
<div class="flex items-center justify-between px-margin-desktop py-4 max-w-container-max mx-auto h-20">
<div class="font-headline-lg text-headline-lg font-bold text-primary tracking-tighter">hycyber</div>
<div class="hidden md:flex items-center space-x-8">
<a class="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md" href="#">Formations</a>
<a class="text-primary font-bold border-b-2 border-primary pb-1 font-body-md text-body-md" href="#">Tarifs</a>
<a class="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md" href="#">Entreprise</a>
<a class="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md" href="#">Contact</a>
</div>
<button class="bg-primary text-on-primary px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-all duration-300 Active: scale-95 glow-primary">
                Connexion
            </button>
</div>
</nav>
<!-- Hero / Background Section -->
<main class="relative pt-32 pb-20 overflow-hidden cyber-grid">

<div class="relative z-10 max-w-container-max mx-auto px-margin-desktop text-center">
<div class="inline-flex items-center bg-surface-container border border-outline-variant/50 rounded-full px-4 py-1 mb-6">
<span class="material-symbols-outlined text-primary text-sm mr-2" style="font-variation-settings: 'FILL' 1;">security</span>
<span class="font-label-mono text-label-mono text-primary uppercase tracking-widest">Protocoles d'Accès Sécurisés</span>
</div>
<h1 class="font-headline-xl text-headline-xl mb-6 tracking-tight text-on-surface">
                Préparez-vous à <span class="text-primary glow-text-primary">Maîtriser</span> le Cyber-espace
            </h1>
<p class="max-w-2xl mx-auto text-on-surface-variant font-body-lg text-body-lg mb-12">
                Choisissez le niveau de certification adapté à votre trajectoire professionnelle. Des laboratoires immersifs aux certifications reconnues.
            </p>
<!-- Region Toggle -->
<div class="flex justify-center mb-16">
<div class="bg-surface-container-high p-1 rounded-xl flex border border-outline-variant/30">
<button class="px-8 py-2 rounded-lg font-bold transition-all duration-300 bg-primary text-on-primary glow-primary" id="toggle-afrique" onclick="setRegion('AFRIQUE')">
                        Afrique (FCFA)
                    </button>
<button class="px-8 py-2 rounded-lg font-bold transition-all duration-300 text-on-surface-variant hover:text-on-surface" id="toggle-europe" onclick="setRegion('EUROPE')">
                        Europe (EUR)
                    </button>
</div>
</div>
<!-- Pricing Cards Bento Layout -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
<!-- Débutant -->
<div class="glass-card p-8 flex flex-col text-left group">
<div class="mb-6">
<span class="font-label-mono text-label-mono text-on-surface-variant block mb-2">NIVEAU 01</span>
<h3 class="font-headline-lg text-headline-lg text-on-surface">Débutant</h3>
</div>
<div class="mb-8">
<div class="flex items-baseline gap-1">
<span class="font-headline-xl text-headline-xl text-primary price-val" data-afrique="15,000" data-europe="40">15,000</span>
<span class="font-body-md text-on-surface-variant currency-val">FCFA</span>
<span class="text-on-surface-variant font-body-md">/ mois</span>
</div>
</div>
<ul class="space-y-4 mb-10 flex-grow">
<li class="flex items-center gap-3 text-on-surface-variant">
<span class="material-symbols-outlined text-primary text-xl">check_circle</span>
<span class="font-body-md">Introduction à la Cyber</span>
</li>
<li class="flex items-center gap-3 text-on-surface-variant">
<span class="material-symbols-outlined text-primary text-xl">check_circle</span>
<span class="font-body-md">5 Labs Fondamentaux / mois</span>
</li>
<li class="flex items-center gap-3 text-on-surface-variant">
<span class="material-symbols-outlined text-primary text-xl">check_circle</span>
<span class="font-body-md">Communauté Discord</span>
</li>
</ul>
<button class="w-full py-4 border border-primary text-primary font-bold rounded-lg hover:bg-primary hover:text-on-primary transition-all duration-300">
                        Initialiser la Session
                    </button>
</div>
<!-- Intermédiaire (Featured) -->
<div class="glass-card p-8 flex flex-col text-left border-primary/50 relative overflow-hidden transform scale-105 z-20">
<div class="absolute top-0 right-0 bg-primary text-on-primary px-4 py-1 font-label-mono text-xs font-bold uppercase tracking-tighter">
                        RECOMMANDÉ
                    </div>
<div class="mb-6">
<span class="font-label-mono text-label-mono text-primary block mb-2">NIVEAU 02</span>
<h3 class="font-headline-lg text-headline-lg text-on-surface">Intermédiaire</h3>
</div>
<div class="mb-8">
<div class="flex items-baseline gap-1">
<span class="font-headline-xl text-headline-xl text-primary price-val" data-afrique="30,000" data-europe="60">30,000</span>
<span class="font-body-md text-on-surface-variant currency-val">FCFA</span>
<span class="text-on-surface-variant font-body-md">/ mois</span>
</div>
</div>
<ul class="space-y-4 mb-10 flex-grow">
<li class="flex items-center gap-3 text-on-surface">
<span class="material-symbols-outlined text-primary text-xl" style="font-variation-settings: 'FILL' 1;">check_circle</span>
<span class="font-body-md">Analyse de Malwares</span>
</li>
<li class="flex items-center gap-3 text-on-surface">
<span class="material-symbols-outlined text-primary text-xl" style="font-variation-settings: 'FILL' 1;">check_circle</span>
<span class="font-body-md">20 Labs Avancés / mois</span>
</li>
<li class="flex items-center gap-3 text-on-surface">
<span class="material-symbols-outlined text-primary text-xl" style="font-variation-settings: 'FILL' 1;">check_circle</span>
<span class="font-body-md">Préparation Certif. Junior</span>
</li>
<li class="flex items-center gap-3 text-on-surface">
<span class="material-symbols-outlined text-primary text-xl" style="font-variation-settings: 'FILL' 1;">check_circle</span>
<span class="font-body-md">Support Prioritaire 24/7</span>
</li>
</ul>
<button class="w-full py-4 bg-primary text-on-primary font-bold rounded-lg glow-primary hover:brightness-110 transition-all duration-300">
                        Élever les Privilèges
                    </button>
</div>
<!-- Hacking Pro -->
<div class="glass-card p-8 flex flex-col text-left group">
<div class="mb-6">
<span class="font-label-mono text-label-mono text-on-surface-variant block mb-2">NIVEAU 03</span>
<h3 class="font-headline-lg text-headline-lg text-on-surface">Hacking Pro</h3>
</div>
<div class="mb-8">
<div class="flex items-baseline gap-1">
<span class="font-headline-xl text-headline-xl text-primary price-val" data-afrique="45,000" data-europe="80">45,000</span>
<span class="font-body-md text-on-surface-variant currency-val">FCFA</span>
<span class="text-on-surface-variant font-body-md">/ mois</span>
</div>
</div>
<ul class="space-y-4 mb-10 flex-grow">
<li class="flex items-center gap-3 text-on-surface-variant">
<span class="material-symbols-outlined text-primary text-xl">check_circle</span>
<span class="font-body-md">Red Teaming &amp; Exploitation</span>
</li>
<li class="flex items-center gap-3 text-on-surface-variant">
<span class="material-symbols-outlined text-primary text-xl">check_circle</span>
<span class="font-body-md">Accès Labs Illimité</span>
</li>
<li class="flex items-center gap-3 text-on-surface-variant">
<span class="material-symbols-outlined text-primary text-xl">check_circle</span>
<span class="font-body-md">Coaching 1-on-1 (2h/mois)</span>
</li>
<li class="flex items-center gap-3 text-on-surface-variant">
<span class="material-symbols-outlined text-primary text-xl">check_circle</span>
<span class="font-body-md">Accès aux Exploits 0-day</span>
</li>
</ul>
<button class="w-full py-4 border border-secondary text-secondary font-bold rounded-lg hover:bg-secondary hover:text-on-secondary transition-all duration-300">
                        Mode Root Activé
                    </button>
</div>
</div>
</div>
</main>
<!-- Comparison Table Section -->
<section class="py-24 bg-surface">
<div class="max-w-container-max mx-auto px-margin-desktop">
<h2 class="font-headline-lg text-headline-lg text-center mb-16">Analyse Comparative des Protocoles</h2>
<div class="overflow-x-auto no-scrollbar">
<table class="w-full text-left border-collapse border border-outline-variant/30">
<thead>
<tr class="bg-surface-container-high">
<th class="p-6 font-label-mono text-label-mono text-on-surface border border-outline-variant/30 uppercase">Fonctionnalité</th>
<th class="p-6 font-label-mono text-label-mono text-on-surface border border-outline-variant/30 text-center uppercase">Débutant</th>
<th class="p-6 font-label-mono text-label-mono text-primary border border-outline-variant/30 text-center uppercase">Intermédiaire</th>
<th class="p-6 font-label-mono text-label-mono text-secondary border border-outline-variant/30 text-center uppercase">Hacking Pro</th>
</tr>
</thead>
<tbody class="font-code-sm text-code-sm">
<tr>
<td class="p-4 border border-outline-variant/30 text-on-surface-variant">Nombre de Labs Virtuels</td>
<td class="p-4 border border-outline-variant/30 text-center">05</td>
<td class="p-4 border border-outline-variant/30 text-center text-primary font-bold">20</td>
<td class="p-4 border border-outline-variant/30 text-center text-secondary font-bold">ILLIMITÉ</td>
</tr>
<tr class="bg-surface-container-lowest">
<td class="p-4 border border-outline-variant/30 text-on-surface-variant">Accès SSH Direct</td>
<td class="p-4 border border-outline-variant/30 text-center text-error">NON</td>
<td class="p-4 border border-outline-variant/30 text-center text-primary font-bold">OUI</td>
<td class="p-4 border border-outline-variant/30 text-center text-secondary font-bold">OUI + VPN</td>
</tr>
<tr>
<td class="p-4 border border-outline-variant/30 text-on-surface-variant">Support IA Assistant</td>
<td class="p-4 border border-outline-variant/30 text-center">Standard</td>
<td class="p-4 border border-outline-variant/30 text-center text-primary font-bold">Avancé</td>
<td class="p-4 border border-outline-variant/30 text-center text-secondary font-bold">Dédié</td>
</tr>
<tr class="bg-surface-container-lowest">
<td class="p-4 border border-outline-variant/30 text-on-surface-variant">Certificat de Réussite</td>
<td class="p-4 border border-outline-variant/30 text-center">
<span class="material-symbols-outlined text-primary">check</span>
</td>
<td class="p-4 border border-outline-variant/30 text-center">
<span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">check_circle</span>
</td>
<td class="p-4 border border-outline-variant/30 text-center">
<span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">verified</span>
</td>
</tr>
<tr>
<td class="p-4 border border-outline-variant/30 text-on-surface-variant">Analyse Forensics</td>
<td class="p-4 border border-outline-variant/30 text-center">X</td>
<td class="p-4 border border-outline-variant/30 text-center">X</td>
<td class="p-4 border border-outline-variant/30 text-center">
<span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">task_alt</span>
</td>
</tr>
</tbody>
</table>
</div>
<div class="mt-12 text-center p-8 glass-card border-dashed border-primary/40 rounded-xl">
<p class="font-code-sm text-code-sm text-on-surface-variant mb-4">
<span class="text-primary mr-2">[INFO]</span> Besoin d'une offre sur mesure pour votre entreprise ? Nos experts sont en ligne.
                </p>
<button class="font-label-mono text-label-mono text-primary hover:underline uppercase tracking-widest cursor-blink">
                    Contacter le SOC Corporate
                </button>
</div>
</div>
</section>
<!-- FAQ / Terminal Section -->
<section class="py-24 border-t border-outline-variant/20">
<div class="max-w-container-max mx-auto px-margin-desktop">
<div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
<div>
<h2 class="font-headline-lg text-headline-lg mb-8">FAQ Système</h2>
<div class="space-y-6">
<details class="group bg-surface-container-low rounded-lg border border-outline-variant/30 p-6 transition-all">
<summary class="font-body-lg text-body-lg cursor-pointer list-none flex justify-between items-center text-on-surface">
                                Puis-je changer de plan en cours de mois ?
                                <span class="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
</summary>
<div class="mt-4 text-on-surface-variant font-body-md">
                                Affirmatif. Vous pouvez effectuer une mise à l'échelle (Upscale) à tout moment. La différence sera calculée au prorata de l'usage restant.
                            </div>
</details>
<details class="group bg-surface-container-low rounded-lg border border-outline-variant/30 p-6 transition-all">
<summary class="font-body-lg text-body-lg cursor-pointer list-none flex justify-between items-center text-on-surface">
                                Les certifications sont-elles reconnues ?
                                <span class="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
</summary>
<div class="mt-4 text-on-surface-variant font-body-md">
                                Nos certifications "hycyber Secure Operator" sont reconnues par plus de 50 partenaires tech en Afrique et en Europe pour valider vos compétences pratiques.
                            </div>
</details>
<details class="group bg-surface-container-low rounded-lg border border-outline-variant/30 p-6 transition-all">
<summary class="font-body-lg text-body-lg cursor-pointer list-none flex justify-between items-center text-on-surface">
                                Quel est le mode de paiement accepté ?
                                <span class="material-symbols-outlined group-open:rotate-180 transition-transform">expand_more</span>
</summary>
<div class="mt-4 text-on-surface-variant font-body-md">
                                Nous acceptons Mobile Money (Orange, MTN, Wave), Cartes Bancaires (Visa, Mastercard) et Cryptomonnaies (BTC, ETH, USDT).
                            </div>
</details>
</div>
</div>
<div class="bg-[#000202] rounded-xl border border-primary/40 p-6 shadow-2xl relative">
<div class="flex items-center gap-2 mb-4 border-b border-outline-variant/20 pb-4">
<div class="w-3 h-3 rounded-full bg-error"></div>
<div class="w-3 h-3 rounded-full bg-secondary"></div>
<div class="w-3 h-3 rounded-full bg-primary"></div>
<span class="ml-4 font-code-sm text-code-sm text-on-surface-variant">hycyber-console ~ query pricing_status</span>
</div>
<div class="font-code-sm text-code-sm text-primary space-y-2">
<p>&gt; Fetching market data for REGION_AFRICA...</p>
<p class="text-on-surface-variant">&gt; Loading plans...</p>
<p>&gt; [SUCCESS] Debutant: 15k FCFA</p>
<p>&gt; [SUCCESS] Intermediaire: 30k FCFA</p>
<p>&gt; [SUCCESS] Hacking Pro: 45k FCFA</p>
<p class="mt-4 text-secondary">Awaiting user input...</p>
<p class="cursor-blink">admin@hycyber:~$ <span class="bg-primary/20 px-1">select_plan --type=pro</span></p>
</div>
</div>
</div>
</div>
</section>
<!-- Footer -->
<footer class="bg-surface-container-lowest border-t border-outline-variant/20 py-12">
<div class="flex flex-col md:flex-row justify-between items-center px-margin-desktop max-w-container-max mx-auto gap-8">
<div class="flex flex-col gap-4">
<div class="text-primary font-headline-lg-mobile font-bold tracking-tighter">hycyber</div>
<p class="text-on-surface-variant font-body-md opacity-80">© 2024 hycyber. Protégez votre futur.</p>
</div>
<div class="flex gap-8">
<a class="text-on-surface-variant hover:text-secondary transition-colors font-body-md opacity-80 hover:opacity-100" href="#">LinkedIn</a>
<a class="text-on-surface-variant hover:text-secondary transition-colors font-body-md opacity-80 hover:opacity-100" href="#">YouTube</a>
<a class="text-on-surface-variant hover:text-secondary transition-colors font-body-md opacity-80 hover:opacity-100" href="#">Confidentialité</a>
<a class="text-on-surface-variant hover:text-secondary transition-colors font-body-md opacity-80 hover:opacity-100" href="#">Mentions Légales</a>
</div>
</div>
</footer>
<script>
        function setRegion(region) {
            const afriqueBtn = document.getElementById('toggle-afrique');
            const europeBtn = document.getElementById('toggle-europe');
            const prices = document.querySelectorAll('.price-val');
            const currencies = document.querySelectorAll('.currency-val');

            if (region === 'AFRIQUE') {
                afriqueBtn.classList.add('bg-primary', 'text-on-primary', 'glow-primary');
                afriqueBtn.classList.remove('text-on-surface-variant');
                europeBtn.classList.remove('bg-primary', 'text-on-primary', 'glow-primary');
                europeBtn.classList.add('text-on-surface-variant');
                
                prices.forEach(p => p.innerText = p.getAttribute('data-afrique'));
                currencies.forEach(c => c.innerText = 'FCFA');
            } else {
                europeBtn.classList.add('bg-primary', 'text-on-primary', 'glow-primary');
                europeBtn.classList.remove('text-on-surface-variant');
                afriqueBtn.classList.remove('bg-primary', 'text-on-primary', 'glow-primary');
                afriqueBtn.classList.add('text-on-surface-variant');

                prices.forEach(p => p.innerText = p.getAttribute('data-europe'));
                currencies.forEach(c => c.innerText = '€');
            }
        }
    </script>
</body></html>

## enteprise 




<!DOCTYPE html>

<html class="dark" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>hycyber | Solutions Entreprise</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;family=Space+Grotesk:wght@600;700&amp;family=JetBrains+Mono:wght@400;500&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "on-background": "#dce5df",
                    "primary-fixed-dim": "#6add93",
                    "on-tertiary-fixed-variant": "#11513a",
                    "tertiary-fixed": "#b2f0d1",
                    "surface-container": "#19211e",
                    "secondary-container": "#199eb9",
                    "on-surface-variant": "#bdcabd",
                    "surface-container-lowest": "#08100d",
                    "inverse-surface": "#dce5df",
                    "on-secondary-fixed": "#001f26",
                    "on-error": "#690005",
                    "surface-container-low": "#151d1a",
                    "secondary": "#66d5f1",
                    "on-tertiary-fixed": "#002114",
                    "on-error-container": "#ffdad6",
                    "outline": "#879488",
                    "surface-tint": "#6add93",
                    "on-secondary-fixed-variant": "#004e5d",
                    "tertiary-container": "#629d81",
                    "on-secondary-container": "#002e38",
                    "secondary-fixed": "#aeecff",
                    "surface-container-high": "#242c28",
                    "surface-variant": "#2e3733",
                    "on-primary-container": "#003117",
                    "outline-variant": "#3e4a40",
                    "on-tertiary": "#003826",
                    "tertiary-fixed-dim": "#97d3b5",
                    "surface-dim": "#0d1512",
                    "primary-container": "#2aa561",
                    "on-primary": "#00391c",
                    "primary": "#6add93",
                    "error-container": "#93000a",
                    "surface": "#0d1512",
                    "surface-container-highest": "#2e3733",
                    "on-primary-fixed-variant": "#00522b",
                    "background": "#0d1512",
                    "tertiary": "#97d3b5",
                    "on-surface": "#dce5df",
                    "inverse-on-surface": "#2a322f",
                    "on-tertiary-container": "#003120",
                    "error": "#ffb4ab",
                    "primary-fixed": "#86faad",
                    "on-primary-fixed": "#00210e",
                    "secondary-fixed-dim": "#66d5f1",
                    "on-secondary": "#003641",
                    "surface-bright": "#333b37",
                    "inverse-primary": "#006d3b"
            },
            "borderRadius": {
                    "DEFAULT": "0.125rem",
                    "lg": "0.25rem",
                    "xl": "0.5rem",
                    "full": "0.75rem"
            },
            "spacing": {
                    "margin-mobile": "20px",
                    "margin-desktop": "64px",
                    "unit": "4px",
                    "gutter": "24px",
                    "container-max": "1280px"
            },
            "fontFamily": {
                    "body-md": ["Inter"],
                    "code-sm": ["JetBrains Mono"],
                    "headline-lg": ["Space Grotesk"],
                    "headline-lg-mobile": ["Space Grotesk"],
                    "headline-xl": ["Space Grotesk"],
                    "body-lg": ["Inter"],
                    "label-mono": ["JetBrains Mono"]
            },
            "fontSize": {
                    "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                    "code-sm": ["13px", {"lineHeight": "18px", "fontWeight": "400"}],
                    "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                    "headline-lg-mobile": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                    "headline-xl": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                    "label-mono": ["14px", {"lineHeight": "20px", "letterSpacing": "0.05em", "fontWeight": "500"}]
            }
          },
        },
      }
    </script>
<style>
        body {
            background-color: #000202;
            color: #dce5df;
            overflow-x: hidden;
        }
        .cyber-grid {
            background-image: radial-gradient(circle at 2px 2px, #121A17 1px, transparent 0);
            background-size: 40px 40px;
        }
        .glass-card {
            background: rgba(18, 26, 23, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid #004630;
            transition: all 0.3s ease;
        }
        .glass-card:hover {
            border-color: #009150;
            box-shadow: 0 0 20px rgba(0, 145, 80, 0.15);
        }
        .hexagon-frame {
            clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
            background: #004630;
            padding: 2px;
        }
        .hexagon-inner {
            clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
        }
        .cursor-blink {
            animation: blink 1s step-end infinite;
        }
        @keyframes blink { 50% { opacity: 0; } }
    </style>
</head>
<body class="font-body-md selection:bg-primary/30">
<!-- TopNavBar -->
<header class="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm">
<nav class="flex items-center justify-between px-margin-desktop py-4 max-w-container-max mx-auto">
<div class="font-headline-lg text-headline-lg font-bold text-primary tracking-tighter">hycyber</div>
<div class="hidden md:flex items-center gap-8">
<a class="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md" href="#">Formations</a>
<a class="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md" href="#">Tarifs</a>
<a class="text-primary font-bold border-b-2 border-primary pb-1 font-body-md text-body-md" href="#">Entreprise</a>
<a class="text-on-surface-variant hover:text-primary transition-colors font-body-md text-body-md" href="#">Contact</a>
</div>
<div class="flex items-center gap-4">
<button class="px-6 py-2 rounded-full border border-primary text-primary font-bold hover:bg-primary/10 transition-all duration-300 active:scale-95">
                    Connexion
                </button>
</div>
</nav>
</header>
<main class="pt-24">
<!-- Hero Section -->
<section class="relative min-h-[716px] flex items-center justify-center overflow-hidden cyber-grid">

<div class="relative z-10 text-center px-margin-mobile max-w-4xl">
<div class="inline-block px-3 py-1 bg-primary/10 border border-primary/20 text-primary font-label-mono text-label-mono mb-6 rounded-sm uppercase tracking-widest">
                    Division Corporate
                </div>
<h1 class="font-headline-xl text-headline-xl text-on-background mb-6">Sécurisez l'avenir de votre infrastructure humaine.</h1>
<p class="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-2xl mx-auto">
                    Des programmes de montée en compétences cyber sur-mesure pour vos équipes techniques, conçus par des experts du terrain dans un environnement de simulation haute-fidélité.
                </p>
<div class="flex flex-col md:flex-row gap-4 justify-center">
<button class="bg-primary text-on-primary px-8 py-4 rounded-sm font-bold text-lg hover:shadow-[0_0_15px_rgba(106,221,147,0.4)] transition-all">
                        Consulter nos offres
                    </button>
<button class="border border-secondary text-secondary px-8 py-4 rounded-sm font-bold text-lg hover:bg-secondary/10 transition-all">
                        Parler à un expert
                    </button>
</div>
</div>
</section>
<!-- Notre Histoire et Valeurs -->
<section class="py-24 px-margin-desktop max-w-container-max mx-auto">
<div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
<div>
<h2 class="font-headline-lg text-headline-lg text-primary mb-8">Notre Histoire &amp; Valeurs</h2>
<div class="space-y-6 font-body-md text-body-md text-on-surface-variant">
<p>Né au cœur des enjeux de souveraineté numérique, <span class="text-primary font-bold">hycyber</span> a été fondé par un collectif d'anciens analystes SOC et chercheurs en vulnérabilités. Notre mission : combler le fossé entre la théorie académique et la réalité brutale des cyberattaques modernes.</p>
<p>Nous croyons que la défense n'est pas qu'une question d'outils, mais de réflexes. Nos valeurs sont ancrées dans la rigueur technique, le partage de connaissance et l'éthique offensive au service de la protection.</p>
</div>
<div class="mt-12 grid grid-cols-2 gap-6">
<div class="p-6 bg-surface-container-low border-l-4 border-primary">
<div class="text-headline-lg font-bold text-primary mb-1">98%</div>
<div class="text-label-mono font-label-mono uppercase text-on-surface-variant">Taux de réussite</div>
</div>
<div class="p-6 bg-surface-container-low border-l-4 border-secondary">
<div class="text-headline-lg font-bold text-secondary mb-1">500+</div>
<div class="text-label-mono font-label-mono uppercase text-on-surface-variant">Entreprises formées</div>
</div>
</div>
</div>
<div class="relative">
<div class="aspect-square glass-card rounded-xl overflow-hidden relative group">
<img class="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" data-alt="A high-tech control room with multiple glowing blue and green screens displaying complex data visualizations and network maps. The room is dark, with cinematic lighting reflecting off glass surfaces. In the foreground, a modern workstation with a mechanical keyboard and encrypted terminals. The atmosphere is professional, secure, and technologically advanced, echoing the hycyber brand identity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAY6-4TmxIH7ALRQnF7ocSc68yyfTSg8QVRGsJbuEc90T218pyNI1evybsBl7w5DrfsahB3IPiUw3Rf4IK3VOSr36zyyzd1EZKBTXO99egswTH7NwtgfD1nib16Bh1UGn3bnk8XfuOg0tylmjGTdsIueJt6pifrzcbdCVXVcn0zg2vJmIe47tNcvMwAHg7HxH1pWAQ5nhAQ6uZSV6uOUD-AvSn1_PunSM3CIaqn5mxGYaMlfDe3bMmI8AKsn-7qUEvFhDBz1JuZFrFY"/>
<div class="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
<div class="absolute bottom-8 left-8 right-8 p-6 bg-surface-container/90 backdrop-blur-md border border-outline-variant/30">
<div class="font-code-sm text-code-sm text-primary mb-2 flex items-center gap-2">
<span class="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                                SYSTEM_CORE_VALUES.EXE
                            </div>
<div class="font-label-mono text-label-mono text-on-surface">
                                &gt; Intégrité. Excellence. Résilience.
                            </div>
</div>
</div>
</div>
</div>
</section>
<!-- Team Section -->
<section class="py-24 bg-surface-container-lowest">
<div class="px-margin-desktop max-w-container-max mx-auto">
<div class="text-center mb-16">
<h2 class="font-headline-lg text-headline-lg text-on-background mb-4">L'Elite du Terminal</h2>
<p class="text-on-surface-variant max-w-2xl mx-auto">Nos formateurs sont des praticiens certifiés intervenant quotidiennement sur des environnements critiques.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
<!-- Trainer 1 -->
<div class="text-center group">
<div class="hexagon-frame mx-auto w-48 h-48 mb-6 group-hover:shadow-[0_0_30px_rgba(0,145,80,0.3)] transition-all duration-500">
<div class="hexagon-inner w-full h-full bg-surface-container-highest">
<img class="w-full h-full object-cover" data-alt="Professional portrait of a male cybersecurity expert in his late 30s with a focused, serious expression. He has short dark hair and is wearing a sleek black tactical polo shirt. The background is a dimly lit server room with soft green neon highlights. High-end portrait photography style, shallow depth of field, cool technical tones matching the hycyber palette." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCNF3AYlIkPqga6rSqKBZ4EMgCF15PnLaa_zr-QA6YrrhGKGc9eVwkGtYczdOBJ42BSfbTSY1zdRJPWyoZUgbXlmmErrUuz2Em3d5VnQ-k4KyxoXRguXiKiVhwOYDLYhfNkQRM-rwIRONpRaMLrH-8gA4phHuY4XwkBxO0zAHXAJeOG-LUpBHOaQB8pN2CDNwnGq9jbC2eaTzVec0FpNBIxuTGhUK7BOyJLrYvlVFRSYPAn8TSg2nCKjCJ20k-AsZQeR2qGDpTmh4p"/>
</div>
</div>
<h3 class="font-headline-lg-mobile text-headline-lg-mobile text-primary">Alexandre V.</h3>
<p class="font-label-mono text-label-mono text-secondary mb-2 uppercase tracking-wider">Lead Pentester</p>
<p class="text-on-surface-variant text-sm px-4">Expert en compromission Active Directory et Red Teaming.</p>
</div>
<!-- Trainer 2 -->
<div class="text-center group">
<div class="hexagon-frame mx-auto w-48 h-48 mb-6 group-hover:shadow-[0_0_30px_rgba(0,145,80,0.3)] transition-all duration-500">
<div class="hexagon-inner w-full h-full bg-surface-container-highest">
<img class="w-full h-full object-cover" data-alt="Professional portrait of a female cybersecurity specialist with glasses, looking confident and professional. She is wearing a modern charcoal blazer over a black tech tee. Behind her, a blurred digital terminal display with green code. The lighting is crisp and modern, featuring a cool teal and green color grade consistent with a secure operations center environment." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyrrjrYYftaH51U23VvF0rPaIAMAUG7fPNsuVcIcqdsjonStDGUxV35glw-IBL-FCWhyczBMrlPO_OCUSCsllpDYioFruEZPCJahkDyYGpc7zlpsnBQ4ADce-I94qZRCoLsr4C2lFCTG-LHqEqmcsVyfUGaO9Vt-t1GHVW7H2xK1Poe8dXzVi7HHNyK1LQtqbOfiYLIp988ApikdOLOEcMJm9gQo8noizChy3Vg6UrQbomBnXVPvpR2jBiZ5agCluDGDULAB-8S7VO"/>
</div>
</div>
<h3 class="font-headline-lg-mobile text-headline-lg-mobile text-primary">Sarah K.</h3>
<p class="font-label-mono text-label-mono text-secondary mb-2 uppercase tracking-wider">DFIR Analyst</p>
<p class="text-on-surface-variant text-sm px-4">Spécialiste en réponse aux incidents et analyse forensique.</p>
</div>
<!-- Trainer 3 -->
<div class="text-center group">
<div class="hexagon-frame mx-auto w-48 h-48 mb-6 group-hover:shadow-[0_0_30px_rgba(0,145,80,0.3)] transition-all duration-500">
<div class="hexagon-inner w-full h-full bg-surface-container-highest">
<img class="w-full h-full object-cover" data-alt="Portrait of a senior cybersecurity architect, middle-aged with salt-and-pepper beard, wearing a dark navy hoodie. He has a wise and technical look. The background shows a dark minimalist office with a single glowing monitor. The style is cinematic and atmospheric, using deep shadows and primary green accents to maintain the hycyber visual identity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoSDQTF2NUba16kd52dx_esGRlTSY7Eco0mLxbn_QFyunYfrLJPebO5PE_8lX0ds4nyh-iFVmbOcdY4eHnO1130D1FFzrBaYXbe0BkiujIBapC3VpyLzA7c94jTJGcCgRpYog_9nqaU39rz9hBD2O4O_kFrgEIBBtmVOGBk3n3QGrNx3IaLegpq30cYOj5XHSBBq1xTtFRsHrCEue9mu-CLQDaZYUoStxSy6K5sbwEja94Xk59JNl1cp8vQum69R0OT8qOOxa6EPq3"/>
</div>
</div>
<h3 class="font-headline-lg-mobile text-headline-lg-mobile text-primary">Marc-André D.</h3>
<p class="font-label-mono text-label-mono text-secondary mb-2 uppercase tracking-wider">Cloud Sec Architect</p>
<p class="text-on-surface-variant text-sm px-4">Ancien RSSI, expert en sécurisation d'environnements AWS &amp; Azure.</p>
</div>
<!-- Trainer 4 -->
<div class="text-center group">
<div class="hexagon-frame mx-auto w-48 h-48 mb-6 group-hover:shadow-[0_0_30px_rgba(0,145,80,0.3)] transition-all duration-500">
<div class="hexagon-inner w-full h-full bg-surface-container-highest">
<img class="w-full h-full object-cover" data-alt="Portrait of a young, brilliant male security researcher with a light beard, wearing a tech-wear jacket. He has an intense, analytical gaze. The background is a dark grid texture with subtle green digital noise. The photograph is sharp, professional, and reflects a modern hacking aesthetic, perfectly aligned with the hycyber dark mode UI." src="https://lh3.googleusercontent.com/aida-public/AB6AXuACm3rerB89UEGnkSsCQTb2_CNKRdvWt1_psp9GRxUOwY1MPW1jMd5uPYl0AWjVkc33hDaoSQsBY23JP_yaFtz5znF_v0D_duQaTnssqVpHwyBAnzkuGUuqmvYGW543lptjXGuSRrLPDHR7CuFCXZicDzxwfOvDLO43pQg3JxXvjXXqqlLuQHjLfU0_6TguVAYpu0yzt-TkCTj2sGQxFHiS-uAiOgNcdFpGu8rTDS_LbbvY7Ym0cN8o_ZXTRTTHMojOhi2FhfdjzmUs"/>
</div>
</div>
<h3 class="font-headline-lg-mobile text-headline-lg-mobile text-primary">Jérôme L.</h3>
<p class="font-label-mono text-label-mono text-secondary mb-2 uppercase tracking-wider">Exploit Dev</p>
<p class="text-on-surface-variant text-sm px-4">Chercheur spécialisé en reverse engineering et kernel hacking.</p>
</div>
</div>
</div>
</section>
<!-- Contact Section -->
<section class="py-24 px-margin-desktop max-w-container-max mx-auto relative" id="contact">
<div class="grid grid-cols-1 lg:grid-cols-5 gap-12">
<div class="lg:col-span-2">
<h2 class="font-headline-lg text-headline-lg text-on-background mb-6">Prêt à renforcer vos défenses ?</h2>
<p class="text-on-surface-variant mb-8">Discutons de vos besoins spécifiques : audits de compétences, parcours de formation personnalisés ou simulations de crise.</p>
<div class="space-y-6">
<div class="flex items-start gap-4">
<div class="w-12 h-12 flex items-center justify-center bg-surface-container-high border border-outline-variant text-primary rounded-sm">
<span class="material-symbols-outlined">mail</span>
</div>
<div>
<div class="font-label-mono text-label-mono text-primary uppercase">Email</div>
<div class="text-on-surface">corporate@hycyber.io</div>
</div>
</div>
<div class="flex items-start gap-4">
<div class="w-12 h-12 flex items-center justify-center bg-surface-container-high border border-outline-variant text-secondary rounded-sm">
<span class="material-symbols-outlined">location_on</span>
</div>
<div>
<div class="font-label-mono text-label-mono text-secondary uppercase">Siège</div>
<div class="text-on-surface">Station F, Paris, France</div>
</div>
</div>
</div>
<div class="mt-12 p-6 glass-card rounded-sm border-dashed border-primary/40">
<div class="font-code-sm text-code-sm text-on-surface-variant mb-2">hycyber_cli --status</div>
<div class="font-code-sm text-code-sm text-primary">
                            [OK] Systèmes opérationnels <br/>
                            [OK] Experts disponibles pour consultation <br/>
<span class="cursor-blink">_</span>
</div>
</div>
</div>
<div class="lg:col-span-3">
<form class="glass-card p-8 md:p-12 rounded-sm space-y-6">
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
<div class="space-y-2">
<label class="font-label-mono text-label-mono text-on-surface-variant uppercase">Nom Complet</label>
<input class="w-full bg-surface-dim border border-outline-variant text-on-surface px-4 py-3 rounded-sm focus:ring-1 focus:ring-secondary focus:border-secondary transition-all outline-none" placeholder="ex: Jean Dupont" type="text"/>
</div>
<div class="space-y-2">
<label class="font-label-mono text-label-mono text-on-surface-variant uppercase">Email Professionnel</label>
<input class="w-full bg-surface-dim border border-outline-variant text-on-surface px-4 py-3 rounded-sm focus:ring-1 focus:ring-secondary focus:border-secondary transition-all outline-none" placeholder="nom@entreprise.com" type="email"/>
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
<div class="space-y-2">
<label class="font-label-mono text-label-mono text-on-surface-variant uppercase">Entreprise</label>
<input class="w-full bg-surface-dim border border-outline-variant text-on-surface px-4 py-3 rounded-sm focus:ring-1 focus:ring-secondary focus:border-secondary transition-all outline-none" placeholder="Nom de votre société" type="text"/>
</div>
<div class="space-y-2">
<label class="font-label-mono text-label-mono text-on-surface-variant uppercase">Effectif IT</label>
<select class="w-full bg-surface-dim border border-outline-variant text-on-surface px-4 py-3 rounded-sm focus:ring-1 focus:ring-secondary focus:border-secondary transition-all outline-none">
<option>1 - 10</option>
<option>11 - 50</option>
<option>50 - 200</option>
<option>200+</option>
</select>
</div>
</div>
<div class="space-y-2">
<label class="font-label-mono text-label-mono text-on-surface-variant uppercase">Votre Projet</label>
<textarea class="w-full bg-surface-dim border border-outline-variant text-on-surface px-4 py-3 rounded-sm focus:ring-1 focus:ring-secondary focus:border-secondary transition-all outline-none" placeholder="Décrivez vos objectifs de formation ou de sécurité..." rows="4"></textarea>
</div>
<button class="w-full bg-primary text-on-primary font-bold py-4 rounded-sm hover:shadow-[0_0_20px_rgba(106,221,147,0.3)] transition-all flex items-center justify-center gap-2" type="submit">
                            Envoyer la requête
                            <span class="material-symbols-outlined">send</span>
</button>
</form>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="w-full py-12 bg-surface-container-lowest border-t border-outline-variant/20">
<div class="flex flex-col md:flex-row justify-between items-center px-margin-desktop max-w-container-max mx-auto gap-8">
<div class="flex flex-col gap-2">
<div class="text-primary font-headline-lg-mobile font-bold">hycyber</div>
<p class="text-on-surface-variant text-sm font-body-md">© 2024 hycyber. Protégez votre futur.</p>
</div>
<div class="flex flex-wrap justify-center gap-6">
<a class="text-on-surface-variant hover:text-secondary transition-colors font-body-md" href="#">LinkedIn</a>
<a class="text-on-surface-variant hover:text-secondary transition-colors font-body-md" href="#">Facebook</a>
<a class="text-on-surface-variant hover:text-secondary transition-colors font-body-md" href="#">YouTube</a>
<a class="text-on-surface-variant hover:text-secondary transition-colors font-body-md" href="#">Mentions Légales</a>
<a class="text-on-surface-variant hover:text-secondary transition-colors font-body-md" href="#">Confidentialité</a>
</div>
<div class="flex items-center gap-4">
<div class="px-3 py-1 border border-outline-variant rounded-sm text-xs text-on-surface-variant font-label-mono">
                    VER: 2.0.4-STABLE
                </div>
</div>
</div>
</footer>
<script>
        // Micro-interaction for form inputs
        document.querySelectorAll('input, select, textarea').forEach(el => {
            el.addEventListener('focus', () => {
                el.parentElement.querySelector('label').style.color = '#6add93';
            });
            el.addEventListener('blur', () => {
                el.parentElement.querySelector('label').style.color = '';
            });
        });

        // Simple scroll reveal for cards
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('opacity-100', 'translate-y-0');
                    entry.target.classList.remove('opacity-0', 'translate-y-10');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.glass-card, .hexagon-frame').forEach(el => {
            el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10');
            observer.observe(el);
        });
    </script>
</body></html>

So follow all of these html pages and build me a next js Front end application