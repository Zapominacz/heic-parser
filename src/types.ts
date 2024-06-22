interface HeicFileData {
  file: File;
  id: number;
  quality: number;
  name: string;
}

interface WorkerInputData {
  id: number;
  quality: number;
  name: string;
  buffer: ArrayBuffer;
}

interface WorkerReturnData {
  id: number;
  downloadUrl: string;
  name: string;
}
