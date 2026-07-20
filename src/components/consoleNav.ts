import type { SidebarItem } from "./ConsoleSidebar";

export const DASHBOARD_NAV: SidebarItem[] = [
  { icon: "dashboard", label: "Tableau de bord", href: "/dashboard" },
  { icon: "school", label: "Mes Formations", href: "/dashboard/formations" },
  { icon: "science", label: "Labs Pratiques", href: "/dashboard/labs" },
  { icon: "workspace_premium", label: "Certifications", href: "/dashboard/certifications" },
  { icon: "shopping_bag", label: "Mes achats", href: "/dashboard/achats" },
  { icon: "settings", label: "Paramètres", href: "/dashboard/parametres" },
];

export const ADMIN_NAV: SidebarItem[] = [
  { icon: "monitoring", label: "Vue d'ensemble", href: "/admin" },
  { icon: "group", label: "Utilisateurs", href: "/admin/utilisateurs" },
  { icon: "school", label: "Formations", href: "/admin/formations" },
  { icon: "point_of_sale", label: "Ventes", href: "/admin/ventes" },
  { icon: "assessment", label: "Rapports", href: "/admin/rapports" },
];
