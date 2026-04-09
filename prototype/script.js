document.addEventListener('DOMContentLoaded', () => {
    const chatBody = document.getElementById('chat-body');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const suggestionChips = document.querySelectorAll('.chip');
    const refreshBtn = document.getElementById('refresh-chat');

    // State tracker for initial layout shift
    let isChatActive = false;

    userInput.focus();

    // Auto resize textarea & toggle active button
    userInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value === '') {
            this.style.height = 'auto';
            sendBtn.classList.remove('active');
        } else {
            sendBtn.classList.add('active');
        }
    });

    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Handle suggestion chips
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const chipText = chip.textContent.trim();
            if (chipText.includes('Thử Low Confidence')) {
                userInput.value = "Trường nào tốt nhất";
            } else {
                userInput.value = chipText;
            }
            handleSend();
        });
    });

    // Reset back to empty state
    refreshBtn.addEventListener('click', () => {
        const messages = document.querySelectorAll('.message:not(.bot-welcome), .system-alert');
        messages.forEach(msg => msg.remove());

        const chatFooter = document.getElementById('chat-footer');
        const emptyState = document.getElementById('empty-state');
        const chatViewport = document.getElementById('chat-viewport');
        const inputWrapper = document.getElementById('input-wrapper');
        const mainContent = document.getElementById('main-content');

        chatViewport.style.display = 'none';
        chatFooter.style.display = 'none';
        emptyState.style.display = 'flex';

        // Return input container to the middle
        const greetingArea = emptyState.querySelector('.empty-greeting');
        greetingArea.after(inputWrapper);

        // Show chips again
        document.getElementById('suggestion-chips').style.display = 'flex';

        isChatActive = false;
        userInput.focus();
    });

    function initiateChat() {
        if (isChatActive) return;
        isChatActive = true;

        const inputWrapper = document.getElementById('input-wrapper');
        const chatFooter = document.getElementById('chat-footer');
        const emptyState = document.getElementById('empty-state');
        const chatViewport = document.getElementById('chat-viewport');
        const footerNote = document.getElementById('footer-note');

        emptyState.style.display = 'none';
        chatViewport.style.display = 'flex';
        chatFooter.style.display = 'flex';

        // Move input wrapper to the fixed footer
        chatFooter.insertBefore(inputWrapper, footerNote);

        // Hide chips
        document.getElementById('suggestion-chips').style.display = 'none';
    }

    function handleSend() {
        const text = userInput.value.trim();
        if (!text) return;

        // Setup layout structure on first message
        initiateChat();

        userInput.value = '';
        userInput.style.height = 'auto';
        sendBtn.classList.remove('active');

        appendUserMessage(text);
        showTypingIndicator();

        setTimeout(() => {
            removeTypingIndicator();
            const responseObj = generateMockResponse(text);
            appendBotMessageComplex(responseObj);
        }, 800 + Math.random() * 800);
    }

    function appendUserMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message user-message animate-in`;
        msgDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fa-solid fa-user"></i>
            </div>
            <div class="message-wrapper">
                <div class="message-content">
                    <p>${text}</p>
                </div>
            </div>
        `;
        chatBody.appendChild(msgDiv);
        scrollToBottom();
    }

    function appendBotMessageComplex(res) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message bot-message animate-in`;

        let contentHtml = '';

        if (res.type === 'normal') {
            contentHtml = `
                <div class="message-origin-text">
                    <p>${res.text}</p>
                </div>
            `;
            if (res.source) {
                contentHtml += `
                    <div class="source-info">
                        <i class="fa-solid fa-book-bookmark"></i> Tham chiếu: ${res.source.id} (Cập nhật: ${res.source.date})
                    </div>
                `;
            }
        }
        else if (res.type === 'low_confidence') {
            let altHtml = res.alternatives.map(item => `<li>${item}</li>`).join('');
            contentHtml = `
                <div class="validation-notice">
                    <i class="fa-solid fa-triangle-exclamation"></i> Cần xác minh thêm
                </div>
                <div class="message-origin-text">
                    <p>${res.text}</p>
                </div>
                <div class="related-options">
                    <strong>Gợi ý hướng tiếp cận:</strong>
                    <ul>${altHtml}</ul>
                    <a href="${res.policyLink}" target="_blank" class="related-link">
                        <i class="fa-solid fa-scale-balanced"></i> Xem chính sách liên quan
                    </a>
                </div>
            `;
        }

        let actionHtml = `
            <div class="message-actions">
                <button class="action-btn edit-btn" title="Chỉnh sửa"><i class="fa-solid fa-pen"></i> Sửa</button>
                <button class="action-btn report-btn" title="Báo sai quy chế"><i class="fa-solid fa-thumbs-down"></i> Báo sai</button>
                <button class="action-btn" title="Sao chép"><i class="fa-regular fa-copy"></i></button>
            </div>
        `;

        msgDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fa-solid fa-bolt"></i>
            </div>
            <div class="message-wrapper">
                <div class="message-content">
                    ${contentHtml}
                </div>
                ${actionHtml}
            </div>
        `;

        chatBody.appendChild(msgDiv);
        bindMessageActions(msgDiv);
        scrollToBottom();
    }

    function bindMessageActions(msgDiv) {
        const reportBtn = msgDiv.querySelector('.report-btn');
        const editBtn = msgDiv.querySelector('.edit-btn');
        const msgContentBox = msgDiv.querySelector('.message-content');
        const originTextContainer = msgDiv.querySelector('.message-origin-text');

        if (reportBtn) {
            reportBtn.addEventListener('click', () => {
                if (msgDiv.classList.contains('flagged')) return;

                msgDiv.classList.add('flagged');
                reportBtn.innerHTML = `<i class="fa-solid fa-flag"></i> Đã báo sai`;
                reportBtn.style.color = '#dc2626';

                const alertDiv = document.createElement('div');
                alertDiv.className = 'system-alert animate-in';
                alertDiv.innerHTML = `
                    <i class="fa-solid fa-headset"></i> 
                    <span>Đã cắm cờ Policy Mismatch. Đang gọi Tư vấn viên... <i class="fa-solid fa-spinner fa-spin" style="margin-left:4px"></i></span>
                `;

                msgDiv.after(alertDiv);
                scrollToBottom();

                setTimeout(() => {
                    alertDiv.classList.add('connected');
                    alertDiv.innerHTML = `<i class="fa-solid fa-user-tie"></i> Tư vấn viên <strong>Ngọc Trâm</strong> đã tham gia đoạn chat.`;
                }, 2500);
            });
        }

        if (editBtn) {
            editBtn.addEventListener('click', () => {
                if (msgContentBox.querySelector('.editor-container')) return;

                const paragraphs = originTextContainer.querySelectorAll('p');
                if (!paragraphs.length) return;

                const originalHtml = paragraphs[0].innerHTML;
                let plainText = originalHtml.replace(/<br\s*[\/]?>/gi, '\n');
                plainText = plainText.replace(/<[^>]*>?/gm, '');

                originTextContainer.style.display = 'none';

                const editorDiv = document.createElement('div');
                editorDiv.className = 'editor-container animate-in';
                editorDiv.innerHTML = `
                    <textarea class="bot-editor-textarea">${plainText.trim()}</textarea>
                    <div class="editor-actions">
                        <button class="cancel-btn">Hủy</button>
                        <button class="save-btn">Lưu sửa</button>
                    </div>
                `;

                msgContentBox.insertBefore(editorDiv, msgContentBox.firstChild);

                editorDiv.querySelector('.cancel-btn').addEventListener('click', () => {
                    editorDiv.remove();
                    originTextContainer.style.display = 'block';
                });

                editorDiv.querySelector('.save-btn').addEventListener('click', () => {
                    const newTextRaw = editorDiv.querySelector('.bot-editor-textarea').value.trim();
                    const formattedHtml = newTextRaw.replace(/\n/g, '<br>');

                    paragraphs[0].innerHTML = formattedHtml + ' <span class="edited-mark">(Đã cập nhật bởi người dùng)</span>';

                    editorDiv.remove();
                    originTextContainer.style.display = 'block';
                    editBtn.disabled = true;
                    editBtn.style.opacity = '0.5';
                });
            });
        }
    }

    function showTypingIndicator() {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message bot-message animate-in typing-msg`;
        msgDiv.id = 'typing-indicator';

        msgDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fa-solid fa-bolt"></i>
            </div>
            <div class="message-wrapper">
                <div class="message-content">
                    <div class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;

        chatBody.appendChild(msgDiv);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    function scrollToBottom() {
        const viewport = document.querySelector('.chat-viewport');
        if (viewport) {
            viewport.scrollTo({
                top: viewport.scrollHeight,
                behavior: 'smooth'
            });
        }
    }

    function generateMockResponse(text) {
        const lowerText = text.toLowerCase();

        if (lowerText.includes('ngành hot') || lowerText.includes('ngành học') || lowerText.includes('khối kỹ thuật')) {
            return {
                type: 'normal',
                text: "Theo dữ liệu báo cáo dự báo cho kỳ tuyển sinh 2025, các ngành: Trí tuệ nhân tạo (AI), Vi mạch bán dẫn, và Logistics tiếp tục được xếp hạng nhóm ưu tiên cao nhất.",
                source: { id: "BGD-TS2025-DRAFT", date: "Gần đây" }
            };
        }
        else if (lowerText.includes('học phí') || lowerText.includes('kinh tế')) {
            return {
                type: 'normal',
                text: "Hệ đại trà công lập có học phí trần từ 1.5 - 3.5 triệu/tháng tùy khối ngành. Tuy nhiên Khối Kinh Tế ở các trường trọng điểm nội đô thường áp dụng tự chủ tài chính khoảng 25-40 triệu/năm.",
                source: { id: "Nghị định 97/2023/NĐ-CP", date: "31/12/2023" }
            };
        }
        else if (lowerText.includes('trường nào tốt') || lowerText.includes('tư vấn chung') || lowerText.includes('không biết') || lowerText.includes('nên học gì') || lowerText.includes('phương thức ưu tiên')) {
            return {
                type: 'low_confidence',
                text: "Câu hỏi này khá chung chung và phụ thuộc vào mục tiêu cá nhân, khả năng tài chính và định hướng cụ thể của bạn. Tôi chưa có đủ thông số để đưa ra gợi ý trường học chính xác.",
                alternatives: [
                    "Sử dụng công cụ trắc nghiệm tính cách Holland",
                    "Tham khảo điểm chuẩn các trường khối Kinh tế",
                    "Tìm trường có học phí dưới 20tr/năm"
                ],
                policyLink: "#policy-tuvan-dinnh-huong"
            };
        }
        else {
            return {
                type: 'normal',
                text: "Đã ghi nhận thắc mắc của bạn: '" + text + "'. Những quy định chi tiết về đối tượng ưu tiên hay cộng điểm sẽ tuân theo thông tư mới nhất. Vui lòng cụ thể hóa câu hỏi của bạn hơn.",
                source: { id: "Quy chế Tuyển sinh ĐH", date: "Đảng hiệu lực" }
            };
        }
    }
});
