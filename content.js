/**
 * =======================================================================
 * PlayPhrase 增强脚本
 * 功能包含：UI美化、防掉行修复、侧边栏单词本、自动循环播放、自动跳词、解除右键限制
 * =======================================================================
 */

// ==========================================
// 1. 全局配置与状态数据
// ==========================================
let targetLoopCount = 3; // 默认每个单词循环播放的次数
let currentLoopCount = 0; // 当前视频已播放的次数

// 单词数据源 (按单元分组)
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
    ],
  },
  {
    title: "Unit 2",
    words: ["mediate", "meditation", "medium", "media", "elaborate"],
  },
];

// 将二维数组扁平化，方便进行“上一个/下一个”的线性查找
const allWordsList = wordData.flatMap((group) => group.words);

// ==========================================
// 2. 样式管理 (样式注入与扩展通信)
// ==========================================
let styleTag = document.getElementById("custom-subtitle-style");
if (!styleTag) {
  styleTag = document.createElement("style");
  styleTag.id = "custom-subtitle-style";
  document.head.appendChild(styleTag);
}

/**
 * 动态应用 CSS 样式
 * 包含：隐藏/显示 Header、主字幕样式、翻译字幕样式、防掉行修复、侧边栏样式等
 */
function applyStyles(mainSize, transSize, headerVisible) {
  styleTag.innerHTML = `
    /* 基础页面排版 */
    header { display: ${headerVisible ? "flex" : "none"} !important; }
    .karaoke-page-content { 
      display: inline-block !important; 
      box-shadow: rgba(0, 0, 0, 0.55) 0px 0px 14px !important; 
      border-radius: 0.35em !important; 
      font-size: ${mainSize}rem !important; 
      padding: 0.6em 0.4em 0.4em 0.4em !important; 
      margin-bottom: 0.3em !important; 
      line-height: 1.4 !important; 
      max-width: 99% !important; 
      margin-left: auto !important; 
      margin-right: auto !important; 
    }
    .karaoke-page-content * { font-size: ${mainSize}rem !important; }
    
    /* 【修复最后一个单词掉行的核心】 */
    .karaoke-page-content .s-word { 
      text-shadow: none !important; /* 清除原本行内元素的文字阴影，防止和外框阴影打架 */
      display: inline !important;   /* 将 inline-block 强制改为 inline，让它们变成纯粹的一行连续文本 */
      white-space: pre-wrap !important; 
      padding: 0 !important;        /* 清零黑魔法间距，用文本自带的空格最自然 */
      word-spacing: normal !important; 
      line-height: inherit !important;
    }
    
    /* 翻译与按钮区 */
    .translate { font-size: ${transSize}rem !important; color: #ffffff !important; }
    .translate-text { font-size: ${transSize}rem !important; line-height: 1.4 !important; padding: 0.3em 0 !important; }
    .copy-button { width: auto !important; height: auto !important; padding: 0 0.2em !important; }
    .copy-button i { font-size: 0.8em !important; line-height: 1 !important; height: auto !important; }

    /* 侧边栏整体样式 */
    #custom-word-sidebar { 
      position: fixed; top: 0; right: -550px; width: 520px; height: 100vh; 
      background: rgba(20, 20, 20, 0.85); backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%); 
      border-left: 1px solid rgba(255, 255, 255, 0.1); box-shadow: -10px 0 30px rgba(0,0,0,0.5); 
      color: white; font-family: sans-serif; z-index: 999999; 
      transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
      display: flex; flex-direction: column; 
    }
    #custom-word-sidebar.show { right: 0; }
    
    /* 侧边栏头部与控件 */
    .sidebar-header { padding: 20px; font-size: 1.2rem; font-weight: bold; border-bottom: 1px solid rgba(255, 255, 255, 0.1); display: flex; flex-direction: column; gap: 12px; }
    .sidebar-header-top { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .sidebar-controls { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; font-weight: normal; color: rgba(255,255,255,0.8); background: rgba(0,0,0,0.3); padding: 8px 12px; border-radius: 8px; }
    .sidebar-controls input { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 2px 6px; border-radius: 4px; width: 50px; text-align: center; outline: none; }
    .sidebar-close-btn { cursor: pointer; opacity: 0.6; }
    .sidebar-close-btn:hover { opacity: 1; color: #ff453a; }
    
    /* 侧边栏列表 */
    .sidebar-word-list { list-style: none; padding: 0; margin: 0; overflow-y: auto; flex: 1; scroll-behavior: smooth; }
    .sidebar-word-list .unit-header { padding: 10px 20px; font-size: 0.85rem; color: rgba(255, 255, 255, 255); background: rgba(0, 0, 0, 1); text-transform: uppercase; letter-spacing: 1px; position: sticky; top: 0; z-index: 10; cursor: default; }
    .sidebar-word-list li.word-item { padding: 12px 20px 12px 30px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.03); transition: all 0.2s; }
    .sidebar-word-list li.word-item:hover { background: rgba(255, 255, 255, 0.1); color: #64b5f6; }
    .sidebar-word-list li.word-item.active-word { background: rgba(100, 181, 246, 0.2); color: #90caf9; font-weight: bold; border-left: 4px solid #64b5f6; padding-left: 26px; }
  `;
}

