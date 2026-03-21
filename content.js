// ==========================================
// 全局配置与状态 (本次新增核心变量)
// ==========================================
let targetLoopCount = 3; // 默认每个单词循环3次
let currentLoopCount = 0; // 当前视频已播放的次数

// 将二维的 wordData 扁平化为一个纯单词数组，方便查找“下一个”单词
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
const allWordsList = wordData.flatMap((group) => group.words);

// ==========================================
// 1. 样式注入 (字幕、排版、美化及高亮)
// ==========================================
let styleTag = document.getElementById("custom-subtitle-style");
if (!styleTag) {
  styleTag = document.createElement("style");
  styleTag.id = "custom-subtitle-style";
  document.head.appendChild(styleTag);
}

// 应用样式的函数
function applyStyles(mainSize, transSize, headerVisible) {
  styleTag.innerHTML = `
    header { display: ${headerVisible ? "flex" : "none"} !important; }
    .karaoke-page-content { display: inline-block !important; box-shadow: rgba(0, 0, 0, 0.55) 0px 0px 14px !important; border-radius: 0.35em !important; font-size: ${mainSize}rem !important; padding: 0.6em 0.4em 0.4em 0.4em !important; margin-bottom: 0.3em !important; line-height: 1.4 !important; max-width: 99% !important; margin-left: auto !important; margin-right: auto !important; }
    .karaoke-page-content * { font-size: ${mainSize}rem !important; }
    /* 清除原本行内元素的文字阴影，防止和外框阴影打架 */
    .karaoke-page-content .s-word { 
      text-shadow: none !important;
      
      /* 【修复最后一个单词掉行的核心】
         将 inline-block 强制改为 inline，让它们变成纯粹的一行连续文本 */
      display: inline !important; 
      white-space: pre-wrap !important; 
      
      /* 既然变成了连续文本，原网站那些为了强行拼凑间距的黑魔法（负间距、左右留白）就不需要了，直接清零，用文本自带的空格最自然 */
      padding: 0 !important; 
      word-spacing: normal !important; 
      line-height: inherit !important;
    }
    .translate { font-size: ${transSize}rem !important; color: #ffffff !important; }
    .translate-text { font-size: ${transSize}rem !important; line-height: 1.4 !important; padding: 0.3em 0 !important; }
    .copy-button { width: auto !important; height: auto !important; padding: 0 0.2em !important; }
    .copy-button i { font-size: 0.8em !important; line-height: 1 !important; height: auto !important; }

    /* 侧边栏与新按钮样式 */
    #custom-word-sidebar { position: fixed; top: 0; right: -550px; width: 520px; height: 100vh; background: rgba(20, 20, 20, 0.85); backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%); border-left: 1px solid rgba(255, 255, 255, 0.1); z-index: 999999; transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; box-shadow: -10px 0 30px rgba(0,0,0,0.5); color: white; font-family: sans-serif; }
    #custom-word-sidebar.show { right: 0; }
    .sidebar-header { padding: 20px; font-size: 1.2rem; font-weight: bold; border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; flex-direction: column; gap: 12px; }
    .sidebar-header-top { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .sidebar-controls { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; font-weight: normal; color: rgba(255,255,255,0.8); background: rgba(0,0,0,0.3); padding: 8px 12px; border-radius: 8px; }
    .sidebar-controls input { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 2px 6px; border-radius: 4px; width: 50px; text-align: center; outline: none; }
    .sidebar-close-btn { cursor: pointer; opacity: 0.6; }
    .sidebar-close-btn:hover { opacity: 1; color: #ff453a; }
    .sidebar-word-list { list-style: none; padding: 0; margin: 0; overflow-y: auto; flex: 1; scroll-behavior: smooth; }
    
    /* 单元标题与具体单词的区分样式 */
    .sidebar-word-list .unit-header { padding: 10px 20px; font-size: 0.85rem; color: rgba(255, 255, 255, 255); background: rgba(0, 0, 0, 1); text-transform: uppercase; letter-spacing: 1px; position: sticky; top: 0; z-index: 10; cursor: default; }
    .sidebar-word-list li.word-item { padding: 12px 20px 12px 30px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.03); transition: all 0.2s; }
    .sidebar-word-list li.word-item:hover { background: rgba(255, 255, 255, 0.1); color: #64b5f6; }
    .sidebar-word-list li.word-item.active-word { background: rgba(100, 181, 246, 0.2); color: #90caf9; font-weight: bold; border-left: 4px solid #64b5f6; padding-left: 26px; }
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
// 2. 核心业务逻辑：自动循环与单词跳转
// ==========================================

// 从 URL 中提取当前的单词
function getCurrentWordFromHash() {
  const match = window.location.hash.match(/q=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// 【新增封装】执行 React 模拟输入的跳转函数
function jumpToWord(targetWord) {
  // 跳转新词时，重置播放计数器
  currentLoopCount = 0;

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
      searchInput.dispatchEvent(new KeyboardEvent("keydown", enterConfig));
      searchInput.dispatchEvent(new KeyboardEvent("keypress", enterConfig));
      searchInput.dispatchEvent(new KeyboardEvent("keyup", enterConfig));
      const form = searchInput.closest("form");
      if (form)
        form.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      searchInput.blur();
    }
  }, 100);
}

// 拦截视频 ended 事件，处理循环和自动跳转
document.addEventListener(
  "ended",
  (event) => {
    if (event.target && event.target.tagName.toUpperCase() === "VIDEO") {
      event.stopImmediatePropagation();

      currentLoopCount++; // 播放次数 +1

      if (currentLoopCount < targetLoopCount) {
        // 没达到指定次数：继续循环当前视频
        event.target.currentTime = 0;
        event.target.play();
        console.log(`播放循环: ${currentLoopCount}/${targetLoopCount}`);
      } else {
        // 达到指定次数：查找并跳转到下一个单词
        console.log(`达到循环次数，自动跳转下一个单词！`);

        const currentWord = getCurrentWordFromHash();
        const currentIndex = allWordsList.indexOf(currentWord);

        if (currentIndex !== -1 && currentIndex < allWordsList.length - 1) {
          // 如果当前词在列表中，并且不是最后一个词，就跳到下一个
          const nextWord = allWordsList[currentIndex + 1];
          jumpToWord(nextWord);
        } else {
          // 如果是最后一个单词，或者是没在列表里的词，就继续无限循环当前视频
          console.log("已是最后一个单词，停止自动跳转。");
          currentLoopCount = 0; // 重置计数器防止溢出
          event.target.currentTime = 0;
          event.target.play();
        }
      }
    }
  },
  true,
);

// 同步侧边栏状态并记忆单词
function syncSidebarWithURL() {
  const currentWord = getCurrentWordFromHash();
  if (!currentWord) return;

  localStorage.setItem("playphrase_last_word", currentWord);

  const listItems = document.querySelectorAll(
    ".sidebar-word-list li.word-item",
  );
  listItems.forEach((li) => li.classList.remove("active-word"));

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
    jumpToWord(lastWord);
  }
}

// ==========================================
// 3. UI 注入与事件绑定
// ==========================================

function createSidebar() {
  if (document.getElementById("custom-word-sidebar")) return;

  const sidebar = document.createElement("div");
  sidebar.id = "custom-word-sidebar";

  let wordsHtml = "";
  wordData.forEach((group) => {
    wordsHtml += `<li class="unit-header">${group.title}</li>`;
    group.words.forEach((word) => {
      wordsHtml += `<li class="word-item" data-word="${word}">${word}</li>`;
    });
  });

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-header-top">
        <span>单词本 (自动播放)</span>
        <span class="material-symbols-outlined sidebar-close-btn" id="sidebar-close">close</span>
      </div>
      <div class="sidebar-controls">
        <label for="loop-count-input">每个单词循环播放次数:</label>
        <input type="number" id="loop-count-input" value="${targetLoopCount}" min="1" max="99">
      </div>
    </div>
    <ul class="sidebar-word-list" id="sidebar-word-list">
      ${wordsHtml}
    </ul>
  `;
  document.body.appendChild(sidebar);

  // 监听关闭按钮
  document.getElementById("sidebar-close").addEventListener("click", () => {
    sidebar.classList.remove("show");
  });

  // 监听循环次数修改
  document
    .getElementById("loop-count-input")
    .addEventListener("change", (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      targetLoopCount = val;
      currentLoopCount = 0; // 修改配置后立即重置当前计数
      e.target.value = val;
    });

  // 监听单词点击事件
  document
    .getElementById("sidebar-word-list")
    .addEventListener("click", (e) => {
      const targetLi = e.target.closest("li.word-item");
      if (targetLi) {
        const targetWord = targetLi.getAttribute("data-word");
        jumpToWord(targetWord);
        // document.getElementById("custom-word-sidebar").classList.remove("show"); // 如果你想点完不收起侧边栏，这行可以注释掉
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
// 4. 初始化
// ==========================================
window.addEventListener("hashchange", syncSidebarWithURL);
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

// 核心逻辑：利用事件冒泡的“捕获阶段 (true)”，在目标网站的脚本执行前拦截右键事件
window.addEventListener(
  "contextmenu",
  function (e) {
    // 阻止事件继续向下传递给网站自己的 JS 代码
    e.stopPropagation();

    // 顺手解除可能存在的选取限制（防复制）
    document.body.style.userSelect = "auto";
    document.body.style.webkitUserSelect = "auto";
  },
  true,
);

// 清除一些老旧的 DOM 0 级绑定
document.oncontextmenu = null;
window.oncontextmenu = null;
