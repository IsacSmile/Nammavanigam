import React from "react";
import {
  UtensilsCrossed,
  Hotel,
  Plane,
  Stethoscope,
  GraduationCap,
  Home,
  Car,
  Sparkles,
  ShoppingBag,
  Briefcase,
  PartyPopper,
  Wrench,
  LayoutGrid,
  FolderTree,
  Utensils,
  Laptop,
  LucideProps,
} from "lucide-react";

export const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  UtensilsCrossed,
  Utensils,
  Hotel,
  Plane,
  Stethoscope,
  GraduationCap,
  Home,
  Car,
  Sparkles,
  ShoppingBag,
  Briefcase,
  PartyPopper,
  Wrench,
  LayoutGrid,
  Laptop,
  FolderTree,
};

interface CategoryIconProps extends LucideProps {
  iconName?: string | null;
  categoryName?: string;
}

export function CategoryIcon({ iconName, categoryName, ...props }: CategoryIconProps) {
  if (iconName && ICON_MAP[iconName]) {
    const IconComp = ICON_MAP[iconName];
    return <IconComp {...props} />;
  }

  if (categoryName) {
    const lower = categoryName.toLowerCase();
    if (lower.includes("food") || lower.includes("restaurant") || lower.includes("cafe") || lower.includes("dining") || lower.includes("bakery")) {
      return <UtensilsCrossed {...props} />;
    }
    if (lower.includes("hotel") || lower.includes("travel") || lower.includes("tourism") || lower.includes("resort")) {
      return <Hotel {...props} />;
    }
    if (lower.includes("health") || lower.includes("doctor") || lower.includes("hospital") || lower.includes("clinic")) {
      return <Stethoscope {...props} />;
    }
    if (lower.includes("education") || lower.includes("school") || lower.includes("college") || lower.includes("coaching")) {
      return <GraduationCap {...props} />;
    }
    if (lower.includes("home") || lower.includes("property") || lower.includes("real estate") || lower.includes("interior")) {
      return <Home {...props} />;
    }
    if (lower.includes("auto") || lower.includes("car") || lower.includes("bike") || lower.includes("vehicle")) {
      return <Car {...props} />;
    }
    if (lower.includes("beauty") || lower.includes("wellness") || lower.includes("salon") || lower.includes("spa")) {
      return <Sparkles {...props} />;
    }
    if (lower.includes("shop") || lower.includes("retail") || lower.includes("fashion") || lower.includes("store")) {
      return <ShoppingBag {...props} />;
    }
    if (lower.includes("professional") || lower.includes("lawyer") || lower.includes("accountant") || lower.includes("consultant")) {
      return <Briefcase {...props} />;
    }
    if (lower.includes("event") || lower.includes("entertainment") || lower.includes("wedding") || lower.includes("cinema")) {
      return <PartyPopper {...props} />;
    }
    if (lower.includes("job") || lower.includes("service") || lower.includes("repair") || lower.includes("freelance")) {
      return <Wrench {...props} />;
    }
    if (lower.includes("other") || lower.includes("ngo") || lower.includes("community")) {
      return <LayoutGrid {...props} />;
    }
  }

  return <FolderTree {...props} />;
}
