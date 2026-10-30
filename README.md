# Doc2EPUB — Document to EPUB Converter (Chuẩn EPUB 3 Reflowable)

Ứng dụng web chuyển đổi tài liệu đa định dạng (**PDF, Word DOCX, TXT, Markdown, HTML**) sang sách điện tử **EPUB 3 Reflowable** chuẩn quốc tế, hoạt động **100% trong trình duyệt (Client-Side Only)**, bảo mật dữ liệu tuyệt đối và hỗ trợ tiếng Việt hoàn hảo.

---

## 1. Tính năng đã hoàn thành

### Mức P0 — Bắt buộc & Cốt lõi
- [x] **Nhập & Kéo thả tài liệu**: Hỗ trợ `.pdf`, `.docx`, `.txt`, `.md`, `.html` với kiểm tra định dạng và cấu trúc tệp thực tế.
- [x] **DOCX (Word) sang EPUB**: Trích xuất qua Mammoth, bảo toàn thứ tự văn bản, heading, in đậm/nghiêng, danh sách, bảng biểu và hình ảnh nhúng.
- [x] **PDF có văn bản sang EPUB**: Trích xuất qua PDF.js, sắp xếp thứ tự đọc hình học (tọa độ Y/X), ghép dòng thông minh, loại bỏ ngắt đoạn lỗi.
- [x] **TXT, Markdown & HTML**:
  - Hỗ trợ chuẩn Unicode NFC tiếng Việt, xử lý BOM UTF-8.
  - Phân tích cú pháp Markdown (#, ##, blockquote, danh sách, bảng biểu ma trận).
  - Làm sạch mã HTML bằng DOMPurify chống XSS, giữ cấu trúc ngữ nghĩa an toàn.
- [x] **OCR cho PDF Scan**: Nhận dạng quang học qua Tesseract.js trực tiếp trên trình duyệt, phát hiện trang scan dạng ảnh, hỗ trợ tiếng Việt và tiếng Anh.
- [x] **Tự động nhận diện chương & tạo mục lục**: Phát hiện các mẫu tiêu đề tiếng Việt ("Chương 1", "Hồi 1", "Phần I", "Mục 1", "Lời mở đầu"...) và tiếng Anh.
- [x] **Tùy biến metadata & Ảnh bìa sách**: Chỉnh sửa tên sách, tác giả, ngôn ngữ (`vi`, `en`, `fr`...), tải ảnh bìa tùy chọn (JPG/PNG) chuẩn tỷ lệ máy đọc sách.
- [x] **Bản xem trước sách điện tử (Live Ebook Preview)**:
  - Xem trước nội dung thực tế đã chuẩn hóa.
  - Chuyển đổi phông chữ Serif (Lora) và Sans (Plus Jakarta Sans).
  - Tùy chỉnh kích thước chữ (A- / A+).
  - Điều hướng chương mượt mà, tính toán thời gian đọc ước tính.
- [x] **Đóng gói & Kiểm tra EPUB 3 Reflowable**:
  - Tệp `mimetype` đặt đầu tiên và lưu trữ không nén (`STORE`).
  - `META-INF/container.xml` trỏ chính xác đến gói OPF.
  - `OEBPS/content.opf` với định danh UUID chuẩn, metadata Dublin Core, manifest đầy đủ tài nguyên và spine.
  - `OEBPS/nav.xhtml` chuẩn HTML5 Navigation Document và `OEBPS/toc.ncx` tương thích ngược EPUB 2.
  - Tự kiểm tra cấu trúc (Self-validation) trước khi tải về.

### Mức P1 — Nâng cao & Tiện ích
- [x] **Chỉnh sửa mục lục (TOC Manager)**:
  - Cho phép đổi tên trực tiếp từng chương sách.
  - Ẩn/hiện chương khỏi mục lục EPUB mà không làm mất nội dung văn bản.
- [x] **Chế độ OCR linh hoạt**: Lựa chọn OCR các trang scan được phát hiện hoặc OCR toàn bộ tài liệu PDF.
- [x] **Hàng đợi chuyển đổi nhiều tệp (Batch Queue)**: Chọn nhiều tệp, xử lý tuần tự độc lập, lỗi một tệp không dừng toàn bộ hàng đợi, tải từng kết quả riêng.
- [x] **1-Click Test Samples**: Tích hợp sẵn 3 tài liệu mẫu tiếng Việt phong phú (Truyện Kiều, Cẩm nang Năng suất, Kiến trúc Web) để kiểm thử quy trình ngay lập tức.

---

## 2. Kiến trúc Hệ thống

Quy trình xử lý theo kiến trúc 6 giai đoạn nghiêm ngặt:

```text
Document Import (PDF, DOCX, TXT, MD, HTML)
       ↓
Document Extraction (PDF.js, Mammoth, Tesseract.js, DOMPurify)
       ↓
Content Normalization (Unicode NFC, Chapter Detector, Paragraph Stitcher)
       ↓
Unified Document Model (DocumentContent, Chapters, Elements, Metadata)
       ↓
EPUB 3 Generator (JSZip, OEBPS Structure, XML Escaping, Nav Document)
       ↓
Self-Validation & Client-Side Download
```

---

## 3. Thư viện sử dụng & Giấy phép

| Thư viện | Phiên bản | Mục đích sử dụng | Giấy phép |
|---|---|---|---|
| `react` & `react-dom` | ^19.0.1 | Giao diện người dùng và quản lý trạng thái | MIT |
| `pdfjs-dist` | ^4.10.38 | Trích xuất văn bản và render trang PDF | Apache-2.0 |
| `mammoth` | ^1.9.1 | Trích xuất Word (.docx) và chuyển đổi hình ảnh inline | BSD-2-Clause |
| `jszip` | ^3.10.1 | Đóng gói lưu trữ ZIP chuẩn EPUB không nén mimetype | MIT / GPLv3 |
| `tesseract.js` | ^6.0.0 | Nhận diện ký tự quang học (OCR) trên trình duyệt | Apache-2.0 |
| `dompurify` | ^3.2.4 | Làm sạch HTML an toàn, chống lỗ hổng XSS | Apache-2.0 / MPL-2.0 |
| `lucide-react` | ^0.546.0 | Hệ thống biểu tượng giao diện | ISC |
| `tailwindcss` | ^4.3.3 | Thiết kế giao diện Modern Minimal SaaS | MIT |

---

## 4. Báo cáo Kiểm thử

### Unit Tests (Logic Cốt lõi)
Chạy bằng Node.js Test Runner qua `npx tsx --test`:
- `normalizeUnicode`: Bảo toàn dấu tiếng Việt và chuyển đổi sang chuẩn Unicode NFC.
- `cleanText`: Chuẩn hóa khoảng trắng và xử lý non-breaking space.
- `escapeXml`: Thoát ký tự đặc biệt (`&`, `<`, `>`, `"`, `'`) cho chuẩn XHTML/XML.
- `isChapterHeader`: Nhận diện chính xác các biến thể chương tiếng Việt ("Chương 1", "Hồi 1", "Phần I", "Mở đầu", "Kết luận") và tiếng Anh.
- `groupIntoChapters`: Phân tách các phần tử nội dung thành các chương độc lập.
- `stitchBrokenParagraphs`: Nối các dòng ngắt đoạn không hoàn chỉnh trong PDF/TXT.
- `calculateDocumentStats`: Đếm chính xác số từ, ký tự, đoạn văn và hình ảnh.
- `generateEpub`: Kiểm tra cấu trúc lưu trữ ZIP, vị trí file `mimetype` đầu tiên không nén, `container.xml`, và `content.opf`.

**Kết quả: 8/8 tests PASSED (100%)**.

### Kiểm thử Giao diện & Trình duyệt (Browser Automation)
- **Desktop (1440x900)**: Layout 2 cột cân xứng (Settings & TOC Manager bên trái, Reader Preview bên phải), các nút điều khiển, thanh công cụ đọc sách, kết quả thành công và nút tải về hoạt động mượt mà.
- **Mobile (390x844)**: Layout reflow dọc mượt mà, thanh Top bar tối ưu vùng hiển thị, modal hàng đợi co giãn chuẩn không bị tràn chiều ngang.

---

## 5. Hướng dẫn Chạy & Triển khai

### Chạy môi trường phát triển:
```bash
npm install
npm run dev
```

### Chạy bộ kiểm thử:
```bash
npx tsx --test src/utils/*.test.ts
```

### Đóng gói Production:
```bash
npm run build
```
Thư mục `dist/` sẵn sàng triển khai trực tiếp lên các nền tảng tĩnh như **Vercel, Cloudflare Pages, Netlify hoặc GitHub Pages** mà không cần bất kỳ cấu hình máy chủ nào.
