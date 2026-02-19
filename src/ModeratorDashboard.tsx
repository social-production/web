import { useState } from 'react';
import { Button, Card, Modal, TopNav } from './components';
import { Report, ModerationAction } from './types';

// Mock reports data
const mockReports: Report[] = [
  {
    id: 1,
    type: 'post',
    targetId: 4,
    reporter: 'urbanwatch_k',
    reason: 'Spam - This post appears to be advertising a commercial service',
    status: 'pending',
    createdAt: '2 hours ago',
  },
  {
    id: 2,
    type: 'comment',
    targetId: 15,
    reporter: 'commonist',
    reason: 'Harassment - Personal attacks against another user',
    status: 'pending',
    createdAt: '5 hours ago',
  },
  {
    id: 3,
    type: 'user',
    targetId: 'spam_account_123',
    reporter: 'Rosa_M',
    reason: 'Spam account - Multiple duplicate posts across channels',
    status: 'reviewed',
    createdAt: '1 day ago',
  },
  {
    id: 4,
    type: 'post',
    targetId: 8,
    reporter: 'teach_bk',
    reason: 'Misinformation - False claims about city regulations',
    status: 'resolved',
    createdAt: '2 days ago',
  },
];

const mockModerationLog: ModerationAction[] = [
  {
    id: 1,
    type: 'removal',
    targetPost: 12,
    reason: 'Spam content removed',
    moderator: 'Rosa_M',
    timestamp: '3 hours ago',
  },
  {
    id: 2,
    type: 'warning',
    targetUser: 'problematic_user',
    reason: 'Inappropriate language in comments',
    moderator: 'Rosa_M',
    timestamp: '1 day ago',
  },
  {
    id: 3,
    type: 'ban',
    targetUser: 'spam_bot',
    reason: 'Repeated spam posts',
    moderator: 'Rosa_M',
    timestamp: '3 days ago',
  },
];

