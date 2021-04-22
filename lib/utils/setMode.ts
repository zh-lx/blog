import { themeMode } from '@/constants/theme-mode';
export const setMode = () => {
  const root: HTMLElement = document.querySelector(':root');
  const options = themeMode.lightMode;
  Object.keys(options).forEach((key) => {
    root.style.setProperty(key, options[key]);
  });
};
