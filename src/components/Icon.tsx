import {
  LuArrowRight, LuBriefcase, LuCakeSlice, LuCalendarDays, LuCheck, LuChevronDown, LuChevronLeft, LuChevronRight,
  LuClipboardList, LuCopy, LuCrown, LuFlower2, LuHeart, LuMapPin, LuMaximize2, LuMenu, LuMessageCircle, LuMinus,
  LuNavigation, LuPhone, LuPlus, LuSofa, LuSparkles, LuUsers, LuUtensils, LuX,
} from 'react-icons/lu'; // Lucide icon set; named imports keep the bundle tree-shakeable

const map = {
  heart: LuHeart, utensils: LuUtensils, flower: LuFlower2, clipboard: LuClipboardList, briefcase: LuBriefcase, cake: LuCakeSlice,
  sparkles: LuSparkles, pin: LuMapPin, users: LuUsers, sofa: LuSofa, phone: LuPhone, chat: LuMessageCircle, menu: LuMenu,
  close: LuX, chevronDown: LuChevronDown, chevronLeft: LuChevronLeft, chevronRight: LuChevronRight, plus: LuPlus, minus: LuMinus,
  check: LuCheck, calendar: LuCalendarDays, arrow: LuArrowRight, navigation: LuNavigation, copy: LuCopy, expand: LuMaximize2, crown: LuCrown,
} as const;
export type IconName = keyof typeof map;

export function Icon({ name, size = 20, className = '' }: { name: IconName; size?: number; className?: string }) {
  const C = map[name];
  return <C size={size} className={className} aria-hidden="true" />;
}
