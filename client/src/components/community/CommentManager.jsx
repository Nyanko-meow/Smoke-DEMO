import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
    List,
    Avatar,
    Button,
    Input,
    Space,
    message,
    Popconfirm,
    Typography,
    Tooltip
} from 'antd';
import {
    DeleteOutlined,
    EditOutlined,
    SaveOutlined,
    CloseOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import UserBadge from '../common/UserBadge';

const { Text } = Typography;
const { TextArea } = Input;

const CommentManager = ({ comments, setComments, postId }) => {
    const { user } = useSelector(state => state.auth);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editText, setEditText] = useState('');
    const [updating, setUpdating] = useState(false);

    const canEditOrDelete = (comment) => {
        console.log('🔍 Debug canEditOrDelete:', {
            hasUser: !!user,
            currentUserID: user?.UserID,
            currentUserRole: user?.role,
            commentUserID: comment.UserID,
            commentAuthor: `${comment.FirstName} ${comment.LastName}`,
            userIDMatch: user?.UserID === comment.UserID,
            isAdmin: user?.role === 'admin',
            canEdit: user && (user.UserID === comment.UserID || user.role === 'admin')
        });
        return user && (user.UserID === comment.UserID || user.role === 'admin');
    };

    const handleStartEdit = (comment) => {
        setEditingCommentId(comment.CommentID);
        setEditText(comment.Content);
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditText('');
    };

    const handleUpdateComment = async (commentId) => {
        if (!editText.trim()) {
            message.warning('Nội dung comment không được để trống');
            return;
        }

        console.log('🔄 Starting comment update:', {
            commentId,
            editText: editText.trim(),
            token: localStorage.getItem('token') ? 'exists' : 'missing'
        });

        setUpdating(true);
        try {
            const response = await axios.put(`http://smokeking.wibu.me:4000/api/community/comments/${commentId}`, {
                content: editText.trim()
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            console.log('✅ Comment update response:', response.data);

            if (response.data.success) {
                setComments(prevComments =>
                    prevComments.map(comment =>
                        comment.CommentID === commentId
                            ? { ...comment, Content: editText.trim() }
                            : comment
                    )
                );
                message.success(response.data.message || 'Cập nhật comment thành công');
                handleCancelEdit();
            } else {
                console.warn('⚠️ Update failed:', response.data);
                message.error(response.data.message || 'Không thể cập nhật comment');
            }
        } catch (error) {
            console.error('❌ Error updating comment:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            if (error.response?.status === 404) {
                message.error('Không tìm thấy comment hoặc bạn không có quyền chỉnh sửa');
            } else if (error.response?.status === 400) {
                message.error(error.response.data.message || 'Dữ liệu không hợp lệ');
            } else {
                message.error(error.response?.data?.message || 'Lỗi khi cập nhật comment');
            }
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const response = await axios.delete(`http://smokeking.wibu.me:4000/api/community/comments/${commentId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                setComments(prevComments =>
                    prevComments.filter(comment => comment.CommentID !== commentId)
                );
                message.success('Xóa comment thành công');
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            message.error('Lỗi khi xóa comment');
        }
    };

    return (
        <List
            dataSource={comments}
            renderItem={(comment) => (
                <List.Item style={{ padding: '16px 0', border: 'none' }}>
                    <div style={{ width: '100%' }}>
                        {/* Comment Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: 8
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar
                                    src={comment.Avatar}
                                    size="small"
                                    style={{ marginRight: 8 }}
                                >
                                    {comment.FirstName?.charAt(0)}
                                </Avatar>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Text strong style={{ marginRight: 8 }}>
                                        {`${comment.FirstName} ${comment.LastName}`}
                                    </Text>
                                    <UserBadge userId={comment.UserID} size="small" />
                                </div>
                                <Text type="secondary" style={{ fontSize: '12px', marginLeft: 8 }}>
                                    {formatDistanceToNow(new Date(comment.CreatedAt), {
                                        addSuffix: true,
                                        locale: vi
                                    })}
                                </Text>
                            </div>

                            {/* Action Buttons */}
                            {/* Debug: Show buttons for all comments temporarily */}
                            {(canEditOrDelete(comment) || true) && editingCommentId !== comment.CommentID && (
                                <Space size="small" style={{ display: 'flex', alignItems: 'center' }}>
                                    <Tooltip title="Chỉnh sửa comment">
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => handleStartEdit(comment)}
                                            style={{
                                                borderRadius: '8px',
                                                color: '#667eea',
                                                height: '32px',
                                                width: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
                                                e.currentTarget.style.color = '#5a6fd8';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                e.currentTarget.style.color = '#667eea';
                                            }}
                                        />
                                    </Tooltip>
                                    <Tooltip title="Xóa comment">
                                        <Popconfirm
                                            title={
                                                <div style={{ fontWeight: 600, fontSize: '14px' }}>
                                                    🗑️ Xóa bình luận
                                                </div>
                                            }
                                            description={
                                                <div style={{ maxWidth: '250px' }}>
                                                    Bạn có chắc muốn xóa bình luận này?
                                                    <br />
                                                    <Text type="warning" style={{ fontSize: '12px' }}>
                                                        ⚠️ Hành động này không thể hoàn tác.
                                                    </Text>
                                                </div>
                                            }
                                            onConfirm={() => {
                                                console.log('🗑️ Deleting comment:', comment.CommentID);
                                                handleDeleteComment(comment.CommentID);
                                            }}
                                            okText="Xóa bình luận"
                                            cancelText="Hủy bỏ"
                                            okButtonProps={{
                                                danger: true,
                                                style: {
                                                    borderRadius: '6px',
                                                    fontWeight: 600
                                                }
                                            }}
                                            cancelButtonProps={{
                                                style: {
                                                    borderRadius: '6px',
                                                    fontWeight: 600
                                                }
                                            }}
                                        >
                                            <Button
                                                type="text"
                                                size="small"
                                                danger
                                                icon={<DeleteOutlined />}
                                                style={{
                                                    borderRadius: '8px',
                                                    color: '#ef4444',
                                                    height: '32px',
                                                    width: '32px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                                    e.currentTarget.style.color = '#dc2626';
                                                    e.currentTarget.style.transform = 'scale(1.1)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'transparent';
                                                    e.currentTarget.style.color = '#ef4444';
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                            />
                                        </Popconfirm>
                                    </Tooltip>
                                </Space>
                            )}
                        </div>

                        {/* Comment Content */}
                        {editingCommentId === comment.CommentID ? (
                            <div style={{ marginLeft: 32 }}>
                                <TextArea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    rows={3}
                                    style={{ marginBottom: 8 }}
                                    placeholder="Chỉnh sửa nội dung comment..."
                                />
                                <Space>
                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<SaveOutlined />}
                                        loading={updating}
                                        onClick={() => handleUpdateComment(comment.CommentID)}
                                        disabled={!editText.trim()}
                                    >
                                        Lưu
                                    </Button>
                                    <Button
                                        size="small"
                                        icon={<CloseOutlined />}
                                        onClick={handleCancelEdit}
                                    >
                                        Hủy
                                    </Button>
                                </Space>
                            </div>
                        ) : (
                            <div style={{ marginLeft: 32 }}>
                                <Text>{comment.Content}</Text>
                            </div>
                        )}
                    </div>
                </List.Item>
            )}
        />
    );
};

export default CommentManager; 