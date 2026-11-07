# languages/

存放 VitePress / Shiki 需要额外加载的第三方 TextMate 语法（`markdown.languages`）。

## mysql.tmLanguage.json

- **用途**：让 ```` ```mysql ```` 代码块高亮 MySQL 专属关键字（内置 `sql` 语法缺 `AUTO_INCREMENT`、`ENGINE`、`CHARSET`、`UNSIGNED`、`DEFINER`、`RLIKE` 等）。
- **上游**：<https://github.com/cweijan/vscode-database-client> → `syntaxes/mysql.tmLanguage.json`
- **固定版本**：commit `3dc0266e89`（2021-01-26），文件大小 24634 B，下载自 jsDelivr：
  `https://cdn.jsdelivr.net/gh/cweijan/vscode-database-client@3dc0266e89/syntaxes/mysql.tmLanguage.json`
- **本地改动**：无。仅通过 `mysql.mts` 在注册时把 `name` / `scopeName` 改成 `mysql` / `source.mysql`，避免与内置 `sql` 的 `source.sql` 冲突。
- **许可证**：MIT

```
MIT License

Copyright (c) 2019-2021 Weijan Chen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

> 升级该语法时：改 `mysql.tmLanguage.json` 并同步更新本文件的 commit 与大小；若上游改了 `scopeName`，`mysql.mts` 里的覆盖仍然生效，不用改。
