// 监听捕获阶段的 'ended' 事件
document.addEventListener(
  "ended",
  function (event) {
    // 确认触发事件的是 video 标签
    if (event.target && event.target.tagName.toUpperCase() === "VIDEO") {
      // 核心：阻止事件继续向下/向上层传播
      // 这样 PlayPhrase 的官方脚本就永远不知道这个视频已经播完了
      event.stopImmediatePropagation();

      // 将视频时间重置为 0，并再次调用播放
      event.target.currentTime = 0;
      event.target.play();

      console.log("PlayPhrase Looper: 视频已重置并循环播放，拦截自动下一集。");
    }
  },
  true,
); // 注意这里的 true，代表在捕获阶段拦截

// 【功能 2】：自动寻找并点击 Favorites 标签
// 因为这是单页应用，页面元素是动态加载的，我们设置一个定时器去寻找它
const autoSelectFavorites = setInterval(() => {
  // 获取所有的 tab
  const tabs = document.querySelectorAll(".menu-tabs .one-tab");

  if (tabs.length > 0) {
    tabs.forEach((tab) => {
      // 检查这个 tab 里的文字是否包含 "Favorites"
      if (tab.textContent.includes("Favorites")) {
        // 如果它目前没有 'selected' 这个类名，就替用户点击它
        if (!tab.classList.contains("selected")) {
          tab.click();
          console.log("PlayPhrase Looper: 已自动为您选中 Favorites 标签。");
        }
      }
    });

    // 找到目标并处理后，停止定时器
    clearInterval(autoSelectFavorites);
  }
}, 500); // 每 0.5 秒检查一次，直到找到为止

let styleTag = document.getElementById("custom-subtitle-style");
if (!styleTag) {
  styleTag = document.createElement("style");
  styleTag.id = "custom-subtitle-style";
  document.head.appendChild(styleTag);
}

// 应用样式的函数
function applyStyles(mainSize, transSize) {
  styleTag.innerHTML = `
    /* --- 1. 英文主字幕区域 --- */
    .karaoke-page-content { 
      /* 让整个容器的基准字体跟随你的设置 */
      font-size: ${mainSize}rem !important; 
      /* 使用 em 代替 px，背景框会随着字体等比例缩放 */
      padding: 0.6em 0.4em 0.4em 0.4em !important; 
      margin-bottom: 0.3em !important;
      line-height: 1.4 !important;
      min-height: auto !important;
    }
    
    .karaoke-page-content * { 
      font-size: ${mainSize}rem !important; 
    }
    
    .karaoke-page-content .s-word { 
      /* 单词之间的间距也改为动态比例 */
      padding: 0 0.15em !important; 
      word-spacing: -0.1em !important;
      line-height: inherit !important;
    }

    /* --- 2. 中文翻译区域 --- */
    .translate {
      font-size: ${transSize}rem !important;
    }

    .translate-text { 
      font-size: ${transSize}rem !important; 
      line-height: 1.4 !important;
      padding: 0.3em 0 !important;
    }

    /* --- 3. 复制按钮等比例缩放 (防止文字很小，图标却很大) --- */
    .copy-button {
      width: auto !important;
      height: auto !important;
      padding: 0 0.2em !important;
    }
    
    .copy-button i {
      font-size: 0.8em !important; /* 图标稍微比文字小一点点 */
      line-height: 1 !important;
      height: auto !important;
    }
  `;
}

chrome.storage.sync.get(
  { mainSize: "1.875", transSize: "1.5", headerVisible: true },
  (data) => {
    decorateFavoriteCards();
    applyStyles(data.mainSize, data.transSize, data.headerVisible);
  },
);

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "updateStyles") {
    applyStyles(request.mainSize, request.transSize, request.headerVisible);
  }
});
