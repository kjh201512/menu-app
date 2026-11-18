const aliases = {
  '계란': '달걀', '난류': '달걀', egg: '달걀', eggs: '달걀', milk: '우유', '밀가루': '밀', wheat: '밀',
  '콩': '대두', soy: '대두', soybean: '대두', peanut: '땅콩', shrimp: '새우', pork: '돼지고기', beef: '소고기',
};
function normalizeIngredient(raw) {
  const value = raw.normalize('NFKC').toLowerCase().replace(/\s/gu, '');
  return aliases[value] || value;
}
function addRestriction(items, raw, type) {
  const ingredientName = normalizeIngredient(raw);
  if (!ingredientName || [...ingredientName].length > 50) throw new Error('식재료 이름은 1~50자로 입력해 주세요.');
  if (items.some(item => normalizeIngredient(item.ingredientName) === ingredientName))
    throw new Error('이미 등록한 식재료입니다. 알레르기/비선호 간에도 중복 등록할 수 없습니다.');
  if (items.length >= 100) throw new Error('최대 100개까지 등록할 수 있습니다.');
  return [...items, { ingredientName, type }];
}
function validCoordinates(latText, lngText) {
  if (!latText.trim() || !lngText.trim()) return false;
  const lat = Number(latText), lng = Number(lngText);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
module.exports = { normalizeIngredient, addRestriction, validCoordinates };
