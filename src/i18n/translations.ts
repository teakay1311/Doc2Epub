export type Language = 'vi' | 'en';

export interface Translations {
  header: {
    converter: string;
    samples: string;
    features: string;
    privacy: string;
    batchQueue: string;
    subtitle: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
  };
  uploader: {
    titleDrop: string;
    titleSelect: string;
    desc: string;
    pdfBadge: string;
    docxBadge: string;
    txtBadge: string;
    htmlBadge: string;
    errorTitle: string;
    unsupportedAlert: string;
  };
  samples: {
    heading: string;
    subheading: string;
    sampleKieuDesc: string;
    sampleProdDesc: string;
    sampleTechDesc: string;
  };
  settings: {
    title: string;
    bookTitleLabel: string;
    bookTitlePlaceholder: string;
    authorLabel: string;
    authorPlaceholder: string;
    langLabel: string;
    coverLabel: string;
    coverFormat: string;
    coverReady: string;
    coverRemove: string;
    coverPrompt: string;
    coverRatioHint: string;
    coverSuggestionsHeading: string;
    coverSuggestionsSub: string;
    activeCoverBadge: string;
    useAsCoverBtn: string;
    customCoverUpload: string;
    autoStyledCover: string;
    words: string;
    characters: string;
    pages: string;
    changeFile: string;
  };
  chapters: {
    title: string;
    subtitle: string;
    renameHint: string;
    saveRename: string;
    tocToggleHint: string;
    tocToggleHelp: string;
    emptyChapter: string;
  };
  preview: {
    title: string;
    readingTime: string;
    serif: string;
    sans: string;
    decreaseFont: string;
    increaseFont: string;
    chapterNumber: string;
    noContent: string;
    prevChapter: string;
    nextChapter: string;
  };
  conversion: {
    convertBtn: string;
    convertShortcutHint: string;
    standardHint: string;
    modalTitle: string;
    modalSubtitle: string;
    cancelBtn: string;
    cancelShortcutHint: string;
    step1: string;
    step2: string;
    step3: string;
  };
  result: {
    successTitle: string;
    successDesc: string;
    downloadBtn: string;
    convertAnotherBtn: string;
    readerHint: string;
    mimetypeValid: string;
    tocValid: string;
    opfValid: string;
    unicodeValid: string;
  };
  batch: {
    title: string;
    subtitle: string;
    addFiles: string;
    startAll: string;
    processing: string;
    emptyTitle: string;
    emptyDesc: string;
    pending: string;
    inProgress: string;
    done: string;
    error: string;
    download: string;
    remove: string;
  };
  ocr: {
    title: string;
    detectedScan: string;
    improveHint: string;
    recognizing: string;
    renderingPage: string;
    cancelBtn: string;
    langSelectLabel: string;
    langBoth: string;
    langVi: string;
    langEn: string;
    btnScannedOnly: string;
    btnAll: string;
  };
  footer: {
    title: string;
    subtitle: string;
    privacyNote: string;
  };
  features: {
    sectionTitle: string;
    sectionSubtitle: string;
    f1Title: string;
    f1Desc: string;
    f2Title: string;
    f2Desc: string;
    f3Title: string;
    f3Desc: string;
  };
}