// 初始化读取配置并注入样式
chrome.storage.sync.get(
  { mainSize: "1.875", transSize: "1.5", headerVisible: false },
  (data) => {
    applyStyles(data.mainSize, data.transSize, Boolean(data.headerVisible));
  },
);

// 监听扩展端发来的样式更新请求
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
// 3. 核心业务逻辑：自动循环与单词跳转
// ==========================================

/**
 * 解析 URL Hash 获取当前播放的单词
 */
function getCurrentWordFromHash() {
  const match = window.location.hash.match(/q=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * 模拟用户行为，执行 React 框架的搜索输入与跳转
 */
function jumpToWord(targetWord) {
  currentLoopCount = 0; // 跳转新词时，重置播放计数器
  window.location.hash = `/search?q=${targetWord}&language=en`;

  setTimeout(() => {
    const searchInput =
      document.querySelector("input[type='text']") ||
      document.querySelector("input");
    if (searchInput) {
      // 1. 获取焦点并设置值 (绕过 React 状态劫持)
      searchInput.focus();
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      ).set;
      nativeInputValueSetter.call(searchInput, targetWord);

      // 2. 触发相关输入事件
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      searchInput.dispatchEvent(new Event("change", { bubbles: true }));

      // 3. 模拟回车键提交
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

      // 4. 触发表单提交
      const form = searchInput.closest("form");
      if (form) {
        form.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true }),
        );
      }
      searchInput.blur();
    }
  }, 100);
}

/**
 * 监听视频播放结束事件：处理循环逻辑与自动跳词
 * 使用捕获阶段 (true) 确保优先处理
 */
