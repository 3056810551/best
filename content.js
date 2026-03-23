// ==========================================
// 全局配置与状态 (动态从 Storage 加载)
// ==========================================
let targetLoopCount = 4;
let currentLoopCount = 0;
let wordData = [];
let allWordsList = [];
let meaningOverlayPosition = { left: 16, top: 16 };
let meaningOverlayDragState = null;
let sidebarSearchKeyword = "";
let sidebarSelectedPage = "all";
let sidebarFilteredGroups = [];
let sidebarSearchDebounceTimer = null;
let sidebarVirtualRows = [];
let sidebarVirtualTotalHeight = 0;
let sidebarWordToRowIndexMap = new Map();
let sidebarVirtualRenderFrame = null;
let sidebarVirtualForceRenderPending = false;
let sidebarLastRenderedRange = {
  startIndex: -1,
  endIndex: -1,
  activeWord: null,
  isEmpty: false,
};

const SIDEBAR_HEADER_ROW_HEIGHT = 40;
const SIDEBAR_ITEM_ROW_HEIGHT = 88;
const SIDEBAR_VIRTUAL_OVERSCAN = 8;
const DEFAULT_MEANING_OVERLAY_POSITION = { left: 16, top: 16 };

// 默认单词模板 (如果用户首次安装无数据时的占位)
const defaultWordData = [
  {
    page: 1,
    index: 1,
    word: "radiate",
    meaning: "vt. vi. 散发，流露；发出 (光、辐射等) vi. 呈辐射状发散 (或伸展)",
  },
  {
    page: 1,
    index: 2,
    word: "radiant",
    meaning: "adj. 容光焕发的；灿烂的；辐射的",
  },
  {
    page: 1,
    index: 3,
    word: "radical",
    meaning: "adj. 根本的；激进的 n. 激进分子；词根",
  },
  {
    page: 2,
    index: 1,
    word: "mediate",
    meaning: "vi. 调解；斡旋 vt. 经调解解决；促成",
  },
  {
    page: 2,
    index: 2,
    word: "medium",
    meaning: "n. 媒介；方法；中间物 adj. 中等的",
  },
];

// 统一按 page / index 排序，保证侧边栏、自动跳词、释义提示始终一致
function sortWordData(data) {
  return [...data].sort((a, b) => {
    const pageDiff = a.page - b.page;
    if (pageDiff !== 0) return pageDiff;
    return a.index - b.index;
  });
}

// 只接受新的扁平结构，避免旧结构混入后影响侧边栏和跳词逻辑
function isValidWordEntry(item) {
  return (
    item &&
    typeof item.page === "number" &&
    Number.isFinite(item.page) &&
    typeof item.index === "number" &&
    Number.isFinite(item.index) &&
    typeof item.word === "string" &&
    item.word.trim() !== "" &&
    typeof item.meaning === "string" &&
    item.meaning.trim() !== ""
  );
}

function buildAllWordsList(data) {
  return data.map((item) => item.word);
}

function findWordEntry(targetWord) {
  return wordData.find((item) => item.word === targetWord) || null;
}

function groupWordDataByPage(data) {
  const pageMap = new Map();

  data.forEach((item) => {
    if (!pageMap.has(item.page)) pageMap.set(item.page, []);
    pageMap.get(item.page).push(item);
  });

  return [...pageMap.entries()];
}

function getAvailablePages() {
  return [...new Set(wordData.map((item) => item.page))].sort((a, b) => a - b);
}

