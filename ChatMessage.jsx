import React from 'react';
import './ChatMessage.css';

const ChatMessage = ({ message, currentUserRole }) => {
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getFileIcon = (mimeType) => {
        if (!mimeType) return '📎';

        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('word')) return '📝';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.startsWith('video/')) return '🎬';
        if (mimeType.includes('text')) return '📄';
        return '📎';
    };

    const isCurrentUser = message.SenderRole === currentUserRole;
    const messageClass = `chat-message ${isCurrentUser ? 'current-user' : 'other-user'} ${message.SenderRole}`;

    const handleFileDownload = (fileUrl, fileName) => {
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isImageFile = (mimeType) => {
        return mimeType && mimeType.startsWith('image/');
    };

    const renderFilePreview = () => {
        if (!message.FileName) return null;

        const fileUrl = message.FileURL;
        const isImage = isImageFile(message.MimeType);

        return (
            <div className="message-attachment">
                <div className="attachment-header">
                    <span className="file-icon">{getFileIcon(message.MimeType)}</span>
                    <div className="file-info">
                        <div className="file-name">{message.FileName}</div>
                        <div className="file-size">{formatFileSize(message.FileSize)}</div>
                    </div>
                </div>

                {isImage && (
                    <div className="image-preview">
                        <img
                            src={fileUrl}
                            alt={message.FileName}
                            className="preview-image"
                            onClick={() => window.open(fileUrl, '_blank')}
                        />
                    </div>
                )}

                <div className="attachment-actions">
                    <button
                        className="download-btn"
                        onClick={() => handleFileDownload(fileUrl, message.FileName)}
                        title="Tải xuống"
                    >
                        📥 Tải xuống
                    </button>
                    <button
                        className="view-btn"
                        onClick={() => window.open(fileUrl, '_blank')}
                        title="Xem file"
                    >
                        👁️ Xem
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className={messageClass}>
            <div className="message-header">
                <span className="sender-name">{message.SenderName}</span>
                <span className="message-time">{formatTime(message.CreatedAt)}</span>
            </div>

            <div className="message-content">
                {message.Content && (
                    <div className="message-text">
                        {message.Content}
                    </div>
                )}

                {renderFilePreview()}
            </div>

            {message.MessageType === 'file' && (
                <div className="message-type-indicator">
                    📎 File đính kèm
                </div>
            )}
        </div>
    );
};

export default ChatMessage; 