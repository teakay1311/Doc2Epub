export interface SampleDocument {
  id: string;
  title: string;
  filename: string;
  type: 'txt' | 'md' | 'html';
  description: string;
  sizeStr: string;
  content: string;
}

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'sample-kieu',
    title: 'Truyện Kiều — Nguyễn Du (Trích đoạn chọn lọc)',
    filename: 'truyen-kieu-trich-doan.txt',
    type: 'txt',
    description: 'Văn bản văn học cổ điển Việt Nam với 3 hồi hoàn chỉnh, thơ lục bát và lời bình.',
    sizeStr: '12 KB',
    content: `Lời nói đầu
Truyện Kiều (Đoạn trường tân thanh) là kiệt tác văn học chữ Nôm của đại thi hào Nguyễn Du. Tác phẩm kể về cuộc đời mười lăm năm lưu lạc, chìm nổi của nàng Thúy Kiều - một thiếu nữ tài sắc vẹn toàn nhưng gặp nhiều truân chuyên.

Bản trích đoạn này gồm các hồi tiêu biểu nhất, được biên tập và chuẩn hóa chính tả tiếng Việt để đọc tiện lợi trên mọi thiết bị sách điện tử.

Hồi 1: Cảnh ngày xuân và hội Đạp thanh
Trăm năm trong cõi người ta,
Chữ tài chữ mệnh khéo là ghét nhau.
Trải qua một cuộc bể dâu,
Những điều trông thấy mà đau đớn lòng.
Lạ gì bỉ sắc tư phong,
Trời xanh quen thói má hồng đánh ghen.

Ngày xuân con én đưa thoi,
Thiều quang chín chục đã ngoài sáu mươi.
Cỏ non xanh tận chân trời,
Cành lê trắng điểm một vài bông hoa.
Thanh minh trong tiết tháng ba,
Lễ là tảo mộ hội là đạp thanh.
Gần xa nô nức yến anh,
Chị em sắm sửa bộ hành chơi xuân.

Hồi 2: Thề nguyền dưới bóng trăng
Vầng trăng vằng vặc giữa trời,
Đinh ninh hai miệng một lời song song.
Tóc tơ căn vặn tấc lòng,
Trăm năm tạc một chữ đồng đến xương.
Chú mừng được chữ đồng tâm,
Mở lòng rộng lượng bao dong chứa chan.

Hồi 3: Khúc đàn và tấm lòng tri âm
Khúc đâu đầm ấm dương hòa,
Ấy là hồ điệp mộng hoa thuở nào.
Khúc đâu êm ái thanh tao,
Hán cung thu lạnh tiếng tiêu não nùng.
Khúc đâu ầm ĩ cuồng phong,
Tiếng gươm giáo rợn bốn vùng non sông.

Kết luận
Tác phẩm mãi là biểu tượng bất hủ cho tinh hoa ngôn ngữ và tâm hồn nhân đạo sâu sắc của dân tộc Việt Nam.`
  },
  {
    id: 'sample-productivity',
    title: 'Cẩm nang Tối ưu hóa Năng suất Cá nhân & Làm việc',
    filename: 'cam-nang-nang-suat.md',
    type: 'md',
    description: 'Tài liệu Markdown chuẩn với tiêu đề, danh sách, bảng biểu ma trận Eisenhower và trích dẫn.',
    sizeStr: '18 KB',
    content: `# Lời mở đầu

Năng suất không phải là làm nhiều việc hơn trong một ngày, mà là làm những việc có ý nghĩa cao nhất với sự tập trung sâu sắc nhất và tiêu tốn ít năng lượng lãng phí nhất.

> "Sự tập trung không phải là nói 'có' với điều bạn cần làm. Sự tập trung là nói 'không' với hàng trăm ý tưởng hay ho khác xung quanh bạn." — Steve Jobs

---

# Chương 1: Ma trận Eisenhower và Quản lý Thời gian

Phương pháp ma trận Eisenhower giúp phân loại công việc theo hai trục cốt lõi: **Độ khẩn cấp** và **Tầm quan trọng**.

| Nhóm | Đặc điểm | Hành động tối ưu | Ví dụ thực tế |
|---|---|---|---|
| Khẩn cấp & Quan trọng | Khủng hoảng, hạn chót gấp | Giải quyết ngay lập tức | Hệ thống bị gián đoạn, sự cố khách hàng |
| Không khẩn cấp nhưng Quan trọng | Chiến lược, phát triển bản thân | Lên lịch thực hiện cố định | Tập thể dục, học kỹ năng mới, đọc sách |
| Khẩn cấp nhưng Không quan trọng | Tin nhắn gián đoạn, cuộc gọi | Ủy quyền hoặc tự động hóa | Trả lời email phụ, họp định kỳ vô thưởng |
| Không khẩn cấp & Không quan trọng | Lướt mạng xã hội vô thức | Loại bỏ dứt điểm | Xem video ngắn lúc làm việc |

---

# Chương 2: Kỹ thuật Deep Work và Pomodoro Hiện đại

Để đạt được trạng thái làm việc sâu (Deep Work), hãy áp dụng quy trình 4 bước sau:

1. **Chuẩn bị không gian**: Đặt điện thoại ở phòng khác, tắt thông báo mạng xã hội.
2. **Xác định mục tiêu duy nhất**: Chọn đúng một nhiệm vụ cho phiên làm việc 50 phút.
3. **Thực thi không gián đoạn**: Làm việc liên tục trong 50 phút với sự chú tâm trọn vẹn.
4. **Nghỉ ngơi chủ động**: Dành 10 phút đi bộ, uống nước, hít thở sâu trước khi bắt đầu phiên mới.

### Những công cụ hỗ trợ đề xuất:
- Trình quản lý nhiệm vụ tối giản (Todoist, Things3)
- Ghi chú tư duy có liên kết (Obsidian, Notion)
- Ứng dụng chặn phân tâm (Cold Turkey, Freedom)

---

# Chương 3: Phục hồi Năng lượng và Giữ vững Phong độ

Năng lượng của não bộ là hữu hạn trong mỗi chu kỳ 24 giờ.

- Giấc ngủ sâu từ 7 đến 8 tiếng mỗi đêm là nền tảng số một của tư duy minh mẫn.
- Uống đủ 2 lít nước mỗi ngày giúp giảm mệt mỏi tinh thần tới 30%.
- Đi bộ ngoài trời 20 phút mỗi ngày kích thích vùng hồi hải mã phát triển ý tưởng mới.

Chúc bạn có những bước tiến vững chắc trên hành trình làm chủ hiệu suất!`
  },
  {
    id: 'sample-tech',
    title: 'Kiến trúc Nền tảng Web Hiện đại & Chuẩn EPUB 3',
    filename: 'kien-truc-web-epub.html',
    type: 'html',
    description: 'Tài liệu HTML chứa bảng, trích dẫn, khối mã và danh sách định dạng.',
    sizeStr: '15 KB',
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Kiến trúc Nền tảng Web Hiện đại</title>
</head>
<body>
  <h1>Mở đầu: Cuộc cách mạng Định dạng Số</h1>
  <p>Sự phát triển của tiêu chuẩn EPUB 3 Reflowable đã biến mọi cuốn sách điện tử thành một trải nghiệm web thu nhỏ, tự do co giãn trên mọi kích thước màn hình từ điện thoại thông minh đến máy đọc sách màn hình mực điện tử E-Ink.</p>

  <h2>Chương 1: Cấu trúc Cốt lõi của EPUB 3</h2>
  <p>Một tệp tin EPUB thực chất là một kho lưu trữ nén định dạng ZIP chứa các thành phần tiêu chuẩn sau:</p>
  <ul>
    <li><strong>mimetype</strong>: Tệp tin đầu tiên không nén xác nhận kiểu MIME application/epub+zip.</li>
    <li><strong>META-INF/container.xml</strong>: Trỏ đường dẫn đến tệp đặc tả gói OPF.</li>
    <li><strong>OEBPS/content.opf</strong>: Khai báo toàn bộ metadata sách, danh mục tài nguyên (Manifest) và thứ tự đọc (Spine).</li>
    <li><strong>OEBPS/nav.xhtml</strong>: Mục lục động theo chuẩn HTML5 Navigation.</li>
  </ul>

  <h2>Chương 2: Tối ưu hóa Trải nghiệm Đọc cho Người Việt</h2>
  <p>Để đảm bảo độc giả có trải nghiệm mượt mà nhất, việc hiển thị dấu câu tiếng Việt và ngắt trang linh hoạt là yếu tố quyết định:</p>
  <blockquote>Bộ chữ Unicode chuẩn dựng sẵn (NFC) giúp các thiết bị máy đọc sách hiển thị chính xác mọi nguyên âm có dấu như ơ, ư, ê, â mà không bị lỗi chân chữ (tofu glyph).</blockquote>
  
  <p>Hy vọng cuốn sách kỹ thuật này sẽ là tài liệu tham khảo hữu ích cho các kỹ sư và biên tập viên số.</p>
</body>
</html>`
  }
];
