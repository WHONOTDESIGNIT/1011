#!/usr/bin/env node
// findMissingRedirects 的自测：通过分支与失败分支都要走一遍。
//
// 失败分支在真实构建里几乎不会出现（要恰好丢一条规则），所以在这里合成输入来钉住
// 行为——否则那段断言只能是"读过一遍、相信它"。

import { findMissingRedirects } from './lib/redirects-check.mjs';

const cases = [
  {
    name: '全部都有规则 → 不报',
    body: '/a/x /blog/y 301!\n/b/x /blog/z 301!\n',
    deleted: ['/a/x', '/b/x'],
    expect: [],
  },
  {
    name: '少一条规则 → 报出那一条',
    body: '/a/x /blog/y 301!\n',
    deleted: ['/a/x', '/b/x'],
    expect: ['/b/x'],
  },
  {
    name: '前缀相同但不同路径（/blog/foo vs /blog/foo-bar）→ 不算命中',
    body: '/blog/foo-bar /blog/baz 301!\n',
    deleted: ['/blog/foo'],
    expect: ['/blog/foo'],
  },
  {
    name: '空删除列表 → 不报',
    body: '',
    deleted: [],
    expect: [],
  },
];

let failures = 0;
for (const c of cases) {
  const got = findMissingRedirects(c.body, c.deleted);
  const same = got.length === c.expect.length && got.every((g, i) => g === c.expect[i]);
  if (same) {
    console.log(`✅ ${c.name}`);
  } else {
    failures++;
    console.error(`❌ ${c.name}\n   期望 ${JSON.stringify(c.expect)}\n   实际 ${JSON.stringify(got)}`);
  }
}

if (failures) {
  console.error(`\n${failures}/${cases.length} 个用例失败`);
  process.exit(1);
}
console.log(`\n${cases.length} 个用例全部通过`);
