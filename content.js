// ==========================================
// 全局配置与状态 (动态从 Storage 加载)
// ==========================================
let targetLoopCount = 4;
let currentLoopCount = 0;
let wordData = [];
let allWordsList = [];

// 默认单词模板 (如果用户首次安装无数据时的占位)
const defaultWordData = [
  { title: "Unit 1", words: ["radiate", "radiant", "radical"] },
  { title: "Unit 2", words: ["mediate", "medium"] },
];

// ==========================================
// 初始化：从 Storage 读取数据
// ==========================================
chrome.storage.sync.get(
  {
    mainSize: "1.875",
    transSize: "1.5",
    headerVisible: true,
    targetLoopCount: 3,
  },
  (data) => {
    targetLoopCount = data.targetLoopCount;

    if (typeof decorateFavoriteCards === "function") decorateFavoriteCards();
    applyStyles(data.mainSize, data.transSize, data.headerVisible);
  },
);

chrome.storage.local.get({ wordData: defaultWordData }, (data) => {
  wordData = data.wordData.length > 0 ? data.wordData : defaultWordData;
  allWordsList = wordData.flatMap((group) => group.words || []);

  createSidebar(); // 根据数据构建侧边栏
  injectToolbarButton();
  restoreLastWord();
});

// ==========================================
// 消息监听：接收来自面板的动态修改
// ==========================================
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "updateStyles") {
    applyStyles(request.mainSize, request.transSize, request.headerVisible);
  } else if (request.action === "updateLoopCount") {
    targetLoopCount = request.targetLoopCount;
    currentLoopCount = 0; // 修改配置后立即重置当前计数
    console.log(`[PlayPhrase] 更新循环次数为: ${targetLoopCount}`);
  } else if (request.action === "updateWordData") {
    wordData = request.wordData;
    allWordsList = wordData.flatMap((group) => group.words || []);
    console.log(`[PlayPhrase] 单词本已更新，共 ${allWordsList.length} 个单词`);
    createSidebar(); // 重新渲染侧边栏
    syncSidebarWithURL();
  }
});

