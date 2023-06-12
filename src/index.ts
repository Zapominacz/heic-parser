import { encode } from "jpeg-js";
import * as decode from "heic-decode";

const convert = async (buffer: Buffer, quality: number) => {
  const image = await decode({ buffer });
  return encode(
    {
      width: image.width,
      height: image.height,
      data: Buffer.from(image.data),
    },
    quality
  ).data;
};

const getDragDropOverlay = (document: Document): HTMLDivElement =>
  document.querySelector(".drag-drop-overlay");

const isHeicFile = (file: File): boolean =>
  file.name.toLowerCase().endsWith(".heic");

const getFilesSection = (document: Document): HTMLElement =>
  document.querySelector("section");

const getSliderValue = (document: Document): HTMLSpanElement =>
  document.querySelector("#qualityValue");

const registerButtonHandler = (
  document: Document,
  handler: (ev: MouseEvent) => void
) => (document.querySelector("button").onclick = handler);

const getFilesList = (document: Document): HTMLUListElement =>
  document.querySelector("ul");

const getSlider = (document: Document): HTMLInputElement =>
  document.querySelector(`input[type="range"]`);

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
  document.querySelector(`input[type="checkbox"]`);

const createFileEntry =
  (document: Document) =>
  (file: File): HTMLLIElement => {
    const liElement = document.createElement("li");
    liElement.innerText = `"${file.name}" -> ${
      isHeicFile(file) ? "Waiting" : "Not a heic file"
    }`;
    return liElement;
  };

const createDownloadLink = (
  document: Document,
  result: ArrayBuffer,
  file: File
): HTMLAnchorElement => {
  const anchorElement = document.createElement("a");
  const newFileName = file.name.toLowerCase().replace(".heic", ".jpg");
  anchorElement.innerText = `"${file.name}" -> Download: "${newFileName}"`;
  anchorElement.href = URL.createObjectURL(
    new Blob([result], {
      type: "image/jpeg",
    })
  );
  anchorElement.download = newFileName;
  return anchorElement;
};

const stopDrag = (overlay: HTMLElement) => () => {
  overlay.style.display = null;
};

const startDrag = (overlay: HTMLElement) => () => {
  overlay.style.display = "flex";
};

const preventDefaultHandler = (event: Event) => {
  event.preventDefault();
};

// TODO: improve fonts
// TODO: cookies
// TODO: file input finish

const onFileDrop = (document: Document) => {
  const htmlFilesList = getFilesList(document);
  const htmlSlider = getSlider(document);
  const htmlCheckbox = getCheckbox(document);
  return async (event: DragEvent) => {
    event.preventDefault();
    stopDrag(getDragDropOverlay(document))();
    getFilesSection(document).style.display = null;
    const files = Array.from(event.dataTransfer.items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile());
    const filesHtmlItems = files.reverse().map(createFileEntry(document));
    htmlFilesList.prepend(...filesHtmlItems);
    const heicFiles = files.filter(isHeicFile);
    heicFiles.forEach(async (file, index) => {
      const fileHtmlItem = filesHtmlItems[index];
      fileHtmlItem.innerText = `"${file.name}" -> Processing`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const quality = parseInt(htmlSlider.value, 10) || 80;
      const result = await convert(buffer, quality);
      const downloadLink = createDownloadLink(document, result, file);
      fileHtmlItem.replaceChildren(downloadLink);
      if (htmlCheckbox.checked) {
        downloadLink.click();
      }
    });
  };
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
