export const generateRandomNumber = (): number => {
  const minm = 1000000;
  const maxm = 9999999;
  return Math.floor(Math.random() * (maxm - minm + 1)) + minm;
};
