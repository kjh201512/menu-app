// Java CredentialsPolicy와 동일한 MVP 이메일/비밀번호 정책. 비밀번호는 trim 금지.
const EMAIL = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;
function normalizeEmail(email) { return email.trim().toLowerCase(); }
function validEmail(raw) {
  const email = normalizeEmail(raw);
  if (email.length > 254 || !EMAIL.test(email)) return false;
  const [local, domain] = email.split('@');
  return local.length <= 64 && !local.startsWith('.') && !local.endsWith('.') && !local.includes('..')
    && domain.split('.').every(label => label.length <= 63);
}
function utf8Bytes(value) {
  let size = 0;
  for (const char of value) {
    const point = char.codePointAt(0);
    size += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
  }
  return size;
}
function validate(email, password, confirmation) {
  const errors = {};
  if (!validEmail(email)) errors.email = '올바른 이메일 형식을 입력해 주세요.';
  if ([...password].length < 8 || password.trim().length === 0 || utf8Bytes(password) > 72)
    errors.password = '비밀번호는 8자 이상, UTF-8 기준 72바이트 이하로 입력해 주세요.';
  if (confirmation !== undefined && password !== confirmation)
    errors.confirmation = '비밀번호가 일치하지 않습니다.';
  return errors;
}
module.exports = { normalizeEmail, validEmail, utf8Bytes, validate };
