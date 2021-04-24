import { colors } from '@/constants/colors';

export const getRandomColor = () => {
  const allColors = colors.flat();
  const index = Math.floor(Math.random() * allColors.length);
  return allColors[index];
};
