import { Platform } from 'react-native';

export const Colors = {
  primary: '#A34B1F',
  primaryDark: '#7D3516',
  primaryLight: '#E9A64D',
  accent: '#C06A3B',
  accent2: '#D27C52',
  bg: '#F8E8C7',
  surface: '#FFF7E9',
  surfaceSoft: '#F4E2BC',
  text: '#4E2513',
  textMuted: '#8B5F49',
  border: 'rgba(163,75,31,0.16)',
  gradientStart: '#A34B1F',
  gradientEnd: '#E9A64D',
  gradientSoftStart: '#FFF7E9',
  gradientSoftEnd: '#F4DCB0',
  success: '#25D366',
  danger: '#DD3333',
  facebook: '#1877F2',
  youtube: '#FF0000',
  whatsapp: '#25D366',
};

export const Shadows = {
  card: Platform.select({
    web: {
      boxShadow: '0px 4px 12px rgba(163,75,31,0.12)',
    },
    default: {
      shadowColor: '#A34B1F',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
    },
  }),
  lg: Platform.select({
    web: {
      boxShadow: '0px 8px 20px rgba(163,75,31,0.16)',
    },
    default: {
      shadowColor: '#A34B1F',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 20,
      elevation: 8,
    },
  }),
};
