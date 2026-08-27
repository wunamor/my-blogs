// docs/.vitepress/config.mts
import { defineConfig } from "file:///E:/github/my-notes/node_modules/vitepress/dist/node/index.js";
import { fileURLToPath as fileURLToPath2, URL as URL2 } from "url";

// docs/.vitepress/configs/vite-plugins.mts
import Components from "file:///E:/github/my-notes/node_modules/unplugin-vue-components/dist/vite.js";
var vitePlugins = [
  Components({
    // 告诉插件，哪些目录下的组件需要自动按需注册
    dirs: [".vitepress/components/algorithm/sort", ".vitepress/components/oj/leetcode"],
    // 允许在 Vue 文件和 Markdown 文件中生效
    include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
    // 自动生成类型声明文件
    dts: ".vitepress/components.d.ts"
  })
  // 💡 以后再有其他的 Vite 插件，直接往这个数组里加就行了，主配置文件零污染！
];

// docs/.vitepress/configs/theme-config.mts
import { generateSidebar } from "file:///E:/github/my-notes/node_modules/vitepress-sidebar/dist/index.js";

// scripts/scanner.mjs
import fs from "node:fs";
import path from "node:path";
import micromatch from "file:///E:/github/my-notes/node_modules/micromatch/index.js";
function scanDir(dirPath, patterns = ["*"]) {
  if (!fs.existsSync(dirPath)) {
    return { directories: [], files: [] };
  }
  const allItems = fs.readdirSync(dirPath);
  const matchedItems = micromatch(allItems, patterns);
  const directories = [];
  const files = [];
  for (const item of matchedItems) {
    const fullPath = path.join(dirPath, item);
    if (fs.statSync(fullPath).isDirectory()) {
      directories.push(item);
    } else {
      files.push(item);
    }
  }
  return { directories, files };
}
function createNameResolver(existingNamesArray) {
  const allNames = new Set(existingNamesArray);
  const seen = /* @__PURE__ */ new Set();
  return function resolve(originalName, candidateName = null) {
    let targetName = candidateName || originalName;
    let displayName = targetName.replace(/^(\d+-)+/, "");
    if (displayName !== targetName && allNames.has(displayName) || seen.has(displayName)) {
      displayName = targetName;
    }
    seen.add(displayName);
    return displayName;
  };
}

// docs/.vitepress/configs/theme-config.mts
function autoGetNavs() {
  const rules = ["*", "!.*", "!public"];
  const { directories } = scanDir("docs", rules);
  return [
    { text: "\u9996\u9875", link: "/" },
    ...directories.map((dir) => ({
      text: dir.replace(/^(\d+-)+/, ""),
      link: `/${dir}/`
    }))
  ];
}
function cleanSidebar(sidebarItems) {
  if (!Array.isArray(sidebarItems)) return sidebarItems;
  const currentLevelNames = sidebarItems.map((item) => item.text).filter(Boolean);
  const resolver = createNameResolver(currentLevelNames);
  return sidebarItems.map((item) => {
    const newItem = { ...item };
    if (newItem.text) {
      newItem.text = resolver(newItem.text);
    }
    if (newItem.items) {
      newItem.items = cleanSidebar(newItem.items);
    }
    return newItem;
  });
}
var themeConfig = {
  nav: autoGetNavs(),
  lastUpdated: {
    text: "\u6700\u540E\u66F4\u65B0\u4E8E",
    formatOptions: {
      dateStyle: "short",
      timeStyle: "short"
    }
  },
  socialLinks: [
    { icon: "github", link: "https://github.com/wunamor/my-blogs" }
  ],
  sidebar: cleanSidebar(generateSidebar({
    documentRootPath: "docs",
    useTitleFromFileHeading: true,
    collapsed: true,
    sortMenusByFrontmatterOrder: true
  })),
  search: {
    provider: "local",
    options: {
      translations: {
        button: {
          buttonText: "\u641C\u7D22\u6587\u6863",
          buttonAriaLabel: "\u641C\u7D22\u6587\u6863"
        },
        modal: {
          noResultsText: "\u65E0\u6CD5\u627E\u5230\u76F8\u5173\u7ED3\u679C",
          resetButtonTitle: "\u6E05\u9664\u67E5\u8BE2\u6761\u4EF6",
          footer: {
            selectText: "\u9009\u62E9",
            navigateText: "\u5207\u6362",
            closeText: "\u5173\u95ED"
          }
        }
      }
    }
  },
  darkModeSwitchLabel: "\u5916\u89C2",
  lightModeSwitchTitle: "\u5207\u6362\u5230\u6D45\u8272\u6A21\u5F0F",
  darkModeSwitchTitle: "\u5207\u6362\u5230\u6DF1\u8272\u6A21\u5F0F",
  sidebarMenuLabel: "\u83DC\u5355",
  returnToTopLabel: "\u8FD4\u56DE\u9876\u90E8",
  notFound: {
    title: "\u9875\u9762\u627E\u4E0D\u5230\u4E86",
    quote: "\u7CDF\u7CD5\uFF0C\u4F60\u4F3C\u4E4E\u6765\u5230\u4E86\u6CA1\u6709\u77E5\u8BC6\u5B58\u5728\u7684\u8352\u539F...",
    linkText: "\u5E26\u6211\u56DE\u9996\u9875"
  },
  docFooter: {
    prev: "\u4E0A\u4E00\u7BC7",
    next: "\u4E0B\u4E00\u7BC7"
  },
  outline: {
    label: "\u672C\u9875\u76EE\u5F55",
    level: "deep"
  },
  footer: {
    message: `
      <a href="https://beian.miit.gov.cn/#/Integrated/index" target="_blank" style="margin-right: 15px; color: #888; text-decoration: none;">\u6D59ICP\u59072026033572\u53F7-1</a>
      <a href="https://beian.mps.gov.cn/#/query/webSearch?code=33078402101562"  target="_blank" style="color: #888; text-decoration: none; display: inline-flex; align-items: center;">
        <img src="/beian.png" style="width: 16px; height: 16px; margin-right: 5px;">
        \u6D59\u516C\u7F51\u5B89\u590733078402101562\u53F7
      </a>`,
    copyright: "Copyright \xA9 2026 wunamor"
  }
};

// docs/.vitepress/configs/page-transform.mts
import fs2 from "fs";
import path2 from "path";
import { fileURLToPath, URL } from "url";
var __vite_injected_original_import_meta_url = "file:///E:/github/my-notes/docs/.vitepress/configs/page-transform.mts";
function transformPageData(pageData) {
  const docsDir = fileURLToPath(new URL("../../", __vite_injected_original_import_meta_url));
  const absoluteFilePath = path2.join(docsDir, pageData.filePath);
  if (!fs2.existsSync(absoluteFilePath)) return;
  let content = fs2.readFileSync(absoluteFilePath, "utf-8");
  content = content.replace(/---[\s\S]*?---/, "").replace(/\$\$[\s\S]*?\$\$/g, "").replace(/\$.*?\$/g, "").replace(/<[^>]+>/g, "");
  const cnMatches = content.match(/[\u4e00-\u9fa5]/g) || [];
  const cnCount = cnMatches.length;
  const enMatches = content.match(/[a-zA-Z0-9]+/g) || [];
  const enCount = enMatches.length;
  const wordCount = cnCount + enCount;
  const readTime = Math.ceil(wordCount / 150) || 1;
  return {
    frontmatter: {
      ...pageData.frontmatter,
      wordCount,
      readTime
    }
  };
}

// docs/.vitepress/plugins/markdown-glossary.mts
var glossary = {
  "\u5355\u4F8B\u6A21\u5F0F": "/01-\u8BA1\u7B97\u673A\u4E0EIT\u6280\u672F/02-\u8BBE\u8BA1\u6A21\u5F0F/01-\u5355\u4F8B\u6A21\u5F0F",
  "\u5DE5\u5382\u6A21\u5F0F": "/01-\u8BA1\u7B97\u673A\u4E0EIT\u6280\u672F/02-\u8BBE\u8BA1\u6A21\u5F0F/02-\u5DE5\u5382\u6A21\u5F0F",
  "\u4EE3\u7406\u6A21\u5F0F": "/01-\u8BA1\u7B97\u673A\u4E0EIT\u6280\u672F/02-\u8BBE\u8BA1\u6A21\u5F0F/03-\u4EE3\u7406\u6A21\u5F0F",
  "RAG": "/01-\u8BA1\u7B97\u673A\u4E0EIT\u6280\u672F/01-\u6BD4\u7279\u5C31\u4E1A\u8BFE/03-LangChain&LangGraph-AI\u5E94\u7528\u5F00\u53D1\u6846\u67B6\u7CBE\u54C1\u8BFE/01-LangChain-AI\u5E94\u7528\u5F00\u53D1\u6846\u67B6\u7CBE\u54C1\u8BFE/02-\u5D4C\u5165\u5F0F\u6A21\u578B#\u5E94\u7528\u573A\u666F",
  "\u76F4\u63A5\u63D2\u5165\u6392\u5E8F": "/01-\u8BA1\u7B97\u673A\u4E0EIT\u6280\u672F/01-\u6BD4\u7279\u5C31\u4E1A\u8BFE/01-Java\u7814\u53D1\u7CFB\u7EDF\u8BFE118\u671F/02-Java\u6570\u636E\u7ED3\u6784/01-\u6570\u636E\u7ED3\u6784\u521D\u9636/2025-07-31-\u6392\u5E8F#\u76F4\u63A5\u63D2\u5165\u6392\u5E8F",
  "\u5E0C\u5C14\u6392\u5E8F": "/01-\u8BA1\u7B97\u673A\u4E0EIT\u6280\u672F/01-\u6BD4\u7279\u5C31\u4E1A\u8BFE/01-Java\u7814\u53D1\u7CFB\u7EDF\u8BFE118\u671F/02-Java\u6570\u636E\u7ED3\u6784/01-\u6570\u636E\u7ED3\u6784\u521D\u9636/2025-07-31-\u6392\u5E8F#\u5E0C\u5C14\u6392\u5E8F",
  "\u9009\u62E9\u6392\u5E8F": "/01-\u8BA1\u7B97\u673A\u4E0EIT\u6280\u672F/01-\u6BD4\u7279\u5C31\u4E1A\u8BFE/01-Java\u7814\u53D1\u7CFB\u7EDF\u8BFE118\u671F/02-Java\u6570\u636E\u7ED3\u6784/01-\u6570\u636E\u7ED3\u6784\u521D\u9636/2025-07-31-\u6392\u5E8F#\u9009\u62E9\u6392\u5E8F",
  "\u5806\u6392\u5E8F": "/01-\u8BA1\u7B97\u673A\u4E0EIT\u6280\u672F/01-\u6BD4\u7279\u5C31\u4E1A\u8BFE/01-Java\u7814\u53D1\u7CFB\u7EDF\u8BFE118\u671F/02-Java\u6570\u636E\u7ED3\u6784/01-\u6570\u636E\u7ED3\u6784\u521D\u9636/2025-07-31-\u6392\u5E8F#\u5806\u6392\u5E8F",
  "\u5192\u6CE1\u6392\u5E8F": "/01-\u8BA1\u7B97\u673A\u4E0EIT\u6280\u672F/01-\u6BD4\u7279\u5C31\u4E1A\u8BFE/01-Java\u7814\u53D1\u7CFB\u7EDF\u8BFE118\u671F/02-Java\u6570\u636E\u7ED3\u6784/01-\u6570\u636E\u7ED3\u6784\u521D\u9636/2025-07-31-\u6392\u5E8F#\u5192\u6CE1\u6392\u5E8F",
  "\u5FEB\u901F\u6392\u5E8F": "/01-\u8BA1\u7B97\u673A\u4E0EIT\u6280\u672F/01-\u6BD4\u7279\u5C31\u4E1A\u8BFE/01-Java\u7814\u53D1\u7CFB\u7EDF\u8BFE118\u671F/02-Java\u6570\u636E\u7ED3\u6784/01-\u6570\u636E\u7ED3\u6784\u521D\u9636/2025-07-31-\u6392\u5E8F#\u5FEB\u901F\u6392\u5E8F",
  "\u5F52\u5E76\u6392\u5E8F": "/01-\u8BA1\u7B97\u673A\u4E0EIT\u6280\u672F/01-\u6BD4\u7279\u5C31\u4E1A\u8BFE/01-Java\u7814\u53D1\u7CFB\u7EDF\u8BFE118\u671F/02-Java\u6570\u636E\u7ED3\u6784/01-\u6570\u636E\u7ED3\u6784\u521D\u9636/2025-07-31-\u6392\u5E8F#\u5F52\u5E76\u6392\u5E8F",
  "\u8BA1\u6570\u6392\u5E8F": "/01-\u8BA1\u7B97\u673A\u4E0EIT\u6280\u672F/01-\u6BD4\u7279\u5C31\u4E1A\u8BFE/01-Java\u7814\u53D1\u7CFB\u7EDF\u8BFE118\u671F/02-Java\u6570\u636E\u7ED3\u6784/01-\u6570\u636E\u7ED3\u6784\u521D\u9636/2025-07-31-\u6392\u5E8F#\u8BA1\u6570\u6392\u5E8F",
  "\u57FA\u6570\u6392\u5E8F": "/01-\u8BA1\u7B97\u673A\u4E0EIT\u6280\u672F/01-\u6BD4\u7279\u5C31\u4E1A\u8BFE/01-Java\u7814\u53D1\u7CFB\u7EDF\u8BFE118\u671F/02-Java\u6570\u636E\u7ED3\u6784/01-\u6570\u636E\u7ED3\u6784\u521D\u9636/2025-07-31-\u6392\u5E8F#\u57FA\u6570\u6392\u5E8F",
  "\u6876\u6392\u5E8F": "/01-\u8BA1\u7B97\u673A\u4E0EIT\u6280\u672F/01-\u6BD4\u7279\u5C31\u4E1A\u8BFE/01-Java\u7814\u53D1\u7CFB\u7EDF\u8BFE118\u671F/02-Java\u6570\u636E\u7ED3\u6784/01-\u6570\u636E\u7ED3\u6784\u521D\u9636/2025-07-31-\u6392\u5E8F#\u6876\u6392\u5E8F",
  "\u4E0D\u80CC\u5355\u8BCD": "/00-\u5B66\u4E60\u6280\u5DE7/02-\u82F1\u8BED/00-\u5355\u8BCD\u80CC\u8BF5\u8F6F\u4EF6\u63A8\u8350#\u4E0D\u80CC\u5355\u8BCD",
  "Anki": "/00-\u5B66\u4E60\u6280\u5DE7/02-\u82F1\u8BED/00-\u5355\u8BCD\u80CC\u8BF5\u8F6F\u4EF6\u63A8\u8350#anki"
  // '科目一': '/驾考交规/01-科目一/index',
};
var sortedKeywords = Object.keys(glossary).sort((a, b) => b.length - a.length);
function autoLinkKeywordsPlugin(md) {
  md.core.ruler.after("inline", "auto-link-keywords", (state) => {
    let isInsideHeading = false;
    state.tokens.forEach((blockToken) => {
      if (blockToken.type === "heading_open") {
        isInsideHeading = true;
      }
      if (blockToken.type === "heading_close") {
        isInsideHeading = false;
      }
      if (blockToken.type !== "inline") return;
      if (isInsideHeading) return;
      let isInsideLink = false;
      for (let i = 0; i < blockToken.children.length; i++) {
        const token = blockToken.children[i];
        if (token.type === "link_open") isInsideLink = true;
        if (token.type === "link_close") isInsideLink = false;
        if (token.type === "text" && !isInsideLink) {
          let html = token.content;
          let replaced = false;
          const placeholders = {};
          let pId = 0;
          sortedKeywords.forEach((keyword) => {
            if (html.includes(keyword)) {
              const parts = html.split(/(<[^>]+>)/g);
              for (let j = 0; j < parts.length; j++) {
                if (!parts[j].startsWith("<") && parts[j].includes(keyword)) {
                  const link = glossary[keyword];
                  const newHtml = `<a href="${link}" style="color: var(--vp-c-brand); font-weight: 500;">${keyword}</a>`;
                  const pieces = parts[j].split(keyword);
                  const rebuilt = [];
                  for (let k = 0; k < pieces.length - 1; k++) {
                    const placeholder = `__VP_GLOSSARY_${pId++}__`;
                    placeholders[placeholder] = newHtml;
                    rebuilt.push(pieces[k], placeholder);
                  }
                  rebuilt.push(pieces[pieces.length - 1]);
                  parts[j] = rebuilt.join("");
                  replaced = true;
                }
              }
              html = parts.join("");
            }
          });
          if (replaced) {
            for (const placeholder in placeholders) {
              html = html.replace(new RegExp(placeholder, "g"), placeholders[placeholder]);
            }
            token.type = "html_inline";
            token.content = html;
          }
        }
      }
    });
  });
}