function getSidebarFilteredGroups() {
  const keyword = sidebarSearchKeyword.trim().toLowerCase();
  const selectedPage =
    sidebarSelectedPage === "all" ? null : Number(sidebarSelectedPage);

  const filteredData = wordData.filter((item) => {
    const matchPage = selectedPage === null || item.page === selectedPage;
    const matchKeyword =
      keyword === "" ||
      item.word.toLowerCase().includes(keyword) ||
      item.meaning.toLowerCase().includes(keyword);

    return matchPage && matchKeyword;
  });

  return groupWordDataByPage(filteredData);
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeMeaningOverlayPosition(position) {
  if (
    !position ||
    typeof position.left !== "number" ||
    !Number.isFinite(position.left) ||
    typeof position.top !== "number" ||
    !Number.isFinite(position.top)
  ) {
    return { ...DEFAULT_MEANING_OVERLAY_POSITION };
  }

  return {
    left: position.left,
    top: position.top,
  };
}

function clampMeaningOverlayPosition(position, overlayRect) {
  const overlayWidth = overlayRect?.width || 0;
  const overlayHeight = overlayRect?.height || 0;
  const maxLeft = Math.max(0, window.innerWidth - overlayWidth);
  const maxTop = Math.max(0, window.innerHeight - overlayHeight);

  return {
    left: Math.min(Math.max(0, position.left), maxLeft),
    top: Math.min(Math.max(0, position.top), maxTop),
  };
}

function saveMeaningOverlayPosition() {
  chrome.storage.sync.set({
    meaningOverlayPosition,
  });
}

function applyMeaningOverlayPosition() {
  const overlay = document.getElementById("custom-word-meaning-overlay");
  if (!overlay) return;

  const clampedPosition = clampMeaningOverlayPosition(
    meaningOverlayPosition,
    overlay.getBoundingClientRect(),
  );
  meaningOverlayPosition = clampedPosition;
  overlay.style.left = `${clampedPosition.left}px`;
  overlay.style.top = `${clampedPosition.top}px`;
}

function handleMeaningOverlayPointerMove(event) {
  if (!meaningOverlayDragState || event.pointerId !== meaningOverlayDragState.pointerId)
    return;

  const overlay = document.getElementById("custom-word-meaning-overlay");
  if (!overlay) return;

  const nextPosition = clampMeaningOverlayPosition(
    {
      left: event.clientX - meaningOverlayDragState.offsetX,
      top: event.clientY - meaningOverlayDragState.offsetY,
    },
    overlay.getBoundingClientRect(),
  );

  meaningOverlayPosition = nextPosition;
  applyMeaningOverlayPosition();
}

function finishMeaningOverlayDrag(event) {
  if (!meaningOverlayDragState || event.pointerId !== meaningOverlayDragState.pointerId)
    return;

  const overlay = document.getElementById("custom-word-meaning-overlay");
  if (overlay && typeof overlay.releasePointerCapture === "function") {
    try {
      overlay.releasePointerCapture(event.pointerId);
    } catch (err) {
      console.warn("[PlayPhrase] releasePointerCapture 失败:", err);
    }
  }

  meaningOverlayDragState = null;
  saveMeaningOverlayPosition();
}

function setupMeaningOverlayDrag(overlay) {
  if (!overlay || overlay.dataset.dragEnabled === "true") return;

  // 释义卡片支持拖拽，拖拽结束后将当前位置写入 sync，实现跨刷新记忆
  overlay.dataset.dragEnabled = "true";
  overlay.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;

    const overlayRect = overlay.getBoundingClientRect();
    meaningOverlayDragState = {
      pointerId: event.pointerId,
      offsetX: event.clientX - overlayRect.left,
      offsetY: event.clientY - overlayRect.top,
    };

    if (typeof overlay.setPointerCapture === "function") {
      overlay.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
  });

  overlay.addEventListener("pointermove", handleMeaningOverlayPointerMove);
  overlay.addEventListener("pointerup", finishMeaningOverlayDrag);
  overlay.addEventListener("pointercancel", finishMeaningOverlayDrag);
}

function destroySidebarVirtualRenderFrame() {
  if (sidebarVirtualRenderFrame !== null) {
    cancelAnimationFrame(sidebarVirtualRenderFrame);
    sidebarVirtualRenderFrame = null;
  }
}

