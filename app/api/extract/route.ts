export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExtractionStatus =
  | "extracted"
  | "extraction_failed"
  | "ocr_required"
  | "unsupported_for_extraction";

type ExtractionResponse = {
  extractedText: string;
  fileName: string;
  fileType: string;
  extractionStatus: ExtractionStatus;
  warnings: string[];
};

type PdfWorkerGlobal = typeof globalThis & {
  pdfjsWorker?: {
    WorkerMessageHandler: unknown;
  };
};

const imageTypes = new Set([".png", ".jpg", ".jpeg"]);
const pdfTypes = new Set([".pdf"]);
const docxTypes = new Set([".docx"]);
const txtTypes = new Set([".txt"]);
const presentationTypes = new Set([".ppt", ".pptx", ".pps", ".ppsx"]);
const maxStoredTextLength = 120000;
const maxUploadSize = 25 * 1024 * 1024;
const minUsefulPdfTextLength = 80;

function fileExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension ? `.${extension}` : "";
}

function normalizeExtractedText(text: string) {
  return text.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function capExtractedText(text: string) {
  if (text.length <= maxStoredTextLength) {
    return { text, warning: "" };
  }

  return {
    text: text.slice(0, maxStoredTextLength),
    warning:
      "Extracted text was shortened before returning to the browser to avoid storing excessive data locally.",
  };
}

function logExtraction(details: {
  fileName: string;
  fileType: string;
  fileSize: number;
  method: string;
  hasBuffer?: boolean;
  bufferBytes?: number;
  extractedCharacters?: number;
  error?: string;
}) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.info(
    `[extract] ${JSON.stringify({
      fileType: details.fileType,
      fileSize: details.fileSize,
      method: details.method,
      hasBuffer: details.hasBuffer,
      bufferBytes: details.bufferBytes,
      extractedCharacters: details.extractedCharacters ?? 0,
    })}`,
  );
}

async function extractDocxText(buffer: ArrayBuffer) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file("word/document.xml")?.async("string");

  if (!documentXml) {
    return "";
  }

  const text = documentXml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

  return normalizeExtractedText(text);
}

async function extractPdfText(buffer: ArrayBuffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdfWorker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  (globalThis as PdfWorkerGlobal).pdfjsWorker = {
    WorkerMessageHandler: pdfWorker.WorkerMessageHandler,
  };
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer.slice(0)),
    disableFontFace: true,
    isEvalSupported: false,
    isOffscreenCanvasSupported: false,
    useSystemFonts: true,
    useWorkerFetch: false,
  }).promise;
  const document = await loadingTask;
  const pages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const textContent = await page.getTextContent({
        disableNormalization: false,
        includeMarkedContent: false,
      });
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .filter(Boolean)
        .join(" ");

      if (pageText.trim()) {
        pages.push(pageText);
      }
    }

    return normalizeExtractedText(pages.join("\n\n"));
  } finally {
    if (typeof document.destroy === "function") {
      await document.destroy();
    }
  }
}

