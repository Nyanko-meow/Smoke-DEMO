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

        setUpdating(true);
        try {
            const response = await axios.put(`/api/community/comments/${commentId}`, {
                content: editText
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.data.success) {
                setComments(prevComments =>
                    prevComments.map(comment =>
                        comment.CommentID === commentId
                            ? { ...comment, Content: editText }
                            : comment
                    )
                );
                message.success('Cập nhật comment thành công');
                handleCancelEdit();
            }
        } catch (error) {
            console.error('Error updating comment:', error);
            message.error('Lỗi khi cập nhật comment');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const response = await axios.delete(`/api/community/comments/${commentId}`, {
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
                            {canEditOrDelete(comment) && editingCommentId !== comment.CommentID && (
                                <Space size="small">
                                    <Tooltip title="Chỉnh sửa comment">
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => handleStartEdit(comment)}
                                        />
                                    </Tooltip>
                                    <Tooltip title="Xóa comment">
                                        <Popconfirm
                                            title="Bạn có chắc muốn xóa comment này?"
                                            description="Hành động này không thể hoàn tác"
                                            onConfirm={() => handleDeleteComment(comment.CommentID)}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                            okButtonProps={{ danger: true }}
                                        >
                                            <Button
                                                type="text"
                                                size="small"
                                                danger
                                                icon={<DeleteOutlined />}
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