function buildSidebarVirtualRows() {
  sidebarFilteredGroups = getSidebarFilteredGroups();
  sidebarVirtualRows = [];
  sidebarWordToRowIndexMap = new Map();
  sidebarVirtualTotalHeight = 0;

  sidebarFilteredGroups.forEach(([page, pageWords]) => {
    sidebarVirtualRows.push({
      type: "header",
      key: `page-${page}`,
      page,
      top: sidebarVirtualTotalHeight,
      height: SIDEBAR_HEADER_ROW_HEIGHT,
    });
    sidebarVirtualTotalHeight += SIDEBAR_HEADER_ROW_HEIGHT;

    pageWords.forEach((item) => {
      const rowIndex = sidebarVirtualRows.length;
      sidebarVirtualRows.push({
        type: "item",
        key: `word-${item.page}-${item.index}-${item.word}`,
        item,
        top: sidebarVirtualTotalHeight,
        height: SIDEBAR_ITEM_ROW_HEIGHT,
      });
      sidebarWordToRowIndexMap.set(item.word, rowIndex);
      sidebarVirtualTotalHeight += SIDEBAR_ITEM_ROW_HEIGHT;
    });
  });

  sidebarLastRenderedRange = {
    startIndex: -1,
    endIndex: -1,
    activeWord: null,
    isEmpty: false,
  };
}

function findSidebarVirtualRowIndexByOffset(offset) {
  if (sidebarVirtualRows.length === 0) return 0;

  let low = 0;
  let high = sidebarVirtualRows.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const row = sidebarVirtualRows[mid];

    if (row.top + row.height <= offset) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return Math.min(Math.max(low, 0), sidebarVirtualRows.length - 1);
}

function buildSidebarVirtualRowHTML(row, activeWord) {
  if (row.type === "header") {
    return `<li class="unit-header" data-page="${escapeHTML(row.page)}">Page ${escapeHTML(row.page)}</li>`;
  }

  const isActive = row.item.word === activeWord;
  return `
    <li class="word-item${isActive ? " active-word" : ""}" data-word="${escapeHTML(row.item.word)}">
      <span class="word-index">${escapeHTML(row.item.index)}</span>
      <span class="word-main">${escapeHTML(row.item.word)}</span>
      <span class="word-meaning">${escapeHTML(row.item.meaning)}</span>
    </li>
  `;
}

function renderSidebarVirtualList(forceRender = false) {
  const wordList = document.getElementById("sidebar-word-list");
  if (!wordList) return;

  const activeWord = getCurrentWordFromHash();

  if (sidebarVirtualRows.length === 0) {
    if (!forceRender && sidebarLastRenderedRange.isEmpty) return;

    wordList.innerHTML =
      '<li class="sidebar-empty-state">没有找到匹配的单词</li>';
    sidebarLastRenderedRange = {
      startIndex: -1,
      endIndex: -1,
      activeWord,
      isEmpty: true,
    };
    return;
  }

  const viewportHeight = wordList.clientHeight || 0;
  const visibleStartIndex = findSidebarVirtualRowIndexByOffset(
    wordList.scrollTop,
  );
  const visibleEndIndex = findSidebarVirtualRowIndexByOffset(
    wordList.scrollTop + viewportHeight,
  );
  const startIndex = Math.max(0, visibleStartIndex - SIDEBAR_VIRTUAL_OVERSCAN);
  const endIndex = Math.min(
    sidebarVirtualRows.length,
    visibleEndIndex + SIDEBAR_VIRTUAL_OVERSCAN + 1,
  );

  if (
    !forceRender &&
    !sidebarLastRenderedRange.isEmpty &&
    sidebarLastRenderedRange.startIndex === startIndex &&
    sidebarLastRenderedRange.endIndex === endIndex &&
    sidebarLastRenderedRange.activeWord === activeWord
  ) {
    return;
  }

  const topSpacerHeight = sidebarVirtualRows[startIndex]?.top || 0;
  const lastVisibleRow = sidebarVirtualRows[endIndex - 1];
  const bottomSpacerHeight = Math.max(
    0,
    sidebarVirtualTotalHeight -
      ((lastVisibleRow?.top || 0) + (lastVisibleRow?.height || 0)),
  );

  let rowsHtml = "";
  for (let index = startIndex; index < endIndex; index++) {
    rowsHtml += buildSidebarVirtualRowHTML(
      sidebarVirtualRows[index],
      activeWord,
    );
  }

  wordList.innerHTML = `
    <li class="sidebar-spacer" aria-hidden="true" style="height:${topSpacerHeight}px;"></li>
    ${rowsHtml}
    <li class="sidebar-spacer" aria-hidden="true" style="height:${bottomSpacerHeight}px;"></li>
  `;

  sidebarLastRenderedRange = {
    startIndex,
    endIndex,
    activeWord,
    isEmpty: false,
  };
}

