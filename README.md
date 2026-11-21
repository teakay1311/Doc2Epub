# Doc2EPUB cho macOS

Doc2EPUB chuyển PDF, Word (.docx), TXT, Markdown và HTML thành sách EPUB 3 có chữ tự dàn theo màn hình. Bản 1.0 dành cho **Apple Silicon**. Bundle đặt mốc tối thiểu **macOS 15**.

## Cài và dùng

1. Tải [Doc2EPUB-1.0.0-arm64.dmg](https://github.com/teakay1311/Doc2Epub/releases/download/v1.0.0/Doc2EPUB-1.0.0-arm64.dmg), mở tệp và kéo **Doc2EPUB** vào **Applications**.
2. Kéo thả tài liệu vào cửa sổ hoặc nhấn **⌘O**. Nếu chọn nhiều tệp, ứng dụng mở hàng đợi.
3. Xem trước và mở **Tùy chọn sách** để chỉnh tên sách, tác giả, bìa hoặc mục lục.
4. Với PDF scan, chọn **OCR trang scan** hoặc **OCR toàn bộ PDF**. Hàng đợi tự OCR các trang nghi là scan với tiếng Việt và tiếng Anh. Cảnh báo cho biết trang nào OCR xong mà không tìm thấy chữ.
5. Nhấn **⌘↵** và chọn nơi lưu EPUB. Trong hàng đợi, lưu từng kết quả từ dòng tương ứng.

Menu **Trợ giúp** có ba tài liệu mẫu. Đổi giao diện trong **Doc2EPUB → Cài đặt**. Giới hạn đầu vào là 80 MiB mỗi tệp. PDF có mật khẩu cần được mở khóa trước khi chuyển đổi. Tài nguyên PDF và OCR đi kèm bản cài để sử dụng ngay khi offline.

Bản DMG dùng chữ ký ad hoc và chưa được Apple notarize.

## Build lại trên Apple Silicon

Cần Node.js 24 trở lên, Rust stable và Xcode hoặc Xcode Command Line Tools.

```sh
npm ci --include=optional
npm run lint
npm test
npm run build:mac
```

Script tạo `out/Doc2EPUB.app`, DMG và tệp SHA-256. Để mở ứng dụng trong môi trường phát triển, chạy `npm run tauri -- dev`.

Với lỗi linker `mis-aligned LINKEDIT string pool` trên Xcode 27, có thể dùng macOS 26.5 SDK từ Command Line Tools cùng linker LLD của Rust bằng lệnh sau.

```sh
DOC2EPUB_USE_SDK26=1 npm run build:mac
```

Kiểm tra phần ghi tệp của lớp macOS với `cargo test --locked --manifest-path src-tauri/Cargo.toml`. Chạy `npm run build` trước khi chạy Cargo trực tiếp để tạo tài nguyên web mà macro Tauri cần.

## Giấy phép

Doc2EPUB dùng Apache License 2.0. Thông tin giấy phép PDF.js, Tesseract và dữ liệu OCR đi kèm tài nguyên trong ứng dụng.