async function extractFile(file: File): Promise<ExtractionResponse> {
  const fileName = file.name;
  const fileType = fileExtension(fileName) || file.type || "unknown";
  const warnings: string[] = [];

  try {
    logExtraction({
      fileName,
      fileType,
      fileSize: file.size,
      method: "received:file",
      hasBuffer: typeof file.arrayBuffer === "function",
    });

    if (file.size > maxUploadSize) {
      logExtraction({
        fileName,
        fileType,
        fileSize: file.size,
        method: "guard:file-size",
        error: "File exceeds extraction size limit.",
      });

      return {
        extractedText: "",
        fileName,
        fileType,
        extractionStatus: "extraction_failed",
        warnings: [
          "We could not extract text from this file. You can still use it as source material or paste the text manually.",
        ],
      };
    }

    if (txtTypes.has(fileType) || file.type.startsWith("text/")) {
      const text = normalizeExtractedText(await file.text());
      const capped = capExtractedText(text);

      if (capped.warning) {
        warnings.push(capped.warning);
      }

      if (capped.text) {
        warnings.push("Text extracted successfully and added to your source materials.");
      } else {
        warnings.push(
          "We could not extract text from this file. You can still use it as source material or paste the text manually.",
        );
      }

      logExtraction({
        fileName,
        fileType,
        fileSize: file.size,
        method: "txt:file.text",
        extractedCharacters: capped.text.length,
      });

      return {
        extractedText: capped.text,
        fileName,
        fileType,
        extractionStatus: capped.text ? "extracted" : "extraction_failed",
        warnings,
      };
    }

    if (docxTypes.has(fileType)) {
      const buffer = await file.arrayBuffer();
      logExtraction({
        fileName,
        fileType,
        fileSize: file.size,
        method: "docx:buffer-loaded",
        hasBuffer: buffer.byteLength > 0,
        bufferBytes: buffer.byteLength,
      });
      const text = await extractDocxText(buffer);
      const capped = capExtractedText(text);

      if (capped.warning) {
        warnings.push(capped.warning);
      }

      if (!capped.text) {
        warnings.push(
          "We could not extract text from this file. You can still use it as source material or paste the text manually.",
        );
      } else {
        warnings.push("Text extracted successfully and added to your source materials.");
      }

      logExtraction({
        fileName,
        fileType,
        fileSize: file.size,
        method: "docx:word-document-xml",
        extractedCharacters: capped.text.length,
      });

      return {
        extractedText: capped.text,
        fileName,
        fileType,
        extractionStatus: capped.text ? "extracted" : "extraction_failed",
        warnings,
      };
    }

    if (pdfTypes.has(fileType)) {
      const buffer = await file.arrayBuffer();
      logExtraction({
        fileName,
        fileType,
        fileSize: file.size,
        method: "pdf:buffer-loaded",
        hasBuffer: buffer.byteLength > 0,
        bufferBytes: buffer.byteLength,
      });
      const text = await extractPdfText(buffer);
      const capped = capExtractedText(text);

      if (capped.warning) {
        warnings.push(capped.warning);
      }

      if (!capped.text || capped.text.length < minUsefulPdfTextLength) {
        warnings.push(
          "We could not extract text from this file. You can still use it as source material or paste the text manually.",
        );
      } else if (capped.text) {
        warnings.push("Text extracted successfully and added to your source materials.");
      }

      logExtraction({
        fileName,
        fileType,
        fileSize: file.size,
        method: "pdf:pdfjs-text-content",
        extractedCharacters: capped.text.length,
      });

      return {
        extractedText: capped.text,
        fileName,
        fileType,
        extractionStatus: capped.text.length >= minUsefulPdfTextLength ? "extracted" : "ocr_required",
        warnings,
      };
    }

    if (imageTypes.has(fileType)) {
      logExtraction({
        fileName,
        fileType,
        fileSize: file.size,
        method: "image:deferred",
        extractedCharacters: 0,
      });

      return {
        extractedText: "",
        fileName,
        fileType,
        extractionStatus: "unsupported_for_extraction",
        warnings: [
          "Image files are saved as reference material. Image OCR will be handled in a separate extraction step.",
        ],
      };
    }

    if (presentationTypes.has(fileType)) {
      logExtraction({
        fileName,
        fileType,
        fileSize: file.size,
        method: "presentation:reference-only",
        extractedCharacters: 0,
      });

      return {
        extractedText: "",
        fileName,
        fileType,
        extractionStatus: "unsupported_for_extraction",
        warnings: [
          "PowerPoint files are saved as reference material. Text extraction for presentations will be added later.",
        ],
      };
    }

    logExtraction({
      fileName,
      fileType,
      fileSize: file.size,
      method: "unsupported:reference-only",
      extractedCharacters: 0,
    });

    return {
      extractedText: "",
      fileName,
      fileType,
      extractionStatus: "unsupported_for_extraction",
      warnings: ["This file is saved as reference material. Text extraction is not supported for this format yet."],
    };
  } catch {
    console.error("[extract] extraction failed", { fileType });
    logExtraction({
      fileName,
      fileType,
      fileSize: file.size,
      method: "failed",
      extractedCharacters: 0,
    });

    return {
      extractedText: "",
      fileName,
      fileType,
      extractionStatus: "extraction_failed",
      warnings: [
        imageTypes.has(fileType)
          ? "We could not read text clearly from this image. Please upload a clearer file or paste the text manually."
          : "We could not extract text from this file. You can still use it as source material or paste the text manually.",
      ],
    };
  }
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json(
      {
        error: "A file field is required.",
      },
      { status: 400 },
    );
  }

  return Response.json(await extractFile(file));
}
