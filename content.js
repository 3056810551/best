// 创建一个专属的 <style> 标签用来覆盖样式
let styleTag = document.getElementById("custom-subtitle-style");
if (!styleTag) {
  styleTag = document.createElement("style");
  styleTag.id = "custom-subtitle-style";
  document.head.appendChild(styleTag);
}

// 拦截视频 ended 事件，阻止站点自动切换下一条
// 在捕获阶段处理，优先于页面自身监听器

document.addEventListener(
  "ended",
  (event) => {
    if (event.target && event.target.tagName.toUpperCase() === "VIDEO") {
      event.stopImmediatePropagation();
      event.target.currentTime = 0;
      event.target.play();

      console.log(
        "PlayPhrase Looper: 视频已重置并循环播放，已拦截自动下一条。",
      );
    }
  },
  true,
);

// 应用样式的函数
function applyStyles(mainSize, transSize, headerVisible) {
  styleTag.innerHTML = `
    header {
      display: ${headerVisible ? "flex" : "none"} !important;
    }
    /* --- 1. 英文主字幕区域 --- */
    .karaoke-page-content { 
      /* 【阴影修复核心】将原本的 inline 强制改为 inline-block，把多行字幕打包成一个完整的盒子 */
      display: inline-block !important;
      
      /* 你自定义的阴影和圆角效果（使用 em 让圆角跟随字体缩放） */
      box-shadow: rgba(0, 0, 0, 0.55) 0px 0px 14px !important;
      border-radius: 0.35em !important;
      
      /* 字体大小及等比例背景框 (之前写好的) */
      font-size: ${mainSize}rem !important; 
      padding: 0.6em 0.4em 0.4em 0.4em !important; 
      margin-bottom: 0.3em !important;
      line-height: 1.4 !important;
      min-height: auto !important;

      /* 防止句子太长贴到屏幕边缘，保持居中 */
      max-width: 99% !important; 
      margin-left: auto !important;
      margin-right: auto !important;
    }
    
    .karaoke-page-content * { 
      font-size: ${mainSize}rem !important; 
    }
    
    /* 清除原本行内元素的文字阴影，防止和外框阴影打架（根据你提供的 HTML 结构） */
    .karaoke-page-content .s-word { 
      text-shadow: none !important;
      padding: 0 0.15em !important; 
      word-spacing: -0.1em !important;
      line-height: inherit !important;
    }

    /* --- 2. 中文翻译区域 --- */
    .translate {
      font-size: ${transSize}rem !important;
      color: #ffffff !important;
    }

    .translate-text { 
      font-size: ${transSize}rem !important; 
      line-height: 1.4 !important;
      padding: 0.3em 0 !important;
    }

    /* --- 3. 复制按钮等比例缩放 --- */
    .copy-button {
      width: auto !important;
      height: auto !important;
      padding: 0 0.2em !important;
    }
    
    .copy-button i {
      font-size: 0.8em !important; 
      line-height: 1 !important;
      height: auto !important;
    }

    /* --- 侧边栏与新按钮样式 (新增) --- */
    #custom-word-sidebar {
      position: fixed;
      top: 0;
      right: -550px; /* 默认隐藏在屏幕外 */
      width: 520px;
      height: 100vh;
      background: rgba(20, 20, 20, 0.85);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 999999;
      transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      box-shadow: -10px 0 30px rgba(0,0,0,0.5);
      color: white;
      font-family: sans-serif;
    }
    #custom-word-sidebar.show {
      right: 0; /* 滑出 */
    }
    .sidebar-header {
      padding: 20px;
      font-size: 1.2rem;
      font-weight: bold;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .sidebar-close-btn {
      cursor: pointer;
      opacity: 0.6;
    }
    .sidebar-close-btn:hover { opacity: 1; color: #ff453a; }
    .sidebar-word-list {
      list-style: none;
      padding: 10px 0;
      margin: 0;
      overflow-y: auto;
      flex: 1;
    }
    .sidebar-word-list li {
      padding: 12px 20px;
      cursor: pointer;
      border-bottom: 1px solid rgba(255,255,255,0.03);
      transition: background 0.2s;
    }
    .sidebar-word-list li:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #64b5f6;
    }

    /* 本次新增：当前播放单词的高亮样式 */
    .sidebar-word-list li.active-word {
      background: rgba(100, 181, 246, 0.2);
      color: #90caf9;
      font-weight: bold;
      border-left: 4px solid #64b5f6;
    }

    /**===================**/
    /* --- 侧边栏与新按钮样式 --- */
    #custom-word-sidebar {
      position: fixed; top: 0; right: -350px; width: 320px; height: 100vh;
      background: rgba(20, 20, 20, 0.85); backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      border-left: 1px solid rgba(255, 255, 255, 0.1); z-index: 999999;
      transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex; flex-direction: column; box-shadow: -10px 0 30px rgba(0,0,0,0.5);
      color: white; font-family: sans-serif;
    }
    #custom-word-sidebar.show { right: 0; }
    .sidebar-header { padding: 20px; font-size: 1.2rem; font-weight: bold; border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between; align-items: center; }
    .sidebar-close-btn { cursor: pointer; opacity: 0.6; }
    .sidebar-close-btn:hover { opacity: 1; color: #ff453a; }
    .sidebar-word-list { list-style: none; padding: 0; margin: 0; overflow-y: auto; flex: 1; scroll-behavior: smooth; }

    /* 本次新增/修改：单元标题与具体单词的区分样式 */
    
    /* 1. 单元标题 (Unit 1, Unit 2) */
    .sidebar-word-list .unit-header {
      padding: 10px 20px;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 255);
      background: rgba(0, 0, 0, 1);
      text-transform: uppercase;
      letter-spacing: 1px;
      position: sticky; /* 滑动时标题会自动吸顶，体验极佳 */
      top: 0;
      z-index: 10;
      cursor: default; /* 鼠标变成普通指针，表示不可点击 */
    }

    /* 2. 具体单词 (可点击) */
    .sidebar-word-list li.word-item { 
      padding: 12px 20px 12px 30px; /* 左边距加大一点，形成层级感 */
      cursor: pointer; 
      border-bottom: 1px solid rgba(255,255,255,0.03); 
      transition: all 0.2s; 
    }
    .sidebar-word-list li.word-item:hover { 
      background: rgba(255, 255, 255, 0.1); 
      color: #64b5f6; 
    }
    
    /* 3. 当前播放单词的高亮样式 */
    .sidebar-word-list li.word-item.active-word {
      background: rgba(100, 181, 246, 0.2);
      color: #90caf9;
      font-weight: bold;
      border-left: 4px solid #64b5f6;
      padding-left: 26px; /* 因为加了 4px 边框，减去对应的 padding 保持文字对齐 */
    }
  `;
}

