export const getImageUrl = (keys: string[] | string | undefined): string[] => {
  if (!keys) return [];
  if (typeof keys === 'string') return [`https://recho-img.s3.ap-northeast-2.amazonaws.com/${keys}`];
  return keys.map(k => `https://recho-img.s3.ap-northeast-2.amazonaws.com/${k}`);
};

export default getImageUrl;