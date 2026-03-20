document.addEventListener("DOMContentLoaded", () => {
  const mainInput = document.getElementById("mainSize");
  const transInput = document.getElementById("transSize");
  const mainVal = document.getElementById("mainVal");
  const transVal = document.getElementById("transVal");

  // 1. 打开弹窗时，从 Chrome storage 读取已保存的设置
  chrome.storage.sync.get({ mainSize: "1.875", transSize: "1.5" }, (data) => {
    mainInput.value = data.mainSize;
    transInput.value = data.transSize;
    mainVal.textContent = data.mainSize;
    transVal.textContent = data.transSize;
  });

  // 2. 监听滑动条变化
  function updateSizes() {
    const mSize = mainInput.value;
    const tSize = transInput.value;

    // 更新弹窗上的数字显示
    mainVal.textContent = mSize;
    transVal.textContent = tSize;

    // 保存设置到 storage，实现记忆功能
    chrome.storage.sync.set({ mainSize: mSize, transSize: tSize });

    // 发送消息给当前活动的网页，实时应用样式
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "updateStyles",
          mainSize: mSize,
          transSize: tSize,
        });
      }
    });
  }

  // 绑定事件
  mainInput.addEventListener("input", updateSizes);
  transInput.addEventListener("input", updateSizes);
});
