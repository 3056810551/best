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
      max-width: 90% !important; 
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

        // 1. 先改变 URL 触发基础路由
        window.location.hash = `/search?q=${targetWord}&language=en`;

        // 2. 增强版：模拟用户真实输入的“全套动作”
        setTimeout(() => {
          // 尽量精准定位搜索框（以防页面顶部多出其他不可见 input）
          const searchInput =
            document.querySelector("input[type='text']") ||
            document.querySelector("input");

          if (searchInput) {
            // 第一步：必须先让输入框获得焦点，骗过浏览器的 activeElement 检测
            searchInput.focus();

            // 第二步：绕过 React 劫持，强行注入 value
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              "value",
            ).set;
            nativeInputValueSetter.call(searchInput, targetWord);

            // 第三步：连发 input 和 change 事件
            searchInput.dispatchEvent(new Event("input", { bubbles: true }));
            searchInput.dispatchEvent(new Event("change", { bubbles: true }));

            // 第四步：模拟完整的回车键生命周期 (按下、输入、抬起)
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

            // 第五步：终极保险，如果它是包裹在 form 里的，直接强行提交表单
            const form = searchInput.closest("form");
            if (form) {
              form.dispatchEvent(
                new Event("submit", { bubbles: true, cancelable: true }),
              );
            }

            // 完事后取消焦点，保持页面清爽
            searchInput.blur();
          }
        }, 100); // 将延迟稍微增加到 100ms，给框架响应 URL 变化的时间

        // 侧边栏点完后自动收起
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