// docs/.vitepress/plugins/markdown-download.mts
var DOWNLOADABLE_EXTENSIONS = [
  // 表格数据
  "xlsx",
  "xls",
  "csv",
  // 压缩包
  "zip",
  "rar",
  "7z",
  "tar",
  "gz",
  // 文档材料
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx"
];
var extPattern = new RegExp(`\\.(${DOWNLOADABLE_EXTENSIONS.join("|")})$`, "i");
var autoDownloadPlugin = (md) => {
  const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };
  md.renderer.rules.link_open = function(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const hrefIndex = token.attrIndex("href");
    if (hrefIndex >= 0) {
      const href = token.attrs[hrefIndex][1];
      if (extPattern.test(href)) {
        const targetIndex = token.attrIndex("target");
        if (targetIndex < 0) {
          token.attrPush(["target", "_blank"]);
        } else {
          token.attrs[targetIndex][1] = "_blank";
        }
        token.attrPush(["download", ""]);
        const classIndex = token.attrIndex("class");
        if (classIndex < 0) {
          token.attrPush(["class", "auto-download-link"]);
        } else {
          token.attrs[classIndex][1] += " auto-download-link";
        }
      }
    }
    return defaultRender(tokens, idx, options, env, self);
  };
};

// docs/.vitepress/plugins/markdown-math-tool.mts
var mathToolPlugin = (md) => {
  const defaultMathBlockRenderer = md.renderer.rules.math_block;
  if (defaultMathBlockRenderer) {
    md.renderer.rules.math_block = (tokens, idx, options, env, self) => {
      const rawTex = tokens[idx].content;
      const renderedHtml = defaultMathBlockRenderer(tokens, idx, options, env, self);
      return `<div class="clickable-math-block" data-tex="${encodeURIComponent(rawTex)}">
${renderedHtml}
</div>`;
    };
  }
  const defaultMathInlineRenderer = md.renderer.rules.math_inline;
  if (defaultMathInlineRenderer) {
    md.renderer.rules.math_inline = (tokens, idx, options, env, self) => {
      const rawTex = tokens[idx].content;
      const renderedHtml = defaultMathInlineRenderer(tokens, idx, options, env, self);
      return `<span class="clickable-math-block clickable-math-inline" data-tex="${encodeURIComponent(rawTex)}" data-type="inline">${renderedHtml}</span>`;
    };
  }
};

// docs/.vitepress/plugins/markdown-syntax-sugar.mts
var syntaxSugarPlugin = (md) => {
  md.core.ruler.before("normalize", "spoiler_global_replace", (state) => {
    const store = [];
    let tempSrc = state.src.replace(/(```[\s\S]*?```|`[^`\n]+`|\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g, (match) => {
      store.push(match);
      return `${store.length - 1}`;
    });
    tempSrc = tempSrc.replace(/^([ \t>]*)\|\|[ \t]*\r?\n([\s\S]*?)^[ \t>]*\|\|[ \t]*(?:\r?\n|$)/gm, (match, prefix, content) => {
      const blank = `${prefix}
`;
      return `${blank}${prefix}<Spoiler mode="block">
${blank}${content}${blank}${prefix}</Spoiler>
${blank}`;
    });
    tempSrc = tempSrc.replace(/\|\|([\s\S]*?)\|\|/g, (match, content) => {
      return `&#8203;<Spoiler mode="inline">${content}</Spoiler>`;
    });
    state.src = tempSrc.replace(/\x01(\d+)\x02/g, (match, index) => {
      return store[parseInt(index, 10)];
    });
  });
};

// docs/.vitepress/plugins/markdown-image-caption.mts
var imageCaptionPlugin = (md) => {
  md.core.ruler.push("replace_p_with_div_for_figure", (state) => {
    for (let i = 0; i < state.tokens.length; i++) {
      const token = state.tokens[i];
      if (token.type === "paragraph_open") {
        const inlineToken = state.tokens[i + 1];
        const hasImage = inlineToken.children?.some((child) => child.type === "image");
        if (hasImage) {
          token.tag = "div";
          token.attrJoin("class", "custom-image-wrapper");
          const closeToken = state.tokens[i + 2];
          if (closeToken && closeToken.type === "paragraph_close") {
            closeToken.tag = "div";
          }
        }
      }
    }
  });
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    let src = token.attrGet("src") || "";
    if (src && !/^(https?:|\/|\.\/|\.\.\/)/.test(src)) {
      src = "./" + src;
    }
    let alt = token.content || "";
    if (!alt) {
      let filename = src.split("/").pop() || "";
      try {
        filename = decodeURIComponent(filename);
      } catch (e) {
        console.warn("\u56FE\u7247\u8DEF\u5F84\u89E3\u7801\u5931\u8D25:", filename);
      }
      filename = filename.replace(/\.(drawio\.svg|svg|png|jpg|jpeg|gif|webp)$/i, "");
      alt = filename.replace(/^\d{4}-\d{2}-\d{2}-.*?-/, "");
    }
    return `
      <figure class="custom-image-figure">
        <img src="${src}" alt="${alt}">
        <figcaption class="image-caption">${alt}</figcaption>
      </figure>
    `;
  };
};

// docs/.vitepress/plugins/markdown-code-tool.mts
var LINE_COUNT_THRESHOLD = 7;
var codeToolPlugin = (md) => {
  const defaultFence = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const rawCode = token.content;
    const lineCount = rawCode.split("\n").length;
    const lang = token.info.trim();
    const renderedHtml = defaultFence(tokens, idx, options, env, self);
    let toolsHtml = "";
    let wrapperClasses = ["custom-code-wrapper"];
    if (lineCount > LINE_COUNT_THRESHOLD) {
      wrapperClasses.push("collapsed");
      toolsHtml += `
        <div class="code-fold-mask"></div>
        <button class="code-tool-btn fold-btn" data-lines="${lineCount}">\u{1F447} \u5C55\u5F00\u6240\u6709 ${lineCount} \u884C\u4EE3\u7801</button>
      `;
    }
    if (toolsHtml) {
      return `
        <div class="${wrapperClasses.join(" ")}">
          ${renderedHtml}
          ${toolsHtml}
        </div>
      `;
    }
    return renderedHtml;
  };
};

