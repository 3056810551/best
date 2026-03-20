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

// 自动选中 Favorites 标签（页面元素异步渲染）
const autoSelectFavorites = setInterval(() => {
  const tabs = document.querySelectorAll(".menu-tabs .one-tab");

  if (tabs.length > 0) {
    tabs.forEach((tab) => {
      if (
        tab.textContent.includes("Favorites") &&
        !tab.classList.contains("selected")
      ) {
        tab.click();
        console.log("PlayPhrase Looper: 已自动选中 Favorites 标签。");
      }
    });

    clearInterval(autoSelectFavorites);
  }
}, 500);

let styleTag = document.getElementById("custom-subtitle-style");
if (!styleTag) {
  styleTag = document.createElement("style");
  styleTag.id = "custom-subtitle-style";
  document.head.appendChild(styleTag);
}

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
      color: #ffffff !important;
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

    /* =========================================
       4. 底部翻页栏居中及隐藏过滤选项 (本次新增)
       ========================================= */
    
    /* 强行隐藏 Level 和 Topic 筛选框 */
    .favorites-search-form-content .filters-form {
      display: none !important;
    }

    /* 强行让包裹层居中对齐 */
    .favorites-search-form-content {
      display: flex !important;
      justify-content: center !important;
    }
    
    .favorites-search-form-content .one-line {
      justify-content: center !important;
    }

    /* 清除原本把翻页器推到最右边的 margin-left: auto */
    .favorites-search-form-content .pagging {
      justify-content: center !important;
      margin-left: 0 !important; 
    }
    
    /* =========================================
   单词卡片：现代玻璃磨砂风格 (Glassmorphism)
   ========================================= */

   .side-container-flex {}

/* 1. 主容器：毛玻璃卡片效果 */
.favorite-container,side-container-flex {
  background: rgba(30, 30, 30, 0.4) !important; /* 半透明深色背景 */
  backdrop-filter: blur(16px) saturate(180%) !important; /* 核心：毛玻璃与色彩饱和度提升 */
  -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important; /* 极细的半透明高光边框 */
  border-radius: 16px !important; /* 大圆角显得现代 */
  padding: 24px !important; /* 留白呼吸感 */
  margin-bottom: 20px !important;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3) !important; /* 弥散阴影，让卡片浮起来 */
  color: #f5f5f5 !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  transition: transform 0.3s ease, box-shadow 0.3s ease !important;
}

/* 鼠标悬浮时卡片轻微上浮 */
.favorite-container:hover {
  transform: translateY(-4px) !important;
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.4) !important;
}

/* 清除原网站乱加的文字阴影，保证玻璃质感干净 */
.favorite-container * {
  text-shadow: none !important; 
}

/* 2. 头部栏：单词、序号、标签、删除按钮 */
.favorite-container .favorite {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  margin-bottom: 16px !important;
  padding-bottom: 16px !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important; /* 柔和的分割线 */
}

.favorite-container .favorite-main {
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 12px !important;
}

.current-page {
color: rgba(255, 255, 255, 1) !important;
}

/* 序号 */
.favorite-container .index {
  font-size: 1.4rem !important;
  color: rgba(255, 255, 255, 1) !important;
  font-weight: 600 !important;
}

/* 主单词：加粗且高亮 */
.favorite-container .text {
  font-size: 2rem !important;
  font-weight: 700 !important;
  letter-spacing: -0.5px !important;
  color: #ffffff !important;
}

/* 计数器和等级标签 (做成药丸状的小 Badge) */
.favorite-container .counter,
.favorite-container .language-level {
  font-size: 0.8rem !important;
  padding: 4px 10px !important;
  background: rgba(255, 255, 255, 0.1) !important; /* 标签的内部再做微弱透明 */
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  border-radius: 20px !important;
  color: rgba(255, 255, 255, 0.8) !important;
  letter-spacing: 0.5px !important;
}

/* 删除按钮 */
.favorite-container .trash-icon {
  color: rgba(255, 255, 255, 0.3) !important;
  transition: all 0.2s ease !important;
  padding: 8px !important;
  border-radius: 50% !important;
  cursor: pointer !important;
}

.favorite-container .trash-icon:hover {
  color: #ff453a !important; /* 苹果风格的删除红 */
  background: rgba(255, 69, 58, 0.15) !important;
}

/* 3. 释义与翻译区域 */
.favorite-container .translate {
  font-size: 1.25rem !important;
  font-weight: 500 !important;
  color: #e2e2e2 !important;
  margin-bottom: 20px !important;
}

/* 词性和信息行 */
.favorite-container .part-of-speech,
.favorite-container .word-meta {
  font-size: 0.95rem !important;
  line-height: 1.6 !important;
  color: rgba(255, 255, 255, 0.65) !important;
  margin-bottom: 8px !important;
  display: block !important;
}

/* 词性标识 (Verb, Noun 等) */
.favorite-container .opacity-50 {
  opacity: 1 !important;
  color: #a1a1aa !important; /* 柔和的锌灰色 */
  text-transform: uppercase !important;
  font-size: 0.75rem !important;
  letter-spacing: 1px !important;
  font-weight: 600 !important;
  margin-right: 8px !important;
  background: rgba(0, 0, 0, 0.2) !important;
  padding: 2px 6px !important;
  border-radius: 4px !important;
}

/* 4. 链接文字 (同根词、搭配等) */
.favorite-container a.one-word {
  color: #64b5f6 !important; /* 现代的清爽蓝色 */
  text-decoration: none !important;
  transition: all 0.2s ease !important;
  border-bottom: 1px solid transparent !important;
}

