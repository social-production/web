import { useState } from 'react';
import { Button, Input, Card, Toggle, Modal, TopNav } from './components';
import { FederatedNode } from './types';

const PRIMARY_GREEN = '#2d6a4f';

// Mock federated nodes
const mockNodes: FederatedNode[] = [
  {
    id: 'node-1',
    name: 'Brooklyn Community',
    url: 'https://brooklyn.social.production',
    status: 'connected',
    lastSync: '2 hours ago',
    userCount: 342,
    description: 'Brooklyn-based community organizing node',
  },
  {
    id: 'node-2',
    name: 'Manhattan Collective',
    url: 'https://manhattan.social.production',
    status: 'connected',
    lastSync: '5 hours ago',
    userCount: 189,
    description: 'Manhattan community projects and mutual aid',
  },
  {
    id: 'node-3',
    name: 'Queens Network',
    url: 'https://queens.social.production',
    status: 'pending',
    description: 'Awaiting approval',
  },
  {
    id: 'node-4',
    name: 'Bronx Organizers',
    url: 'https://bronx.social.production',
    status: 'disconnected',
    lastSync: '3 days ago',
    userCount: 78,
  },
];

export default function NetworkSettingsPage() {
  const [nodes, setNodes] = useState<FederatedNode[]>(mockNodes);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNodeUrl, setNewNodeUrl] = useState('');
  const [newNodeName, setNewNodeName] = useState('');
  const [connecting, setConnecting] = useState(false);

  // Node settings
  const [nodeName, setNodeName] = useState('NYC Community Node');
  const [nodeDescription, setNodeDescription] = useState('New York City community organizing and mutual aid platform');
  const [publicNode, setPublicNode] = useState(true);
  const [allowFederation, setAllowFederation] = useState(true);

  const handleAddNode = async () => {
    if (!newNodeUrl) return;
    setConnecting(true);
    // Simulate connection attempt
    await new Promise(resolve => setTimeout(resolve, 1500));
    const newNode: FederatedNode = {
      id: `node-${Date.now()}`,
      name: newNodeName || newNodeUrl.replace(/https?:\/\//, '').split('.')[0],
      url: newNodeUrl,
      status: 'pending',
      description: 'Connection request sent',
    };
    setNodes([...nodes, newNode]);
    setNewNodeUrl('');
    setNewNodeName('');
    setConnecting(false);
    setShowAddModal(false);
  };

  const handleDisconnect = (nodeId: string) => {
    setNodes(nodes.map(n => 
      n.id === nodeId ? { ...n, status: 'disconnected' as const } : n
    ));
  };

  const handleReconnect = async (nodeId: string) => {
    setNodes(nodes.map(n => 
      n.id === nodeId ? { ...n, status: 'pending' as const } : n
    ));
    // Simulate reconnection
    await new Promise(resolve => setTimeout(resolve, 2000));
    setNodes(nodes.map(n => 
      n.id === nodeId ? { ...n, status: 'connected' as const, lastSync: 'Just now' } : n
    ));
  };

  const getStatusColor = (status: FederatedNode['status']) => {
    switch (status) {
      case 'connected': return '#22c55e';
      case 'pending': return '#eab308';
      case 'disconnected': return '#ef4444';
    }
  };

  const connectedCount = nodes.filter(n => n.status === 'connected').length;
  const pendingCount = nodes.filter(n => n.status === 'pending').length;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f6f7f8', minHeight: '100vh', color: '#1c1c1c' }}>
      <TopNav showBack />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px', display: 'flex', justifyContent: 'flex-end', marginBottom: '-16px' }}>
        <Button onClick={() => setShowAddModal(true)}>
          + Add Node
        </Button>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
            Network Settings
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Configure federation and connect to other nodes
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <Card style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: PRIMARY_GREEN }}>{connectedCount}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Connected Nodes</div>
          </Card>
          <Card style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#eab308' }}>{pendingCount}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Pending Requests</div>
          </Card>
          <Card style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>
              {nodes.filter(n => n.status === 'connected').reduce((sum, n) => sum + (n.userCount || 0), 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Federated Users</div>
          </Card>
        </div>

        {/* Node Settings */}
        <Card style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '20px' }}>
            Node Configuration
          </h2>

          <Input
            label="Node Name"
            value={nodeName}
            onChange={setNodeName}
            placeholder="Your node's name"
          />

          <Input
            label="Description"
            value={nodeDescription}
            onChange={setNodeDescription}
            placeholder="Brief description of your node"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
            <Toggle
              enabled={publicNode}
              onChange={setPublicNode}
              label="Public Node"
              description="Allow other nodes to discover and connect to this node"
            />

            <div style={{ height: '1px', background: '#e5e7eb' }} />

            <Toggle
              enabled={allowFederation}
              onChange={setAllowFederation}
              label="Enable Federation"
              description="Share content with connected nodes (threads, projects, events)"
            />
          </div>
        </Card>

        {/* Connected Nodes */}
        <Card>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
            Connected Nodes
          </h2>

          {nodes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
              No nodes connected yet. Add a node to start federating.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {nodes.map(node => (
                <div
                  key={node.id}
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
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: getStatusColor(node.status),
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                        {node.name}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: node.status === 'connected' ? '#dcfce7' : node.status === 'pending' ? '#fef9c3' : '#fee2e2',
                          color: node.status === 'connected' ? '#166534' : node.status === 'pending' ? '#854d0e' : '#991b1b',
                        }}
                      >
                        {node.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                      {node.url}
                    </div>
                    {node.userCount && (
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                        {node.userCount} users • Last sync: {node.lastSync}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {node.status === 'connected' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(node.id)}
                      >
                        Disconnect
                      </Button>
                    )}
                    {node.status === 'disconnected' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReconnect(node.id)}
                      >
                        Reconnect
                      </Button>
                    )}
                    {node.status === 'pending' && (
                      <span style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>
                        Awaiting approval...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Info Box */}
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            background: '#eff6ff',
            borderRadius: '8px',
            border: '1px solid #bfdbfe',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e40af', marginBottom: '4px' }}>
            ℹ️ About Federation
          </div>
          <p style={{ fontSize: '12px', color: '#1e40af', margin: 0, lineHeight: '1.6' }}>
            Federation allows different Social Production nodes to share content while remaining independent. 
            Users from connected nodes can view and interact with your public threads and projects. 
            Each node maintains its own user accounts and moderation policies.
          </p>
        </div>
      </div>

      {/* Add Node Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Federated Node"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNode} disabled={!newNodeUrl || connecting}>
              {connecting ? 'Connecting...' : 'Connect'}
            </Button>
          </>
        }
      >
        <Input
          label="Node URL"
          value={newNodeUrl}
          onChange={setNewNodeUrl}
          placeholder="https://node.social.production"
          hint="The full URL of the node you want to connect to"
        />
        <Input
          label="Node Name (optional)"
          value={newNodeName}
          onChange={setNewNodeName}
          placeholder="Brooklyn Community"
          hint="A friendly name for this node"
        />
      </Modal>
    </div>
  );
}