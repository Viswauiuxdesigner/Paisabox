import React from 'react';
import {
  Utensils,
  Car,
  Coffee,
  Smartphone,
  Tv,
  ShoppingBasket,
  Zap,
  Home,
  ShoppingBag,
  HeartPulse,
  Film,
  Tag,
  Wallet,
  Gift,
  BookOpen,
  Plane,
  Dumbbell,
  PawPrint,
  Wrench,
  Music,
  type LucideProps,
} from 'lucide-react';

export const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  utensils: Utensils,
  car: Car,
  coffee: Coffee,
  smartphone: Smartphone,
  tv: Tv,
  'shopping-basket': ShoppingBasket,
  zap: Zap,
  home: Home,
  'shopping-bag': ShoppingBag,
  'heart-pulse': HeartPulse,
  film: Film,
  tag: Tag,
  wallet: Wallet,
  gift: Gift,
  book: BookOpen,
  plane: Plane,
  dumbbell: Dumbbell,
  paw: PawPrint,
  wrench: Wrench,
  music: Music,
};

export const ICON_OPTIONS = Object.keys(ICON_MAP);

export const COLOR_OPTIONS = [
  '#f97316', // orange
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#10b981', // emerald
  '#eab308', // yellow
  '#6366f1', // indigo
  '#f43f5e', // rose
  '#ef4444', // red
  '#a855f7', // purple
  '#64748b', // slate
  '#0d9488', // teal
  '#84cc16', // lime
];

interface CategoryIconProps {
  name: string;
  size?: number;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, size = 18, className = '' }) => {
  const Icon = ICON_MAP[name] ?? Tag;
  return <Icon size={size} className={className} strokeWidth={2} />;
};