export const translations: Record<Language, Translations> = {
  vi: {
    header: {
      converter: 'Chuyển đổi',
      samples: 'Tài liệu mẫu',
      features: 'Tính năng chuẩn EPUB 3',
      privacy: 'Bảo mật 100% Client',
      batchQueue: 'Hàng đợi',
      subtitle: 'Bộ chuyển đổi sách điện tử'
    },
    hero: {
      badge: 'Tiêu chuẩn EPUB 3 Reflowable Quốc tế',
      title: 'Chuyển tài liệu sang EPUB dễ dàng',
      subtitle: 'Chuyển đổi PDF, Word và tài liệu văn bản thành EPUB để đọc trên thiết bị yêu thích. Xử lý trực tiếp trong trình duyệt, bảo mật 100%.'
    },
    uploader: {
      titleDrop: 'Kéo thả tài liệu vào đây hoặc',
      titleSelect: 'chọn từ máy tính',
      desc: 'Hỗ trợ các định dạng PDF, Word (.docx), TXT, Markdown (.md) và HTML. Xử lý trực tiếp trong trình duyệt, không tải lên server.',
      pdfBadge: 'PDF (Văn bản & Scan)',
      docxBadge: 'Word (.docx)',
      txtBadge: 'TXT / Markdown',
      htmlBadge: 'HTML',
      errorTitle: 'Đã xảy ra sự cố trích xuất:',
      unsupportedAlert: 'Định dạng tệp không được hỗ trợ. Vui lòng chọn PDF, DOCX, TXT, MD hoặc HTML.'
    },
    samples: {
      heading: 'Hoặc thử nhanh với tài liệu mẫu có sẵn (1-Click Test):',
      subheading: 'Không cần chuẩn bị tệp',
      sampleKieuDesc: 'Văn bản văn học cổ điển Việt Nam với 3 hồi hoàn chỉnh, thơ lục bát và lời bình.',
      sampleProdDesc: 'Tài liệu Markdown chuẩn với tiêu đề, danh sách, bảng biểu ma trận Eisenhower và trích dẫn.',
      sampleTechDesc: 'Tài liệu HTML chứa bảng, trích dẫn, khối mã và danh sách định dạng.'
    },
    settings: {
      title: 'Thiết lập sách',
      bookTitleLabel: 'Tên sách (Tiêu đề EPUB)',
      bookTitlePlaceholder: 'Nhập tên cuốn sách...',
      authorLabel: 'Tác giả (Tùy chọn)',
      authorPlaceholder: 'Tác giả hoặc người dịch...',
      langLabel: 'Ngôn ngữ chính',
      coverLabel: 'Ảnh bìa sách (Tùy chọn)',
      coverFormat: 'Định dạng JPG/PNG',
      coverReady: '✓ Đã sẵn sàng đóng gói vào EPUB',
      coverRemove: 'Xóa ảnh bìa',
      coverPrompt: 'Bấm để tải ảnh bìa từ máy tính',
      coverRatioHint: 'Tỷ lệ chuẩn 3:4 hoặc 2:3 cho kết quả đẹp nhất trên mọi máy đọc sách',
      coverSuggestionsHeading: 'Gợi ý ảnh bìa từ tài liệu',
      coverSuggestionsSub: 'Tự động quét trang đầu và hình ảnh có sẵn trong tài liệu',
      activeCoverBadge: 'Đang dùng làm bìa',
      useAsCoverBtn: 'Chọn làm bìa',
      customCoverUpload: 'Hoặc tải ảnh bìa riêng từ máy tính',
      autoStyledCover: 'Bìa thiết kế tự động',
      words: 'từ',
      characters: 'ký tự',
      pages: 'trang',
      changeFile: 'Đổi tệp'
    },
    chapters: {
      title: 'Mục lục & Chương sách',
      subtitle: 'Tự động nhận diện · Tùy chỉnh nhanh',
      renameHint: 'Đổi tên chương',
      saveRename: 'Lưu tên',
      tocToggleHint: 'Có hiển thị trong mục lục EPUB',
      tocToggleHelp: '* Bấm vào ô kiểm để bật/tắt hiển thị chương trong mục lục EPUB mà không làm mất nội dung văn bản.',
      emptyChapter: 'Chương này chưa có nội dung.'
    },
    preview: {
      title: 'Bản xem trước sách điện tử',
      readingTime: 'phút đọc',
      serif: 'Serif',
      sans: 'Sans',
      decreaseFont: 'Giảm cỡ chữ',
      increaseFont: 'Tăng cỡ chữ',
      chapterNumber: 'Chương',
      noContent: 'Chương này chưa có nội dung hoặc chỉ bao gồm tiêu đề.',
      prevChapter: 'Chương trước',
      nextChapter: 'Chương sau'
    },
    conversion: {
      convertBtn: 'Chuyển đổi sang EPUB',
      convertShortcutHint: 'Phím tắt',
      standardHint: 'Đóng gói EPUB 3 Reflowable chuẩn Dublin Core & W3C',
      modalTitle: 'Đang chuyển đổi tài liệu sang EPUB',
      modalSubtitle: 'Quá trình diễn ra 100% trong trình duyệt của bạn',
      cancelBtn: 'Hủy tác vụ',
      cancelShortcutHint: 'phím Esc',
      step1: 'Đang tạo cấu trúc EPUB 3...',
      step2: 'Đang nén các tệp XHTML & stylesheet...',
      step3: 'Đang kiểm tra tính hợp lệ của tệp EPUB...'
    },
    result: {
      successTitle: 'Chuyển đổi sang EPUB thành công!',
      successDesc: 'Sách điện tử chuẩn EPUB 3 Reflowable đã được tạo và vượt qua tự kiểm tra cấu trúc.',
      downloadBtn: 'Tải tệp sách EPUB (.epub)',
      convertAnotherBtn: 'Chuyển đổi tệp khác',
      readerHint: 'Bạn có thể đọc tệp này bằng Apple Books, Google Play Sách, Calibre, Kobo hoặc các ứng dụng đọc EPUB trên điện thoại và máy đọc sách.',
      mimetypeValid: 'Mimetype chuẩn không nén',
      tocValid: 'Mục lục hoàn chỉnh',
      opfValid: 'Đặc tả gói OPF & NCX',
      unicodeValid: 'Unicode tiếng Việt chuẩn NFC'
    },
    batch: {
      title: 'Hàng đợi chuyển đổi nhiều tệp (Batch Queue)',
      subtitle: 'Xử lý tuần tự từng tài liệu và tải từng tệp EPUB độc lập',
      addFiles: 'Thêm tệp vào hàng đợi',
      startAll: 'Bắt đầu chuyển đổi tất cả',
      processing: 'Đang xử lý hàng đợi...',
      emptyTitle: 'Hàng đợi đang trống',
      emptyDesc: 'Bấm "Thêm tệp vào hàng đợi" để chọn nhiều tài liệu cùng lúc.',
      pending: 'Chờ xử lý',
      inProgress: 'Đang xử lý',
      done: 'Hoàn thành',
      error: 'Lỗi',
      download: 'Tải về',
      remove: 'Xóa khỏi hàng đợi'
    },
    ocr: {
      title: 'Công cụ OCR nhận dạng quang học cho PDF',
      detectedScan: 'trang scan dạng hình ảnh cần nhận diện ký tự.',
      improveHint: 'Bạn có thể chạy OCR để cải thiện văn bản trích xuất từ các trang scan mờ hoặc chứa ảnh.',
      recognizing: 'Đang nhận diện ký tự:',
      renderingPage: 'Đang render trang',
      cancelBtn: 'Hủy tiến trình OCR',
      langSelectLabel: 'Ngôn ngữ nhận dạng:',
      langBoth: 'Tiếng Việt + Tiếng Anh (Khuyên dùng)',
      langVi: 'Chỉ Tiếng Việt',
      langEn: 'Chỉ Tiếng Anh',
      btnScannedOnly: 'OCR trang scan',
      btnAll: 'OCR toàn bộ PDF'
    },
    footer: {
      title: 'Doc2EPUB',
      subtitle: 'Chuyển đổi tài liệu sang sách điện tử EPUB 3 Reflowable',
      privacyNote: '100% Client-Side: Toàn bộ quá trình xử lý diễn ra trực tiếp trên trình duyệt của bạn'
    },
    features: {
      sectionTitle: 'Được thiết kế cho tiêu chuẩn sách điện tử hiện đại',
      sectionSubtitle: 'Chất lượng chuyển đổi cao, tối ưu hiển thị trên Kindle, Kobo, iPad, điện thoại và máy đọc sách.',
      f1Title: 'EPUB 3 Reflowable Chuẩn',
      f1Desc: 'Tự động co giãn dòng chữ, tùy biến cỡ phông và ngắt trang linh hoạt theo kích thước màn hình mà không bị méo chữ.',
      f2Title: 'OCR Tích hợp & Giữ Mục lục',
      f2Desc: 'Tự động phát hiện các trang PDF scan, hỗ trợ OCR tiếng Việt và tiếng Anh bằng Tesseract.js, bảo toàn heading và bảng biểu.',
      f3Title: 'Bảo mật Tuyệt đối 100%',
      f3Desc: 'Dữ liệu tài liệu của bạn không bao giờ được gửi lên máy chủ hay lưu trữ đám mây. Mọi phép toán diễn ra cục bộ trong bộ nhớ trình duyệt.'
    }
  },
  en: {
    header: {
      converter: 'Converter',
      samples: 'Samples',
      features: 'EPUB 3 Standards',
      privacy: '100% Client Privacy',
      batchQueue: 'Batch Queue',
      subtitle: 'Ebook Document Converter'
    },
    hero: {
      badge: 'International EPUB 3 Reflowable Standard',
      title: 'Convert Documents to EPUB Easily',
      subtitle: 'Transform PDF, Word, and text documents into standard EPUB books for your favorite e-readers. 100% client-side in your browser.'
    },
    uploader: {
      titleDrop: 'Drag & drop documents here or',
      titleSelect: 'browse from computer',
      desc: 'Supports PDF, Word (.docx), TXT, Markdown (.md), and HTML. Processed entirely inside your browser without uploading to any server.',
      pdfBadge: 'PDF (Text & Scan)',
      docxBadge: 'Word (.docx)',
      txtBadge: 'TXT / Markdown',
      htmlBadge: 'HTML',
      errorTitle: 'Document Extraction Error:',
      unsupportedAlert: 'Unsupported file format. Please choose a PDF, DOCX, TXT, MD, or HTML file.'
    },
    samples: {
      heading: 'Or try with built-in sample documents (1-Click Test):',
      subheading: 'No files needed',
      sampleKieuDesc: 'Classic Vietnamese literary masterpiece with 3 complete cantos, poetry and commentary.',
      sampleProdDesc: 'Structured Markdown guide featuring Eisenhower matrix table, lists, and quotes.',
      sampleTechDesc: 'HTML technical document with structured tables, blockquotes, and code blocks.'
    },
    settings: {
      title: 'Book Settings',
      bookTitleLabel: 'Book Title (EPUB Title)',
      bookTitlePlaceholder: 'Enter book title...',
      authorLabel: 'Author (Optional)',
      authorPlaceholder: 'Author or translator...',
      langLabel: 'Primary Language',
      coverLabel: 'Book Cover (Optional)',
      coverFormat: 'JPG / PNG Format',
      coverReady: '✓ Ready to package into EPUB',
      coverRemove: 'Remove cover',
      coverPrompt: 'Click to upload cover image from computer',
      coverRatioHint: 'Recommended 3:4 or 2:3 ratio for best appearance on all e-readers',
      coverSuggestionsHeading: 'Suggested Covers from Document',
      coverSuggestionsSub: 'Auto-scanned from initial pages and embedded artwork',
      activeCoverBadge: 'Active Cover',
      useAsCoverBtn: 'Use as Cover',
      customCoverUpload: 'Or upload a custom cover from computer',
      autoStyledCover: 'Auto-styled Cover',
      words: 'words',
      characters: 'chars',
      pages: 'pages',
      changeFile: 'Change file'
    },
    chapters: {
      title: 'Table of Contents & Chapters',
      subtitle: 'Auto-detected · Quick customize',
      renameHint: 'Rename chapter',
      saveRename: 'Save title',
      tocToggleHint: 'Include in EPUB Table of Contents',
      tocToggleHelp: '* Click checkbox to toggle chapter in EPUB Table of Contents without deleting the chapter body content.',
      emptyChapter: 'This chapter has no content.'
    },
    preview: {
      title: 'Ebook Live Preview',
      readingTime: 'min read',
      serif: 'Serif',
      sans: 'Sans',
      decreaseFont: 'Decrease font size',
      increaseFont: 'Increase font size',
      chapterNumber: 'Chapter',
      noContent: 'This chapter has no content or only contains a title.',
      prevChapter: 'Previous chapter',
      nextChapter: 'Next chapter'
    },
    conversion: {
      convertBtn: 'Convert to EPUB',
      convertShortcutHint: 'Shortcut',
      standardHint: 'Packages EPUB 3 Reflowable conforming to Dublin Core & W3C',
      modalTitle: 'Converting Document to EPUB',
      modalSubtitle: 'Processing 100% locally inside your browser',
      cancelBtn: 'Cancel Task',
      cancelShortcutHint: 'Esc key',
      step1: 'Generating EPUB 3 structure...',
      step2: 'Compressing XHTML files & stylesheet...',
      step3: 'Validating EPUB archive compliance...'
    },
    result: {
      successTitle: 'Conversion to EPUB Succeeded!',
      successDesc: 'Standard EPUB 3 Reflowable ebook generated and self-validation passed.',
      downloadBtn: 'Download EPUB Book (.epub)',
      convertAnotherBtn: 'Convert Another File',
      readerHint: 'You can read this book using Apple Books, Google Play Books, Calibre, Kobo, Kindle, or any EPUB-compatible reader.',
      mimetypeValid: 'Uncompressed mimetype header',
      tocValid: 'Complete Table of Contents',
      opfValid: 'Package OPF & NCX Manifest',
      unicodeValid: 'Unicode NFC Diacritics'
    },
    batch: {
      title: 'Batch Conversion Queue',
      subtitle: 'Process multiple documents sequentially and download each EPUB independently',
      addFiles: 'Add files to queue',
      startAll: 'Start converting all',
      processing: 'Processing batch queue...',
      emptyTitle: 'Queue is empty',
      emptyDesc: 'Click "Add files to queue" to choose multiple documents at once.',
      pending: 'Pending',
      inProgress: 'Processing',
      done: 'Completed',
      error: 'Error',
      download: 'Download',
      remove: 'Remove from queue'
    },
    ocr: {
      title: 'Optical Character Recognition (OCR) for PDF',
      detectedScan: 'scanned image pages require character recognition.',
      improveHint: 'You can run OCR to improve extracted text from scanned or image-heavy pages.',
      recognizing: 'Recognizing text:',
      renderingPage: 'Rendering page',
      cancelBtn: 'Cancel OCR',
      langSelectLabel: 'Recognition language:',
      langBoth: 'Vietnamese + English (Recommended)',
      langVi: 'Vietnamese Only',
      langEn: 'English Only',
      btnScannedOnly: 'OCR Scanned Pages',
      btnAll: 'OCR Entire PDF'
    },
    footer: {
      title: 'Doc2EPUB',
      subtitle: 'Convert documents into EPUB 3 Reflowable ebooks',
      privacyNote: '100% Client-Side: All processing occurs entirely inside your web browser'
    },
    features: {
      sectionTitle: 'Engineered for Modern Ebook Standards',
      sectionSubtitle: 'High-quality conversion optimized for Kindle, Kobo, iPad, smartphones, and dedicated e-ink readers.',
      f1Title: 'Standard EPUB 3 Reflowable',
      f1Desc: 'Automatically reflows text, customizes fonts and margins gracefully across all screen dimensions without distortion.',
      f2Title: 'Built-in OCR & TOC Preservation',
      f2Desc: 'Automatically identifies scanned PDF pages, supports Vietnamese and English OCR via Tesseract.js, preserving headings and tables.',
      f3Title: '100% Private & Secure',
      f3Desc: 'Your document data is never uploaded to any server or cloud storage. All computing happens locally in your browser memory.'
    }
  }
};