chrome.storage.sync.get(
  { mainSize: "1.875", transSize: "1.5", headerVisible: false },
  (data) => {
    applyStyles(data.mainSize, data.transSize, Boolean(data.headerVisible));
  },
);

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "updateStyles") {
    applyStyles(
      request.mainSize,
      request.transSize,
      typeof request.headerVisible === "boolean"
        ? request.headerVisible
        : false,
    );
  }
});

// ==========================================
// 2. 注入单词侧边栏与工具栏图标 (本次新增核心)
// ==========================================

// 从图片中提取的单词库（你可以随时在这里增删单词）
const wordData = [
  {
    title: "Unit 1",
    words: [
      "radiate",
      "radiant",
      "radical",
      "object",
      "objective",
      "objection",
      "obligation",
      "oblige",
      "obscure",
      "observation",
      "observe",
      "obsession",
      "obsolete",
      "obtain",
      "obvious",
      "ideal",
      "ideology",
      "identical",
      "identification",
      "identify",
      "identity",
      "journal",
      "journalist",
      "journey",
      "judge",
      "judg(e)ment",
      "judicial",
      "jury",
      "jurisdiction",
      "justice",
      "justify",
      "label",
      "lag",
      "largely",
      "lateral",
      "latter",
      "law",
      "lawsuit",
      "magnitude",
      "magnify",
      "magnificent",
      "maintain",
      "maintenance",
      "major",
      "majority",
      "make",
      "theme",
      "theory",
      "theoretical",
      "therapy",
      "qualification",
      "qualify",
      "quality",
      "qualitative",
      "safeguard",
      "safety",
      "savage",
      "save",
      "saving",
      "scale",
      "scene",
      "scenery",
      "pace",
      "panel",
      "panorama",
      "prove",
      "provide",
      "provided",
    ],
  },
  {
    title: "Unit 2",
    words: [
      "mediate",
      "meditation",
      "medium",
      "media",
      "elaborate",
      "elegant",
      "element",
      "elementary",
      "eliminate",
      "abolish",
      "absence",
      "absent",
      "abroad",
      "absolute",
      "absorb",
      "abstract",
      "ban",
      "bar",
      "bare",
      "barely",
      "bargain",
      "capable",
      "capacity",
      "capital",
      "captive",
      "capture",
      "career",
      "careful",
      "case",
      "cast",
      "casual",
      "casualty",
      "catch",
      "category",
      "cater",
      "cause",
      "caution",
      "cautious",
      "cease",
      "celebrate",
      "celebrity",
      "ceremony",
      "certain",
      "certainty",
      "certificate",
      "certify",
      "decline",
      "decrease",
      "decree",
      "deem",
      "dedicate",
      "deduce",
      "deduct",
      "fashion",
      "fashionable",
      "favo(u)r",
      "favo(u)rable",
      "favo(u)rite",
      "sit",
      "site",
      "situate",
      "situation",
      "skeleton",
      "skeptical",
      "sketch",
    ],
  },
  {
    title: "Unit 3",
    words: [
      "embrace",
      "embed",
      "embody",
      "embryo",
      "elicit",
      "elite",
      "elsewhere",
      "thirst",
      "thorough",
      "though",
      "thought",
      "thoughtful",
      "threat",
      "threaten",
      "update",
      "upgrade",
      "uphold",
      "upset",
      "up-to-date",
      "ventilate",
      "venture",
      "widespread",
      "win",
      "wit",
      "withdraw",
      "witness",
      "inaugurate",
      "incentive",
      "incidence",
      "incident",
      "incidentally",
      "incline",
      "academic",
      "academy",
      "accelerate",
      "accept",
      "acceptance",
      "access",
      "accessory",
      "begin",
      "beginning",
      "behalf",
      "behave",
      "behavio(u)r",
      "belief",
      "believe",
      "belong",
      "beneficial",
      "benefit",
      "benevolent",
      "benign",
      "challenge",
      "chance",
      "change",
      "channel",
      "character",
      "characterise",
      "characteristic",
      "defend",
      "define",
      "definite",
      "definition",
      "defy",
      "degree",
      "delay",
      "deliberate",
      "delicate",
      "deliver",
      "delivery",
      "fiction",
      "field",
      "fierce",
      "fight",
      "figure",
      "finance",
      "financial",
      "finding",
      "finite",
      "firm",
      "first",
      "fit",
      "global",
      "globe",
    ],
  },
  {
    title: "Unit 4",
    words: [
      "abandon",
      "abide",
      "ability",
      "able",
      "abnormal",
      "background",
      "balance",
      "base",
      "basement",
      "basic",
      "basis",
      "calculate",
      "call",
      "calm",
      "campaign",
      "candidate",
      "data",
      "database",
      "date",
      "dazzle",
      "deal",
      "dealer",
      "debate",
      "decade",
      "decide",
      "decision",
      "decisive",
      "decorate",
      "economic",
      "economical",
      "economics",
      "economy",
      "educate",
      "education",
      "effect",
      "effective",
      "efficient",
      "efficiency",
      "effort",
      "fabric",
      "fabricate",
      "face",
      "facet",
      "factor",
      "fade",
      "fail",
      "failure",
      "fair",
      "fairly",
      "fall",
      "fan",
      "fancy",
      "fascinate",
      "gain",
      "gamble",
      "gap",
      "gene",
      "general",
      "generalize",
      "habit",
      "habitat",
      "hamper",
      "handicap",
      "shield",
      "shift",
      "shoulder",
      "show",
      "shower",
    ],
  },
  {
    title: "Unit 5",
    words: [
      "glamo(u)r",
      "generate",
      "generation",
      "generator",
      "generous",
      "genius",
      "gift",
      "genre",
      "giant",
      "gigantic",
      "give",
      "happen",
      "harm",
      "harmony",
      "harsh",
      "ignorance",
      "ignorant",
      "ignore",
      "ill",
      "illness",
      "illusion",
      "illustrate",
      "illustration",
      "image",
      "imagine",
      "imaginary",
      "imagination",
      "imaginative",
      "imitate",
      "imitation",
      "lead",
      "leadership",
      "leading",
      "legal",
      "legislation",
      "legitimate",
      "leisure",
      "level",
      "lever",
      "levy",
      "manage",
      "management",
      "mandate",
      "manifest",
      "manipulate",
      "manner",
      "margin",
      "marginal",
      "mass",
      "massive",
      "massacre",
      "occupation",
      "occupy",
      "occur",
      "occurrence",
      "offend",
      "offer",
      "offset",
      "offspring",
      "paragraph",
      "paralyse",
      "parallel",
      "part",
      "partial",
      "participant",
      "participate",
      "particle",
      "particular",
      "partly",
      "partner",
      "passion",
      "passive",
      "quick",
      "quit",
      "quest",
      "questionnaire",
      "quote",
      "span",
      "spare",
      "schedule",
      "scheme",
      "science",
      "scientific",
      "scientist",
    ],
  },
];

