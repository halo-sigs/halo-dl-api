document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-copy], [data-copy-sha]");

  if (!target) {
    return;
  }

  event.preventDefault();

  const key = target.dataset.copy ?? target.dataset.copySha;
  if (!key) {
    return;
  }

  if (target.dataset.busy) {
    return;
  }
  target.dataset.busy = "1";

  const original = target.textContent;

  try {
    if (target.dataset.copy) {
      await navigator.clipboard.writeText(`${location.origin}/${key}`);
    } else {
      const response = await fetch(`/${key}.sha256`);
      if (!response.ok) {
        throw new Error("Failed to fetch checksum");
      }
      await navigator.clipboard.writeText(await response.text());
    }
    target.textContent = "已复制";
  } catch {
    target.textContent = "复制失败";
  }

  setTimeout(() => {
    target.textContent = original;
    delete target.dataset.busy;
  }, 1500);
});
