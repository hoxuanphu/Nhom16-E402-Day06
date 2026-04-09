# SPEC — AI Product Hackathon



**Nhóm:** 16-E402<br>



**Họ tên và MSHV:** Hồ Xuân Phú - 2A20260061<br>
**Họ tên và MSHV:** Lại Đức Anh - 2A202600374<br>
**Họ tên và MSHV:** Phạm Anh Quân - 2A202600252<br>
**Họ tên và MSHV:** Hoàng Ngọc Thạch - 2A202600068<br>
**Họ tên và MSHV:** Đào Danh Đăng Phụng - 2A202600358<br>
**Họ tên và MSHV:** Nguyễn Minh Trí - 2A202600182<br>

**Track:** Open<br>
**Problem statement (1 câu):** 
*Đội hỗ trợ tuyển sinh phải trả lời lặp đi lặp lại các câu hỏi giống nhau từ phụ huynh/học sinh qua chat/call, hiện làm thủ công theo kinh nghiệm cá nhân, AI giúp gợi ý câu trả lời chuẩn hóa từ kho FAQ để giảm thời gian xử lý và tăng tính nhất quán.*

---

## 1. AI Product Canvas (Thạch)

||Value|Trust|Feasibility|
|-|-|-|-|
|**Câu hỏi**|User nào? Pain gì? AI giải gì?|Khi AI sai thì sao? User sửa bằng cách nào?|Cost/latency bao nhiêu? Risk chính?|
|**Trả lời**|*Tư vấn viên tuyển sinh phải trả lời 60-120 câu hỏi/ngày, trong đó 50-70% là câu hỏi lặp (học phí, hồ sơ, deadline, học bổng). AI đọc câu hỏi và gợi ý câu trả lời dựa trên kho FAQ + policy hiện hành, giảm thời gian tra cứu từ 3-5 phút xuống 20-40 giây/câu.*|*AI gợi ý sai hoặc thiếu ngữ cảnh → tư vấn viên luôn thấy nguồn tham chiếu, confidence và có thể sửa/viết lại trước khi gửi. Mỗi lần sửa được lưu thành correction để cập nhật knowledge base.*|*Ước tính \~0.002-0.008 USD/lượt gợi ý, latency mục tiêu <2.5 giây. Risk chính: trả lời sai chính sách mới, hallucination thông tin không tồn tại, và quá tự tin với câu hỏi ngoài phạm vi.*|



**Automation hay augmentation?**  Augmentation



## Justify: 
*Augmentation — câu trả lời được AI nháp trước, tư vấn viên duyệt/chỉnh sửa rồi mới gửi; cost of reject gần như bằng 0 và giảm rủi ro gửi sai thông tin chính thức.*



**Learning signal:**

1. User correction đi vào đâu? `answer_correction_log` + pipeline review để cập nhật FAQ answer theo tuần.
2. Product thu signal gì để biết tốt lên hay tệ đi? Tỷ lệ accept suggestion, tỷ lệ sửa lớn (>30% nội dung), thời gian xử lý mỗi ticket, reopen rate do trả lời thiếu/sai.
3. Data thuộc loại nào? ☑ User-specific · ☑ Domain-specific · ☑ Real-time · ☑ Human-judgmen<br>
Có marginal value không? (Model đã biết cái này chưa?) 
*Có — chính sách tuyển sinh, học phí, lịch mốc và quy trình hồ sơ thay đổi theo kỳ/năm và mang tính nội bộ, model nền không có bản cập nhật đáng tin cậy theo thời gian thực.*
---

## 2. User Stories — 4 paths (Hồ Xuân Phú)

**Mỗi feature chính = 1 bảng. AI trả lời xong → chuyện gì xảy ra?**

**Feature: Gợi ý câu trả lời FAQ cho tư vấn viên tuyển sinh**



**Trigger:** 
*Phụ huynh/học sinh gửi câu hỏi mới trong CRM/chat inbox → hệ thống truy xuất FAQ + policy hiện hành → AI sinh nháp câu trả lời có trích nguồn.*