function scheduleSidebarVirtualListRender(forceRender = false) {
  if (forceRender) sidebarVirtualForceRenderPending = true;
  if (sidebarVirtualRenderFrame !== null) return;

  sidebarVirtualRenderFrame = requestAnimationFrame(() => {
    const shouldForceRender = sidebarVirtualForceRenderPending;
    sidebarVirtualRenderFrame = null;
    sidebarVirtualForceRenderPending = false;
    renderSidebarVirtualList(shouldForceRender);
  });
}

// ==========================================
// 初始化：从 Storage 读取数据
// ==========================================
chrome.storage.sync.get(
  {
    mainSize: "1.875",
    transSize: "1.5",
    headerVisible: true,
    targetLoopCount: 3,
    meaningOverlayPosition: DEFAULT_MEANING_OVERLAY_POSITION,
  },
  (data) => {
    targetLoopCount = data.targetLoopCount;
    meaningOverlayPosition = normalizeMeaningOverlayPosition(
      data.meaningOverlayPosition,
    );
    applyMeaningOverlayPosition();

    if (typeof decorateFavoriteCards === "function") decorateFavoriteCards();
    applyStyles(data.mainSize, data.transSize, data.headerVisible);
  },
);

chrome.storage.local.get({ wordData: defaultWordData }, (data) => {
  const storageWordData = Array.isArray(data.wordData) ? data.wordData : [];
  const validWordData = storageWordData.filter(isValidWordEntry);
  wordData =
    validWordData.length > 0
      ? sortWordData(validWordData)
      : sortWordData(defaultWordData);
  allWordsList = buildAllWordsList(wordData);

  createSidebar(); // 根据数据构建侧边栏
  createMeaningOverlay(); // 初始化左上角释义提示
  syncSidebarWithURL();
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
    const nextWordData = Array.isArray(request.wordData)
      ? request.wordData
      : [];
    wordData = sortWordData(nextWordData.filter(isValidWordEntry));
    allWordsList = buildAllWordsList(wordData);
    console.log(`[PlayPhrase] 单词本已更新，共 ${allWordsList.length} 个单词`);
    createSidebar(); // 重新渲染侧边栏
    createMeaningOverlay();
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
  const availablePages = getAvailablePages();

  destroySidebarVirtualRenderFrame();
  clearTimeout(sidebarSearchDebounceTimer);

  if (sidebar) {
    wasShowing = sidebar.classList.contains("show");
    sidebar.remove();
  }

  if (
    sidebarSelectedPage !== "all" &&
    !availablePages.includes(Number(sidebarSelectedPage))
  ) {
    sidebarSelectedPage = "all";
  }

  sidebar = document.createElement("div");
  sidebar.id = "custom-word-sidebar";
  if (wasShowing) sidebar.classList.add("show"); // 保持之前的打开状态

  const pageOptionsHtml = availablePages
    .map(
      (page) =>
        `<option value="${escapeHTML(page)}"${String(page) === String(sidebarSelectedPage) ? " selected" : ""}>Page ${escapeHTML(page)}</option>`,
    )
    .join("");

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-header-top">
        <span>单词本 (自动播放)</span>
        <span class="material-symbols-outlined sidebar-close-btn" id="sidebar-close" style="cursor:pointer;">close</span>
      </div>
      <div class="sidebar-toolbar">
        <input
          id="sidebar-search-input"
          class="sidebar-search-input"
          type="text"
          placeholder="搜索单词或释义"
          value="${escapeHTML(sidebarSearchKeyword)}"
        />
        <select id="sidebar-page-filter" class="sidebar-page-filter">
          <option value="all">全部 Page</option>
          ${pageOptionsHtml}
        </select>
      </div>
    </div>
    <ul class="sidebar-word-list" id="sidebar-word-list">
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

  document
    .getElementById("sidebar-word-list")
    .addEventListener("scroll", () => {
      scheduleSidebarVirtualListRender();
    });

  // 搜索与 page 筛选统一走虚拟列表刷新，DOM 中只保留视口附近的少量节点
  document
    .getElementById("sidebar-search-input")
    .addEventListener("input", (event) => {
      const nextKeyword = event.target.value;
      clearTimeout(sidebarSearchDebounceTimer);
      sidebarSearchDebounceTimer = setTimeout(() => {
        sidebarSearchKeyword = nextKeyword;
        buildSidebarVirtualRows();
        document.getElementById("sidebar-word-list").scrollTop = 0;
        scheduleSidebarVirtualListRender(true);
        syncSidebarWithURL();
      }, 160);
    });

  document
    .getElementById("sidebar-page-filter")
    .addEventListener("change", (event) => {
      sidebarSelectedPage = event.target.value;
      buildSidebarVirtualRows();
      document.getElementById("sidebar-word-list").scrollTop = 0;
      scheduleSidebarVirtualListRender(true);
      syncSidebarWithURL();
    });

  buildSidebarVirtualRows();
  scheduleSidebarVirtualListRender(true);
}

function ensureWordVisibleInSidebar(targetWord) {
  if (!targetWord) return;

  const wordList = document.getElementById("sidebar-word-list");
  const targetRowIndex = sidebarWordToRowIndexMap.get(targetWord);
  if (!wordList || typeof targetRowIndex !== "number") return;

  const targetRow = sidebarVirtualRows[targetRowIndex];
  if (!targetRow) return;

  const rowTop = targetRow.top;
  const rowBottom = targetRow.top + targetRow.height;
  const viewportTop = wordList.scrollTop;
  const viewportBottom = viewportTop + wordList.clientHeight;
  const rowAlreadyVisible =
    rowTop >= viewportTop && rowBottom <= viewportBottom && viewportBottom > 0;

  if (rowAlreadyVisible) {
    scheduleSidebarVirtualListRender(true);
    return;
  }

  wordList.scrollTop = Math.max(
    0,
    rowTop - wordList.clientHeight / 2 + targetRow.height / 2,
  );
  scheduleSidebarVirtualListRender(true);
}

function createMeaningOverlay() {
  // 左上角释义卡片只创建一次，后续由 syncSidebarWithURL 负责更新内容和显隐
  let overlay = document.getElementById("custom-word-meaning-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "custom-word-meaning-overlay";
    document.body.appendChild(overlay);
  }

  setupMeaningOverlayDrag(overlay);
  applyMeaningOverlayPosition();
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
    #custom-word-sidebar { position: fixed; top: 0; right: -750px; width: 620px; height: 100vh; background: rgba(20, 20, 20, 0.85); backdrop-filter: blur(16px); border-left: 1px solid rgba(255, 255, 255, 0.1); z-index: 999999; transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; color: white; font-family: sans-serif; }
    #custom-word-sidebar.show { right: 0; box-shadow: -10px 0 30px rgba(0,0,0,0.5); }
    .sidebar-header { padding: 20px; font-size: 0.8rem; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .sidebar-header-top { display: flex; justify-content: space-between; align-items: center; }
    .sidebar-toolbar { display: grid; grid-template-columns: minmax(0, 1fr) 130px; gap: 10px; margin-top: 14px; }
    .sidebar-search-input, .sidebar-page-filter { width: 100%; min-width: 0; height: 40px; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; background: rgba(255,255,255,0.08); color: white; padding: 0 10px; outline: none; }
    .sidebar-search-input::placeholder { color: rgba(255,255,255,0.45); }
    .sidebar-search-input:focus, .sidebar-page-filter:focus { border-color: rgba(100,181,246,0.65); box-shadow: 0 0 0 3px rgba(100,181,246,0.16); }
    .sidebar-page-filter option { color: #111827; }
    .sidebar-word-list { list-style: none; padding: 0; margin: 0; overflow-y: auto; flex: 1; scroll-behavior: auto; }
    .sidebar-word-list .unit-header { display: flex; align-items: center; height: ${SIDEBAR_HEADER_ROW_HEIGHT}px; padding: 0 20px; font-size: 0.85rem; background: rgba(0,0,0,0.95); text-transform: uppercase; }
    .sidebar-word-list li.word-item { display: grid; grid-template-columns: 52px minmax(90px, 120px) 1fr; gap: 12px; align-items: start; min-height: ${SIDEBAR_ITEM_ROW_HEIGHT}px; padding: 12px 20px 12px 30px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s, color 0.2s; box-sizing: border-box; overflow: hidden; }
    .sidebar-word-list li.word-item:hover { background: rgba(255,255,255,0.1); color: #64b5f6; }
    .sidebar-word-list li.word-item.active-word { background: rgba(100,181,246,0.2); color: #90caf9; font-weight: bold; border-left: 4px solid #64b5f6; padding-left: 26px; }
    .sidebar-word-list .word-index { display: inline-flex; justify-content: center; min-width: 36px; padding: 2px 8px; border-radius: 999px; background: rgba(100,181,246,0.16); color: #bbdefb; font-size: 0.8rem; font-weight: 700; line-height: 1.5; }
    .sidebar-word-list .word-main { font-size: 0.95rem; font-weight: 700; line-height: 1.5; word-break: break-word; }
    .sidebar-word-list .word-meaning { color: rgba(255,255,255,0.78); font-size: 0.86rem; line-height: 1.5; word-break: break-word; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .sidebar-empty-state { padding: 18px 20px; text-align: center; color: rgba(255,255,255,0.62); font-size: 0.9rem; }
    .sidebar-spacer { height: 0; margin: 0; padding: 0; border: 0; pointer-events: none; }

    /* 左上角显示当前 targetWord 的页码 / 序号 / 中文释义 */
    #custom-word-meaning-overlay { position: fixed; top: 16px; left: 16px; max-width: min(420px, calc(100vw - 32px)); padding: 14px 16px; border-radius: 16px; background: rgba(12, 18, 28, 0.72); border: 1px solid rgba(255,255,255,0.16); backdrop-filter: blur(14px); color: #ffffff; z-index: 999998; box-shadow: 0 12px 28px rgba(0,0,0,0.3); display: none; cursor: move; user-select: none; touch-action: none; }
    #custom-word-meaning-overlay.show { display: block; }
    #custom-word-meaning-overlay .meaning-meta { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 4px 10px; border-radius: 999px; background: rgba(100,181,246,0.16); color: #bbdefb; font-size: 0.8rem; font-weight: 700; }
    #custom-word-meaning-overlay .word-meta {  justify-content: center; align-items: center; gap: 8px; margin-bottom: 8px; padding: 4px 10px; border-radius: 999px; background: rgba(251, 191, 36, 0.16); color: #fff3e0; font-size: 1.4rem; font-weight: 700; }
    #custom-word-meaning-overlay .meaning-text { font-size: 0.95rem; line-height: 1.6; color: rgba(255,255,255,0.92); word-break: break-word; }
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
  const overlay = document.getElementById("custom-word-meaning-overlay");

  if (!currentWord) {
    if (overlay) {
      overlay.classList.remove("show");
      overlay.innerHTML = "";
    }
    return;
  }
  localStorage.setItem("playphrase_last_word", currentWord);

  ensureWordVisibleInSidebar(currentWord);
  renderSidebarVirtualList(true);

  // 当前 hash 命中的词条同步显示中文释义；没命中时隐藏卡片
  const activeWordEntry = findWordEntry(currentWord);
  if (!overlay) return;

  if (!activeWordEntry) {
    overlay.classList.remove("show");
    overlay.innerHTML = "";
    return;
  }

  overlay.innerHTML = `
    <div class="meaning-meta">Page ${escapeHTML(activeWordEntry.page)} · ${escapeHTML(activeWordEntry.index)}</div>
    <div class="word-meta">${escapeHTML(activeWordEntry.word)}</div>
    <div class="meaning-text">${escapeHTML(activeWordEntry.meaning)}</div>
  `;
  overlay.classList.add("show");
}

function restoreLastWord() {
  const lastWord = localStorage.getItem("playphrase_last_word");
  const currentHash = window.location.hash;
  if (lastWord && (!currentHash || !currentHash.includes("q=")))
    jumpToWord(lastWord);
}

window.addEventListener("hashchange", syncSidebarWithURL);
window.addEventListener("resize", () => {
  applyMeaningOverlayPosition();
});

const observer = new MutationObserver(() => {
  if (document.querySelector('.filter-input-icon[aria-label="Settings"]'))
    injectToolbarButton();
});
observer.observe(document.body, { childList: true, subtree: true });
