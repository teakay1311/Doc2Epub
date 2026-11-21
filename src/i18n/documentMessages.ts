import type { Language } from './translations';

const messages: Record<string, [string, string]> = {
  EMPTY_FILE: ['Tệp đang rỗng.', 'The file is empty.'],
  FILE_TOO_LARGE: ['Tệp vượt giới hạn 80 MiB.', 'The file exceeds 80 MiB.'],
  UNSUPPORTED_FILE: ['Định dạng tệp không được hỗ trợ.', 'This file format is unsupported.'],
  NO_CONTENT: ['Chưa có nội dung để xuất EPUB. Hãy chạy OCR nếu tài liệu là bản scan.', 'There is no content to export. Run OCR if this document is scanned.'],
  EPUB_TITLE_EMPTY: ['Tên sách trong EPUB đang trống.', 'The EPUB book title is empty.'],
  EPUB_CHAPTER_TITLE_EMPTY: ['Tên trang chương trong EPUB đang trống.', 'An EPUB chapter page has an empty title.'],
  EPUB_TOC_LABEL_EMPTY: ['Nhãn mục lục trong EPUB đang trống.', 'An EPUB table of contents entry has an empty label.'],
  OCR_CHAPTER_EDITS_UNMATCHED: ['Không thể ghép các chương đã chỉnh sửa với kết quả OCR. Đã giữ nguyên tài liệu trước OCR.', 'The OCR result could not be matched to the edited chapters. The document was kept as it was before OCR.'],
  SAVE_PERMISSION_DENIED: ['Không có quyền ghi EPUB vào vị trí đã chọn.', 'Permission denied when saving the EPUB to the selected location.'],
  INVALID_COVER: ['Không thể đưa ảnh bìa này vào EPUB.', 'The cover could not be included in the EPUB.'],
  INVALID_EMBEDDED_IMAGE: ['Không thể đưa một số ảnh nhúng vào EPUB.', 'Some embedded images could not be included in the EPUB.'],
  INVALID_PDF: ['Tệp PDF bị hỏng hoặc có cấu trúc không hợp lệ.', 'The PDF is damaged or has an invalid structure.'],
  PDF_PASSWORD_REQUIRED: ['PDF yêu cầu mật khẩu. Hãy mở khóa bản sao trước khi chuyển đổi.', 'This PDF requires a password. Unlock a copy before converting it.'],
  JPEG_CHECK_FAILED: ['Không thể chạy bộ kiểm tra ảnh JPEG. Hãy thử xuất lại.', 'The JPEG validator failed. Try exporting again.'],
  JPEG_CHECK_TIMEOUT: ['Kiểm tra ảnh JPEG vượt quá 30 giây. Hãy thử xuất lại.', 'JPEG validation exceeded 30 seconds. Try exporting again.'],
  JPEG_CHECK_LIMIT: ['Ảnh JPEG vượt giới hạn xử lý của bộ kiểm tra ảnh.', 'A JPEG exceeds the image validator’s resource limits.'],
  PNG_CHECK_FAILED: ['Không thể chạy bộ kiểm tra ảnh PNG. Hãy thử xuất lại.', 'The PNG validator failed. Try exporting again.'],
  PNG_CHECK_TIMEOUT: ['Kiểm tra ảnh PNG vượt quá 30 giây. Hãy thử xuất lại.', 'PNG validation exceeded 30 seconds.'],
  EPUB_SAVED: ['Đã lưu EPUB.', 'EPUB saved.']
};

export function documentErrorCode(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  if (error.name === 'InvalidPDFException') return 'INVALID_PDF';
  if (error.name === 'PasswordException') return 'PDF_PASSWORD_REQUIRED';
  return error.message;
}

export function formatDocumentMessage(message: string, language: Language): string {
  const index = language === 'vi' ? 0 : 1;
  return message.split('\n')
    .map(line => Object.hasOwn(messages, line) ? messages[line][index] : line)
    .join('\n');
}

export type DocumentNotice =
  | { kind: 'error'; message: string }
  | { kind: 'saved'; warnings: string[] };

export function formatDocumentNotice(notice: DocumentNotice, language: Language): string {
  if (notice.kind === 'error') return formatDocumentMessage(notice.message, language);
  return ['EPUB_SAVED', ...notice.warnings].map(code => formatDocumentMessage(code, language)).join(' ');
}