// ==========================================
// 播放控制与业务跳转逻辑
// ==========================================
function getCurrentWordFromHash() {
  const match = window.location.hash.match(/q=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function jumpToWord(targetWord) {
  currentLoopCount = 0; // 跳转新词时，重置播放计数器
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

// 利用事件冒泡的“捕获阶段 (true)”，在目标网站的脚本执行前拦截右键事件
window.addEventListener(
  "contextmenu",
  function (e) {
    e.stopPropagation(); // 阻止事件继续向下传递给网站自己的防盗代码

    // 顺手解除可能存在的选取限制（防复制）
    document.body.style.userSelect = "auto";
    document.body.style.webkitUserSelect = "auto";
  },
  true,
);

// 清除老旧的 DOM 0 级防右键绑定
document.oncontextmenu = null;
window.oncontextmenu = null;

// 监听捕获阶段的 'ended' 事件
document.addEventListener(
  "ended",
  function (event) {
    if (event.target && event.target.tagName.toUpperCase() === "VIDEO") {
      event.stopImmediatePropagation();
      currentLoopCount++; // 播放次数 +1

      if (currentLoopCount < targetLoopCount) {
        // 未达到指定次数：继续循环当前视频
        event.target.currentTime = 0;
        event.target.play();
        console.log(
          `[Looper] 循环播放: ${currentLoopCount}/${targetLoopCount}`,
        );
      } else {
        // 达到指定次数：查找并跳转到下一个单词
        console.log(`[Looper] 达到循环次数，准备跳转！`);

        const currentWord = getCurrentWordFromHash();
        const currentIndex = allWordsList.indexOf(currentWord);

        if (currentIndex !== -1 && currentIndex < allWordsList.length - 1) {
          const nextWord = allWordsList[currentIndex + 1];
          jumpToWord(nextWord);
        } else {
          // 已经是最后一个单词，或者不在列表里 -> 继续无限循环当前视频
          console.log("[Looper] 已是最后一个单词，停止自动跳转。");
          currentLoopCount = 0;
          event.target.currentTime = 0;
          event.target.play();
        }
      }
    }
  },
  true,
);

// ==========================================
// UI 组件构建：侧边栏与美化样式
// ==========================================
function createSidebar() {
  // 如果已存在旧侧边栏，先移除再重建 (用于更新数据时)
  let sidebar = document.getElementById("custom-word-sidebar");
  let wasShowing = false;

  if (sidebar) {
    wasShowing = sidebar.classList.contains("show");
    sidebar.remove();
  }

  sidebar = document.createElement("div");
  sidebar.id = "custom-word-sidebar";
  if (wasShowing) sidebar.classList.add("show"); // 保持之前的打开状态

  let wordsHtml = "";
  wordData.forEach((group) => {
    wordsHtml += `<li class="unit-header">${group.title || "Group"}</li>`;
    (group.words || []).forEach((word) => {
      wordsHtml += `<li class="word-item" data-word="${word}">${word}</li>`;
    });
  });

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-header-top">
        <span>单词本 (自动播放)</span>
        <span class="material-symbols-outlined sidebar-close-btn" id="sidebar-close" style="cursor:pointer;">close</span>
      </div>
    </div>
    <ul class="sidebar-word-list" id="sidebar-word-list">
      ${wordsHtml}
    </ul>
  `;
  document.body.appendChild(sidebar);

  document.getElementById("sidebar-close").addEventListener("click", () => {
    sidebar.classList.remove("show");
  });

  document
    .getElementById("sidebar-word-list")
    .addEventListener("click", (e) => {
      const targetLi = e.target.closest("li.word-item");
      if (targetLi) {
        const targetWord = targetLi.getAttribute("data-word");
        jumpToWord(targetWord);
      }
    });
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
      if (sidebar.classList.contains("show")) syncSidebarWithURL();
    }
  });
}

// ==========================================
// 样式注入与其他工具方法
// ==========================================
let styleTag = document.getElementById("custom-subtitle-style");
if (!styleTag) {
  styleTag = document.createElement("style");
  styleTag.id = "custom-subtitle-style";
  document.head.appendChild(styleTag);
}

function applyStyles(mainSize, transSize, headerVisible) {
  const headerRule = headerVisible
    ? ""
    : "header { display: none !important; }";

  styleTag.textContent = `
    ${headerRule}
    .karaoke-page-content {
      display: block !important;
      width: fit-content !important;
      max-width: min(100%, calc(100vw - 24px)) !important;
      box-sizing: border-box !important;
      font-size: ${mainSize}rem !important;
      padding: 0.6em 0.4em 0.4em 0.4em !important;
      margin-left: auto !important;
      margin-right: auto !important;
      margin-bottom: 0.3em !important;
      line-height: 1.4 !important;
      min-height: auto !important;
    }
    .karaoke-page-content * { font-size: ${mainSize}rem !important; }
    .karaoke-page-content .s-word { padding: 0 0.15em !important; word-spacing: -0.1em !important; line-height: inherit !important; }
    .translate { font-size: ${transSize}rem !important; }
    .translate-text { font-size: ${transSize}rem !important; line-height: 1.4 !important; padding: 0.3em 0 !important; color: #F8F8F8 !important; text-shadow: 0 0 3px rgba(0,0,0,0.9) !important; }
    .copy-button { width: auto !important; height: auto !important; padding: 0 0.2em !important; }
    .copy-button i { font-size: 0.8em !important; line-height: 1 !important; height: auto !important; }

    /* 侧边栏样式补充 */
    #custom-word-sidebar { position: fixed; top: 0; right: -550px; width: 420px; height: 100vh; background: rgba(20, 20, 20, 0.85); backdrop-filter: blur(16px); border-left: 1px solid rgba(255, 255, 255, 0.1); z-index: 999999; transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; color: white; font-family: sans-serif; }
    #custom-word-sidebar.show { right: 0; box-shadow: -10px 0 30px rgba(0,0,0,0.5); }
    .sidebar-header { padding: 20px; font-size: 1.2rem; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .sidebar-header-top { display: flex; justify-content: space-between; align-items: center; }
    .sidebar-word-list { list-style: none; padding: 0; margin: 0; overflow-y: auto; flex: 1; scroll-behavior: smooth; }
    .sidebar-word-list .unit-header { padding: 10px 20px; font-size: 0.85rem; background: rgba(0,0,0,1); text-transform: uppercase; position: sticky; top: 0; z-index: 10; }
    .sidebar-word-list li.word-item { padding: 12px 20px 12px 30px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.03); transition: all 0.2s; }
    .sidebar-word-list li.word-item:hover { background: rgba(255,255,255,0.1); color: #64b5f6; }
    .sidebar-word-list li.word-item.active-word { background: rgba(100,181,246,0.2); color: #90caf9; font-weight: bold; border-left: 4px solid #64b5f6; padding-left: 26px; }
  `;
}

// 自动寻找并点击 Favorites 标签
const autoSelectFavorites = setInterval(() => {
  const tabs = document.querySelectorAll(".menu-tabs .one-tab");
  if (tabs.length > 0) {
    tabs.forEach((tab) => {
      if (
        tab.textContent.includes("Favorites") &&
        !tab.classList.contains("selected")
      ) {
        tab.click();
        console.log("PlayPhrase Looper: 已自动为您选中 Favorites 标签。");
      }
    });
    clearInterval(autoSelectFavorites);
  }
}, 500);

// 状态同步与记忆恢复
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

function restoreLastWord() {
  const lastWord = localStorage.getItem("playphrase_last_word");
  const currentHash = window.location.hash;
  if (lastWord && (!currentHash || !currentHash.includes("q=")))
    jumpToWord(lastWord);
}

window.addEventListener("hashchange", syncSidebarWithURL);

const observer = new MutationObserver(() => {
  if (document.querySelector('.filter-input-icon[aria-label="Settings"]'))
    injectToolbarButton();
});
observer.observe(document.body, { childList: true, subtree: true });
