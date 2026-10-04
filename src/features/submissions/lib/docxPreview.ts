export type DocxRun = {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
};

export type DocxParagraphBlock = {
  type: "paragraph";
  style: "title" | "heading1" | "heading2" | "heading3" | "normal";
  align: "left" | "center" | "right" | "justify";
  runs: DocxRun[];
  bullet: boolean;
};

export type DocxTableBlock = {
  type: "table";
  rows: string[][];
};

export type DocxPreviewBlock = DocxParagraphBlock | DocxTableBlock;

export type DocxPreviewDocument = {
  blocks: DocxPreviewBlock[];
};

type ZipEntry = {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
};

function findEndOfCentralDirectory(bytes: Uint8Array) {
  const minimumOffset = Math.max(0, bytes.length - 65_557);
  for (let offset = bytes.length - 22; offset >= minimumOffset; offset -= 1) {
    if (
      bytes[offset] === 0x50 &&
      bytes[offset + 1] === 0x4b &&
      bytes[offset + 2] === 0x05 &&
      bytes[offset + 3] === 0x06
    ) {
      return offset;
    }
  }
  return -1;
}

function readZipEntries(buffer: ArrayBuffer): ZipEntry[] {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const eocdOffset = findEndOfCentralDirectory(bytes);
  if (eocdOffset < 0) throw new Error("The DOCX archive could not be read.");

  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const decoder = new TextDecoder("utf-8");
  const entries: ZipEntry[] = [];
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error("The DOCX archive directory is invalid.");
    }

    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const nameBytes = bytes.slice(offset + 46, offset + 46 + fileNameLength);

    entries.push({
      name: decoder.decode(nameBytes),
      compressionMethod,
      compressedSize,
      localHeaderOffset,
    });

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

async function extractZipEntry(
  buffer: ArrayBuffer,
  entry: ZipEntry,
): Promise<Uint8Array> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const offset = entry.localHeaderOffset;
  if (view.getUint32(offset, true) !== 0x04034b50) {
    throw new Error("The DOCX file entry is invalid.");
  }

  const fileNameLength = view.getUint16(offset + 26, true);
  const extraLength = view.getUint16(offset + 28, true);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const compressed = bytes.slice(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) return compressed;
  if (
    entry.compressionMethod !== 8 ||
    typeof DecompressionStream === "undefined"
  ) {
    throw new Error("DOCX preview is not supported by this browser.");
  }

  const stream = new Blob([compressed])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  const output = await new Response(stream).arrayBuffer();
  return new Uint8Array(output);
}

function childElements(element: Element, localName: string) {
  return Array.from(element.children).filter(
    (child) => child.localName === localName,
  );
}

function firstChild(element: Element, localName: string) {
  return childElements(element, localName)[0] ?? null;
}

function attributeValue(element: Element | null, localName: string) {
  if (!element) return null;
  return (
    Array.from(element.attributes).find(
      (attribute) => attribute.localName === localName,
    )?.value ?? null
  );
}

function parseRun(run: Element): DocxRun {
  const properties = firstChild(run, "rPr");
  let text = "";

  for (const child of Array.from(run.children)) {
    if (child.localName === "t") text += child.textContent ?? "";
    if (child.localName === "tab") text += "\t";
    if (child.localName === "br" || child.localName === "cr") text += "\n";
  }

  return {
    text,
    bold: Boolean(properties && firstChild(properties, "b")),
    italic: Boolean(properties && firstChild(properties, "i")),
    underline: Boolean(properties && firstChild(properties, "u")),
  };
}

function paragraphStyle(paragraph: Element): DocxParagraphBlock["style"] {
  const properties = firstChild(paragraph, "pPr");
  const styleName = attributeValue(
    firstChild(properties ?? paragraph, "pStyle"),
    "val",
  )
    ?.toLowerCase()
    .replace(/\s+/g, "");

  if (styleName?.includes("title")) return "title";
  if (styleName?.includes("heading1")) return "heading1";
  if (styleName?.includes("heading2")) return "heading2";
  if (styleName?.includes("heading3")) return "heading3";
  return "normal";
}

function paragraphAlignment(paragraph: Element): DocxParagraphBlock["align"] {
  const properties = firstChild(paragraph, "pPr");
  const value = attributeValue(
    firstChild(properties ?? paragraph, "jc"),
    "val",
  );
  if (value === "center" || value === "right" || value === "both") {
    return value === "both" ? "justify" : value;
  }
  return "left";
}

function parseParagraph(paragraph: Element): DocxParagraphBlock {
  const properties = firstChild(paragraph, "pPr");
  const bullet = Boolean(properties && firstChild(properties, "numPr"));
  const runs = childElements(paragraph, "r")
    .map(parseRun)
    .filter((run) => run.text.length > 0);

  if (runs.length === 0) {
    const fallback = Array.from(paragraph.getElementsByTagName("w:t"))
      .map((node) => node.textContent ?? "")
      .join("");
    if (fallback) {
      runs.push({
        text: fallback,
        bold: false,
        italic: false,
        underline: false,
      });
    }
  }

  return {
    type: "paragraph",
    style: paragraphStyle(paragraph),
    align: paragraphAlignment(paragraph),
    runs,
    bullet,
  };
}

function parseTable(table: Element): DocxTableBlock {
  const rows = childElements(table, "tr").map((row) =>
    childElements(row, "tc").map((cell) =>
      Array.from(cell.getElementsByTagName("w:p"))
        .map((paragraph) =>
          Array.from(paragraph.getElementsByTagName("w:t"))
            .map((node) => node.textContent ?? "")
            .join(""),
        )
        .filter(Boolean)
        .join("\n"),
    ),
  );
  return { type: "table", rows };
}

export async function parseDocxPreview(
  buffer: ArrayBuffer,
): Promise<DocxPreviewDocument> {
  const entries = readZipEntries(buffer);
  const documentEntry = entries.find(
    (entry) => entry.name === "word/document.xml",
  );
  if (!documentEntry)
    throw new Error(
      "This DOCX file does not contain a readable document body.",
    );

  const xmlBytes = await extractZipEntry(buffer, documentEntry);
  const xml = new TextDecoder("utf-8").decode(xmlBytes);
  const parsed = new DOMParser().parseFromString(xml, "application/xml");
  if (parsed.querySelector("parsererror")) {
    throw new Error("The DOCX document could not be parsed.");
  }

  const body = Array.from(parsed.getElementsByTagName("w:body"))[0];
  if (!body) throw new Error("The DOCX document body could not be found.");

  const blocks: DocxPreviewBlock[] = [];
  for (const child of Array.from(body.children)) {
    if (child.localName === "p") blocks.push(parseParagraph(child));
    if (child.localName === "tbl") blocks.push(parseTable(child));
  }

  return { blocks };
}
