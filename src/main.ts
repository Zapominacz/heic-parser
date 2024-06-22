import workerUrl from "./worker?worker&url";

let currentId = 1;
const worker = new Worker(workerUrl, { type: "module" });

const getDragDropOverlay = (document: Document): HTMLDivElement =>
  document.querySelector(".drag-drop-overlay")!;

const isHeicFile = (file: File): boolean =>
  file.name.toLowerCase().endsWith(".heic");

const getFilesSection = (document: Document): HTMLElement =>
  document.querySelector("section")!;

const getSliderValue = (document: Document): HTMLSpanElement =>
  document.querySelector("#qualityValue")!;

const registerButtonHandler = (
  document: Document,
  handler: (ev: MouseEvent) => void
) => (document.querySelector("button")!.onclick = handler);

const getFilesList = (document: Document): HTMLUListElement =>
  document.querySelector("ul")!;

const getSlider = (document: Document): HTMLInputElement =>
  document.querySelector(`input[type="range"]`)!;

const registerSliderChangeHandler = (
  document: Document,
  handler: (value: string) => void
) => {
  const slide = getSlider(document);
  slide.addEventListener("input", () => handler(slide.value), {
    passive: true,
  });
};

const getCheckbox = (document: Document): HTMLInputElement =>
  document.querySelector(`input[type="checkbox"]`)!;

const createFileEntry =
  (document: Document) =>
  (data: HeicFileData): HTMLLIElement => {
    const liElement = document.createElement("li");
    liElement.id = `file-${data.id}`;
    liElement.innerText = `"${data.name}" -> "Waiting"`;
    return liElement;
  };

const createDownloadLink = (
  document: Document,
  downloadUrl: string,
  name: string
): HTMLAnchorElement => {
  const anchorElement = document.createElement("a");
  const newFileName = name.toLowerCase().replace(".heic", ".jpg");
  anchorElement.innerText = `"${name}" -> Download: "${newFileName}"`;
  anchorElement.href = downloadUrl;
  anchorElement.download = newFileName;
  return anchorElement;
};

const stopDrag = (overlay: HTMLElement) => () => {
  overlay.style.display = "initial";
};

const startDrag = (overlay: HTMLElement) => () => {
  overlay.style.display = "flex";
};

const preventDefaultHandler = (event: Event) => {
  event.preventDefault();
};

const onFileDrop = (document: Document) => {
  const htmlFilesList = getFilesList(document);
  const htmlSlider = getSlider(document);
  return async (event: DragEvent) => {
    event.preventDefault();
    stopDrag(getDragDropOverlay(document))();
    getFilesSection(document).style.display = "initial";
    const quality = parseInt(htmlSlider.value, 10) || 80;
    const files = Array.from(event.dataTransfer?.items ?? [])
      .filter((item) => item.kind === "file")
      .map((item) => <File>item.getAsFile())
      .filter(isHeicFile)
      .map(
        (file) =>
          ({
            file,
            id: currentId++,
            quality,
            name: file.name,
          } satisfies HeicFileData)
      );
    htmlFilesList.prepend(...files.reverse().map(createFileEntry(document)));
    files.forEach(async (data) => {
      const element = <HTMLLIElement>document.querySelector(`#file-${data.id}`);
      element.innerText = `"${data.name}" -> Processing`;
      const input = {
        name: data.name,
        id: data.id,
        quality: data.quality,
        buffer: await data.file.arrayBuffer(),
      } satisfies WorkerInputData;
      worker.postMessage(input, [input.buffer]);
    });
  };
};

worker.onmessage = (e: MessageEvent<WorkerReturnData>) => {
  const { downloadUrl, id, name } = e.data;
  const element = <HTMLLIElement>document.querySelector(`#file-${id}`);
  element.innerText = `"${name}" -> Processing`;
  const downloadLink = createDownloadLink(document, downloadUrl, name);
  element.replaceChildren(downloadLink);
  if (getCheckbox(document).checked) {
    downloadLink.click();
  }
};

const createDragDrop = (document: Document) => {
  const overlay = getDragDropOverlay(document);
  document.ondrop = onFileDrop(document);
  document.ondragleave = stopDrag(overlay);
  document.ondragenter = startDrag(overlay);
  document.ondragover = preventDefaultHandler;
};

createDragDrop(document);
registerButtonHandler(document, () => {
  getFilesSection(document).style.display = "none";
  getFilesList(document).replaceChildren();
});
registerSliderChangeHandler(document, (value) => {
  getSliderValue(document).innerText = value + "%";
});
