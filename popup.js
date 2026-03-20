document.addEventListener("DOMContentLoaded", () => {
  const mainInput = document.getElementById("mainSize");
  const transInput = document.getElementById("transSize");
  const headerVisibleInput = document.getElementById("headerVisible");
  const mainVal = document.getElementById("mainVal");
  const transVal = document.getElementById("transVal");

  chrome.storage.sync.get(
    { mainSize: "1.875", transSize: "1.5", headerVisible: false },
    (data) => {
      mainInput.value = data.mainSize;
      transInput.value = data.transSize;
      headerVisibleInput.checked = Boolean(data.headerVisible);
      mainVal.textContent = data.mainSize;
      transVal.textContent = data.transSize;
    },
  );

  function updateSettings() {
    const mSize = mainInput.value;
    const tSize = transInput.value;
    const headerVisible = headerVisibleInput.checked;

    mainVal.textContent = mSize;
    transVal.textContent = tSize;

    chrome.storage.sync.set({
      mainSize: mSize,
      transSize: tSize,
      headerVisible,
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "updateStyles",
          mainSize: mSize,
          transSize: tSize,
          headerVisible,
        });
      }
    });
  }

  mainInput.addEventListener("input", updateSettings);
  transInput.addEventListener("input", updateSettings);
  headerVisibleInput.addEventListener("change", updateSettings);
});