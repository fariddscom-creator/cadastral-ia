import { deflateRawSync } from 'node:zlib';
import { needsReview, referenceCount } from './review-status';
import type { Task } from './store';

const columnWidths = [25, 16, 22, 12, 14, 13, 34, 34, 48, 60];

function uniqueText(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function reviewReason(task: Task) {
  if (task.error) return `Erreur d'analyse : ${task.error}`;
  const count = referenceCount(task);
  return `Moins de 2 références nommées distinctes (${count} trouvée${count > 1 ? 's' : ''}).`;
}

function xml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function columnName(index: number) {
  let name = '';
  for (let current = index; current > 0; current = Math.floor((current - 1) / 26)) name = String.fromCharCode(65 + ((current - 1) % 26)) + name;
  return name;
}

function cell(address: string, value: string | number, style = 0) {
  if (typeof value === 'number') return `<c r="${address}" s="${style}"><v>${value}</v></c>`;
  return `<c r="${address}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
}

function wrappedLines(value: string, columnWidth: number) {
  return value.split('\n').reduce((lines, part) => lines + Math.max(1, Math.ceil(part.length / columnWidth)), 0);
}

function crc32(input: Buffer) {
  let crc = 0xffffffff;
  for (const byte of input) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zip(files: Array<{ name: string; content: string }>) {
  const sections: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name);
    const uncompressed = Buffer.from(file.content, 'utf8');
    const compressed = deflateRawSync(uncompressed);
    const crc = crc32(uncompressed);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(compressed.length, 18); local.writeUInt32LE(uncompressed.length, 22);
    local.writeUInt16LE(name.length, 26); sections.push(local, name, compressed);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0); directory.writeUInt16LE(20, 4); directory.writeUInt16LE(20, 6); directory.writeUInt16LE(8, 10);
    directory.writeUInt32LE(crc, 16); directory.writeUInt32LE(compressed.length, 20); directory.writeUInt32LE(uncompressed.length, 24);
    directory.writeUInt16LE(name.length, 28); directory.writeUInt32LE(offset, 42); central.push(directory, name);
    offset += local.length + name.length + compressed.length;
  }
  const centralSize = central.reduce((size, value) => size + value.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(centralSize, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...sections, ...central, end]);
}

function worksheetXml(tasks: Task[]) {
  const headers = ['Fichier source', 'Wilaya', 'Commune', 'District', 'État', 'Références', 'Repères', 'Voies nommées', 'Motif de revue', 'Avertissements'];
  const rows = [
    `<row r="1" ht="24" customHeight="1">${cell('A1', `Districts à revoir (${tasks.length})`, 1)}</row>`,
    `<row r="2">${cell('A2', 'Extraction Vision Qwen - repères insuffisants ou erreur d’analyse', 2)}</row>`,
    `<row r="3" ht="30" customHeight="1">${headers.map((header, index) => cell(`${columnName(index + 1)}3`, header, 3)).join('')}</row>`,
    ...tasks.map((task, taskIndex) => {
      const row = taskIndex + 4; const result = task.result;
      const values: Array<string | number> = [task.fileName, result?.administrative.wilaya || '', result?.administrative.commune || '', result?.administrative.districtNumber ? Number(result.administrative.districtNumber) : '', task.error ? 'Erreur' : 'À revoir', referenceCount(task), uniqueText(result?.landmarks || []).join('\n'), uniqueText(result?.streets || []).join('\n'), reviewReason(task), uniqueText(result?.warnings || []).join('\n')];
      const height = Math.min(150, Math.max(30, 14 * Math.max(wrappedLines(String(values[6]), 32), wrappedLines(String(values[7]), 32), wrappedLines(String(values[8]), 44), wrappedLines(String(values[9]), 56))));
      return `<row r="${row}" ht="${height}" customHeight="1">${values.map((value, index) => cell(`${columnName(index + 1)}${row}`, value, index === 3 ? 6 : index === 4 ? 4 : 5)).join('')}</row>`;
    }),
  ].join('');
  const widths = columnWidths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join('');
  const lastRow = Math.max(3, tasks.length + 3);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths}</cols><sheetData>${rows}</sheetData><autoFilter ref="A3:J${lastRow}"/><mergeCells count="2"><mergeCell ref="A1:J1"/><mergeCell ref="A2:J2"/></mergeCells></worksheet>`;
}

export function buildReviewExport(tasks: Task[]): Buffer {
  const reviewed = tasks.filter(needsReview).sort((left, right) => left.fileName.localeCompare(right.fileName, 'fr'));
  const now = new Date().toISOString();
  return zip([
    { name: '[Content_Types].xml', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>' },
    { name: '_rels/.rels', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>' },
    { name: 'docProps/core.xml', content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>Cadst-IA</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created></cp:coreProperties>` },
    { name: 'docProps/app.xml', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Cadst-IA</Application></Properties>' },
    { name: 'xl/workbook.xml', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="À revoir" sheetId="1" r:id="rId1"/></sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
    { name: 'xl/styles.xml', content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="000"/></numFmts><fonts count="4"><font><sz val="10"/><name val="Arial"/></font><font><b/><sz val="14"/><color rgb="FFFFFFFF"/><name val="Arial"/></font><font><i/><color rgb="FF475569"/><name val="Arial"/></font><font><b/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F766E"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF334155"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><bottom style="thin"><color rgb="FFE2E8F0"/></bottom></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="7"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs></styleSheet>' },
    { name: 'xl/worksheets/sheet1.xml', content: worksheetXml(reviewed) },
  ]);
}
