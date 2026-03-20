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
