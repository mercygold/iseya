export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExtractionStatus = "extracted" | "metadata_only" | "unsupported" | "failed";

type ExtractionResponse = {
  extractedText: string;
  fileName: string;
  fileType: string;
  extractionStatus: ExtractionStatus;
  warnings: string[];
};

const imageTypes = new Set([".png", ".jpg", ".jpeg"]);
const maxStoredTextLength = 120000;

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
  const document = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
  }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .filter(Boolean)
      .join(" ");

    if (pageText.trim()) {
      pages.push(pageText);
    }
  }

  return normalizeExtractedText(pages.join("\n\n"));
}

async function extractFile(file: File): Promise<ExtractionResponse> {
  const fileName = file.name;
  const fileType = fileExtension(fileName) || file.type || "unknown";
  const warnings: string[] = [];

  try {
    if (fileType === ".txt" || file.type.startsWith("text/")) {
      const text = normalizeExtractedText(await file.text());
      const capped = capExtractedText(text);

      if (capped.warning) {
        warnings.push(capped.warning);
      }

      return {
        extractedText: capped.text,
        fileName,
        fileType,
        extractionStatus: capped.text ? "extracted" : "metadata_only",
        warnings,
      };
    }

    if (fileType === ".docx") {
      const text = await extractDocxText(await file.arrayBuffer());
      const capped = capExtractedText(text);

      if (capped.warning) {
        warnings.push(capped.warning);
      }

      if (!capped.text) {
        warnings.push("No readable DOCX text was found in this file.");
      }

      return {
        extractedText: capped.text,
        fileName,
        fileType,
        extractionStatus: capped.text ? "extracted" : "metadata_only",
        warnings,
      };
    }

    if (fileType === ".pdf") {
      const text = await extractPdfText(await file.arrayBuffer());
      const capped = capExtractedText(text);

      if (capped.warning) {
        warnings.push(capped.warning);
      }

      if (!capped.text) {
        warnings.push("No readable PDF text was found. Scanned PDFs may require OCR later.");
      }

      return {
        extractedText: capped.text,
        fileName,
        fileType,
        extractionStatus: capped.text ? "extracted" : "metadata_only",
        warnings,
      };
    }

    if (imageTypes.has(fileType)) {
      return {
        extractedText: "",
        fileName,
        fileType,
        extractionStatus: "metadata_only",
        warnings: ["Image uploaded. OCR will be enabled later."],
      };
    }

    return {
      extractedText: "",
      fileName,
      fileType,
      extractionStatus: "unsupported",
      warnings: ["This file type is saved as metadata only. Text extraction is not supported yet."],
    };
  } catch {
    return {
      extractedText: "",
      fileName,
      fileType,
      extractionStatus: "failed",
      warnings: ["Text extraction failed. File metadata was saved for source tracking."],
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
