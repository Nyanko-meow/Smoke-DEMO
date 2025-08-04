import React from 'react';
import { Alert, Card, Row, Col, Button } from 'antd';
import { FormOutlined, FileTextOutlined, ArrowRightOutlined } from '@ant-design/icons';

const MenuGuide = () => {
    return (
        <div style={{ padding: '20px' }}>
            <Alert 
                message="⚠️ CHỌN ĐÚNG MENU!" 
                description="Bạn đang ở menu SAI. Hãy chọn menu ĐÚNG để xem dữ liệu khảo sát nghiện thuốc."
                type="warning" 
                showIcon 
                style={{ marginBottom: '20px' }}
            />
            
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card 
                        title={
                            <span>
                                <FileTextOutlined style={{ color: '#ff4d4f' }} /> 
                                {' '}📝 Menu &quot;Khảo sát&quot; (CŨ)
                            </span>
                        }
                        style={{ border: '2px solid #ff4d4f' }}
                    >
                        <p><strong>❌ BẠN ĐANG Ở ĐÂY!</strong></p>
                        <p>🗂️ <strong>API:</strong> /api/coach/survey-overview</p>
                        <p>🗄️ <strong>Bảng:</strong> SurveyQuestions + UserSurveyAnswers</p>
                        <p>📊 <strong>Kết quả:</strong> 0 answers (không có data)</p>
                        <p style={{ color: '#666' }}>
                            Menu này dành cho khảo sát chung, không phải khảo sát nghiện thuốc lá.
                        </p>
                    </Card>
                </Col>
                
                <Col xs={24} md={12}>
                    <Card 
                        title={
                            <span>
                                <FormOutlined style={{ color: '#52c41a' }} /> 
                                {' '}🚭 Menu &quot;Khảo sát nghiện thuốc&quot; (MỚI)
                            </span>
                        }
                        style={{ border: '2px solid #52c41a' }}
                    >
                        <p><strong>✅ HÃY CHUYỂN VỀ ĐÂY!</strong></p>
                        <p>🗂️ <strong>API:</strong> /api/coach/addiction-overview</p>
                        <p>🗄️ <strong>Bảng:</strong> SmokingAddictionSurveyResults + SmokingAddictionSurveyAnswers</p>
                        <p>📊 <strong>Kết quả:</strong> 1 member với 82% success rate</p>
                        <p style={{ color: '#666' }}>
                            Menu này chứa dữ liệu khảo sát nghiện thuốc lá mà bạn cần.
                        </p>
                        
                        <div style={{ marginTop: '15px', textAlign: 'center' }}>
                            <Button 
                                type="primary" 
                                icon={<ArrowRightOutlined />}
                                size="large"
                                style={{ background: '#52c41a', borderColor: '#52c41a' }}
                            >
                                Click Menu Này!
                            </Button>
                        </div>
                    </Card>
                </Col>
            </Row>
            
            <Alert 
                message="🎯 HƯỚNG DẪN" 
                description={
                    <div>
                        <p><strong>Bước 1:</strong> Nhìn menu bên trái của trang</p>
                        <p><strong>Bước 2:</strong> Tìm menu có icon <FormOutlined /> và tên <strong>&quot;Khảo sát nghiện thuốc&quot;</strong></p>
                        <p><strong>Bước 3:</strong> Click vào menu đó (KHÔNG phải menu &quot;Khảo sát&quot;)</p>
                        <p><strong>Bước 4:</strong> Bạn sẽ thấy dữ liệu: 1 member, 82% success rate, 459k VNĐ/tháng</p>
                    </div>
                }
                type="info" 
                showIcon 
                style={{ marginTop: '20px' }}
            />
        </div>
    );
};

export default MenuGuide;