// 从 URL 中提取当前的单词
function getCurrentWordFromHash() {
  const match = window.location.hash.match(/q=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// 同步侧边栏状态并记忆单词
function syncSidebarWithURL() {
  const currentWord = getCurrentWordFromHash();
  if (!currentWord) return;

  localStorage.setItem("playphrase_last_word", currentWord);

  // 移除所有单词的高亮
  const listItems = document.querySelectorAll(
    ".sidebar-word-list li.word-item",
  );
  listItems.forEach((li) => li.classList.remove("active-word"));

  // 找到对应的单词并高亮 + 滚动定位
  const activeLi = document.querySelector(
    `.sidebar-word-list li.word-item[data-word="${currentWord}"]`,
  );
  if (activeLi) {
    activeLi.classList.add("active-word");
    activeLi.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// 页面加载时的记忆恢复机制
function restoreLastWord() {
  const lastWord = localStorage.getItem("playphrase_last_word");
  const currentHash = window.location.hash;

  if (lastWord && (!currentHash || !currentHash.includes("q="))) {
    window.location.hash = `/search?q=${lastWord}&language=en`;
  }
}

// 创建侧边栏
function createSidebar() {
  if (document.getElementById("custom-word-sidebar")) return;

  const sidebar = document.createElement("div");
  sidebar.id = "custom-word-sidebar";

  // 动态生成包含单元标题和单词的 HTML 结构
  let wordsHtml = "";
  wordData.forEach((group) => {
    // 插入不可点击的单元标题
    wordsHtml += `<li class="unit-header">${group.title}</li>`;
    // 插入可点击的具体单词
    group.words.forEach((word) => {
      wordsHtml += `<li class="word-item" data-word="${word}">${word}</li>`;
    });
  });

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <span>单词本 (词汇表)</span>
      <span class="material-symbols-outlined sidebar-close-btn" id="sidebar-close">close</span>
    </div>
    <ul class="sidebar-word-list" id="sidebar-word-list">
      ${wordsHtml}
    </ul>
  `;
  document.body.appendChild(sidebar);

  document.getElementById("sidebar-close").addEventListener("click", () => {
    sidebar.classList.remove("show");
  });

  // 【核心修改】事件委托：严格判断点击的是不是单词
  document
    .getElementById("sidebar-word-list")
    .addEventListener("click", (e) => {
      // 使用 closest 确保我们点到的是带有 word-item 类的 <li>
      const targetLi = e.target.closest("li.word-item");

      if (targetLi) {
        const targetWord = targetLi.getAttribute("data-word");
        window.location.hash = `/search?q=${targetWord}&language=en`;

        setTimeout(() => {
          const searchInput =
            document.querySelector("input[type='text']") ||
            document.querySelector("input");
          if (searchInput) {
            searchInput.focus();
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              "value",
            ).set;
            nativeInputValueSetter.call(searchInput, targetWord);
            searchInput.dispatchEvent(new Event("input", { bubbles: true }));
            searchInput.dispatchEvent(new Event("change", { bubbles: true }));

            const enterConfig = {
              key: "Enter",
              code: "Enter",
              keyCode: 13,
              which: 13,
              bubbles: true,
              cancelable: true,
            };
            searchInput.dispatchEvent(
              new KeyboardEvent("keydown", enterConfig),
            );
            searchInput.dispatchEvent(
              new KeyboardEvent("keypress", enterConfig),
            );
            searchInput.dispatchEvent(new KeyboardEvent("keyup", enterConfig));

            const form = searchInput.closest("form");
            if (form)
              form.dispatchEvent(
                new Event("submit", { bubbles: true, cancelable: true }),
              );
            searchInput.blur();
          }
        }, 100);

        document.getElementById("custom-word-sidebar").classList.remove("show");
      }
    });

  syncSidebarWithURL();
}

function injectToolbarButton() {
  if (document.getElementById("custom-sidebar-btn")) return;

  const settingsIconContainer = document.querySelector(
    '.filter-input-icon[aria-label="Settings"]',
  );
  if (!settingsIconContainer) return;
  const settingsLi = settingsIconContainer.closest("li");
  if (!settingsLi) return;

  const newLi = document.createElement("li");
  newLi.className = "input-button";
  newLi.id = "custom-sidebar-btn";
  newLi.innerHTML = `
    <div role="button" tabindex="0" class="filter-input-icon" aria-label="Open Word List">
      <i class="material-symbols-outlined" style="color: #64b5f6;">format_list_bulleted</i>
    </div>
  `;
  settingsLi.parentNode.insertBefore(newLi, settingsLi);

  newLi.addEventListener("click", () => {
    const sidebar = document.getElementById("custom-word-sidebar");
    if (sidebar) {
      sidebar.classList.toggle("show");
      if (sidebar.classList.contains("show")) {
        syncSidebarWithURL();
      }
    }
  });
}

// ==========================================
// 3. 动态监视 DOM 变化，确保图标成功插入
// ==========================================
// 因为网页是动态加载的，我们要监视 DOM，一旦 Settings 渲染出来，我们就插入。

// 监听网址哈希变化（捕捉网站自带的搜索行为）
window.addEventListener("hashchange", syncSidebarWithURL);

// 尝试恢复上一次的单词
restoreLastWord();

const observer = new MutationObserver((mutations, obs) => {
  const settingsIconContainer = document.querySelector(
    '.filter-input-icon[aria-label="Settings"]',
  );
  if (settingsIconContainer) {
    createSidebar();
    injectToolbarButton();
  }
});
observer.observe(document.body, { childList: true, subtree: true });
