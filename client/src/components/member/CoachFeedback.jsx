import React, { useState, useEffect } from 'react';
import { StarFilled, StarOutlined, SendOutlined, UserOutlined, ClockCircleOutlined, MessageOutlined } from '@ant-design/icons';
import './CoachFeedback.css';

const CoachFeedback = ({ coachId, appointmentId, onClose, onSubmitSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [categories, setCategories] = useState({
        professionalism: 0,
        helpfulness: 0,
        communication: 0,
        knowledge: 0
    });
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [coachInfo, setCoachInfo] = useState(null);
    const [existingFeedback, setExistingFeedback] = useState(null);

    const categoryLabels = {
        professionalism: 'Tính chuyên nghiệp',
        helpfulness: 'Tính hữu ích',
        communication: 'Kỹ năng giao tiếp',
        knowledge: 'Kiến thức chuyên môn'
    };

    useEffect(() => {
        if (coachId) {
            fetchCoachInfo();
            checkExistingFeedback();
        }
    }, [coachId, appointmentId]);

    const fetchCoachInfo = async () => {
        try {
            const token = localStorage.getItem('memberToken') || localStorage.getItem('token');
            const response = await fetch(`http://localhost:4000/api/coach`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const coach = data.data.find(c => c.UserID === parseInt(coachId));
                setCoachInfo(coach);
            }
        } catch (error) {
            console.error('Error fetching coach info:', error);
        }
    };

    const checkExistingFeedback = async () => {
        try {
            const token = localStorage.getItem('memberToken') || localStorage.getItem('token');
            const response = await fetch(`http://localhost:4000/api/coach/${coachId}/feedback`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Check if current user already rated this coach
                const userStr = localStorage.getItem('user') || localStorage.getItem('member');
                const userId = userStr ? JSON.parse(userStr)?.UserID || JSON.parse(userStr)?.id : null;
                const userFeedback = data.data.feedback.find(f =>
                    f.MemberID === userId &&
                    (!appointmentId || f.AppointmentID === appointmentId)
                );

                if (userFeedback) {
                    setExistingFeedback(userFeedback);
                }
            }
        } catch (error) {
            console.error('Error checking existing feedback:', error);
        }
    };

    const handleStarClick = (value) => {
        setRating(value);
    };

    const handleCategoryRating = (category, value) => {
        setCategories(prev => ({
            ...prev,
            [category]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            alert('Vui lòng chọn số sao đánh giá');
            return;
        }

        setIsSubmitting(true);

        try {
            // Debug: Check all possible token sources
            const tokenSources = {
                memberToken: localStorage.getItem('memberToken'),
                token: localStorage.getItem('token'),
                sessionToken: sessionStorage.getItem('token'),
                sessionMemberToken: sessionStorage.getItem('memberToken')
            };

            console.log('🔍 Available tokens:', tokenSources);

            // Try different token sources
            const token = localStorage.getItem('memberToken') ||
                localStorage.getItem('token') ||
                sessionStorage.getItem('token') ||
                sessionStorage.getItem('memberToken');

            if (!token) {
                alert('Bạn cần đăng nhập để gửi đánh giá. Vui lòng đăng nhập lại.');
                return;
            }

            // Debug: Check user info
            const userSources = {
                user: localStorage.getItem('user'),
                member: localStorage.getItem('member'),
                sessionUser: sessionStorage.getItem('user'),
                sessionMember: sessionStorage.getItem('member')
            };

            console.log('🔍 Available user info:', userSources);

            console.log('🚀 Submitting feedback with token:', token.substring(0, 20) + '...');

            const feedbackData = {
                coachId: parseInt(coachId),
                rating,
                comment: comment.trim(),
                categories,
                isAnonymous,
                ...(appointmentId && { appointmentId: parseInt(appointmentId) })
            };

            console.log('📝 Feedback data:', feedbackData);

            const response = await fetch('http://localhost:4000/api/coach/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(feedbackData)
            });

            console.log('📡 Response status:', response.status);
            const data = await response.json();
            console.log('📡 Response data:', data);

            if (response.ok) {
                alert('Đánh giá đã được gửi thành công!');
                if (onSubmitSuccess) onSubmitSuccess();
                if (onClose) onClose();
            } else {
                // Handle specific error messages
                if (response.status === 403) {
                    alert('Bạn không có quyền gửi đánh giá này. Vui lòng đăng nhập với tài khoản member.');
                } else if (response.status === 401) {
                    alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                } else if (response.status === 400) {
                    alert(data.message || 'Dữ liệu gửi không hợp lệ');
                } else {
                    alert(data.message || `Lỗi ${response.status}: ${response.statusText}`);
                }
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('Không thể kết nối đến server. Vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStars = (currentRating, onStarClick, isCategory = false, category = '') => {
        return (
            <div className="stars-container">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`star ${star <= (isCategory ? currentRating : (hoverRating || rating)) ? 'active' : ''}`}
                        onClick={() => isCategory ? handleCategoryRating(category, star) : handleStarClick(star)}
                        onMouseEnter={() => !isCategory && setHoverRating(star)}
                        onMouseLeave={() => !isCategory && setHoverRating(0)}
                        disabled={existingFeedback}
                    >
                        {star <= (isCategory ? currentRating : (hoverRating || rating)) ?
                            <StarFilled style={{ fontSize: isCategory ? 16 : 24 }} /> :
                            <StarOutlined style={{ fontSize: isCategory ? 16 : 24 }} />
                        }
                    </button>
                ))}
                <span className="rating-text">
                    {isCategory ? `${currentRating}/5` : `${rating}/5`}
                </span>
            </div>
        );
    };

    if (existingFeedback) {
        return (
            <div className="feedback-modal-overlay">
                <div className="feedback-modal">
                    <div className="feedback-header">
                        <h3>Đánh giá của bạn</h3>
                        <button onClick={onClose} className="close-btn">&times;</button>
                    </div>

                    <div className="existing-feedback">
                        <div className="coach-info">
                            {coachInfo && (
                                <>
                                    <img
                                        src={coachInfo.Avatar || '/default-avatar.png'}
                                        alt={coachInfo.FullName}
                                        className="coach-avatar"
                                    />
                                    <div>
                                        <h4>{coachInfo.FullName}</h4>
                                        <p>{coachInfo.Specialization}</p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="rating-display">
                            <div className="overall-rating">
                                <span>Đánh giá tổng thể:</span>
                                {renderStars(existingFeedback.Rating, null)}
                            </div>

                            {existingFeedback.Categories && (
                                <div className="category-ratings">
                                    {Object.entries(JSON.parse(existingFeedback.Categories)).map(([key, value]) => (
                                        <div key={key} className="category-item">
                                            <span>{categoryLabels[key]}:</span>
                                            {renderStars(value, null, true)}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {existingFeedback.Comment && (
                                <div className="comment-display">
                                    <h5>Nhận xét:</h5>
                                    <p>{existingFeedback.Comment}</p>
                                </div>
                            )}

                            <div className="feedback-info">
                                <small>
                                    <ClockCircleOutlined style={{ fontSize: 14 }} />
                                    Đánh giá vào: {new Date(existingFeedback.CreatedAt).toLocaleDateString('vi-VN')}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="feedback-modal-overlay">
            <div className="feedback-modal">
                <div className="feedback-header">
                    <h3>Đánh giá Coach</h3>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>

                <div className="coach-info">
                    {coachInfo && (
                        <>
                            <img
                                src={coachInfo.Avatar || '/default-avatar.png'}
                                alt={coachInfo.FullName}
                                className="coach-avatar"
                            />
                            <div>
                                <h4>{coachInfo.FullName}</h4>
                                <p>{coachInfo.Specialization}</p>
                                <div className="coach-stats">
                                    <span>⭐ {coachInfo.AverageRating} ({coachInfo.ReviewCount} đánh giá)</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="feedback-form">
                    <div className="form-group">
                        <label>Đánh giá tổng thể *</label>
                        {renderStars(rating, handleStarClick)}
                    </div>

                    <div className="form-group">
                        <label>Đánh giá chi tiết</label>
                        <div className="category-ratings">
                            {Object.entries(categories).map(([key, value]) => (
                                <div key={key} className="category-item">
                                    <span>{categoryLabels[key]}:</span>
                                    {renderStars(value, null, true, key)}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Nhận xét</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Chia sẻ trải nghiệm của bạn với coach này..."
                            rows={4}
                            maxLength={500}
                        />
                        <small>{comment.length}/500 ký tự</small>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                            />
                            <span>Đánh giá ẩn danh</span>
                        </label>
                        <small>Tên của bạn sẽ không được hiển thị công khai</small>
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            Hủy
                        </button>
                        <button type="submit" disabled={isSubmitting || rating === 0} className="btn-submit">
                            {isSubmitting ? (
                                <>
                                    <div className="spinner"></div>
                                    Đang gửi...
                                </>
                            ) : (
                                <>
                                    <SendOutlined style={{ fontSize: 16 }} />
                                    Gửi đánh giá
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CoachFeedback; 