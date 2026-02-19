import { useState } from 'react';
import { Button, Input, Textarea, Card, Toggle, TopNav } from './components';
import { User, UserSettings } from './types';

const DARK_GREEN = '#1a3d2b';

// Mock current user data (will be replaced with real data from backend)
const mockCurrentUser: User & UserSettings = {
  username: 'Rosa_M',
  bio: 'Community organizer in East Village. Passionate about urban gardens and mutual aid.',
  joined: '3 months ago',
  score: 1247,
  email: 'rosa@example.com',
  location: 'East Village, NYC',
  website: 'https://rosa-community.org',
  notifications: {
    email: true,
    push: true,
    mentions: true,
    projectUpdates: true,
  },
  privacy: {
    showEmail: false,
    showLocation: true,
    showActivity: true,
  },
  theme: 'system',
};

export default function EditProfilePage() {
  const [activeSection, setActiveSection] = useState<'profile' | 'notifications' | 'privacy'>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Profile state
  const [bio, setBio] = useState(mockCurrentUser.bio);
  const [email, setEmail] = useState(mockCurrentUser.email || '');
  const [location, setLocation] = useState(mockCurrentUser.location || '');
  const [website, setWebsite] = useState(mockCurrentUser.website || '');

  // Notification settings
  const [emailNotif, setEmailNotif] = useState(mockCurrentUser.notifications.email);
  const [pushNotif, setPushNotif] = useState(mockCurrentUser.notifications.push);
  const [mentionsNotif, setMentionsNotif] = useState(mockCurrentUser.notifications.mentions);
  const [projectUpdatesNotif, setProjectUpdatesNotif] = useState(mockCurrentUser.notifications.projectUpdates);

  // Privacy settings
  const [showEmail, setShowEmail] = useState(mockCurrentUser.privacy.showEmail);
  const [showLocation, setShowLocation] = useState(mockCurrentUser.privacy.showLocation);
  const [showActivity, setShowActivity] = useState(mockCurrentUser.privacy.showActivity);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    { id: 'profile' as const, label: 'Profile', icon: '👤' },
    { id: 'notifications' as const, label: 'Notifications', icon: '🔔' },
    { id: 'privacy' as const, label: 'Privacy', icon: '🔒' },
  ];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#f6f7f8', minHeight: '100vh', color: '#1c1c1c' }}>
      <TopNav showBack />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px', display: 'flex', justifyContent: 'flex-end', marginBottom: '-16px' }}>
        {saved && (
          <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: 500, marginRight: '8px' }}>
            ✓ Saved
          </span>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
            Settings
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Manage your account settings and preferences
          </p>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Sidebar */}
          <div style={{ width: '200px', flexShrink: 0 }}>
            <Card style={{ padding: '8px' }}>
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: activeSection === section.id ? '#f0faf3' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: activeSection === section.id ? 600 : 400,
                    color: activeSection === section.id ? '#2d6a4f' : '#4b5563',
                    fontFamily: 'Inter, sans-serif',
                    textAlign: 'left' as const,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.background = '#f9fafb';
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span>{section.icon}</span>
                  {section.label}
                </button>
              ))}
            </Card>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1 }}>
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <Card>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '20px' }}>
                  Profile Information
                </h2>

                {/* Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      background: `linear-gradient(135deg, ${DARK_GREEN}, #2d6a4f)`,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    {mockCurrentUser.username[0].toUpperCase()}
                  </div>
                  <div>
                    <Button variant="secondary" size="sm">
                      Change Avatar
                    </Button>
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
                      JPG, PNG or GIF. Max 2MB.
                    </p>
                  </div>
                </div>

                {/* Username (read-only) */}
                <div style={{ marginBottom: '14px' }}>
                  <label
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#374151',
                      display: 'block',
                      marginBottom: '6px',
                    }}
                  >
                    Username
                  </label>
                  <div
                    style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '14px',
                      color: '#6b7280',
                    }}
                  >
                    u/{mockCurrentUser.username}
                  </div>
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                    Username cannot be changed
                  </p>
                </div>

                <Textarea
                  label="Bio"
                  value={bio}
                  onChange={setBio}
                  placeholder="Tell others about yourself..."
                  maxLength={200}
                  rows={3}
                  hint="Brief description for your profile"
                />

                <Input
                  label="Email"
                  value={email}
                  onChange={setEmail}
                  type="email"
                  placeholder="your@email.com"
                />

                <Input
                  label="Location"
                  value={location}
                  onChange={setLocation}
                  placeholder="City, Country"
                />

                <Input
                  label="Website"
                  value={website}
                  onChange={setWebsite}
                  type="text"
                  placeholder="https://your-website.com"
                />
              </Card>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <Card>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '20px' }}>
                  Notification Preferences
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <Toggle
                    enabled={emailNotif}
                    onChange={setEmailNotif}
                    label="Email Notifications"
                    description="Receive notifications via email"
                  />

                  <div style={{ height: '1px', background: '#e5e7eb' }} />

                  <Toggle
                    enabled={pushNotif}
                    onChange={setPushNotif}
                    label="Push Notifications"
                    description="Receive push notifications in your browser"
                  />

                  <div style={{ height: '1px', background: '#e5e7eb' }} />

                  <Toggle
                    enabled={mentionsNotif}
                    onChange={setMentionsNotif}
                    label="Mentions"
                    description="Get notified when someone mentions you"
                  />

                  <div style={{ height: '1px', background: '#e5e7eb' }} />

                  <Toggle
                    enabled={projectUpdatesNotif}
                    onChange={setProjectUpdatesNotif}
                    label="Project Updates"
                    description="Get notified about updates to projects you're involved in"
                  />
                </div>
              </Card>
            )}

            {/* Privacy Section */}
            {activeSection === 'privacy' && (
              <Card>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginBottom: '20px' }}>
                  Privacy Settings
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <Toggle
                    enabled={showEmail}
                    onChange={setShowEmail}
                    label="Show Email"
                    description="Display your email address on your public profile"
                  />

                  <div style={{ height: '1px', background: '#e5e7eb' }} />

                  <Toggle
                    enabled={showLocation}
                    onChange={setShowLocation}
                    label="Show Location"
                    description="Display your location on your public profile"
                  />

                  <div style={{ height: '1px', background: '#e5e7eb' }} />

                  <Toggle
                    enabled={showActivity}
                    onChange={setShowActivity}
                    label="Show Activity"
                    description="Allow others to see your posts and comments on your profile"
                  />
                </div>

                <div
                  style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    border: '1px solid #fcd34d',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                    ⚠️ Note
                  </div>
                  <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>
                    Your threads, projects, and comments are always public. Privacy settings only affect what's shown on your profile page.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}