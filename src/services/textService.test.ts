import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMarkdown, parsePlainText } from './textService';

test('parseMarkdown extracts headings, blockquotes, lists, and tables', () => {
  const md = `# Tiêu đề chính

Lời dẫn mở đầu cuốn sách.

> "Trích dẫn triết lý sâu sắc"

## Chương 1: Bảng dữ liệu ma trận

| Cột A | Cột B |
|---|---|
| Dữ liệu 1 | Dữ liệu 2 |
| Dữ liệu 3 | Dữ liệu 4 |

- Danh sách ý 1
- Danh sách ý 2
`;

  const doc = parseMarkdown(md, 'test.md', 100);
  assert.equal(doc.fileType, 'md');
  assert.ok(doc.chapters.length >= 2);

  // Check chapter with table
  const chWithTable = doc.chapters.find(c => c.title.includes('Chương 1'));
  assert.ok(chWithTable);
  const tableEl = chWithTable.elements.find(el => el.type === 'table');
  assert.ok(tableEl);
  assert.deepEqual(tableEl.headers, ['Cột A', 'Cột B']);
  assert.equal(tableEl.rows?.length, 2);
});

test('parsePlainText extracts chapters from Vietnamese pattern', () => {
  const txt = `Lời mở đầu
Đây là nội dung mở đầu.

Chương 1: Khởi hành
Đoàn người bắt đầu lên đường.

Chương 2: Đến đích
Cuộc hành trình kết thúc tốt đẹp.
`;

  const doc = parsePlainText(txt, 'test.txt', 80);
  assert.equal(doc.chapters.length, 3);
  assert.equal(doc.chapters[0].title, 'Lời mở đầu');
  assert.equal(doc.chapters[1].title, 'Chương 1: Khởi hành');
  assert.equal(doc.chapters[2].title, 'Chương 2: Đến đích');
});