.favorite-container a.one-word:hover {
  color: #90caf9 !important;
  border-bottom: 1px solid #90caf9 !important;
}

/* --- 侧边栏与新按钮样式 (新增) --- */
    #custom-word-sidebar {
      position: fixed;
      top: 0;
      right: -350px; /* 默认隐藏在屏幕外 */
      width: 320px;
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
const wordList = [
  "brisk",
  "brief",
  "browse",
  "aggravate",
  "aggregate",
  "aggressive",
  "agitate",
  "agreeable",
  "aid",
  "aim",
  "alarm",
  "alien",
  "alienate",
  "allocate",
  "allow",
  "alter",
  "alternate",
  "alternative",
  "comparable",
  "comparative",
  "compare",
  "comparison",
  "compel",
  "compensate",
  "compete",
  "competition",
  "competitive",
  "competent",
  "compile",
  "complain",
  "complaint",
  "complement",
  "complete",
  "complex",
  "complicate",
  "complicated",
  "comply",
  "compliment",
  "differ",
  "difference",
  "diffuse",
  "emphasis",
  "emphasize",
  "employ",
  "employee",
  "employer",
  "employment",
  "enable",
  "encounter",
  "encourage",
  "end",
  "endeavour",
  "endorse",
  "indicate",
  "indication",
  "indicative",
  "outrage",
  "outset",
  "outside",
  "outward",
  "special",
  "specialist",
  "specialize",
  "specialty",
  "species",
  "specific",
  "specification",
  "specify",
  "speculate",
];

// 创建并注入侧边栏 HTML
function createSidebar() {
  if (document.getElementById("custom-word-sidebar")) return;

  const sidebar = document.createElement("div");
  sidebar.id = "custom-word-sidebar";

  // 生成单词 `<li>` 列表
  const wordsHtml = wordList
    .map((word) => `<li data-word="${word}">${word}</li>`)
    .join("");

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

  // 绑定关闭按钮事件
  document.getElementById("sidebar-close").addEventListener("click", () => {
    sidebar.classList.remove("show");
  });

  // 绑定单词点击跳转事件 (事件委托机制)
  document
    .getElementById("sidebar-word-list")
    .addEventListener("click", (e) => {
      if (e.target.tagName === "LI") {
        const targetWord = e.target.getAttribute("data-word");
        // 触发 SPA 路由跳转！改变 hash 即可让 React 重新拉取视频
        // 1. 修改 URL (使用 HTML5 History API 更安全)
        const newHash = `#/search?q=${targetWord}&language=en`;
        window.history.pushState(null, "", newHash);
        window.dispatchEvent(new PopStateEvent("popstate"));
        window.dispatchEvent(new HashChangeEvent("hashchange"));

        // 2. 模拟 React 搜索框输入并回车 (终极必杀技)
        // 延迟 50 毫秒执行，等待前面的路由事件消化
        setTimeout(() => {
          // 找到页面顶部的搜索框 (通常是页面里的第一个 input)
          const searchInput = document.querySelector("input");
          if (searchInput) {
            // 绕过 React 的虚拟 DOM 拦截，直接修改底层原生 input 的值
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              "value",
            ).set;
            nativeInputValueSetter.call(searchInput, targetWord);

            // 派发 input 事件，骗过 React，让它以为是你亲手输入的
            searchInput.dispatchEvent(new Event("input", { bubbles: true }));

            // 派发 Enter 回车键事件，触发网站内部的搜索和网络请求
            searchInput.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "Enter",
                code: "Enter",
                keyCode: 13,
                which: 13,
                bubbles: true,
              }),
            );
          }
        }, 50);

        // (可选) 侧边栏点完后自动收起，体验更好
        document.getElementById("custom-word-sidebar").classList.remove("show");
      }
    });
}

// 在导航栏插入新图标
function injectToolbarButton() {
  // 如果已经插入过了，就跳过
  if (document.getElementById("custom-sidebar-btn")) return;

  // 寻找 Settings 按钮的容器
  const settingsIconContainer = document.querySelector(
    '.filter-input-icon[aria-label="Settings"]',
  );
  if (!settingsIconContainer) return;

  const settingsLi = settingsIconContainer.closest("li");
  if (!settingsLi) return;

  // 创建我们的新 <li> 图标元素
  const newLi = document.createElement("li");
  newLi.className = "input-button";
  newLi.id = "custom-sidebar-btn";
  newLi.innerHTML = `
    <div role="button" tabindex="0" class="filter-input-icon" aria-label="Open Word List">
      <i class="material-symbols-outlined" style="color: #64b5f6;">format_list_bulleted</i>
    </div>
  `;

  // 插入到 Settings 的前面
  settingsLi.parentNode.insertBefore(newLi, settingsLi);

  // 点击图标弹出侧边栏
  newLi.addEventListener("click", () => {
    const sidebar = document.getElementById("custom-word-sidebar");
    if (sidebar) {
      sidebar.classList.toggle("show");
    }
  });
}

// ==========================================
// 3. 动态监视 DOM 变化，确保图标成功插入
// ==========================================
// 因为网页是动态加载的，我们要监视 DOM，一旦 Settings 渲染出来，我们就插入。
const observer = new MutationObserver((mutations, obs) => {
  const settingsIconContainer = document.querySelector(
    '.filter-input-icon[aria-label="Settings"]',
  );
  if (settingsIconContainer) {
    createSidebar();
    injectToolbarButton();
  }
});

// 开始监听 body 的变化
observer.observe(document.body, { childList: true, subtree: true });