export default function ModeratorDashboard() {
  const [activeTab, setActiveTab] = useState<'reports' | 'log' | 'channels'>('reports');
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'dismiss' | 'warn' | 'remove' | 'ban'>('dismiss');
  const [actionReason, setActionReason] = useState('');

  const pendingReports = reports.filter(r => r.status === 'pending');
  const reviewedReports = reports.filter(r => r.status !== 'pending');

  const handleReportAction = () => {
    if (!selectedReport) return;
    
    setReports(reports.map(r => 
      r.id === selectedReport.id 
        ? { ...r, status: actionType === 'dismiss' ? 'dismissed' : 'resolved' }
        : r
    ));
    
    setShowActionModal(false);
    setSelectedReport(null);
    setActionReason('');
  };

  const openActionModal = (report: Report, action: 'dismiss' | 'warn' | 'remove' | 'ban') => {
    setSelectedReport(report);
    setActionType(action);
    setShowActionModal(true);
  };

  const getReportTypeIcon = (type: Report['type']) => {
    switch (type) {
      case 'post': return '📝';
      case 'comment': return '💬';
      case 'user': return '👤';
    }
  };

  const getStatusBadge = (status: Report['status']) => {
    const styles: Record<Report['status'], { bg: string; color: string }> = {
      pending: { bg: '#fef3c7', color: '#92400e' },
      reviewed: { bg: '#dbeafe', color: '#1e40af' },
      resolved: { bg: '#dcfce7', color: '#166534' },
      dismissed: { bg: '#f3f4f6', color: '#4b5563' },
    };
    return (
      <span
        style={{
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase' as const,
          padding: '2px 8px',
          borderRadius: '4px',
          background: styles[status].bg,
          color: styles[status].color,
        }}
      >
        {status}
      </span>
    );
  };

  const getActionTypeBadge = (type: ModerationAction['type']) => {
    const styles: Record<ModerationAction['type'], { bg: string; color: string; label: string }> = {
      warning: { bg: '#fef3c7', color: '#92400e', label: 'Warning' },
      removal: { bg: '#fee2e2', color: '#991b1b', label: 'Removed' },
      ban: { bg: '#7f1d1d', color: '#fff', label: 'Banned' },
      lock: { bg: '#e5e7eb', color: '#374151', label: 'Locked' },
    };
    const s = styles[type];
    return (
      <span
        style={{
          fontSize: '10px',
          fontWeight: 600,
          textTransform: 'uppercase' as const,
          padding: '2px 8px',
          borderRadius: '4px',
          background: s.bg,
          color: s.color,
        }}
      >
        {s.label}
      </span>
    );
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f6f7f8', minHeight: '100vh', color: '#1c1c1c' }}>
      <TopNav showBack />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
            Moderator Dashboard
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Manage reports, moderate content, and oversee community health
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <Card style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                ⚠️
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                  {pendingReports.length}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Pending Reports</div>
              </div>
            </div>
          </Card>
          <Card style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                ✓
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                  {reports.filter(r => r.status === 'resolved').length}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Resolved Today</div>
              </div>
            </div>
          </Card>
          <Card style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                📊
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>9</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Channels Managed</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '20px' }}>
          {[
            { id: 'reports' as const, label: 'Reports', icon: '⚠️', count: pendingReports.length },
            { id: 'log' as const, label: 'Moderation Log', icon: '📋' },
            { id: 'channels' as const, label: 'Channel Management', icon: '📁' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #2d6a4f' : '2px solid transparent',
                color: activeTab === tab.id ? '#2d6a4f' : '#6b7280',
                fontWeight: activeTab === tab.id ? 600 : 400,
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                marginBottom: '-1px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && (
                <span
                  style={{
                    fontSize: '11px',
                    background: activeTab === tab.id ? '#f0faf3' : '#f3f4f6',
                    color: activeTab === tab.id ? '#2d6a4f' : '#6b7280',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    fontWeight: 600,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div>
            {/* Pending Reports */}
            {pendingReports.length > 0 && (
              <>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
                  Pending Review
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {pendingReports.map(report => (
                    <Card key={report.id}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: '#fef3c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            flexShrink: 0,
                          }}
                        >
                          {getReportTypeIcon(report.type)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                              {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
                            </span>
                            {getStatusBadge(report.status)}
                          </div>
                          <p style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                            {report.reason}
                          </p>
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            Reported by <strong style={{ color: '#6b7280' }}>{report.reporter}</strong> • {report.createdAt}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <Button variant="ghost" size="sm" onClick={() => openActionModal(report, 'dismiss')}>
                            Dismiss
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => openActionModal(report, 'warn')}>
                            Warn
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => openActionModal(report, 'remove')}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Reviewed Reports */}
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
              Recently Reviewed
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reviewedReports.map(report => (
                <Card key={report.id}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        flexShrink: 0,
                      }}
                    >
                      {getReportTypeIcon(report.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                          {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
                        </span>
                        {getStatusBadge(report.status)}
                      </div>
                      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                        {report.reason}
                      </p>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        Reported by <strong style={{ color: '#6b7280' }}>{report.reporter}</strong> • {report.createdAt}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Moderation Log Tab */}
        {activeTab === 'log' && (
          <Card>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
              Recent Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mockModerationLog.map(action => (
                <div
                  key={action.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  {getActionTypeBadge(action.type)}
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '13px', color: '#374151' }}>
                      {action.reason}
                    </span>
                    {action.targetUser && (
                      <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                        (User: <strong>{action.targetUser}</strong>)
                      </span>
                    )}
                    {action.targetPost && (
                      <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                        (Post: <strong>#{action.targetPost}</strong>)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                    by <strong style={{ color: '#6b7280' }}>{action.moderator}</strong> • {action.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Channel Management Tab */}
        {activeTab === 'channels' && (
          <Card>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
              Channels You Moderate
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { name: 'New York', icon: '🏙️', subscribers: 2103, posts: 156 },
                { name: 'Brooklyn', icon: '🌉', subscribers: 1456, posts: 89 },
                { name: 'Politics', icon: '🏛️', subscribers: 892, posts: 234 },
                { name: 'Meta', icon: '⚙️', subscribers: 1247, posts: 67 },
              ].map(channel => (
                <div
                  key={channel.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{channel.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                      {channel.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {channel.subscribers.toLocaleString()} subscribers • {channel.posts} posts
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="ghost" size="sm">View</Button>
                    <Button variant="secondary" size="sm">Settings</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Action Modal */}
      <Modal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Report`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowActionModal(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'dismiss' ? 'secondary' : actionType === 'ban' ? 'danger' : 'primary'}
              onClick={handleReportAction}
            >
              Confirm {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>
          {actionType === 'dismiss' && 'Are you sure you want to dismiss this report? No action will be taken.'}
          {actionType === 'warn' && 'A warning will be sent to the user. They will be notified of the violation.'}
          {actionType === 'remove' && 'The content will be removed and the user will be notified.'}
          {actionType === 'ban' && 'This will ban the user from the platform. This action cannot be undone easily.'}
        </p>
        {selectedReport && (
          <div
            style={{
              padding: '12px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Report reason:</div>
            <div style={{ fontSize: '13px', color: '#374151' }}>{selectedReport.reason}</div>
          </div>
        )}
        <div style={{ marginBottom: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
            Notes (optional)
          </label>
          <textarea
            value={actionReason}
            onChange={e => setActionReason(e.target.value)}
            placeholder="Add any notes about this action..."
            style={{
              width: '100%',
              minHeight: '80px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = '#52b788'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
      </Modal>
    </div>
  );
}