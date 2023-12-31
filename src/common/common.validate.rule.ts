import { RuleType } from '@midwayjs/validate';

// 手机号
export const PhoneRule = RuleType.string().pattern(
  /^1(3\d|4[5-9]|5[0-35-9]|6[567]|7[0-8]|8\d|9[0-35-9])\d{8}$/
);

// 邮箱
export const EmailRule = RuleType.string().pattern(
  /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/
);
