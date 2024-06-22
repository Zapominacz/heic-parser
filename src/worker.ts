import { encode } from "jpeg-js";
import decode from "heic-decode";

onmessage = async (event: MessageEvent<WorkerInputData>) => {
  const result = await convert(event.data.buffer, event.data.quality);
  const downloadLink = URL.createObjectURL(
    new Blob([result], {
      type: "image/jpeg",
    })
  );
  const data = {
    id: event.data.id,
    name: event.data.name,
    downloadUrl: downloadLink,
  } satisfies WorkerReturnData;
  postMessage(data);
};

const convert = async (buffer: ArrayBuffer, quality: number) => {
  const image = await decode({ buffer: new Uint8Array(buffer) });
  return encode(
    {
      width: image.width,
      height: image.height,
      data: image.data,
    },
    quality
  ).data;
};