document.addEventListener(
  "ended",
  (event) => {
    if (event.target && event.target.tagName.toUpperCase() === "VIDEO") {
      event.stopImmediatePropagation(); // 阻止原网页默认的结束行为

      currentLoopCount++; // 播放次数累加

      if (currentLoopCount < targetLoopCount) {
        // [未达标]：继续循环当前视频
        event.target.currentTime = 0;
        event.target.play();
        console.log(`播放循环: ${currentLoopCount}/${targetLoopCount}`);
      } else {
        // [已达标]：查找并跳转到下一个单词
        console.log(`达到循环次数，自动跳转下一个单词！`);

        const currentWord = getCurrentWordFromHash();
        const currentIndex = allWordsList.indexOf(currentWord);

        if (currentIndex !== -1 && currentIndex < allWordsList.length - 1) {
          // 跳转下一个词
          const nextWord = allWordsList[currentIndex + 1];
          jumpToWord(nextWord);
        } else {
          // 已经是最后一个词，或当前词不在列表内 -> 回退到无限循环当前视频
          console.log("已是最后一个单词，停止自动跳转。");
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
// 4. UI 组件构建 (侧边栏与控制栏按钮)
// ==========================================

/**
 * 创建并注入右侧单词列表侧边栏
 */
function createSidebar() {
  if (document.getElementById("custom-word-sidebar")) return;

  const sidebar = document.createElement("div");
  sidebar.id = "custom-word-sidebar";

  // 构建单词列表 HTML
  let wordsHtml = "";
  wordData.forEach((group) => {
    wordsHtml += `<li class="unit-header">${group.title}</li>`;
    group.words.forEach((word) => {
      wordsHtml += `<li class="word-item" data-word="${word}">${word}</li>`;
    });
  });

  // 拼接整体 DOM
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

  // 事件绑定：关闭侧边栏
  document.getElementById("sidebar-close").addEventListener("click", () => {
    sidebar.classList.remove("show");
  });

  // 事件绑定：修改循环次数
  document
    .getElementById("loop-count-input")
    .addEventListener("change", (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      targetLoopCount = val;
      currentLoopCount = 0; // 修改配置后立即重置当前计数
      e.target.value = val;
    });

  // 事件绑定：点击列表单词实现跳转 (事件委托)
  document
    .getElementById("sidebar-word-list")
    .addEventListener("click", (e) => {
      const targetLi = e.target.closest("li.word-item");
      if (targetLi) {
        const targetWord = targetLi.getAttribute("data-word");
        jumpToWord(targetWord);
      }
    });

  syncSidebarWithURL();
}

/**
 * 在页面底部工具栏注入打开侧边栏的按钮
 */
function injectToolbarButton() {
  if (document.getElementById("custom-sidebar-btn")) return;

  // 定位原有的设置按钮，在其前方插入自定义按钮
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

  // 点击按钮切换侧边栏显示状态
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
// 5. 状态同步与记忆恢复
// ==========================================

/**
 * 根据当前 URL 同步侧边栏的单词高亮状态，并更新本地记忆
 */
function syncSidebarWithURL() {
  const currentWord = getCurrentWordFromHash();
  if (!currentWord) return;

  // 记录最后一次播放的单词
  localStorage.setItem("playphrase_last_word", currentWord);

  // 清除旧高亮
  const listItems = document.querySelectorAll(
    ".sidebar-word-list li.word-item",
  );
  listItems.forEach((li) => li.classList.remove("active-word"));

  // 激活新高亮并居中滚动
  const activeLi = document.querySelector(
    `.sidebar-word-list li.word-item[data-word="${currentWord}"]`,
  );
  if (activeLi) {
    activeLi.classList.add("active-word");
    activeLi.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

/**
 * 页面初始加载时，恢复上一次学习的单词
 */
function restoreLastWord() {
  const lastWord = localStorage.getItem("playphrase_last_word");
  const currentHash = window.location.hash;
  // 如果有记忆，且当前 URL 没有指定查询词，则进行恢复
  if (lastWord && (!currentHash || !currentHash.includes("q="))) {
    jumpToWord(lastWord);
  }
}

// ==========================================
// 6. 全局拦截与破解 (防复制限制)
// ==========================================

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

// ==========================================
// 7. 生命周期与初始化
// ==========================================

// 监听 URL Hash 变化 (支持页面内无刷新的路由变化)
window.addEventListener("hashchange", syncSidebarWithURL);

// 执行记忆恢复
restoreLastWord();

// 监听页面 DOM 变化，确保原生组件渲染后，再注入我们的自定义 UI
const observer = new MutationObserver(() => {
  const settingsIconContainer = document.querySelector(
    '.filter-input-icon[aria-label="Settings"]',
  );
  if (settingsIconContainer) {
    createSidebar();
    injectToolbarButton();
  }
});
observer.observe(document.body, { childList: true, subtree: true });
