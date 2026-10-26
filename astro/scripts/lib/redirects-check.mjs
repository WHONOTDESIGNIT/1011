// _redirects 里"被删除的页面是否都有 301"的判定。
// 单独成文件是为了能被自测脚本直接调用——判定逻辑与写盘/构建流程解耦。

/**
 * 返回被删掉但 _redirects 里找不到对应规则的路径。
 *
 * 规则行形如 `FROM TO 301!`，所以判定用 `FROM + 空格`：这样 `/blog/foo` 不会误配
 * `/blog/foo-bar ...`（前缀相同但并不是同一条规则）。
 */
export function findMissingRedirects(body, deletedPaths) {
  return deletedPaths.filter((from) => !body.includes(`${from} `));
}