|Path|Câu hỏi thiết kế|Mô tả|
|-|-|-|
|Happy — AI đúng, tự tin|User thấy gì? Flow kết thúc ra sao?|*Tư vấn viên thấy câu trả lời nháp + nguồn (FAQ #ID, ngày cập nhật), confidence 0.9. Chọn "Gửi" sau 1 chỉnh sửa nhỏ hoặc giữ nguyên, ticket đóng trong 1 lần phản hồi.*|
|Low-confidence — AI không chắc|System báo "không chắc" bằng cách nào? User quyết thế nào?|*Hệ thống hiển thị nhãn "Cần xác minh", confidence <0.6, đưa 2-3 câu trả lời khả dĩ và link chính sách liên quan. Tư vấn viên chọn phương án phù hợp hoặc tự soạn mới.*|
|Failure — AI sai|User biết AI sai bằng cách nào? Recover ra sao?|*AI gợi ý deadline cũ do policy mới chưa được index. Tư vấn viên phát hiện qua nguồn tham chiếu không khớp, bỏ gợi ý và trả lời thủ công theo thông báo mới; ticket gắn cờ "policy mismatch".*|
|Correction — user sửa|User sửa bằng cách nào? Data đó đi vào đâu?|*Tư vấn viên sửa trực tiếp trong editor, bấm "Lưu sửa + gửi". Diff được ghi vào correction log, chuyển hàng đợi review nội dung để cập nhật câu trả lời chuẩn trong kho FAQ.*|


### Feature: Gom cụm câu hỏi trùng lặp + đề xuất FAQ mới

**Trigger:** *Hệ thống nhận nhiều câu hỏi có ý nghĩa tương đương trong ngày/tuần (khác cách diễn đạt) → AI gom cụm theo intent và phát hiện cụm chưa có FAQ chuẩn.*

| Path | Câu hỏi thiết kế | Mô tả |
|------|-------------------|-------|
| Happy — AI đúng, tự tin | User thấy gì? Flow kết thúc ra sao? | *Dashboard hiển thị cụm "Học bổng đầu vào lớp 10" với 124 câu tương tự, gợi ý FAQ chuẩn. Content owner duyệt và publish 1 FAQ mới, các câu hỏi sau được trả lời nhanh hơn.* |
| Low-confidence — AI không chắc | System báo "không chắc" bằng cách nào? User quyết thế nào? | *Cụm có độ tương đồng thấp được gắn cờ "cần tách cụm", hệ thống đề xuất 2 cách chia intent. Content owner chọn phương án đúng rồi lưu.* |
| Failure — AI sai | User biết AI sai bằng cách nào? Recover ra sao? | *AI gom nhầm 2 intent khác nhau (học phí vs học bổng), dẫn tới FAQ đề xuất bị lệch. Content owner thấy ví dụ trong cụm không đồng nhất, tách cụm thủ công và gắn lại intent.* |
| Correction — user sửa | User sửa bằng cách nào? Data đó đi vào đâu? | *Content owner kéo-thả câu hỏi sang cụm đúng, sửa tên intent. Các thao tác này được lưu vào `intent_cluster_feedback` để cải thiện mô hình clustering vòng sau.* |
---

## 3. Eval metrics + threshold (Phạm Anh Quân)

**Optimize precision hay recall?** Precision



Tại sao? Trong tuyển sinh, trả lời sai chính sách có chi phí cao (mất uy tín, khiếu nại, ảnh hưởng quyết định nộp hồ sơ). Ưu tiên "ít sai" hơn "trả lời được mọi câu".
Nếu sai ngược lại thì chuyện gì xảy ra? Nếu tối ưu recall quá mức, hệ thống cố trả lời cả câu ngoài phạm vi và tăng tỷ lệ trả lời sai, khiến tư vấn viên mất niềm tin và quay lại làm thủ công.

---



|Metric|Threshold|Red flag (dừng khi)|
|-|-|-|
|Precision@1 của câu trả lời được chấp nhận|≥90%|<80% trong 2 tuần liên tiếp|
|Tỷ lệ accept suggestion (không sửa hoặc sửa nhẹ)|≥65%|<45% trong 3 tuần|
|P95 latency từ lúc nhận câu hỏi đến lúc có nháp|≤2.5 giây|>4 giây trong giờ cao điểm 5 ngày liên tiếp|

---



## 4. Top 3 failure modes (Đào Danh Đăng Phụng)

**Liệt kê cách product có thể fail — không phải list features.
"Failure mode nào user KHÔNG BIẾT bị sai? Đó là cái nguy hiểm nhất."**

---



|#|Trigger|Hậu quả|Mitigation|
|-|-|-|-|
|1|Policy tuyển sinh mới ban hành nhưng kho FAQ chưa cập nhật|AI trả lời sai nhưng có thể vẫn tự tin cao, tư vấn viên mới khó phát hiện|Bắt buộc hiển thị ngày hiệu lực nguồn; rule chặn auto-suggest nếu nguồn quá hạn; quy trình cập nhật policy theo SLA <24h|
|2|Câu hỏi mơ hồ, thiếu ngữ cảnh (khối lớp, hệ đào tạo, campus)|AI chọn nhầm ngữ cảnh và đưa thông tin không áp dụng cho người hỏi|Prompt bắt buộc hỏi lại thông tin thiếu; template "câu hỏi làm rõ" trước khi trả lời chính thức|
|3|Không có nguồn phù hợp nhưng model vẫn sinh nội dung|Hallucination gây trả lời bịa thông tin học phí/học bổng|Retrieval-first architecture; nếu không đạt ngưỡng bằng chứng thì chỉ trả về "không đủ dữ liệu" + escalate cho chuyên viên|

---


## 5. ROI 3 kịch bản (Nguyễn Minh Trí)


||Conservative|Realistic|Optimistic|
|-|-|-|-|
|**Assumption**|*12 tư vấn viên, 70 câu/người/ngày, 40% câu lặp được AI hỗ trợ*|*20 tư vấn viên, 90 câu/người/ngày, 60% câu lặp được AI hỗ trợ*|*35 tư vấn viên, 110 câu/người/ngày, 70% câu lặp được AI hỗ trợ*|
|**Cost**|*\~40 USD/ngày (LLM + retrieval + logging)*|*\~110 USD/ngày*|*\~260 USD/ngày*|
|**Benefit**|*Tiết kiệm \~18 giờ công/ngày, giảm thời gian phản hồi trung bình 25%*|*Tiết kiệm \~55 giờ công/ngày, giảm thời gian phản hồi 45%, tăng tỷ lệ hài lòng +8 điểm*|*Tiết kiệm \~130 giờ công/ngày, giảm thời gian phản hồi 60%, tăng conversion nộp hồ sơ 3-5%*|
|**Net**|*Lợi ích ròng dương sau 1-2 tháng vận hành*|*Lợi ích ròng dương rõ rệt theo tuần*|*ROI cao, đủ cơ sở mở rộng đa kênh (chat, email, call summary)*|



**Kill criteria:** *Dừng hoặc thu hẹp phạm vi nếu trong 8 tuần liên tục: precision <80% hoặc tỷ lệ accept <45%, đồng thời chi phí vận hành > lợi ích tiết kiệm nhân sự trong 2 tháng.*

---

## 6. Mini AI spec (1 trang) (Lại Đức Anh)



Sản phẩm tập trung giải quyết bài toán quá tải câu hỏi tuyển sinh lặp lại cho đội tư vấn viên, bằng cách biến tri thức tuyển sinh rải rác thành một FAQ knowledge base có cấu trúc và dùng AI để gợi ý câu trả lời nhanh, chuẩn hóa và có nguồn kiểm chứng. Đối tượng chính là tư vấn viên tuyển sinh (internal user), còn phụ huynh/học sinh hưởng lợi gián tiếp qua tốc độ phản hồi nhanh hơn và thông tin nhất quán hơn.

AI trong hệ thống vận hành theo hướng augmentation: AI không tự gửi phản hồi cho người hỏi mà chỉ tạo nháp câu trả lời, đính kèm nguồn (FAQ/policy), confidence score và cảnh báo khi thiếu dữ kiện. Tư vấn viên là người quyết định cuối cùng, có thể sửa hoặc bỏ gợi ý để tránh rủi ro nghiệp vụ. Thiết kế này phù hợp bối cảnh tuyển sinh vì chi phí của một câu trả lời sai cao hơn nhiều so với chi phí duyệt thêm vài giây.

Mục tiêu chất lượng ưu tiên precision. Hệ thống chấp nhận "không chắc thì hỏi lại hoặc escalate" thay vì đoán bừa. Các chỉ số lõi gồm precision@1, accept rate và latency P95, đi kèm red flags để quyết định rollback hoặc dừng thử nghiệm khi chất lượng xuống thấp. Failure mode nguy hiểm nhất là trả lời sai chính sách mới nhưng vẫn tự tin cao; vì vậy hệ thống cần ràng buộc theo ngày hiệu lực nguồn, retrieval-first, và cơ chế chặn generate khi không đủ bằng chứng.

Data flywheel được xây quanh hành vi chỉnh sửa của tư vấn viên: mỗi lần sửa câu trả lời đều trở thành learning signal để cải thiện retrieval, cập nhật canonical answer, và tinh chỉnh prompt/rule. Theo thời gian, tỷ lệ câu hỏi lặp được trả lời đúng ngay từ gợi ý đầu tiên tăng lên, giúp giảm tải vận hành tuyển sinh và giữ trải nghiệm tư vấn ổn định trong mùa cao điểm.

