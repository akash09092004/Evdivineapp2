export const NAV_ITEMS = [
  {
    name: 'Home',
    label: 'Home',
    iconType: 'Ionicons',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    name: 'About',
    label: 'About Me',
    iconType: 'Ionicons',
    icon: 'information-circle-outline',
    activeIcon: 'information-circle',
  },
  {
    name: 'Services',
    label: 'Services',
    iconType: 'MaterialIcons',
    icon: 'auto-awesome',
    activeIcon: 'auto-awesome',
  },
  {
    name: 'Booking',
    label: 'Booking',
    iconType: 'Ionicons',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
    isBrand: true,
  },
  {
    name: 'Blog',
    label: 'Blog',
    iconType: 'Ionicons',
    icon: 'reader-outline',
    activeIcon: 'reader',
  },
  {
    name: 'Chat',
    label: 'Chat',
    iconType: 'Ionicons',
    icon: 'chatbubble-ellipses-outline',
    activeIcon: 'chatbubble-ellipses',
  },
  {
    name: 'Profile',
    label: 'Profile',
    iconType: 'Ionicons',
    icon: 'person-outline',
    activeIcon: 'person',
  },
];

export const DESKTOP_NAV_LINKS = NAV_ITEMS.map(({ name, label }) => ({
  name,
  label,
}));