// docs/.vitepress/config.mts
var __vite_injected_original_import_meta_url2 = "file:///E:/github/my-notes/docs/.vitepress/config.mts";
var config_default = defineConfig({
  lang: "zh-CN",
  title: "\u6211\u7684\u5B66\u4E60\u7B14\u8BB0",
  description: "\u8BB0\u5F55\u9A7E\u8003\u4E0E\u7F16\u7A0B\u77E5\u8BC6",
  head: [["link", { rel: "icon", href: "/logo.png" }]],
  cleanUrls: true,
  lastUpdated: true,
  vite: {
    plugins: vitePlugins,
    resolve: {
      alias: {
        // 核心魔法：以后代码里遇到 '@components'，就等同于指向当前目录下的 components 文件夹
        "@components": fileURLToPath2(new URL2("./components", __vite_injected_original_import_meta_url2))
      }
    }
  },
  // 💡 VitePress 提供的页面数据转换钩子，在编译每一个 Markdown 文件时都会触发
  transformPageData,
  // 核心 Markdown 渲染配置
  markdown: {
    config: (md) => {
      md.use(autoLinkKeywordsPlugin);
      md.use(autoDownloadPlugin);
      md.use(mathToolPlugin);
      md.use(syntaxSugarPlugin);
      md.use(imageCaptionPlugin);
      md.use(codeToolPlugin);
    },
    math: true
  },
  // 直接挂载外部引入的主题配置
  themeConfig
});
export {
  config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZG9jcy8udml0ZXByZXNzL2NvbmZpZy5tdHMiLCAiZG9jcy8udml0ZXByZXNzL2NvbmZpZ3Mvdml0ZS1wbHVnaW5zLm10cyIsICJkb2NzLy52aXRlcHJlc3MvY29uZmlncy90aGVtZS1jb25maWcubXRzIiwgInNjcmlwdHMvc2Nhbm5lci5tanMiLCAiZG9jcy8udml0ZXByZXNzL2NvbmZpZ3MvcGFnZS10cmFuc2Zvcm0ubXRzIiwgImRvY3MvLnZpdGVwcmVzcy9wbHVnaW5zL21hcmtkb3duLWdsb3NzYXJ5Lm10cyIsICJkb2NzLy52aXRlcHJlc3MvcGx1Z2lucy9tYXJrZG93bi1kb3dubG9hZC5tdHMiLCAiZG9jcy8udml0ZXByZXNzL3BsdWdpbnMvbWFya2Rvd24tbWF0aC10b29sLm10cyIsICJkb2NzLy52aXRlcHJlc3MvcGx1Z2lucy9tYXJrZG93bi1zeW50YXgtc3VnYXIubXRzIiwgImRvY3MvLnZpdGVwcmVzcy9wbHVnaW5zL21hcmtkb3duLWltYWdlLWNhcHRpb24ubXRzIiwgImRvY3MvLnZpdGVwcmVzcy9wbHVnaW5zL21hcmtkb3duLWNvZGUtdG9vbC5tdHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxnaXRodWJcXFxcbXktbm90ZXNcXFxcZG9jc1xcXFwudml0ZXByZXNzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxnaXRodWJcXFxcbXktbm90ZXNcXFxcZG9jc1xcXFwudml0ZXByZXNzXFxcXGNvbmZpZy5tdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L2dpdGh1Yi9teS1ub3Rlcy9kb2NzLy52aXRlcHJlc3MvY29uZmlnLm10c1wiOy8vIC52aXRlcHJlc3MvY29uZmlnLm10c1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZXByZXNzJ1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAndXJsJ1xuXG4vLyBcdUQ4M0RcdURDQTEgXHU1QkZDXHU1MTY1XHU1NDA0XHU3OUNEXHU2MkJEXHU3OUJCXHU1MUZBXHU2NzY1XHU3Njg0XHU5MTREXHU3RjZFXHU1NDhDXHU5MDNCXHU4RjkxXG5pbXBvcnQgeyB2aXRlUGx1Z2lucyB9IGZyb20gJy4vY29uZmlncy92aXRlLXBsdWdpbnMubXRzJ1xuaW1wb3J0IHsgdGhlbWVDb25maWcgfSBmcm9tICcuL2NvbmZpZ3MvdGhlbWUtY29uZmlnLm10cydcbmltcG9ydCB7IHRyYW5zZm9ybVBhZ2VEYXRhIH0gZnJvbSAnLi9jb25maWdzL3BhZ2UtdHJhbnNmb3JtLm10cydcblxuLy8gXHU1QkZDXHU1MTY1XHU4MUVBXHU1REYxXHU1MTk5XHU3Njg0IE1hcmtkb3duIFx1NjNEMlx1NEVGNlxuaW1wb3J0IHsgYXV0b0xpbmtLZXl3b3Jkc1BsdWdpbiB9IGZyb20gJy4vcGx1Z2lucy9tYXJrZG93bi1nbG9zc2FyeS5tdHMnXG5pbXBvcnQgeyBhdXRvRG93bmxvYWRQbHVnaW4gfSBmcm9tICcuL3BsdWdpbnMvbWFya2Rvd24tZG93bmxvYWQubXRzJ1xuaW1wb3J0IHsgbWF0aFRvb2xQbHVnaW4gfSBmcm9tICcuL3BsdWdpbnMvbWFya2Rvd24tbWF0aC10b29sLm10cydcbi8vIFx1RDgzRFx1RENBMSBcdTRFQ0VcdTdFREZcdTRFMDBcdTc2ODRcdTYzRDJcdTRFRjZcdTY1ODdcdTRFRjZcdTRFMkRcdTVGMTVcdTUxNjVcdThCRURcdTZDRDVcdTdDRDZcdTU0MDhcdTk2QzZcbmltcG9ydCB7IHN5bnRheFN1Z2FyUGx1Z2luIH0gZnJvbSAnLi9wbHVnaW5zL21hcmtkb3duLXN5bnRheC1zdWdhci5tdHMnXG5pbXBvcnQgeyBpbWFnZUNhcHRpb25QbHVnaW4gfSBmcm9tICcuL3BsdWdpbnMvbWFya2Rvd24taW1hZ2UtY2FwdGlvbi5tdHMnXG5pbXBvcnQgeyBjb2RlVG9vbFBsdWdpbiB9IGZyb20gJy4vcGx1Z2lucy9tYXJrZG93bi1jb2RlLXRvb2wubXRzJ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuXHRsYW5nOiAnemgtQ04nLFxuXHR0aXRsZTogJ1x1NjIxMVx1NzY4NFx1NUI2Nlx1NEU2MFx1N0IxNFx1OEJCMCcsXG5cdGRlc2NyaXB0aW9uOiAnXHU4QkIwXHU1RjU1XHU5QTdFXHU4MDAzXHU0RTBFXHU3RjE2XHU3QTBCXHU3N0U1XHU4QkM2Jyxcblx0aGVhZDogW1snbGluaycsIHsgcmVsOiAnaWNvbicsIGhyZWY6ICcvbG9nby5wbmcnIH1dXSxcblx0Y2xlYW5VcmxzOiB0cnVlLFxuXHRsYXN0VXBkYXRlZDogdHJ1ZSxcblxuXHR2aXRlOiB7XG5cdFx0cGx1Z2luczogdml0ZVBsdWdpbnMsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0YWxpYXM6IHtcblx0XHRcdFx0Ly8gXHU2ODM4XHU1RkMzXHU5QjU0XHU2Q0Q1XHVGRjFBXHU0RUU1XHU1NDBFXHU0RUUzXHU3ODAxXHU5MUNDXHU5MDQ3XHU1MjMwICdAY29tcG9uZW50cydcdUZGMENcdTVDMzFcdTdCNDlcdTU0MENcdTRFOEVcdTYzMDdcdTU0MTFcdTVGNTNcdTUyNERcdTc2RUVcdTVGNTVcdTRFMEJcdTc2ODQgY29tcG9uZW50cyBcdTY1ODdcdTRFRjZcdTU5Mzlcblx0XHRcdFx0J0Bjb21wb25lbnRzJzogZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuL2NvbXBvbmVudHMnLCBpbXBvcnQubWV0YS51cmwpKSxcblx0XHRcdH0sXG5cdFx0fSxcblx0fSxcblxuXHQvLyBcdUQ4M0RcdURDQTEgVml0ZVByZXNzIFx1NjNEMFx1NEY5Qlx1NzY4NFx1OTg3NVx1OTc2Mlx1NjU3MFx1NjM2RVx1OEY2Q1x1NjM2Mlx1OTRBOVx1NUI1MFx1RkYwQ1x1NTcyOFx1N0YxNlx1OEJEMVx1NkJDRlx1NEUwMFx1NEUyQSBNYXJrZG93biBcdTY1ODdcdTRFRjZcdTY1RjZcdTkwRkRcdTRGMUFcdTg5RTZcdTUzRDFcblx0dHJhbnNmb3JtUGFnZURhdGEsXG5cblx0Ly8gXHU2ODM4XHU1RkMzIE1hcmtkb3duIFx1NkUzMlx1NjdEM1x1OTE0RFx1N0Y2RVxuXHRtYXJrZG93bjoge1xuXHRcdGNvbmZpZzogKG1kKSA9PiB7XG5cdFx0XHRtZC51c2UoYXV0b0xpbmtLZXl3b3Jkc1BsdWdpbilcblx0XHRcdG1kLnVzZShhdXRvRG93bmxvYWRQbHVnaW4pXG5cdFx0XHRtZC51c2UobWF0aFRvb2xQbHVnaW4pXG5cdFx0XHRtZC51c2Uoc3ludGF4U3VnYXJQbHVnaW4pXG5cdFx0XHRtZC51c2UoaW1hZ2VDYXB0aW9uUGx1Z2luKVxuXHRcdFx0bWQudXNlKGNvZGVUb29sUGx1Z2luKVxuXHRcdH0sXG5cdFx0bWF0aDogdHJ1ZSxcblx0fSxcblxuXHQvLyBcdTc2RjRcdTYzQTVcdTYzMDJcdThGN0RcdTU5MTZcdTkwRThcdTVGMTVcdTUxNjVcdTc2ODRcdTRFM0JcdTk4OThcdTkxNERcdTdGNkVcblx0dGhlbWVDb25maWcsXG59KVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxnaXRodWJcXFxcbXktbm90ZXNcXFxcZG9jc1xcXFwudml0ZXByZXNzXFxcXGNvbmZpZ3NcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXGdpdGh1YlxcXFxteS1ub3Rlc1xcXFxkb2NzXFxcXC52aXRlcHJlc3NcXFxcY29uZmlnc1xcXFx2aXRlLXBsdWdpbnMubXRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi9naXRodWIvbXktbm90ZXMvZG9jcy8udml0ZXByZXNzL2NvbmZpZ3Mvdml0ZS1wbHVnaW5zLm10c1wiOy8vIGRvY3MvLnZpdGVwcmVzcy9jb25maWdzL3ZpdGUtcGx1Z2lucy5tdHNcclxuaW1wb3J0IENvbXBvbmVudHMgZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvdml0ZSdcclxuXHJcbi8vIFx1NUJGQ1x1NTFGQVx1NEUwMFx1NEUyQVx1NjNEMlx1NEVGNlx1NjU3MFx1N0VDNFxyXG5leHBvcnQgY29uc3Qgdml0ZVBsdWdpbnMgPSBbXHJcblx0Q29tcG9uZW50cyh7XHJcblx0XHQvLyBcdTU0NEFcdThCQzlcdTYzRDJcdTRFRjZcdUZGMENcdTU0RUFcdTRFOUJcdTc2RUVcdTVGNTVcdTRFMEJcdTc2ODRcdTdFQzRcdTRFRjZcdTk3MDBcdTg5ODFcdTgxRUFcdTUyQThcdTYzMDlcdTk3MDBcdTZDRThcdTUxOENcclxuXHRcdGRpcnM6IFsnLnZpdGVwcmVzcy9jb21wb25lbnRzL2FsZ29yaXRobS9zb3J0JywgJy52aXRlcHJlc3MvY29tcG9uZW50cy9vai9sZWV0Y29kZSddLFxyXG5cdFx0Ly8gXHU1MTQxXHU4QkI4XHU1NzI4IFZ1ZSBcdTY1ODdcdTRFRjZcdTU0OEMgTWFya2Rvd24gXHU2NTg3XHU0RUY2XHU0RTJEXHU3NTFGXHU2NTQ4XHJcblx0XHRpbmNsdWRlOiBbL1xcLnZ1ZSQvLCAvXFwudnVlXFw/dnVlLywgL1xcLm1kJC9dLFxyXG5cdFx0Ly8gXHU4MUVBXHU1MkE4XHU3NTFGXHU2MjEwXHU3QzdCXHU1NzhCXHU1OEYwXHU2NjBFXHU2NTg3XHU0RUY2XHJcblx0XHRkdHM6ICcudml0ZXByZXNzL2NvbXBvbmVudHMuZC50cycsXHJcblx0fSksXHJcblxyXG5cdC8vIFx1RDgzRFx1RENBMSBcdTRFRTVcdTU0MEVcdTUxOERcdTY3MDlcdTUxNzZcdTRFRDZcdTc2ODQgVml0ZSBcdTYzRDJcdTRFRjZcdUZGMENcdTc2RjRcdTYzQTVcdTVGODBcdThGRDlcdTRFMkFcdTY1NzBcdTdFQzRcdTkxQ0NcdTUyQTBcdTVDMzFcdTg4NENcdTRFODZcdUZGMENcdTRFM0JcdTkxNERcdTdGNkVcdTY1ODdcdTRFRjZcdTk2RjZcdTZDNjFcdTY3RDNcdUZGMDFcclxuXVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkU6XFxcXGdpdGh1YlxcXFxteS1ub3Rlc1xcXFxkb2NzXFxcXC52aXRlcHJlc3NcXFxcY29uZmlnc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcZ2l0aHViXFxcXG15LW5vdGVzXFxcXGRvY3NcXFxcLnZpdGVwcmVzc1xcXFxjb25maWdzXFxcXHRoZW1lLWNvbmZpZy5tdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L2dpdGh1Yi9teS1ub3Rlcy9kb2NzLy52aXRlcHJlc3MvY29uZmlncy90aGVtZS1jb25maWcubXRzXCI7Ly8gLnZpdGVwcmVzcy9jb25maWdzL3RoZW1lLm10c1xyXG5pbXBvcnQgdHlwZSB7IERlZmF1bHRUaGVtZSB9IGZyb20gJ3ZpdGVwcmVzcydcclxuaW1wb3J0IHsgZ2VuZXJhdGVTaWRlYmFyIH0gZnJvbSAndml0ZXByZXNzLXNpZGViYXInXHJcbi8vIFx1MjZBMFx1RkUwRiBcdTZDRThcdTYxMEZcdThGRDlcdTkxQ0NcdTc2ODRcdThERUZcdTVGODRcdTUzRDhcdTYyMTBcdTRFODZcdTRFMDlcdTRFMkEgLi4vXHJcbmltcG9ydCB7IHNjYW5EaXIsIGNyZWF0ZU5hbWVSZXNvbHZlciB9IGZyb20gJy4uLy4uLy4uL3NjcmlwdHMvc2Nhbm5lci5tanMnXHJcblxyXG4vLyBcdUQ4M0RcdURDNDcgXHU4MUVBXHU1MkE4XHU3NTFGXHU2MjEwXHU1QkZDXHU4MjJBXHU2ODBGXHU3Njg0XHU1MUZEXHU2NTcwXHJcbmZ1bmN0aW9uIGF1dG9HZXROYXZzKCkge1xyXG4gIGNvbnN0IHJ1bGVzID0gWycqJywgJyEuKicsICchcHVibGljJ107XHJcbiAgY29uc3QgeyBkaXJlY3RvcmllcyB9ID0gc2NhbkRpcignZG9jcycsIHJ1bGVzKTtcclxuICByZXR1cm4gW1xyXG4gICAgeyB0ZXh0OiAnXHU5OTk2XHU5ODc1JywgbGluazogJy8nIH0sXHJcbiAgICAuLi5kaXJlY3Rvcmllcy5tYXAoZGlyID0+ICh7XHJcbiAgICAgIHRleHQ6IGRpci5yZXBsYWNlKC9eKFxcZCstKSsvLCAnJyksXHJcbiAgICAgIGxpbms6IGAvJHtkaXJ9L2BcclxuICAgIH0pKVxyXG4gIF07XHJcbn1cclxuXHJcbi8vIFx1RDgzRFx1REM0NyBcdTUxNzFcdTc1MjhcdTVGMTVcdTY0Q0VcdTc2ODRcdTRGQTdcdThGQjlcdTY4MEZcdTZFMDVcdTZEMTdcdTU2NjhcclxuZnVuY3Rpb24gY2xlYW5TaWRlYmFyKHNpZGViYXJJdGVtczogYW55KSB7XHJcbiAgaWYgKCFBcnJheS5pc0FycmF5KHNpZGViYXJJdGVtcykpIHJldHVybiBzaWRlYmFySXRlbXM7XHJcbiAgY29uc3QgY3VycmVudExldmVsTmFtZXMgPSBzaWRlYmFySXRlbXMubWFwKGl0ZW0gPT4gaXRlbS50ZXh0KS5maWx0ZXIoQm9vbGVhbik7XHJcbiAgY29uc3QgcmVzb2x2ZXIgPSBjcmVhdGVOYW1lUmVzb2x2ZXIoY3VycmVudExldmVsTmFtZXMpO1xyXG5cclxuICByZXR1cm4gc2lkZWJhckl0ZW1zLm1hcChpdGVtID0+IHtcclxuICAgIGNvbnN0IG5ld0l0ZW0gPSB7IC4uLml0ZW0gfTtcclxuICAgIGlmIChuZXdJdGVtLnRleHQpIHtcclxuICAgICAgbmV3SXRlbS50ZXh0ID0gcmVzb2x2ZXIobmV3SXRlbS50ZXh0KTtcclxuICAgIH1cclxuICAgIGlmIChuZXdJdGVtLml0ZW1zKSB7XHJcbiAgICAgIG5ld0l0ZW0uaXRlbXMgPSBjbGVhblNpZGViYXIobmV3SXRlbS5pdGVtcyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3SXRlbTtcclxuICB9KTtcclxufVxyXG5cclxuLy8gXHVEODNEXHVEQzQ3IFx1NUJGQ1x1NTFGQVx1NjU3NFx1NEUyQVx1NEUzQlx1OTg5OFx1OTE0RFx1N0Y2RVx1NUJGOVx1OEM2MVx1RkYwOFx1NTJBMFx1NEUwQVx1N0M3Qlx1NTc4Qlx1NkNFOFx1ODlFM1x1RkYwQ1x1NTE5OVx1OTE0RFx1N0Y2RVx1NjVGNlx1NjcwOVx1NUI4Q1x1N0Y4RVx1NzY4NFx1NEVFM1x1NzgwMVx1NjNEMFx1NzkzQVx1RkYwMVx1RkYwOVxyXG5leHBvcnQgY29uc3QgdGhlbWVDb25maWc6IERlZmF1bHRUaGVtZS5Db25maWcgPSB7XHJcbiAgbmF2OiBhdXRvR2V0TmF2cygpLFxyXG5cclxuICBsYXN0VXBkYXRlZDoge1xyXG4gICAgdGV4dDogJ1x1NjcwMFx1NTQwRVx1NjZGNFx1NjVCMFx1NEU4RScsXHJcbiAgICBmb3JtYXRPcHRpb25zOiB7XHJcbiAgICAgIGRhdGVTdHlsZTogJ3Nob3J0JyxcclxuICAgICAgdGltZVN0eWxlOiAnc2hvcnQnXHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgc29jaWFsTGlua3M6IFtcclxuICAgIHsgaWNvbjogJ2dpdGh1YicsIGxpbms6ICdodHRwczovL2dpdGh1Yi5jb20vd3VuYW1vci9teS1ibG9ncycgfSxcclxuICBdLFxyXG5cclxuICBzaWRlYmFyOiBjbGVhblNpZGViYXIoZ2VuZXJhdGVTaWRlYmFyKHtcclxuICAgIGRvY3VtZW50Um9vdFBhdGg6ICdkb2NzJyxcclxuICAgIHVzZVRpdGxlRnJvbUZpbGVIZWFkaW5nOiB0cnVlLFxyXG4gICAgY29sbGFwc2VkOiB0cnVlLFxyXG4gICAgc29ydE1lbnVzQnlGcm9udG1hdHRlck9yZGVyOiB0cnVlXHJcbiAgfSkpLFxyXG5cclxuICBzZWFyY2g6IHtcclxuICAgIHByb3ZpZGVyOiAnbG9jYWwnLFxyXG4gICAgb3B0aW9uczoge1xyXG4gICAgICB0cmFuc2xhdGlvbnM6IHtcclxuICAgICAgICBidXR0b246IHtcclxuICAgICAgICAgIGJ1dHRvblRleHQ6ICdcdTY0MUNcdTdEMjJcdTY1ODdcdTY4NjMnLFxyXG4gICAgICAgICAgYnV0dG9uQXJpYUxhYmVsOiAnXHU2NDFDXHU3RDIyXHU2NTg3XHU2ODYzJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgbW9kYWw6IHtcclxuICAgICAgICAgIG5vUmVzdWx0c1RleHQ6ICdcdTY1RTBcdTZDRDVcdTYyN0VcdTUyMzBcdTc2RjhcdTUxNzNcdTdFRDNcdTY3OUMnLFxyXG4gICAgICAgICAgcmVzZXRCdXR0b25UaXRsZTogJ1x1NkUwNVx1OTY2NFx1NjdFNVx1OEJFMlx1Njc2MVx1NEVGNicsXHJcbiAgICAgICAgICBmb290ZXI6IHtcclxuICAgICAgICAgICAgc2VsZWN0VGV4dDogJ1x1OTAwOVx1NjJFOScsXHJcbiAgICAgICAgICAgIG5hdmlnYXRlVGV4dDogJ1x1NTIwN1x1NjM2MicsXHJcbiAgICAgICAgICAgIGNsb3NlVGV4dDogJ1x1NTE3M1x1OTVFRCdcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG5cclxuICBkYXJrTW9kZVN3aXRjaExhYmVsOiAnXHU1OTE2XHU4OUMyJyxcclxuICBsaWdodE1vZGVTd2l0Y2hUaXRsZTogJ1x1NTIwN1x1NjM2Mlx1NTIzMFx1NkQ0NVx1ODI3Mlx1NkEyMVx1NUYwRicsXHJcbiAgZGFya01vZGVTd2l0Y2hUaXRsZTogJ1x1NTIwN1x1NjM2Mlx1NTIzMFx1NkRGMVx1ODI3Mlx1NkEyMVx1NUYwRicsXHJcbiAgc2lkZWJhck1lbnVMYWJlbDogJ1x1ODNEQ1x1NTM1NScsXHJcbiAgcmV0dXJuVG9Ub3BMYWJlbDogJ1x1OEZENFx1NTZERVx1OTg3Nlx1OTBFOCcsXHJcblxyXG4gIG5vdEZvdW5kOiB7XHJcbiAgICB0aXRsZTogJ1x1OTg3NVx1OTc2Mlx1NjI3RVx1NEUwRFx1NTIzMFx1NEU4NicsXHJcbiAgICBxdW90ZTogJ1x1N0NERlx1N0NENVx1RkYwQ1x1NEY2MFx1NEYzQ1x1NEU0RVx1Njc2NVx1NTIzMFx1NEU4Nlx1NkNBMVx1NjcwOVx1NzdFNVx1OEJDNlx1NUI1OFx1NTcyOFx1NzY4NFx1ODM1Mlx1NTM5Ri4uLicsIFxyXG4gICAgbGlua1RleHQ6ICdcdTVFMjZcdTYyMTFcdTU2REVcdTk5OTZcdTk4NzUnXHJcbiAgfSxcclxuXHJcbiAgZG9jRm9vdGVyOiB7XHJcbiAgICBwcmV2OiAnXHU0RTBBXHU0RTAwXHU3QkM3JyxcclxuICAgIG5leHQ6ICdcdTRFMEJcdTRFMDBcdTdCQzcnXHJcbiAgfSxcclxuICBcclxuICBvdXRsaW5lOiB7XHJcbiAgICBsYWJlbDogJ1x1NjcyQ1x1OTg3NVx1NzZFRVx1NUY1NScsXHJcbiAgICBsZXZlbDogJ2RlZXAnXHJcbiAgfSxcclxuXHJcbiAgZm9vdGVyOiB7XHJcbiAgICBtZXNzYWdlOiBgXHJcbiAgICAgIDxhIGhyZWY9XCJodHRwczovL2JlaWFuLm1paXQuZ292LmNuLyMvSW50ZWdyYXRlZC9pbmRleFwiIHRhcmdldD1cIl9ibGFua1wiIHN0eWxlPVwibWFyZ2luLXJpZ2h0OiAxNXB4OyBjb2xvcjogIzg4ODsgdGV4dC1kZWNvcmF0aW9uOiBub25lO1wiPlx1NkQ1OUlDUFx1NTkwNzIwMjYwMzM1NzJcdTUzRjctMTwvYT5cclxuICAgICAgPGEgaHJlZj1cImh0dHBzOi8vYmVpYW4ubXBzLmdvdi5jbi8jL3F1ZXJ5L3dlYlNlYXJjaD9jb2RlPTMzMDc4NDAyMTAxNTYyXCIgIHRhcmdldD1cIl9ibGFua1wiIHN0eWxlPVwiY29sb3I6ICM4ODg7IHRleHQtZGVjb3JhdGlvbjogbm9uZTsgZGlzcGxheTogaW5saW5lLWZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7XCI+XHJcbiAgICAgICAgPGltZyBzcmM9XCIvYmVpYW4ucG5nXCIgc3R5bGU9XCJ3aWR0aDogMTZweDsgaGVpZ2h0OiAxNnB4OyBtYXJnaW4tcmlnaHQ6IDVweDtcIj5cclxuICAgICAgICBcdTZENTlcdTUxNkNcdTdGNTFcdTVCODlcdTU5MDczMzA3ODQwMjEwMTU2Mlx1NTNGN1xyXG4gICAgICA8L2E+YCxcclxuICAgIGNvcHlyaWdodDogJ0NvcHlyaWdodCBcdTAwQTkgMjAyNiB3dW5hbW9yJ1xyXG4gIH1cclxufSIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRTpcXFxcZ2l0aHViXFxcXG15LW5vdGVzXFxcXHNjcmlwdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXGdpdGh1YlxcXFxteS1ub3Rlc1xcXFxzY3JpcHRzXFxcXHNjYW5uZXIubWpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi9naXRodWIvbXktbm90ZXMvc2NyaXB0cy9zY2FubmVyLm1qc1wiOy8vIHNjcmlwdHMvc2Nhbm5lci5tanNcclxuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xyXG5pbXBvcnQgbWljcm9tYXRjaCBmcm9tICdtaWNyb21hdGNoJztcclxuXHJcbi8qKlxyXG4gKiBcdTY2N0FcdTgwRkRcdTYyNkJcdTYzQ0ZcdTc2RUVcdTVGNTVcdUZGMENcdTY1MkZcdTYzMDEgR2xvYiBcdTg4NjhcdThGQkVcdTVGMEZcdThGQzdcdTZFRTRcclxuICogQHBhcmFtIHtzdHJpbmd9IGRpclBhdGggLSBcdTg5ODFcdTYyNkJcdTYzQ0ZcdTc2ODRcdTY1ODdcdTRFRjZcdTU5MzlcdThERUZcdTVGODRcclxuICogQHBhcmFtIHtzdHJpbmdbXX0gcGF0dGVybnMgLSBcdTUzMzlcdTkxNERcdTg5QzRcdTUyMTlcdUZGMENcdTRGOEJcdTU5ODIgWycqJywgJyEuKicsICchaW5kZXgubWQnXVxyXG4gKiBAcmV0dXJucyB7eyBkaXJlY3Rvcmllczogc3RyaW5nW10sIGZpbGVzOiBzdHJpbmdbXSB9fVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHNjYW5EaXIoZGlyUGF0aCwgcGF0dGVybnMgPSBbJyonXSkge1xyXG4gIC8vIFx1NTk4Mlx1Njc5Q1x1NzZFRVx1NUY1NVx1NEUwRFx1NUI1OFx1NTcyOFx1RkYwQ1x1NzZGNFx1NjNBNVx1OEZENFx1NTZERVx1N0E3QVxyXG4gIGlmICghZnMuZXhpc3RzU3luYyhkaXJQYXRoKSkge1xyXG4gICAgcmV0dXJuIHsgZGlyZWN0b3JpZXM6IFtdLCBmaWxlczogW10gfTtcclxuICB9XHJcblxyXG4gIC8vIFx1ODNCN1x1NTNENlx1NzZFRVx1NUY1NVx1NEUwQlx1NjI0MFx1NjcwOVx1NjU4N1x1NEVGNlx1NTQ4Q1x1NjU4N1x1NEVGNlx1NTkzOVx1NTQwRFx1NzlGMFxyXG4gIGNvbnN0IGFsbEl0ZW1zID0gZnMucmVhZGRpclN5bmMoZGlyUGF0aCk7XHJcblxyXG4gIC8vIFx1NjgzOFx1NUZDM1x1OUI1NFx1NkNENVx1RkYxQVx1NEY3Rlx1NzUyOCBtaWNyb21hdGNoIFx1OEZEQlx1ODg0Q1x1ODg2OFx1OEZCRVx1NUYwRlx1OEZDN1x1NkVFNFxyXG4gIGNvbnN0IG1hdGNoZWRJdGVtcyA9IG1pY3JvbWF0Y2goYWxsSXRlbXMsIHBhdHRlcm5zKTtcclxuXHJcbiAgY29uc3QgZGlyZWN0b3JpZXMgPSBbXTtcclxuICBjb25zdCBmaWxlcyA9IFtdO1xyXG5cclxuICAvLyBcdTVDMDZcdThGQzdcdTZFRTRcdTU0MEVcdTc2ODRcdTdFRDNcdTY3OUNcdTUyMDZcdTdDN0JcdTYyNTNcdTUzMDVcclxuICBmb3IgKGNvbnN0IGl0ZW0gb2YgbWF0Y2hlZEl0ZW1zKSB7XHJcbiAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihkaXJQYXRoLCBpdGVtKTtcclxuICAgIGlmIChmcy5zdGF0U3luYyhmdWxsUGF0aCkuaXNEaXJlY3RvcnkoKSkge1xyXG4gICAgICBkaXJlY3Rvcmllcy5wdXNoKGl0ZW0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZmlsZXMucHVzaChpdGVtKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiB7IGRpcmVjdG9yaWVzLCBmaWxlcyB9O1xyXG59XHJcblxyXG4vKipcclxuICogXHU1MjFCXHU1RUZBXHU0RTAwXHU0RTJBXHU1RjUzXHU1MjREXHU1QzQyXHU3RUE3XHU3Njg0XHUyMDFDXHU5NjMyXHU2NDlFXHU4RjY2XHUyMDFEXHU1NDBEXHU3OUYwXHU4OUUzXHU2NzkwXHU1NjY4XHJcbiAqIEBwYXJhbSB7c3RyaW5nW119IGV4aXN0aW5nTmFtZXNBcnJheSAtIFx1NUY1M1x1NTI0RFx1NUM0Mlx1N0VBN1x1NjI0MFx1NjcwOVx1NzcxRlx1NUI5RVx1NzY4NFx1NzI2OVx1NzQwNlx1NTQwRFx1NzlGMFx1NTIxN1x1ODg2OFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5hbWVSZXNvbHZlcihleGlzdGluZ05hbWVzQXJyYXkpIHtcclxuICAvLyAxLiBcdThCQjBcdTVGNTVcdTVGNTNcdTUyNERcdTVDNDJcdTdFQTdcdTYyNDBcdTY3MDlcdTc3MUZcdTVCOUVcdTVCNThcdTU3MjhcdTc2ODRcdTcyNjlcdTc0MDZcdTU0MERcdTVCNTdcclxuICBjb25zdCBhbGxOYW1lcyA9IG5ldyBTZXQoZXhpc3RpbmdOYW1lc0FycmF5KTtcclxuICAvLyAyLiBcdThCQjBcdTVGNTVcdTVERjJcdTdFQ0ZcdTg4QUJcdTgxMzFcdTUzQkJcdTlBNkNcdTc1MzJcdTVDNTVcdTc5M0FcdThGQzdcdTc2ODRcdTU0MERcdTVCNTdcclxuICBjb25zdCBzZWVuID0gbmV3IFNldCgpO1xyXG5cclxuICAvKipcclxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JpZ2luYWxOYW1lIC0gXHU3NzFGXHU1QjlFXHU3Njg0XHU2NTg3XHU0RUY2L1x1NjU4N1x1NEVGNlx1NTkzOVx1NTQwRCAoXHU0RjhCXHU1OTgyOiAwMS10ZXN0KVxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY2FuZGlkYXRlTmFtZV0gLSBcdTU5MDdcdTkwMDlcdTU0MEQoXHU0RjhCXHU1OTgyXHU0RUNFIE1hcmtkb3duIFx1NjNEMFx1NTNENlx1NzY4NFx1NTkyN1x1NjgwN1x1OTg5OClcclxuICAgKi9cclxuICByZXR1cm4gZnVuY3Rpb24gcmVzb2x2ZShvcmlnaW5hbE5hbWUsIGNhbmRpZGF0ZU5hbWUgPSBudWxsKSB7XHJcbiAgICBsZXQgdGFyZ2V0TmFtZSA9IGNhbmRpZGF0ZU5hbWUgfHwgb3JpZ2luYWxOYW1lO1xyXG4gICAgbGV0IGRpc3BsYXlOYW1lID0gdGFyZ2V0TmFtZS5yZXBsYWNlKC9eKFxcZCstKSsvLCAnJyk7IC8vIFx1NUMxRFx1OEJENVx1ODEzMVx1OUE2Q1x1NzUzMlxyXG5cclxuICAgIC8vIFx1NjY3QVx1ODBGRFx1OTA3Rlx1OEJBOVx1OTAzQlx1OEY5MVx1RkYxQVxyXG4gICAgLy8gXHU1OTgyXHU2NzlDXHU4MTMxXHU5QTZDXHU3NTMyXHU1NDBFXHU3Njg0XHU1NDBEXHU1QjU3XHU1NDhDXHU1MjJCXHU0RUJBXHU3NzFGXHU1QjlFXHU1QjU4XHU1NzI4XHU3Njg0XHU3MjY5XHU3NDA2XHU1NDBEXHU1QjU3XHU2NDlFXHU0RTg2XHVGRjBDXHU2MjE2XHU4MDA1XHU1REYyXHU3RUNGXHU4OEFCXHU1MjREXHU5NzYyXHU3Njg0XHU1MTQ0XHU1RjFGXHU2MkEyXHU2Q0U4XHU0RTg2XHJcbiAgICBpZiAoKGRpc3BsYXlOYW1lICE9PSB0YXJnZXROYW1lICYmIGFsbE5hbWVzLmhhcyhkaXNwbGF5TmFtZSkpIHx8IHNlZW4uaGFzKGRpc3BsYXlOYW1lKSkge1xyXG4gICAgICBkaXNwbGF5TmFtZSA9IHRhcmdldE5hbWU7IC8vIFx1NEU1Nlx1NEU1Nlx1N0E3Rlx1NTZERVx1OUE2Q1x1NzUzMlx1RkYwQ1x1OTYzMlx1NkI2Mlx1NTFCMlx1N0E4MVxyXG4gICAgfVxyXG5cclxuICAgIHNlZW4uYWRkKGRpc3BsYXlOYW1lKTtcclxuICAgIHJldHVybiBkaXNwbGF5TmFtZTtcclxuICB9O1xyXG59IiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxnaXRodWJcXFxcbXktbm90ZXNcXFxcZG9jc1xcXFwudml0ZXByZXNzXFxcXGNvbmZpZ3NcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXGdpdGh1YlxcXFxteS1ub3Rlc1xcXFxkb2NzXFxcXC52aXRlcHJlc3NcXFxcY29uZmlnc1xcXFxwYWdlLXRyYW5zZm9ybS5tdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L2dpdGh1Yi9teS1ub3Rlcy9kb2NzLy52aXRlcHJlc3MvY29uZmlncy9wYWdlLXRyYW5zZm9ybS5tdHNcIjsvLyBkb2NzLy52aXRlcHJlc3MvY29uZmlncy9wYWdlLXRyYW5zZm9ybS5tdHNcclxuaW1wb3J0IGZzIGZyb20gJ2ZzJ1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xyXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tICd1cmwnXHJcbmltcG9ydCB0eXBlIHsgUGFnZURhdGEgfSBmcm9tICd2aXRlcHJlc3MnXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmb3JtUGFnZURhdGEocGFnZURhdGE6IFBhZ2VEYXRhKSB7XHJcblx0Ly8gXHVEODNEXHVEQ0ExIFx1NjgzOFx1NUZDM1x1OTY3N1x1OTYzMVx1NEZFRVx1NTkwRFx1RkYxQVx1NTZFMFx1NEUzQVx1NUY1M1x1NTI0RFx1NjU4N1x1NEVGNlx1NTcyOCBjb25maWdzLyBcdTRFMEJcdUZGMENcdTYyNDBcdTRFRTVcdTg5ODFcdTVGODBcdTRFMEFcdThERjNcdTRFMjRcdTdFQTdcdUZGMDguLi8uLi9cdUZGMDlcdTYyNERcdTgwRkRcdTUyMzBcdThGQkUgZG9jcyBcdTY4MzlcdTc2RUVcdTVGNTVcclxuXHRjb25zdCBkb2NzRGlyID0gZmlsZVVSTFRvUGF0aChuZXcgVVJMKCcuLi8uLi8nLCBpbXBvcnQubWV0YS51cmwpKVxyXG5cdGNvbnN0IGFic29sdXRlRmlsZVBhdGggPSBwYXRoLmpvaW4oZG9jc0RpciwgcGFnZURhdGEuZmlsZVBhdGgpXHJcblxyXG5cdGlmICghZnMuZXhpc3RzU3luYyhhYnNvbHV0ZUZpbGVQYXRoKSkgcmV0dXJuXHJcblxyXG5cdGxldCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGFic29sdXRlRmlsZVBhdGgsICd1dGYtOCcpXHJcblxyXG5cdC8vIDEuIFx1NjZCNFx1NTI5Qlx1NkUwNVx1NkQxN1x1RkYxQVx1NjNEMFx1NTI0RFx1NTI1NFx1OTY2NFx1NTkyN1x1NTc1N1x1NzY4NFx1OTc1RVx1OTYwNVx1OEJGQlx1NTMzQVx1NTdERlx1RkYwQ1x1OTYzMlx1NkI2Mlx1OTFDQ1x1OTc2Mlx1NzY4NFx1NTM1NVx1OEJDRFx1ODhBQlx1OEJFRlx1N0I5N1xyXG5cdGNvbnRlbnQgPSBjb250ZW50XHJcblx0XHQucmVwbGFjZSgvLS0tW1xcc1xcU10qPy0tLS8sICcnKSAvLyBcdTc5RkJcdTk2NjQgRnJvbnRtYXR0ZXIgXHU1OTM0XHU5MEU4XHU5MTREXHU3RjZFXHJcblx0XHQvLyAucmVwbGFjZSgvYGBgW1xcc1xcU10qP2BgYC9nLCAnJykgICAgLy8gXHU3OUZCXHU5NjY0XHU1OTI3XHU1NzU3XHU3Njg0XHU0RUUzXHU3ODAxXHU1NzU3XHJcblx0XHQvLyAucmVwbGFjZSgvYC4qP2AvZywgJycpICAgICAgICAgICAgIC8vIFx1NzlGQlx1OTY2NFx1ODg0Q1x1NTE4NVx1NEVFM1x1NzgwMVxyXG5cdFx0LnJlcGxhY2UoL1xcJFxcJFtcXHNcXFNdKj9cXCRcXCQvZywgJycpIC8vIFx1NzlGQlx1OTY2NCBMYVRlWCBcdTU3NTdcdTdFQTdcdTUxNkNcdTVGMEZcclxuXHRcdC5yZXBsYWNlKC9cXCQuKj9cXCQvZywgJycpIC8vIFx1NzlGQlx1OTY2NCBMYVRlWCBcdTg4NENcdTUxODVcdTUxNkNcdTVGMEZcclxuXHRcdC5yZXBsYWNlKC88W14+XSs+L2csICcnKSAvLyBcdTc5RkJcdTk2NjQgSFRNTCBcdTY4MDdcdTdCN0UgKFx1NkJENFx1NTk4MiA8U3BvaWxlcj4pXHJcblxyXG5cdC8vIDIuIFx1NkI2M1x1NTQxMVx1NTMzOVx1OTE0RFx1RkYxQVx1N0NCRVx1NTFDNlx1NjI5M1x1NTNENlx1NEUyRFx1NjU4N1x1NkM0OVx1NUI1N1xyXG5cdC8vIFtcXHU0ZTAwLVxcdTlmYTVdIFx1NjYyRlx1NjgwN1x1NTFDNlx1NEUyRFx1NjU4N1x1NUI1N1x1N0IyNlx1OTZDNlx1RkYwQ1x1NUI4Q1x1NTE2OFx1NEUwRFx1NTMwNVx1NTQyQlx1NEUyRFx1NjU4N1x1NjgwN1x1NzBCOVx1N0IyNlx1NTNGN1x1RkYwMVxyXG5cdGNvbnN0IGNuTWF0Y2hlcyA9IGNvbnRlbnQubWF0Y2goL1tcXHU0ZTAwLVxcdTlmYTVdL2cpIHx8IFtdXHJcblx0Y29uc3QgY25Db3VudCA9IGNuTWF0Y2hlcy5sZW5ndGhcclxuXHJcblx0Ly8gMy4gXHU2QjYzXHU1NDExXHU1MzM5XHU5MTREXHVGRjFBXHU3Q0JFXHU1MUM2XHU2MjkzXHU1M0Q2XHU4MkYxXHU2NTg3XHU1MzU1XHU4QkNEXHU1NDhDXHU2NTcwXHU1QjU3XHJcblx0Ly8gW2EtekEtWjAtOV0rIFx1NEYxQVx1NjI4QVx1OEZERVx1N0VFRFx1NzY4NFx1ODJGMVx1NjU4N1x1NUI1N1x1NkJDRFx1NjIxNlx1NjU3MFx1NUI1N1x1NUY1M1x1NjIxMFx1NEUwMFx1NEUyQVx1NjU3NFx1NEY1M1x1RkYwOFx1NEY4Qlx1NTk4MiBcIndvcmxkXCIgXHU3Qjk3IDEgXHU0RTJBXHVGRjBDXCIxMjNcIiBcdTdCOTcgMSBcdTRFMkFcdUZGMDlcclxuXHQvLyBcdTRFMTRcdTVCOENcdTdGOEVcdThGQzdcdTZFRTRcdTYzODlcdTRFODZcdTYyNDBcdTY3MDlcdTc2ODRcdTgyRjFcdTY1ODdcdTY4MDdcdTcwQjlcdTMwMDFcdTdBN0FcdTY4M0NcdTMwMDFNYXJrZG93biBcdTcyNzlcdTZCOEFcdTdCMjZcdTUzRjdcdUZGMDhcdTU5ODIgIywgKiwgPiBcdTdCNDlcdUZGMDlcclxuXHRjb25zdCBlbk1hdGNoZXMgPSBjb250ZW50Lm1hdGNoKC9bYS16QS1aMC05XSsvZykgfHwgW11cclxuXHRjb25zdCBlbkNvdW50ID0gZW5NYXRjaGVzLmxlbmd0aFxyXG5cclxuXHQvLyA0LiBcdTU0MDhcdTVFNzZcdTYwM0JcdTVCNTdcdTY1NzBcclxuXHRjb25zdCB3b3JkQ291bnQgPSBjbkNvdW50ICsgZW5Db3VudFxyXG5cclxuXHQvLyBcdTk2MDVcdThCRkJcdTY1RjZcdTk1RjRcdUZGMUFcdTYzMDlcdTZCQ0ZcdTUyMDZcdTk0OUZcdTk2MDVcdThCRkIgMTUwIFx1NUI1N1x1N0I5N1x1RkYwQ1x1ODFGM1x1NUMxMVx1NjYzRVx1NzkzQSAxIFx1NTIwNlx1OTQ5RlxyXG5cdGNvbnN0IHJlYWRUaW1lID0gTWF0aC5jZWlsKHdvcmRDb3VudCAvIDE1MCkgfHwgMVxyXG5cclxuXHRyZXR1cm4ge1xyXG5cdFx0ZnJvbnRtYXR0ZXI6IHtcclxuXHRcdFx0Li4ucGFnZURhdGEuZnJvbnRtYXR0ZXIsXHJcblx0XHRcdHdvcmRDb3VudDogd29yZENvdW50LFxyXG5cdFx0XHRyZWFkVGltZTogcmVhZFRpbWUsXHJcblx0XHR9LFxyXG5cdH1cclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkU6XFxcXGdpdGh1YlxcXFxteS1ub3Rlc1xcXFxkb2NzXFxcXC52aXRlcHJlc3NcXFxccGx1Z2luc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcZ2l0aHViXFxcXG15LW5vdGVzXFxcXGRvY3NcXFxcLnZpdGVwcmVzc1xcXFxwbHVnaW5zXFxcXG1hcmtkb3duLWdsb3NzYXJ5Lm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovZ2l0aHViL215LW5vdGVzL2RvY3MvLnZpdGVwcmVzcy9wbHVnaW5zL21hcmtkb3duLWdsb3NzYXJ5Lm10c1wiOy8vIFx1NjU4N1x1NEVGNlx1OERFRlx1NUY4NFx1RkYxQS52aXRlcHJlc3MvZ2xvc3NhcnkubXRzXHJcblxyXG4vLyAxLiBcdTU3MjhcdThGRDlcdTkxQ0NcdTk2QzZcdTRFMkRcdTdFRjRcdTYyQTRcdTRGNjBcdTc2ODRcdTUxNjhcdTVDNDBcdTY3MkZcdThCRURcdThCQ0RcdTUxNzhcdUZGMDhcdTk2OEZcdTRGQkZcdTUyQTBcdUZGMENcdTRFMERcdTc1MjhcdTdCQTFcdTk4N0FcdTVFOEZcdUZGMDFcdUZGMDlcclxuY29uc3QgZ2xvc3Nhcnk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XHJcbiAgJ1x1NTM1NVx1NEY4Qlx1NkEyMVx1NUYwRic6ICcvMDEtXHU4QkExXHU3Qjk3XHU2NzNBXHU0RTBFSVRcdTYyODBcdTY3MkYvMDItXHU4QkJFXHU4QkExXHU2QTIxXHU1RjBGLzAxLVx1NTM1NVx1NEY4Qlx1NkEyMVx1NUYwRicsXHJcbiAgJ1x1NURFNVx1NTM4Mlx1NkEyMVx1NUYwRic6ICcvMDEtXHU4QkExXHU3Qjk3XHU2NzNBXHU0RTBFSVRcdTYyODBcdTY3MkYvMDItXHU4QkJFXHU4QkExXHU2QTIxXHU1RjBGLzAyLVx1NURFNVx1NTM4Mlx1NkEyMVx1NUYwRicsXHJcbiAgJ1x1NEVFM1x1NzQwNlx1NkEyMVx1NUYwRic6ICcvMDEtXHU4QkExXHU3Qjk3XHU2NzNBXHU0RTBFSVRcdTYyODBcdTY3MkYvMDItXHU4QkJFXHU4QkExXHU2QTIxXHU1RjBGLzAzLVx1NEVFM1x1NzQwNlx1NkEyMVx1NUYwRicsXHJcblxyXG4gICdSQUcnOiAnLzAxLVx1OEJBMVx1N0I5N1x1NjczQVx1NEUwRUlUXHU2MjgwXHU2NzJGLzAxLVx1NkJENFx1NzI3OVx1NUMzMVx1NEUxQVx1OEJGRS8wMy1MYW5nQ2hhaW4mTGFuZ0dyYXBoLUFJXHU1RTk0XHU3NTI4XHU1RjAwXHU1M0QxXHU2ODQ2XHU2N0I2XHU3Q0JFXHU1NEMxXHU4QkZFLzAxLUxhbmdDaGFpbi1BSVx1NUU5NFx1NzUyOFx1NUYwMFx1NTNEMVx1Njg0Nlx1NjdCNlx1N0NCRVx1NTRDMVx1OEJGRS8wMi1cdTVENENcdTUxNjVcdTVGMEZcdTZBMjFcdTU3OEIjXHU1RTk0XHU3NTI4XHU1NzNBXHU2NjZGJyxcclxuXHJcbiAgXCJcdTc2RjRcdTYzQTVcdTYzRDJcdTUxNjVcdTYzOTJcdTVFOEZcIjogJy8wMS1cdThCQTFcdTdCOTdcdTY3M0FcdTRFMEVJVFx1NjI4MFx1NjcyRi8wMS1cdTZCRDRcdTcyNzlcdTVDMzFcdTRFMUFcdThCRkUvMDEtSmF2YVx1NzgxNFx1NTNEMVx1N0NGQlx1N0VERlx1OEJGRTExOFx1NjcxRi8wMi1KYXZhXHU2NTcwXHU2MzZFXHU3RUQzXHU2Nzg0LzAxLVx1NjU3MFx1NjM2RVx1N0VEM1x1Njc4NFx1NTIxRFx1OTYzNi8yMDI1LTA3LTMxLVx1NjM5Mlx1NUU4RiNcdTc2RjRcdTYzQTVcdTYzRDJcdTUxNjVcdTYzOTJcdTVFOEYnLFxyXG4gIFwiXHU1RTBDXHU1QzE0XHU2MzkyXHU1RThGXCI6ICcvMDEtXHU4QkExXHU3Qjk3XHU2NzNBXHU0RTBFSVRcdTYyODBcdTY3MkYvMDEtXHU2QkQ0XHU3Mjc5XHU1QzMxXHU0RTFBXHU4QkZFLzAxLUphdmFcdTc4MTRcdTUzRDFcdTdDRkJcdTdFREZcdThCRkUxMThcdTY3MUYvMDItSmF2YVx1NjU3MFx1NjM2RVx1N0VEM1x1Njc4NC8wMS1cdTY1NzBcdTYzNkVcdTdFRDNcdTY3ODRcdTUyMURcdTk2MzYvMjAyNS0wNy0zMS1cdTYzOTJcdTVFOEYjXHU1RTBDXHU1QzE0XHU2MzkyXHU1RThGJyxcclxuICBcIlx1OTAwOVx1NjJFOVx1NjM5Mlx1NUU4RlwiOiAnLzAxLVx1OEJBMVx1N0I5N1x1NjczQVx1NEUwRUlUXHU2MjgwXHU2NzJGLzAxLVx1NkJENFx1NzI3OVx1NUMzMVx1NEUxQVx1OEJGRS8wMS1KYXZhXHU3ODE0XHU1M0QxXHU3Q0ZCXHU3RURGXHU4QkZFMTE4XHU2NzFGLzAyLUphdmFcdTY1NzBcdTYzNkVcdTdFRDNcdTY3ODQvMDEtXHU2NTcwXHU2MzZFXHU3RUQzXHU2Nzg0XHU1MjFEXHU5NjM2LzIwMjUtMDctMzEtXHU2MzkyXHU1RThGI1x1OTAwOVx1NjJFOVx1NjM5Mlx1NUU4RicsXHJcbiAgXCJcdTU4MDZcdTYzOTJcdTVFOEZcIjogJy8wMS1cdThCQTFcdTdCOTdcdTY3M0FcdTRFMEVJVFx1NjI4MFx1NjcyRi8wMS1cdTZCRDRcdTcyNzlcdTVDMzFcdTRFMUFcdThCRkUvMDEtSmF2YVx1NzgxNFx1NTNEMVx1N0NGQlx1N0VERlx1OEJGRTExOFx1NjcxRi8wMi1KYXZhXHU2NTcwXHU2MzZFXHU3RUQzXHU2Nzg0LzAxLVx1NjU3MFx1NjM2RVx1N0VEM1x1Njc4NFx1NTIxRFx1OTYzNi8yMDI1LTA3LTMxLVx1NjM5Mlx1NUU4RiNcdTU4MDZcdTYzOTJcdTVFOEYnLFxyXG4gIFwiXHU1MTkyXHU2Q0UxXHU2MzkyXHU1RThGXCI6ICcvMDEtXHU4QkExXHU3Qjk3XHU2NzNBXHU0RTBFSVRcdTYyODBcdTY3MkYvMDEtXHU2QkQ0XHU3Mjc5XHU1QzMxXHU0RTFBXHU4QkZFLzAxLUphdmFcdTc4MTRcdTUzRDFcdTdDRkJcdTdFREZcdThCRkUxMThcdTY3MUYvMDItSmF2YVx1NjU3MFx1NjM2RVx1N0VEM1x1Njc4NC8wMS1cdTY1NzBcdTYzNkVcdTdFRDNcdTY3ODRcdTUyMURcdTk2MzYvMjAyNS0wNy0zMS1cdTYzOTJcdTVFOEYjXHU1MTkyXHU2Q0UxXHU2MzkyXHU1RThGJyxcclxuICBcIlx1NUZFQlx1OTAxRlx1NjM5Mlx1NUU4RlwiOiAnLzAxLVx1OEJBMVx1N0I5N1x1NjczQVx1NEUwRUlUXHU2MjgwXHU2NzJGLzAxLVx1NkJENFx1NzI3OVx1NUMzMVx1NEUxQVx1OEJGRS8wMS1KYXZhXHU3ODE0XHU1M0QxXHU3Q0ZCXHU3RURGXHU4QkZFMTE4XHU2NzFGLzAyLUphdmFcdTY1NzBcdTYzNkVcdTdFRDNcdTY3ODQvMDEtXHU2NTcwXHU2MzZFXHU3RUQzXHU2Nzg0XHU1MjFEXHU5NjM2LzIwMjUtMDctMzEtXHU2MzkyXHU1RThGI1x1NUZFQlx1OTAxRlx1NjM5Mlx1NUU4RicsXHJcbiAgXCJcdTVGNTJcdTVFNzZcdTYzOTJcdTVFOEZcIjogJy8wMS1cdThCQTFcdTdCOTdcdTY3M0FcdTRFMEVJVFx1NjI4MFx1NjcyRi8wMS1cdTZCRDRcdTcyNzlcdTVDMzFcdTRFMUFcdThCRkUvMDEtSmF2YVx1NzgxNFx1NTNEMVx1N0NGQlx1N0VERlx1OEJGRTExOFx1NjcxRi8wMi1KYXZhXHU2NTcwXHU2MzZFXHU3RUQzXHU2Nzg0LzAxLVx1NjU3MFx1NjM2RVx1N0VEM1x1Njc4NFx1NTIxRFx1OTYzNi8yMDI1LTA3LTMxLVx1NjM5Mlx1NUU4RiNcdTVGNTJcdTVFNzZcdTYzOTJcdTVFOEYnLFxyXG4gIFwiXHU4QkExXHU2NTcwXHU2MzkyXHU1RThGXCI6ICcvMDEtXHU4QkExXHU3Qjk3XHU2NzNBXHU0RTBFSVRcdTYyODBcdTY3MkYvMDEtXHU2QkQ0XHU3Mjc5XHU1QzMxXHU0RTFBXHU4QkZFLzAxLUphdmFcdTc4MTRcdTUzRDFcdTdDRkJcdTdFREZcdThCRkUxMThcdTY3MUYvMDItSmF2YVx1NjU3MFx1NjM2RVx1N0VEM1x1Njc4NC8wMS1cdTY1NzBcdTYzNkVcdTdFRDNcdTY3ODRcdTUyMURcdTk2MzYvMjAyNS0wNy0zMS1cdTYzOTJcdTVFOEYjXHU4QkExXHU2NTcwXHU2MzkyXHU1RThGJyxcclxuICBcIlx1NTdGQVx1NjU3MFx1NjM5Mlx1NUU4RlwiOiAnLzAxLVx1OEJBMVx1N0I5N1x1NjczQVx1NEUwRUlUXHU2MjgwXHU2NzJGLzAxLVx1NkJENFx1NzI3OVx1NUMzMVx1NEUxQVx1OEJGRS8wMS1KYXZhXHU3ODE0XHU1M0QxXHU3Q0ZCXHU3RURGXHU4QkZFMTE4XHU2NzFGLzAyLUphdmFcdTY1NzBcdTYzNkVcdTdFRDNcdTY3ODQvMDEtXHU2NTcwXHU2MzZFXHU3RUQzXHU2Nzg0XHU1MjFEXHU5NjM2LzIwMjUtMDctMzEtXHU2MzkyXHU1RThGI1x1NTdGQVx1NjU3MFx1NjM5Mlx1NUU4RicsXHJcbiAgXCJcdTY4NzZcdTYzOTJcdTVFOEZcIjogJy8wMS1cdThCQTFcdTdCOTdcdTY3M0FcdTRFMEVJVFx1NjI4MFx1NjcyRi8wMS1cdTZCRDRcdTcyNzlcdTVDMzFcdTRFMUFcdThCRkUvMDEtSmF2YVx1NzgxNFx1NTNEMVx1N0NGQlx1N0VERlx1OEJGRTExOFx1NjcxRi8wMi1KYXZhXHU2NTcwXHU2MzZFXHU3RUQzXHU2Nzg0LzAxLVx1NjU3MFx1NjM2RVx1N0VEM1x1Njc4NFx1NTIxRFx1OTYzNi8yMDI1LTA3LTMxLVx1NjM5Mlx1NUU4RiNcdTY4NzZcdTYzOTJcdTVFOEYnLFxyXG5cclxuXHJcblxyXG4gICdcdTRFMERcdTgwQ0NcdTUzNTVcdThCQ0QnOiAnLzAwLVx1NUI2Nlx1NEU2MFx1NjI4MFx1NURFNy8wMi1cdTgyRjFcdThCRUQvMDAtXHU1MzU1XHU4QkNEXHU4MENDXHU4QkY1XHU4RjZGXHU0RUY2XHU2M0E4XHU4MzUwI1x1NEUwRFx1ODBDQ1x1NTM1NVx1OEJDRCcsXHJcbiAgJ0Fua2knOiAnLzAwLVx1NUI2Nlx1NEU2MFx1NjI4MFx1NURFNy8wMi1cdTgyRjFcdThCRUQvMDAtXHU1MzU1XHU4QkNEXHU4MENDXHU4QkY1XHU4RjZGXHU0RUY2XHU2M0E4XHU4MzUwI2Fua2knLFxyXG4gIC8vICdcdTc5RDFcdTc2RUVcdTRFMDAnOiAnL1x1OUE3RVx1ODAwM1x1NEVBNFx1ODlDNC8wMS1cdTc5RDFcdTc2RUVcdTRFMDAvaW5kZXgnLFxyXG59O1xyXG5cclxuLy8gXHVEODNEXHVEQzQ5IFx1MzAxMFx1NjgzOFx1NUZDM1x1NEYxOFx1NTMxNlx1MzAxMVx1RkYxQVx1NUMwNlx1OEJDRFx1NTE3OFx1NzY4NCBLZXkgXHU2M0QwXHU1M0Q2XHU1MUZBXHU2NzY1XHVGRjBDXHU1RTc2XHU4MUVBXHU1MkE4XHU2MzA5XHU3MTY3XHU1QjU3XHU3QjI2XHU0RTMyXHU5NTdGXHU1RUE2XHU0RUNFXHU5NTdGXHU1MjMwXHU3N0VEXHU2MzkyXHU1RThGIChiLmxlbmd0aCAtIGEubGVuZ3RoKVxyXG4vLyBcdThGRDlcdTY4MzdcdTU3MjhcdTkwNERcdTUzODZcdTY1RjZcdUZGMENcIlx1NTM1NVx1NEY4Qlx1NkEyMVx1NUYwRlwiIFx1NkMzOFx1OEZEQ1x1NEYxQVx1NTcyOCBcIlx1NkEyMVx1NUYwRlwiIFx1NEU0Qlx1NTI0RFx1ODhBQlx1NTMzOVx1OTE0RFx1RkYwQ1x1NUY3Qlx1NUU5NVx1Njc1Q1x1N0VERFx1OTFDRFx1NTNFMFx1NTk1N1x1NUEwM1x1RkYwMVxyXG5jb25zdCBzb3J0ZWRLZXl3b3JkcyA9IE9iamVjdC5rZXlzKGdsb3NzYXJ5KS5zb3J0KChhLCBiKSA9PiBiLmxlbmd0aCAtIGEubGVuZ3RoKTtcclxuXHJcbi8vIDIuIFx1NUJGQ1x1NTFGQVx1NEUwMFx1NEUyQVx1NjgwN1x1NTFDNlx1NzY4NCBtYXJrZG93bi1pdCBcdTYzRDJcdTRFRjZcdTUxRkRcdTY1NzBcclxuZXhwb3J0IGZ1bmN0aW9uIGF1dG9MaW5rS2V5d29yZHNQbHVnaW4obWQ6IGFueSkge1xyXG4gIG1kLmNvcmUucnVsZXIuYWZ0ZXIoJ2lubGluZScsICdhdXRvLWxpbmsta2V5d29yZHMnLCAoc3RhdGU6IGFueSkgPT4ge1xyXG4gICAgXHJcbiAgICAvLyBcdTI3MjggXHU2ODM4XHU1RkMzXHU0RkVFXHU1OTBEIDFcdUZGMUFcdTU4OUVcdTUyQTBcdTRFMDBcdTRFMkFcdTY4MDdcdThCQjBcdUZGMENcdThCQjBcdTVGNTVcdTVGNTNcdTUyNERcdTY2MkZcdTU0MjZcdTU5MDRcdTRFOEVcdTY4MDdcdTk4OThcdUZGMDhoMX5oNlx1RkYwOVx1NTE4NVx1OTBFOFxyXG4gICAgbGV0IGlzSW5zaWRlSGVhZGluZyA9IGZhbHNlOyBcclxuXHJcbiAgICBzdGF0ZS50b2tlbnMuZm9yRWFjaCgoYmxvY2tUb2tlbjogYW55KSA9PiB7XHJcbiAgICAgIFxyXG4gICAgICAvLyBcdTI3MjggXHU2ODM4XHU1RkMzXHU0RkVFXHU1OTBEIDJcdUZGMUFcdTc2RDFcdTU0MkNcdTY4MDdcdTk4OThcdTc2ODRcdTVGMDBcdTU5Q0JcdTU0OENcdTdFRDNcdTY3NUZcclxuICAgICAgaWYgKGJsb2NrVG9rZW4udHlwZSA9PT0gJ2hlYWRpbmdfb3BlbicpIHtcclxuICAgICAgICBpc0luc2lkZUhlYWRpbmcgPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChibG9ja1Rva2VuLnR5cGUgPT09ICdoZWFkaW5nX2Nsb3NlJykge1xyXG4gICAgICAgIGlzSW5zaWRlSGVhZGluZyA9IGZhbHNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBpZiAoYmxvY2tUb2tlbi50eXBlICE9PSAnaW5saW5lJykgcmV0dXJuO1xyXG5cclxuICAgICAgLy8gXHUyNzI4IFx1NjgzOFx1NUZDM1x1NEZFRVx1NTkwRCAzXHVGRjFBXHU1OTgyXHU2NzlDXHU1RjUzXHU1MjREXHU4RkQ5XHU2QkI1XHU2NTg3XHU1QjU3XHU2NjJGXHU1NzI4XHU2ODA3XHU5ODk4XHU1MTg1XHU5MEU4XHU3Njg0XHVGRjBDXHU3NkY0XHU2M0E1XHU4REYzXHU4RkM3XHVGRjBDXHU3RUREXHU1QkY5XHU0RTBEXHU2NkZGXHU2MzYyXHVGRjAxXHJcbiAgICAgIGlmIChpc0luc2lkZUhlYWRpbmcpIHJldHVybjtcclxuXHJcbiAgICAgIGxldCBpc0luc2lkZUxpbmsgPSBmYWxzZTtcclxuICAgICAgXHJcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2tUb2tlbi5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGNvbnN0IHRva2VuID0gYmxvY2tUb2tlbi5jaGlsZHJlbltpXTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAodG9rZW4udHlwZSA9PT0gJ2xpbmtfb3BlbicpIGlzSW5zaWRlTGluayA9IHRydWU7XHJcbiAgICAgICAgaWYgKHRva2VuLnR5cGUgPT09ICdsaW5rX2Nsb3NlJykgaXNJbnNpZGVMaW5rID0gZmFsc2U7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHRva2VuLnR5cGUgPT09ICd0ZXh0JyAmJiAhaXNJbnNpZGVMaW5rKSB7XHJcbiAgICAgICAgICBsZXQgaHRtbCA9IHRva2VuLmNvbnRlbnQ7XHJcbiAgICAgICAgICBsZXQgcmVwbGFjZWQgPSBmYWxzZTtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgY29uc3QgcGxhY2Vob2xkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XHJcbiAgICAgICAgICBsZXQgcElkID0gMDtcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgc29ydGVkS2V5d29yZHMuZm9yRWFjaCgoa2V5d29yZCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoaHRtbC5pbmNsdWRlcyhrZXl3b3JkKSkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gaHRtbC5zcGxpdCgvKDxbXj5dKz4pL2cpO1xyXG4gICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgcGFydHMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICghcGFydHNbal0uc3RhcnRzV2l0aCgnPCcpICYmIHBhcnRzW2pdLmluY2x1ZGVzKGtleXdvcmQpKSB7XHJcbiAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAvLyBcdUQ4M0RcdURDNDcgXHU2Q0U4XHU2MTBGXHU4RkQ5XHU5MUNDXHU3Njg0XHU5NEZFXHU2M0E1XHU2ODM3XHU1RjBGXHVGRjBDXHU0RjYwXHU1M0VGXHU0RUU1XHU2ODM5XHU2MzZFXHU5NzAwXHU4OTgxXHU4QzAzXHU2NTc0XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGxpbmsgPSBnbG9zc2FyeVtrZXl3b3JkXTtcclxuICAgICAgICAgICAgICAgICAgY29uc3QgbmV3SHRtbCA9IGA8YSBocmVmPVwiJHtsaW5rfVwiIHN0eWxlPVwiY29sb3I6IHZhcigtLXZwLWMtYnJhbmQpOyBmb250LXdlaWdodDogNTAwO1wiPiR7a2V5d29yZH08L2E+YDtcclxuICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHBpZWNlcyA9IHBhcnRzW2pdLnNwbGl0KGtleXdvcmQpO1xyXG4gICAgICAgICAgICAgICAgICBjb25zdCByZWJ1aWx0ID0gW107XHJcbiAgICAgICAgICAgICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgcGllY2VzLmxlbmd0aCAtIDE7IGsrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBsYWNlaG9sZGVyID0gYF9fVlBfR0xPU1NBUllfJHtwSWQrK31fX2A7XHJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXJzW3BsYWNlaG9sZGVyXSA9IG5ld0h0bWw7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVidWlsdC5wdXNoKHBpZWNlc1trXSwgcGxhY2Vob2xkZXIpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIHJlYnVpbHQucHVzaChwaWVjZXNbcGllY2VzLmxlbmd0aCAtIDFdKTtcclxuICAgICAgICAgICAgICAgICAgcGFydHNbal0gPSByZWJ1aWx0LmpvaW4oJycpO1xyXG4gICAgICAgICAgICAgICAgICByZXBsYWNlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGh0bWwgPSBwYXJ0cy5qb2luKCcnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIGlmIChyZXBsYWNlZCkge1xyXG4gICAgICAgICAgICBmb3IgKGNvbnN0IHBsYWNlaG9sZGVyIGluIHBsYWNlaG9sZGVycykge1xyXG4gICAgICAgICAgICAgIGh0bWwgPSBodG1sLnJlcGxhY2UobmV3IFJlZ0V4cChwbGFjZWhvbGRlciwgJ2cnKSwgcGxhY2Vob2xkZXJzW3BsYWNlaG9sZGVyXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdG9rZW4udHlwZSA9ICdodG1sX2lubGluZSc7XHJcbiAgICAgICAgICAgIHRva2VuLmNvbnRlbnQgPSBodG1sO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcbn0iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkU6XFxcXGdpdGh1YlxcXFxteS1ub3Rlc1xcXFxkb2NzXFxcXC52aXRlcHJlc3NcXFxccGx1Z2luc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcZ2l0aHViXFxcXG15LW5vdGVzXFxcXGRvY3NcXFxcLnZpdGVwcmVzc1xcXFxwbHVnaW5zXFxcXG1hcmtkb3duLWRvd25sb2FkLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovZ2l0aHViL215LW5vdGVzL2RvY3MvLnZpdGVwcmVzcy9wbHVnaW5zL21hcmtkb3duLWRvd25sb2FkLm10c1wiOy8vIC52aXRlcHJlc3MvcGx1Z2lucy9tYXJrZG93bi1kb3dubG9hZC5tdHNcclxuXHJcbi8vIFx1RDgzQ1x1REZBRiBcdTMwMTBcdTk2QzZcdTRFMkRcdTkxNERcdTdGNkVcdTUzM0FcdTMwMTFcdUZGMUFcdTU3MjhcdThGRDlcdTkxQ0NcdTRFRTVcdTY1NzBcdTdFQzRcdTVGNjJcdTVGMEZcdTdCQTFcdTc0MDZcdTYyNDBcdTY3MDlcdTk3MDBcdTg5ODFcdTg5RTZcdTUzRDFcdTRFMEJcdThGN0RcdTc2ODRcdTY1ODdcdTRFRjZcdTU0MEVcdTdGMDBcclxuY29uc3QgRE9XTkxPQURBQkxFX0VYVEVOU0lPTlMgPSBbXHJcbiAgLy8gXHU4ODY4XHU2ODNDXHU2NTcwXHU2MzZFXHJcbiAgJ3hsc3gnLCAneGxzJywgJ2NzdicsXHJcbiAgLy8gXHU1MzhCXHU3RjI5XHU1MzA1XHJcbiAgJ3ppcCcsICdyYXInLCAnN3onLCAndGFyJywgJ2d6JyxcclxuICAvLyBcdTY1ODdcdTY4NjNcdTY3NTBcdTY1OTlcclxuICAncGRmJywgJ2RvYycsICdkb2N4JywgJ3BwdCcsICdwcHR4J1xyXG5dO1xyXG5cclxuLy8gXHUyNjk5XHVGRTBGIFx1NUYxNVx1NjRDRVx1ODFFQVx1NTJBOFx1NUMwNlx1NjU3MFx1N0VDNFx1NjJGQ1x1NjNBNVx1NEUzQVx1NkI2M1x1NTIxOVx1ODg2OFx1OEZCRVx1NUYwRiAoXHU0RjhCXHU1OTgyOiAvXFwuKHhsc3h8eGxzfGNzdi4uLikkL2kgKVxyXG5jb25zdCBleHRQYXR0ZXJuID0gbmV3IFJlZ0V4cChgXFxcXC4oJHtET1dOTE9BREFCTEVfRVhURU5TSU9OUy5qb2luKCd8Jyl9KSRgLCAnaScpO1xyXG5cclxuZXhwb3J0IGNvbnN0IGF1dG9Eb3dubG9hZFBsdWdpbiA9IChtZDogYW55KSA9PiB7XHJcbiAgLy8gXHU4QkIwXHU0RjRGXHU5RUQ4XHU4QkE0XHU3Njg0XHU4RDg1XHU5NEZFXHU2M0E1XHU2RTMyXHU2N0QzXHU4OUM0XHU1MjE5XHJcbiAgY29uc3QgZGVmYXVsdFJlbmRlciA9IG1kLnJlbmRlcmVyLnJ1bGVzLmxpbmtfb3BlbiB8fCBmdW5jdGlvbih0b2tlbnM6IGFueSwgaWR4OiBudW1iZXIsIG9wdGlvbnM6IGFueSwgZW52OiBhbnksIHNlbGY6IGFueSkge1xyXG4gICAgcmV0dXJuIHNlbGYucmVuZGVyVG9rZW4odG9rZW5zLCBpZHgsIG9wdGlvbnMpO1xyXG4gIH07XHJcblxyXG4gIC8vIFx1NTJBQlx1NjMwMVx1OEQ4NVx1OTRGRVx1NjNBNVx1NzY4NFx1NjI1M1x1NUYwMFx1NjgwN1x1N0I3RSA8YT5cclxuICBtZC5yZW5kZXJlci5ydWxlcy5saW5rX29wZW4gPSBmdW5jdGlvbiAodG9rZW5zOiBhbnksIGlkeDogbnVtYmVyLCBvcHRpb25zOiBhbnksIGVudjogYW55LCBzZWxmOiBhbnkpIHtcclxuICAgIGNvbnN0IHRva2VuID0gdG9rZW5zW2lkeF07XHJcbiAgICBjb25zdCBocmVmSW5kZXggPSB0b2tlbi5hdHRySW5kZXgoJ2hyZWYnKTtcclxuXHJcbiAgICBpZiAoaHJlZkluZGV4ID49IDApIHtcclxuICAgICAgY29uc3QgaHJlZiA9IHRva2VuLmF0dHJzW2hyZWZJbmRleF1bMV07XHJcbiAgICAgIFxyXG4gICAgICAvLyBcdUQ4M0RcdURFODAgXHU0RjdGXHU3NTI4XHU1MkE4XHU2MDAxXHU3NTFGXHU2MjEwXHU3Njg0XHU2QjYzXHU1MjE5XHU4RkRCXHU4ODRDXHU2ODIxXHU5QThDXHJcbiAgICAgIGlmIChleHRQYXR0ZXJuLnRlc3QoaHJlZikpIHtcclxuICAgICAgICBcclxuICAgICAgICAvLyAxLiBcdTgxRUFcdTUyQThcdTZDRThcdTUxNjUgdGFyZ2V0PVwiX2JsYW5rXCJcclxuICAgICAgICBjb25zdCB0YXJnZXRJbmRleCA9IHRva2VuLmF0dHJJbmRleCgndGFyZ2V0Jyk7XHJcbiAgICAgICAgaWYgKHRhcmdldEluZGV4IDwgMCkge1xyXG4gICAgICAgICAgdG9rZW4uYXR0clB1c2goWyd0YXJnZXQnLCAnX2JsYW5rJ10pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0b2tlbi5hdHRyc1t0YXJnZXRJbmRleF1bMV0gPSAnX2JsYW5rJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIDIuIFx1ODFFQVx1NTJBOFx1NkNFOFx1NTE2NSBkb3dubG9hZCBcdTVDNUVcdTYwMjdcclxuICAgICAgICB0b2tlbi5hdHRyUHVzaChbJ2Rvd25sb2FkJywgJyddKTtcclxuXHJcbiAgICAgICAgLy8gMy4gXHU4MUVBXHU1MkE4XHU1MkEwXHU0RTBBXHU0RTEzXHU1QzVFXHU3Njg0IENTUyBcdTdDN0JcdTU0MERcclxuICAgICAgICBjb25zdCBjbGFzc0luZGV4ID0gdG9rZW4uYXR0ckluZGV4KCdjbGFzcycpO1xyXG4gICAgICAgIGlmIChjbGFzc0luZGV4IDwgMCkge1xyXG4gICAgICAgICAgdG9rZW4uYXR0clB1c2goWydjbGFzcycsICdhdXRvLWRvd25sb2FkLWxpbmsnXSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRva2VuLmF0dHJzW2NsYXNzSW5kZXhdWzFdICs9ICcgYXV0by1kb3dubG9hZC1saW5rJztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBkZWZhdWx0UmVuZGVyKHRva2VucywgaWR4LCBvcHRpb25zLCBlbnYsIHNlbGYpO1xyXG4gIH07XHJcbn07IiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxnaXRodWJcXFxcbXktbm90ZXNcXFxcZG9jc1xcXFwudml0ZXByZXNzXFxcXHBsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXGdpdGh1YlxcXFxteS1ub3Rlc1xcXFxkb2NzXFxcXC52aXRlcHJlc3NcXFxccGx1Z2luc1xcXFxtYXJrZG93bi1tYXRoLXRvb2wubXRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi9naXRodWIvbXktbm90ZXMvZG9jcy8udml0ZXByZXNzL3BsdWdpbnMvbWFya2Rvd24tbWF0aC10b29sLm10c1wiOy8vIC52aXRlcHJlc3MvcGx1Z2lucy9tYXJrZG93bi1tYXRoLXRvb2wubXRzXHJcbmV4cG9ydCBjb25zdCBtYXRoVG9vbFBsdWdpbiA9IChtZDogYW55KSA9PiB7XHJcbiAgLy8gXHU1MkFCXHU2MzAxXHU5RUQ4XHU4QkE0XHU3Njg0XHU1NzU3XHU3RUE3XHU2NTcwXHU1QjY2XHU1MTZDXHU1RjBGXHU2RTMyXHU2N0QzXHU1NjY4XHJcbiAgY29uc3QgZGVmYXVsdE1hdGhCbG9ja1JlbmRlcmVyID0gbWQucmVuZGVyZXIucnVsZXMubWF0aF9ibG9jaztcclxuXHJcbiAgaWYgKGRlZmF1bHRNYXRoQmxvY2tSZW5kZXJlcikge1xyXG4gICAgbWQucmVuZGVyZXIucnVsZXMubWF0aF9ibG9jayA9ICh0b2tlbnM6IGFueSwgaWR4OiBudW1iZXIsIG9wdGlvbnM6IGFueSwgZW52OiBhbnksIHNlbGY6IGFueSkgPT4ge1xyXG4gICAgICAvLyBcdTgzQjdcdTUzRDZcdTUzOUZcdTU5Q0JcdTc2ODQgTGFUZVggXHU0RUUzXHU3ODAxXHJcbiAgICAgIGNvbnN0IHJhd1RleCA9IHRva2Vuc1tpZHhdLmNvbnRlbnQ7XHJcbiAgICAgIC8vIFx1ODNCN1x1NTNENlx1NkUzMlx1NjdEM1x1NTQwRVx1NzY4NCBIVE1MIChTVkcgXHU2MjE2IE1hdGhNTClcclxuICAgICAgY29uc3QgcmVuZGVyZWRIdG1sID0gZGVmYXVsdE1hdGhCbG9ja1JlbmRlcmVyKHRva2VucywgaWR4LCBvcHRpb25zLCBlbnYsIHNlbGYpO1xyXG5cclxuICAgICAgLy8gXHU2ODM4XHU1RkMzXHU5QjU0XHU2Q0Q1XHVGRjFBXHU3NTI4XHU0RTAwXHU0RTJBXHU1RTI2XHU2NzA5IGRhdGEtdGV4IFx1NUM1RVx1NjAyN1x1NzY4NCBkaXYgXHU1MzA1XHU4OEY5XHU4RDc3XHU2NzY1XHJcbiAgICAgIHJldHVybiBgPGRpdiBjbGFzcz1cImNsaWNrYWJsZS1tYXRoLWJsb2NrXCIgZGF0YS10ZXg9XCIke2VuY29kZVVSSUNvbXBvbmVudChyYXdUZXgpfVwiPlxcbiR7cmVuZGVyZWRIdG1sfVxcbjwvZGl2PmA7XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLy8gLS0tIDIuIFx1NjVCMFx1NTg5RVx1RkYxQVx1NTkwNFx1NzQwNlx1ODg0Q1x1NTE4NVx1NTE2Q1x1NUYwRiAtLS1cclxuICBjb25zdCBkZWZhdWx0TWF0aElubGluZVJlbmRlcmVyID0gbWQucmVuZGVyZXIucnVsZXMubWF0aF9pbmxpbmU7XHJcbiAgaWYgKGRlZmF1bHRNYXRoSW5saW5lUmVuZGVyZXIpIHtcclxuICAgIG1kLnJlbmRlcmVyLnJ1bGVzLm1hdGhfaW5saW5lID0gKHRva2VuczogYW55LCBpZHg6IG51bWJlciwgb3B0aW9uczogYW55LCBlbnY6IGFueSwgc2VsZjogYW55KSA9PiB7XHJcbiAgICAgIGNvbnN0IHJhd1RleCA9IHRva2Vuc1tpZHhdLmNvbnRlbnQ7XHJcbiAgICAgIGNvbnN0IHJlbmRlcmVkSHRtbCA9IGRlZmF1bHRNYXRoSW5saW5lUmVuZGVyZXIodG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiwgc2VsZik7XHJcbiAgICAgIFxyXG4gICAgICAvLyBcdTY4MzhcdTVGQzNcdTlCNTRcdTZDRDVcdUZGMUFcdTRGN0ZcdTc1Mjggc3BhbiBcdTRGRERcdTYzMDFcdTg4NENcdTUxODVcdTYzOTJcdTcyNDhcdUZGMENcdTU4OUVcdTUyQTAgY2xpY2thYmxlLW1hdGgtaW5saW5lIFx1N0M3Qlx1NTQwRFx1RkYwQ1x1NEUxNFx1NjgwN1x1OEJCMFx1NEUzQSBpbmxpbmVcclxuICAgICAgcmV0dXJuIGA8c3BhbiBjbGFzcz1cImNsaWNrYWJsZS1tYXRoLWJsb2NrIGNsaWNrYWJsZS1tYXRoLWlubGluZVwiIGRhdGEtdGV4PVwiJHtlbmNvZGVVUklDb21wb25lbnQocmF3VGV4KX1cIiBkYXRhLXR5cGU9XCJpbmxpbmVcIj4ke3JlbmRlcmVkSHRtbH08L3NwYW4+YDtcclxuICAgIH07XHJcbiAgfVxyXG59IiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxnaXRodWJcXFxcbXktbm90ZXNcXFxcZG9jc1xcXFwudml0ZXByZXNzXFxcXHBsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXGdpdGh1YlxcXFxteS1ub3Rlc1xcXFxkb2NzXFxcXC52aXRlcHJlc3NcXFxccGx1Z2luc1xcXFxtYXJrZG93bi1zeW50YXgtc3VnYXIubXRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi9naXRodWIvbXktbm90ZXMvZG9jcy8udml0ZXByZXNzL3BsdWdpbnMvbWFya2Rvd24tc3ludGF4LXN1Z2FyLm10c1wiOy8vIGRvY3MvLnZpdGVwcmVzcy9wbHVnaW5zL21hcmtkb3duLXN5bnRheC1zdWdhci5tdHNcclxuXHJcbmV4cG9ydCBjb25zdCBzeW50YXhTdWdhclBsdWdpbiA9IChtZDogYW55KSA9PiB7XHJcblx0bWQuY29yZS5ydWxlci5iZWZvcmUoJ25vcm1hbGl6ZScsICdzcG9pbGVyX2dsb2JhbF9yZXBsYWNlJywgKHN0YXRlOiBhbnkpID0+IHtcclxuXHRcdGNvbnN0IHN0b3JlOiBzdHJpbmdbXSA9IFtdXHJcblxyXG5cdFx0Ly8gXHVEODNEXHVERUUxXHVGRTBGIDEuIFx1NjNEMFx1NTNENlx1NUU3Nlx1NEZERFx1NjJBNFx1NjI0MFx1NjcwOVx1NzY4NCBcdTU5MUFcdTg4NENcdTRFRTNcdTc4MDFcdTU3NTdcdTMwMDFcdTg4NENcdTUxODVcdTRFRTNcdTc4MDFcdTMwMDFcdTUxNkNcdTVGMEZcdUZGMENcdTk2MzJcdTZCNjJcdTg4QUJcdTk1MTlcdThCRUZcdTc2ODRcdTZCNjNcdTUyMTlcdTc4MzRcdTU3NEZcclxuXHRcdGxldCB0ZW1wU3JjID0gc3RhdGUuc3JjLnJlcGxhY2UoLyhgYGBbXFxzXFxTXSo/YGBgfGBbXmBcXG5dK2B8XFwkXFwkW1xcc1xcU10qP1xcJFxcJHxcXCRbXiRcXG5dK1xcJCkvZywgKG1hdGNoOiBzdHJpbmcpID0+IHtcclxuXHRcdFx0c3RvcmUucHVzaChtYXRjaClcclxuXHRcdFx0cmV0dXJuIGBcXHgwMSR7c3RvcmUubGVuZ3RoIC0gMX1cXHgwMmAgLy8gXHU2NkZGXHU2MzYyXHU0RTNBXHU0RTBEXHU1M0VGXHU4OUMxXHU3Njg0XHU1MzYwXHU0RjREXHU3QjI2XHJcblx0XHR9KVxyXG5cclxuXHRcdC8vIFx1RDgzRVx1RERGMSAyLiBcdTUzMzlcdTkxNERcdTU3NTdcdTdFQTcgU3BvaWxlclx1RkYwOFx1NzJFQ1x1NTM2MFx1NEUwMFx1ODg0Q1x1NzY4NCB8fFx1RkYwOVxyXG5cdFx0Ly8gXHU1MzM5XHU5MTREXHU4OUM0XHU1MjE5XHVGRjFBXHU4ODRDXHU5OTk2XHU3Njg0IHx8IFx1NTJBMFx1NEUwQVx1NjM2Mlx1ODg0Q1x1RkYwQ1x1NEUyRFx1OTVGNFx1NEVGQlx1NjEwRlx1NTE4NVx1NUJCOVx1RkYwQ1x1NjcwMFx1NTQwRVx1NTNDOFx1NjYyRlx1ODg0Q1x1OTk5Nlx1NzY4NCB8fFxyXG5cdFx0Ly8gdGVtcFNyYyA9IHRlbXBTcmMucmVwbGFjZShcclxuXHRcdC8vIFx0L15cXHxcXHxbIFxcdF0qXFxyP1xcbihbXFxzXFxTXSo/KV5cXHxcXHxbIFxcdF0qKD86XFxyP1xcbnwkKS9nbSxcclxuXHRcdC8vIFx0KG1hdGNoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZykgPT4ge1xyXG5cdFx0Ly8gXHRcdHJldHVybiBgXFxuXFxuPFNwb2lsZXIgbW9kZT1cImJsb2NrXCI+XFxuXFxuJHtjb250ZW50fVxcblxcbjwvU3BvaWxlcj5cXG5cXG5gXHJcblx0XHQvLyBcdH0sXHJcblx0XHQvLyApXHJcbiAgICB0ZW1wU3JjID0gdGVtcFNyYy5yZXBsYWNlKC9eKFsgXFx0Pl0qKVxcfFxcfFsgXFx0XSpcXHI/XFxuKFtcXHNcXFNdKj8pXlsgXFx0Pl0qXFx8XFx8WyBcXHRdKig/Olxccj9cXG58JCkvZ20sIChtYXRjaDogc3RyaW5nLCBwcmVmaXg6IHN0cmluZywgY29udGVudDogc3RyaW5nKSA9PiB7XHJcbiAgICAgIC8vIFx1NTJBOFx1NjAwMVx1NzUxRlx1NjIxMFx1NUUyNlx1NjcwOVx1NkI2M1x1Nzg2RVx1NTI0RFx1N0YwMFx1NzY4NFx1N0E3QVx1ODg0Q1x1RkYwOFx1NkJENFx1NTk4MiBcIj4gXFxuXCJcdUZGMDlcdUZGMENcdTc4NkVcdTRGRERcdTU5MTZcdTkwRThcdTc2ODRcdTVGMTVcdTc1MjhcdTU3NTdcdTRFMERcdTY1QURcdTVDNDJcclxuICAgICAgY29uc3QgYmxhbmsgPSBgJHtwcmVmaXh9XFxuYDtcclxuICAgICAgLy8gXHU1NzI4IEhUTUwgXHU2ODA3XHU3QjdFXHU0RTBFXHU2QjYzXHU2NTg3XHU0RTRCXHU5NUY0XHU2Q0U4XHU1MTY1XHU3QTdBXHU4ODRDXHVGRjBDXHU1RjNBXHU1MjM2IE1hcmtkb3duIFx1NUYxNVx1NjRDRVx1NUI4Q1x1NjU3NFx1ODlFM1x1Njc5MFx1NTE4NVx1OTBFOFx1NzY4NFx1NTIxN1x1ODg2OFx1NTQ4Q1x1NEVFM1x1NzgwMVx1NTc1N1x1RkYwMVxyXG4gICAgICByZXR1cm4gYCR7Ymxhbmt9JHtwcmVmaXh9PFNwb2lsZXIgbW9kZT1cImJsb2NrXCI+XFxuJHtibGFua30ke2NvbnRlbnR9JHtibGFua30ke3ByZWZpeH08L1Nwb2lsZXI+XFxuJHtibGFua31gO1xyXG4gICAgfSk7XHJcblxyXG5cdFx0Ly8gXHVEODNEXHVEQ0REIDMuIFx1NTMzOVx1OTE0RFx1ODg0Q1x1NTE4NSBTcG9pbGVyXHJcblx0XHR0ZW1wU3JjID0gdGVtcFNyYy5yZXBsYWNlKC9cXHxcXHwoW1xcc1xcU10qPylcXHxcXHwvZywgKG1hdGNoOiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZykgPT4ge1xyXG4gICAgICAvLyBcdUQ4M0RcdURDQTEgXHU2ODM4XHU1RkMzXHU5RUQxXHU5QjU0XHU2Q0Q1XHVGRjFBXHU1NzI4XHU1RjAwXHU1OTM0XHU1RjNBXHU4ODRDXHU1ODVFXHU1MTY1XHU0RTAwXHU0RTJBIEhUTUwgXHU5NkY2XHU1QkJEXHU3QTdBXHU3NjdEXHU1QjU3XHU3QjI2ICYjODIwMztcclxuICAgICAgLy8gXHU1RjdCXHU1RTk1XHU3ODM0XHU1NzRGIE1hcmtkb3duLWl0IFx1NUMwNlx1NTE3Nlx1OEJFRlx1NTIyNFx1NEUzQSBcIkhUTUxcdTRFRTNcdTc4MDFcdTU3NTdcIiBcdTc2ODRcdTg5QzRcdTUyMTlcdUZGMENcdTVGM0FcdTUyMzZcdTVGMDBcdTU0MkZcdTUxODVcdTkwRTggTWFya2Rvd24gXHU4OUUzXHU2NzkwXHVGRjAxXHJcblx0XHRcdHJldHVybiBgJiM4MjAzOzxTcG9pbGVyIG1vZGU9XCJpbmxpbmVcIj4ke2NvbnRlbnR9PC9TcG9pbGVyPmA7XHJcblx0XHR9KVxyXG5cclxuXHRcdC8vIFx1RDgzRFx1REQwNCA0LiBcdTVDMDZcdTRGRERcdTYyQTRcdTU5N0RcdTc2ODRcdTRFRTNcdTc4MDFcdTU3NTdcdTU0OENcdTUxNkNcdTVGMEZcdTVCOENcdTdGOEVcdThGRDhcdTUzOUZcdTU2REVcdTUzQkJcclxuXHRcdHN0YXRlLnNyYyA9IHRlbXBTcmMucmVwbGFjZSgvXFx4MDEoXFxkKylcXHgwMi9nLCAobWF0Y2g6IHN0cmluZywgaW5kZXg6IHN0cmluZykgPT4ge1xyXG5cdFx0XHRyZXR1cm4gc3RvcmVbcGFyc2VJbnQoaW5kZXgsIDEwKV1cclxuXHRcdH0pXHJcblx0fSlcclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkU6XFxcXGdpdGh1YlxcXFxteS1ub3Rlc1xcXFxkb2NzXFxcXC52aXRlcHJlc3NcXFxccGx1Z2luc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcZ2l0aHViXFxcXG15LW5vdGVzXFxcXGRvY3NcXFxcLnZpdGVwcmVzc1xcXFxwbHVnaW5zXFxcXG1hcmtkb3duLWltYWdlLWNhcHRpb24ubXRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi9naXRodWIvbXktbm90ZXMvZG9jcy8udml0ZXByZXNzL3BsdWdpbnMvbWFya2Rvd24taW1hZ2UtY2FwdGlvbi5tdHNcIjsvLyBkb2NzLy52aXRlcHJlc3MvcGx1Z2lucy9tYXJrZG93bi1pbWFnZS1jYXB0aW9uLm10c1xyXG5cclxuZXhwb3J0IGNvbnN0IGltYWdlQ2FwdGlvblBsdWdpbiA9IChtZDogYW55KSA9PiB7XHJcblx0Ly8gXHVEODNEXHVEQ0ExIDEuIFx1NjgzOFx1NUZDM1x1NEZFRVx1NTkwRFx1RkYxQVx1NkNFOFx1NTE2NVx1NUU5NVx1NUM0Mlx1ODlDNFx1NTIxOVx1RkYwQ1x1NjJFNlx1NjIyQVx1NUU3Nlx1NjZGRlx1NjM2Mlx1OTc1RVx1NkNENVx1NzY4NCA8cD4gXHU2ODA3XHU3QjdFXHJcblx0bWQuY29yZS5ydWxlci5wdXNoKCdyZXBsYWNlX3Bfd2l0aF9kaXZfZm9yX2ZpZ3VyZScsIChzdGF0ZTogYW55KSA9PiB7XHJcblx0XHQvLyBcdTkwNERcdTUzODZcdTYyNDBcdTY3MDlcdTg5RTNcdTY3OTBcdTc1MUZcdTYyMTBcdTc2ODQgdG9rZW4gXHU4MjgyXHU3MEI5XHJcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHN0YXRlLnRva2Vucy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRjb25zdCB0b2tlbiA9IHN0YXRlLnRva2Vuc1tpXVxyXG5cclxuXHRcdFx0Ly8gXHU2MjdFXHU1MjMwXHU0RTAwXHU0RTJBXHU2QkI1XHU4NDNEXHU3Njg0XHU1RjAwXHU1OTM0XHU4MjgyXHU3MEI5IChwYXJhZ3JhcGhfb3BlbilcclxuXHRcdFx0aWYgKHRva2VuLnR5cGUgPT09ICdwYXJhZ3JhcGhfb3BlbicpIHtcclxuXHRcdFx0XHRjb25zdCBpbmxpbmVUb2tlbiA9IHN0YXRlLnRva2Vuc1tpICsgMV1cclxuXHJcblx0XHRcdFx0Ly8gXHU2OEMwXHU2N0U1XHU4RkQ5XHU0RTJBXHU2QkI1XHU4NDNEXHU1MTg1XHU5MEU4XHU2NjJGXHU1NDI2XHU1MzA1XHU1NDJCIGltYWdlIChcdTU2RkVcdTcyNDcpXHJcblx0XHRcdFx0Y29uc3QgaGFzSW1hZ2UgPSBpbmxpbmVUb2tlbi5jaGlsZHJlbj8uc29tZSgoY2hpbGQ6IGFueSkgPT4gY2hpbGQudHlwZSA9PT0gJ2ltYWdlJylcclxuXHJcblx0XHRcdFx0aWYgKGhhc0ltYWdlKSB7XHJcblx0XHRcdFx0XHQvLyBcdTU5ODJcdTY3OUNcdTUzMDVcdTU0MkJcdTU2RkVcdTcyNDdcdUZGMENcdTVDMDZcdTVGMDBcdTU5MzRcdTc2ODQgPHA+IFx1NUYzQVx1NTIzNlx1NjUzOVx1NEUzQSA8ZGl2PlxyXG5cdFx0XHRcdFx0dG9rZW4udGFnID0gJ2RpdidcclxuXHRcdFx0XHRcdC8vIFx1OTg3QVx1NjI0Qlx1NTJBMFx1NEUyQVx1NEUxM1x1NUM1RSBjbGFzc1x1RkYwQ1x1NEUwRFx1NEVDNVx1ODlDNFx1ODMwM1x1RkYwQ1x1OEZEOFx1NjVCOVx1NEZCRlx1NEY2MFx1NjcyQVx1Njc2NVx1NTcyOCBDU1MgXHU5MUNDXHU2M0E3XHU1MjM2XHU1OTE2XHU1QzQyXHU4RkI5XHU4REREXHJcblx0XHRcdFx0XHR0b2tlbi5hdHRySm9pbignY2xhc3MnLCAnY3VzdG9tLWltYWdlLXdyYXBwZXInKVxyXG5cclxuXHRcdFx0XHRcdC8vIFx1NjI3RVx1NTIzMFx1NUJGOVx1NUU5NFx1NzY4NFx1NkJCNVx1ODQzRFx1N0VEM1x1NUMzRVx1ODI4Mlx1NzBCOSAocGFyYWdyYXBoX2Nsb3NlKVx1RkYwQ1x1NEU1Rlx1NUMwNiA8L3A+IFx1NjUzOVx1NEUzQSA8L2Rpdj5cclxuXHRcdFx0XHRcdGNvbnN0IGNsb3NlVG9rZW4gPSBzdGF0ZS50b2tlbnNbaSArIDJdXHJcblx0XHRcdFx0XHRpZiAoY2xvc2VUb2tlbiAmJiBjbG9zZVRva2VuLnR5cGUgPT09ICdwYXJhZ3JhcGhfY2xvc2UnKSB7XHJcblx0XHRcdFx0XHRcdGNsb3NlVG9rZW4udGFnID0gJ2RpdidcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9KVxyXG5cclxuXHQvLyBcdUQ4M0RcdURDRjggMi4gXHU1MzlGXHU2NzJDXHU3Njg0XHU1NkZFXHU3MjQ3XHU1MkFCXHU2MzAxXHU2RTMyXHU2N0QzXHU5MDNCXHU4RjkxXHVGRjA4XHU0RkREXHU2MzAxXHU0RTBEXHU1M0Q4XHVGRjA5XHJcblx0bWQucmVuZGVyZXIucnVsZXMuaW1hZ2UgPSAodG9rZW5zOiBhbnksIGlkeDogbnVtYmVyLCBvcHRpb25zOiBhbnksIGVudjogYW55LCBzZWxmOiBhbnkpID0+IHtcclxuXHRcdGNvbnN0IHRva2VuID0gdG9rZW5zW2lkeF1cclxuXHRcdGxldCBzcmMgPSB0b2tlbi5hdHRyR2V0KCdzcmMnKSB8fCAnJ1xyXG5cclxuXHRcdC8vIFx1NEZFRVx1NTkwRCBWaXRlIFx1OERFRlx1NUY4NFx1NUYzQVx1NjgyMVx1OUE4Q1x1NjJFNlx1NjIyQVxyXG5cdFx0aWYgKHNyYyAmJiAhL14oaHR0cHM/OnxcXC98XFwuXFwvfFxcLlxcLlxcLykvLnRlc3Qoc3JjKSkge1xyXG5cdFx0XHRzcmMgPSAnLi8nICsgc3JjXHJcblx0XHR9XHJcblxyXG5cdFx0bGV0IGFsdCA9IHRva2VuLmNvbnRlbnQgfHwgJydcclxuXHJcblx0XHRpZiAoIWFsdCkge1xyXG5cdFx0XHQvLyBcdTYzRDBcdTUzRDZcdTVFNzZcdTg5RTNcdTc4MDFcdTY1ODdcdTRFRjZcdTU0MERcclxuXHRcdFx0bGV0IGZpbGVuYW1lID0gc3JjLnNwbGl0KCcvJykucG9wKCkgfHwgJydcclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRmaWxlbmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudChmaWxlbmFtZSlcclxuXHRcdFx0fSBjYXRjaCAoZSkge1xyXG5cdFx0XHRcdGNvbnNvbGUud2FybignXHU1NkZFXHU3MjQ3XHU4REVGXHU1Rjg0XHU4OUUzXHU3ODAxXHU1OTMxXHU4RDI1OicsIGZpbGVuYW1lKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBcdTUyNjVcdTc5QkJcdTU0MEVcdTdGMDBcdTRFMEVcdTY1RTVcdTY3MUZcdTUyNERcdTdGMDBcclxuXHRcdFx0ZmlsZW5hbWUgPSBmaWxlbmFtZS5yZXBsYWNlKC9cXC4oZHJhd2lvXFwuc3ZnfHN2Z3xwbmd8anBnfGpwZWd8Z2lmfHdlYnApJC9pLCAnJylcclxuXHRcdFx0YWx0ID0gZmlsZW5hbWUucmVwbGFjZSgvXlxcZHs0fS1cXGR7Mn0tXFxkezJ9LS4qPy0vLCAnJylcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gYFxyXG4gICAgICA8ZmlndXJlIGNsYXNzPVwiY3VzdG9tLWltYWdlLWZpZ3VyZVwiPlxyXG4gICAgICAgIDxpbWcgc3JjPVwiJHtzcmN9XCIgYWx0PVwiJHthbHR9XCI+XHJcbiAgICAgICAgPGZpZ2NhcHRpb24gY2xhc3M9XCJpbWFnZS1jYXB0aW9uXCI+JHthbHR9PC9maWdjYXB0aW9uPlxyXG4gICAgICA8L2ZpZ3VyZT5cclxuICAgIGBcclxuXHR9XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxnaXRodWJcXFxcbXktbm90ZXNcXFxcZG9jc1xcXFwudml0ZXByZXNzXFxcXHBsdWdpbnNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXGdpdGh1YlxcXFxteS1ub3Rlc1xcXFxkb2NzXFxcXC52aXRlcHJlc3NcXFxccGx1Z2luc1xcXFxtYXJrZG93bi1jb2RlLXRvb2wubXRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi9naXRodWIvbXktbm90ZXMvZG9jcy8udml0ZXByZXNzL3BsdWdpbnMvbWFya2Rvd24tY29kZS10b29sLm10c1wiOy8vIGRvY3MvLnZpdGVwcmVzcy9wbHVnaW5zL21hcmtkb3duLWNvZGUtdG9vbC5tdHNcclxuXHJcbmNvbnN0IExJTkVfQ09VTlRfVEhSRVNIT0xEID0gNyAvLyBcdThEODVcdThGQzdcdTU5MUFcdTVDMTFcdTg4NENcdTc2ODRcdTRFRTNcdTc4MDFcdTU3NTdcdTYyNERcdTRGMUFcdTYyOThcdTUzRTBcclxuXHJcbmV4cG9ydCBjb25zdCBjb2RlVG9vbFBsdWdpbiA9IChtZDogYW55KSA9PiB7XHJcblx0Ly8gXHU0RkREXHU1QjU4IFZpdGVQcmVzcyBcdTlFRDhcdThCQTRcdTc2ODRcdTRFRTNcdTc4MDFcdTU3NTdcdTZFMzJcdTY3RDNcdTkwM0JcdThGOTFcclxuXHRjb25zdCBkZWZhdWx0RmVuY2UgPSBtZC5yZW5kZXJlci5ydWxlcy5mZW5jZVxyXG5cclxuXHRtZC5yZW5kZXJlci5ydWxlcy5mZW5jZSA9ICh0b2tlbnM6IGFueSwgaWR4OiBudW1iZXIsIG9wdGlvbnM6IGFueSwgZW52OiBhbnksIHNlbGY6IGFueSkgPT4ge1xyXG5cdFx0Ly8gMS4gXHU4M0I3XHU1M0Q2XHU1N0ZBXHU3ODQwXHU0RkUxXHU2MDZGXHJcblx0XHRjb25zdCB0b2tlbiA9IHRva2Vuc1tpZHhdXHJcblx0XHRjb25zdCByYXdDb2RlID0gdG9rZW4uY29udGVudFxyXG5cdFx0Y29uc3QgbGluZUNvdW50ID0gcmF3Q29kZS5zcGxpdCgnXFxuJykubGVuZ3RoXHJcblx0XHRjb25zdCBsYW5nID0gdG9rZW4uaW5mby50cmltKCkgLy8gXHU4M0I3XHU1M0Q2XHU0RUUzXHU3ODAxXHU4QkVEXHU4QTAwXHVGRjA4XHU1OTgyXHU2NzlDXHU2NzJBXHU2NzY1XHU5NzAwXHU4OTgxXHU5NDg4XHU1QkY5IEphdmEgXHU2MjE2IFB5dGhvbiBcdTUwNUFcdTcyNzlcdTVCOUFcdTYzMDlcdTk0QUVcdUZGMENcdTUzRUZcdTRFRTVcdTc1NTlcdTc1MjhcdUZGMDlcclxuXHJcblx0XHQvLyAyLiBcdTgzQjdcdTUzRDZcdTUzOUZcdTc1MUZcdTZFMzJcdTY3RDNcdTc2ODQgSFRNTCAoXHU1RTI2XHU2NzA5IFZpdGVQcmVzcyBcdTlFRDhcdThCQTRcdTlBRDhcdTRFQUVcdTc2ODRcdTdFRDNcdTY3ODQpXHJcblx0XHRjb25zdCByZW5kZXJlZEh0bWwgPSBkZWZhdWx0RmVuY2UodG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiwgc2VsZilcclxuXHJcblx0XHQvLyAzLiBcdTY3ODRcdTVFRkFcdTUyOUZcdTgwRkRcdTdFQzRcdTRFRjZcdTY4MDggKFx1OTg4NFx1NzU1OVx1NjcyQVx1Njc2NVx1NjI2OVx1NUM1NVx1NEY0RClcclxuXHRcdGxldCB0b29sc0h0bWwgPSAnJ1xyXG5cdFx0bGV0IHdyYXBwZXJDbGFzc2VzID0gWydjdXN0b20tY29kZS13cmFwcGVyJ11cclxuXHJcblx0XHQvLyAtLS0gXHU1MjlGXHU4MEZEXHU2QTIxXHU1NzU3IEFcdUZGMUFcdTk1N0ZcdTRFRTNcdTc4MDFcdTYyOThcdTUzRTAgLS0tXHJcblx0XHRpZiAobGluZUNvdW50ID4gTElORV9DT1VOVF9USFJFU0hPTEQpIHtcclxuXHRcdFx0d3JhcHBlckNsYXNzZXMucHVzaCgnY29sbGFwc2VkJylcclxuXHRcdFx0dG9vbHNIdG1sICs9IGBcclxuICAgICAgICA8ZGl2IGNsYXNzPVwiY29kZS1mb2xkLW1hc2tcIj48L2Rpdj5cclxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwiY29kZS10b29sLWJ0biBmb2xkLWJ0blwiIGRhdGEtbGluZXM9XCIke2xpbmVDb3VudH1cIj5cdUQ4M0RcdURDNDcgXHU1QzU1XHU1RjAwXHU2MjQwXHU2NzA5ICR7bGluZUNvdW50fSBcdTg4NENcdTRFRTNcdTc4MDE8L2J1dHRvbj5cclxuICAgICAgYFxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIC0tLSBcdTUyOUZcdTgwRkRcdTZBMjFcdTU3NTcgQlx1RkYxQVx1OTg4NFx1NzU1OVx1NTE3Nlx1NEVENlx1NTI5Rlx1ODBGRCAoXHU1OTgyXHU4RkQwXHU4ODRDXHU2MzA5XHU5NEFFXHU3QjQ5KSAtLS1cclxuXHRcdC8vIGlmIChsYW5nID09PSAnamF2YScpIHsgLi4uIH1cclxuXHJcblx0XHQvLyA0LiBcdTUzRUFcdTY3MDlcdTVGNTNcdTc4NkVcdTVCOUVcdTZDRThcdTUxNjVcdTRFODZcdTY1QjBcdTUyOUZcdTgwRkRcdTY1RjZcdUZGMENcdTYyNERcdTUwNUFcdTU5MTZcdTVDNDJcdTUzMDVcdTg4RjlcdUZGMENcdTU0MjZcdTUyMTlcdThGRDRcdTU2REVcdTdFQUZcdTUxQzBcdTc2ODRcdTUzOUZcdTc1MUZcdTdFRDNcdTY3ODRcclxuXHRcdGlmICh0b29sc0h0bWwpIHtcclxuXHRcdFx0cmV0dXJuIGBcclxuICAgICAgICA8ZGl2IGNsYXNzPVwiJHt3cmFwcGVyQ2xhc3Nlcy5qb2luKCcgJyl9XCI+XHJcbiAgICAgICAgICAke3JlbmRlcmVkSHRtbH1cclxuICAgICAgICAgICR7dG9vbHNIdG1sfVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICBgXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHJlbmRlcmVkSHRtbFxyXG5cdH1cclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsU0FBUyxpQkFBQUEsZ0JBQWUsT0FBQUMsWUFBVzs7O0FDRG5DLE9BQU8sZ0JBQWdCO0FBR2hCLElBQU0sY0FBYztBQUFBLEVBQzFCLFdBQVc7QUFBQTtBQUFBLElBRVYsTUFBTSxDQUFDLHdDQUF3QyxtQ0FBbUM7QUFBQTtBQUFBLElBRWxGLFNBQVMsQ0FBQyxVQUFVLGNBQWMsT0FBTztBQUFBO0FBQUEsSUFFekMsS0FBSztBQUFBLEVBQ04sQ0FBQztBQUFBO0FBR0Y7OztBQ2JBLFNBQVMsdUJBQXVCOzs7QUNEaEMsT0FBTyxRQUFRO0FBQ2YsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sZ0JBQWdCO0FBUWhCLFNBQVMsUUFBUSxTQUFTLFdBQVcsQ0FBQyxHQUFHLEdBQUc7QUFFakQsTUFBSSxDQUFDLEdBQUcsV0FB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
