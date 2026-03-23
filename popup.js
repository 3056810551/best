document.addEventListener("DOMContentLoaded", () => {
  const mainInput = document.getElementById("mainSize");
  const transInput = document.getElementById("transSize");
  const headerVisibleInput = document.getElementById("headerVisible");
  const loopInput = document.getElementById("loopCount");

  const mainVal = document.getElementById("mainVal");
  const transVal = document.getElementById("transVal");
  const loopVal = document.getElementById("loopVal");

  // ==========================================
  // 初始化加载配置 (循环次数等放入 sync)
  // ==========================================
  chrome.storage.sync.get(
    {
      mainSize: "1.875",
      transSize: "1.5",
      headerVisible: true,
      targetLoopCount: 3,
    },
    (data) => {
      mainInput.value = data.mainSize;
      transInput.value = data.transSize;
      headerVisibleInput.checked = data.headerVisible;
      loopInput.value = data.targetLoopCount;

      mainVal.textContent = data.mainSize;
      transVal.textContent = data.transSize;
      loopVal.textContent = data.targetLoopCount;
    },
  );

  // ==========================================
  // 实时更新配置并通知网页端的 content.js
  // ==========================================
  function updateSettings() {
    const mainSize = mainInput.value;
    const transSize = transInput.value;
    const headerVisible = headerVisibleInput.checked;
    const targetLoopCount = parseInt(loopInput.value, 10);

    mainVal.textContent = mainSize;
    transVal.textContent = transSize;
    loopVal.textContent = targetLoopCount;

    // 保存到同步存储区
    chrome.storage.sync.set({
      mainSize,
      transSize,
      headerVisible,
      targetLoopCount,
    });

    // 通知当前活跃标签页更新 UI 和逻辑
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) return;

      // 更新样式
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "updateStyles",
        mainSize,
        transSize,
        headerVisible,
      });
      // 更新循环次数
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "updateLoopCount",
        targetLoopCount,
      });
    });
  }

  // 绑定事件监听器
  mainInput.addEventListener("input", updateSettings);
  transInput.addEventListener("input", updateSettings);
  headerVisibleInput.addEventListener("change", updateSettings);
  loopInput.addEventListener("input", updateSettings);

  // ==========================================
  // 处理 JSON 单词本上传与清空逻辑
  // ==========================================
  const uploadBtn = document.getElementById("uploadBtn");
  const clearBtn = document.getElementById("clearBtn");
  const fileInput = document.getElementById("wordDataFile");
  const statusDiv = document.getElementById("uploadStatus");

  // 1. 上传与保存逻辑
  uploadBtn.addEventListener("click", () => {
    const file = fileInput.files[0];

    // 拦截未选择文件的情况
    if (!file) {
      statusDiv.style.color = "var(--danger)";
      statusDiv.textContent = "⚠️ 请先选择 JSON 文件！";
      setTimeout(() => (statusDiv.textContent = ""), 2500);
      return;
    }

    const mode = document.querySelector(
      'input[name="uploadMode"]:checked',
    ).value;
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const newWordData = JSON.parse(e.target.result);
        if (!Array.isArray(newWordData))
          throw new Error("JSON 根目录必须是数组");

        // 读取本地现有的数据进行合并或覆盖
        chrome.storage.local.get({ wordData: [] }, (data) => {
          let finalWordData = [];

          if (mode === "append") {
            // 追加模式：合并旧数据和新数据
            finalWordData = [...data.wordData, ...newWordData];
          } else {
            // 覆盖模式：直接使用新数据
            finalWordData = newWordData;
          }

          // 保存回本地存储 (用 local 防止文件过大超出 sync 限制)
          chrome.storage.local.set({ wordData: finalWordData }, () => {
            statusDiv.style.color = "var(--accent)";
            statusDiv.textContent = "✅ 上传并保存成功！";
            setTimeout(() => (statusDiv.textContent = ""), 2500);

            // 通知网页端的 content.js 立即重新渲染侧边栏
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, {
                  action: "updateWordData",
                  wordData: finalWordData,
                });
              }
            });
          });
        });
      } catch (err) {
        // 捕获 JSON 解析错误
        statusDiv.style.color = "var(--danger)";
        statusDiv.textContent = "❌ 解析失败: " + err.message;
      }
    };
    reader.readAsText(file);
  });

  // 2. 清空逻辑 (带防误触确认)
  clearBtn.addEventListener("click", () => {
    const confirmClear = confirm(
      "⚠️ 确定要彻底清空已保存的单词数据吗？\n此操作不可逆！",
    );

    if (confirmClear) {
      // 将 wordData 设置为空数组
      chrome.storage.local.set({ wordData: [] }, () => {
        // 更新 UI 提示，使用红色提醒清空成功
        statusDiv.style.color = "var(--danger)";
        statusDiv.textContent = "🗑️ 单词数据已全部清空！";
        setTimeout(() => {
          statusDiv.textContent = "";
        }, 2500);

        // 重置文件选择框，防止残留显示
        fileInput.value = "";

        // 通知网页端的 content.js 立即清空侧边栏
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: "updateWordData",
              wordData: [], // 传递空数组给 content.js
            });
          }
        });
      });
    }
  });
});
