document.addEventListener("DOMContentLoaded", () => {
  const mainInput = document.getElementById("mainSize");
  const transInput = document.getElementById("transSize");
  const headerVisibleInput = document.getElementById("headerVisible");
  const loopInput = document.getElementById("loopCount");

  const mainVal = document.getElementById("mainVal");
  const transVal = document.getElementById("transVal");
  const loopVal = document.getElementById("loopVal");

  // 初始化加载配置 (循环次数等放入 sync)
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

  // 更新配置并通知内容脚本
  function updateSettings() {
    const mainSize = mainInput.value;
    const transSize = transInput.value;
    const headerVisible = headerVisibleInput.checked;
    const targetLoopCount = parseInt(loopInput.value, 10);

    mainVal.textContent = mainSize;
    transVal.textContent = transSize;
    loopVal.textContent = targetLoopCount;

    chrome.storage.sync.set({
      mainSize,
      transSize,
      headerVisible,
      targetLoopCount,
    });

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

  mainInput.addEventListener("input", updateSettings);
  transInput.addEventListener("input", updateSettings);
  headerVisibleInput.addEventListener("change", updateSettings);
  loopInput.addEventListener("input", updateSettings);

  // ==========================================
  // 处理 JSON 单词本上传 (使用 storage.local 以防超过 sync 大小限制)
  // ==========================================
  const uploadBtn = document.getElementById("uploadBtn");
  const fileInput = document.getElementById("wordDataFile");
  const statusDiv = document.getElementById("uploadStatus");

  uploadBtn.addEventListener("click", () => {
    const file = fileInput.files[0];
    if (!file) {
      statusDiv.textContent = "⚠️ 请先选择 JSON 文件！";
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

        // 获取原有的 wordData
        chrome.storage.local.get({ wordData: [] }, (data) => {
          let finalWordData = [];

          if (mode === "append") {
            // 追加模式：将新的合并到旧的后面
            finalWordData = [...data.wordData, ...newWordData];
          } else {
            // 覆盖模式
            finalWordData = newWordData;
          }

          chrome.storage.local.set({ wordData: finalWordData }, () => {
            statusDiv.textContent = "✅ 上传并保存成功！";
            setTimeout(() => (statusDiv.textContent = ""), 2500);

            // 通知页面更新侧边栏与单词列表
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
        statusDiv.textContent = "❌ 解析失败: " + err.message;
      }
    };
    reader.readAsText(file);
  });
});
