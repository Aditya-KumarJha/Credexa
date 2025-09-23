"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const Sidebar = dynamic(() => import("@/components/dashboard/Sidebar"), { ssr: false });
import api from "@/utils/axios";
import {
  Button as AntButton,
} from "@/components/ui/button";
import {
  Card,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Tabs,
  Space,
  message,
  ConfigProvider,
  theme as antdTheme,
  Divider,
  Typography,
  List,
  Avatar,
  Popconfirm,
  Button,
} from "antd";
import {
  Settings,
  User,
  Palette,
  Shield,
  Eye,
  Smartphone,
  Monitor,
  Globe,
  Bell,
  Lock,
  Trash2,
  QrCode,
} from "lucide-react";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";

const { Title, Text } = Typography;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  
  // Initialize forms after component mounts
  const [profileForm] = Form.useForm();
  const [preferencesForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [privacyForm] = Form.useForm();
  
  // 2FA states
  const [twoFactorModal, setTwoFactorModal] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchSettings();
      fetchActiveSessions();
    }
  }, [mounted]);

  const fetchSettings = async () => {
    try {
      const response = await api.get("/api/settings");
      if (response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        
        // Initialize forms
        profileForm.setFieldsValue({
          firstName: userData.fullName?.firstName || "",
          lastName: userData.fullName?.lastName || "",
          email: userData.email || "",
        });

        if (userData.settings?.preferences) {
          preferencesForm.setFieldsValue({
            theme: userData.settings.preferences.theme || "system",
            language: userData.settings.preferences.language || "en",
            timezone: userData.settings.preferences.timezone || "UTC",
            emailNotifications: userData.settings.preferences.notifications?.email ?? true,
            pushNotifications: userData.settings.preferences.notifications?.push ?? true,
            marketingNotifications: userData.settings.preferences.notifications?.marketing ?? false,
            securityNotifications: userData.settings.preferences.notifications?.security ?? true,
          });
        }

        if (userData.settings?.security) {
          securityForm.setFieldsValue({
            sessionTimeout: userData.settings.security.sessionTimeout || 30,
            loginNotifications: userData.settings.security.loginNotifications ?? true,
            twoFactorEnabled: userData.settings.security.twoFactorEnabled ?? false,
          });
        }

        if (userData.settings?.privacy) {
          privacyForm.setFieldsValue({
            profileVisibility: userData.settings.privacy.profileVisibility || "public",
            showEmail: userData.settings.privacy.showEmail ?? false,
            showCredentials: userData.settings.privacy.showCredentials ?? true,
            allowProfileIndexing: userData.settings.privacy.allowProfileIndexing ?? true,
          });
        }
      }
    } catch (error: any) {
      console.error("Fetch settings error:", error);
      toast.error("Failed to load settings");
      if (error.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const response = await api.get("/api/settings/security/sessions");
      if (response.data.success) {
        setActiveSessions(response.data.data);
      }
    } catch (error) {
      console.error("Fetch sessions error:", error);
    }
  };

  const updateProfile = async (values: any) => {
    try {
      // Validate input
      if (!values.firstName?.trim() || !values.lastName?.trim()) {
        toast.error("First name and last name are required");
        return;
      }

      if (!values.email?.trim()) {
        toast.error("Email is required");
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(values.email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      // Password validation if changing password
      if (values.newPassword) {
        if (!values.currentPassword) {
          toast.error("Current password is required to change password");
          return;
        }
        if (values.newPassword.length < 6) {
          toast.error("New password must be at least 6 characters long");
          return;
        }
        if (values.newPassword !== values.confirmPassword) {
          toast.error("New passwords do not match");
          return;
        }
        // Password strength check
        const hasUpperCase = /[A-Z]/.test(values.newPassword);
        const hasLowerCase = /[a-z]/.test(values.newPassword);
        const hasNumbers = /\d/.test(values.newPassword);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(values.newPassword);
        
        if (!(hasUpperCase && hasLowerCase && (hasNumbers || hasSpecial))) {
          toast.error("Password must contain uppercase, lowercase, and numbers or special characters");
          return;
        }
      }

      const payload: any = {
        fullName: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
        },
        email: values.email.trim().toLowerCase(),
      };

      if (values.newPassword) {
        payload.currentPassword = values.currentPassword;
        payload.newPassword = values.newPassword;
      }

      const response = await api.put("/api/settings/profile", payload);
      if (response.data.success) {
        toast.success("Profile updated successfully");
        setUser(response.data.data);
        profileForm.resetFields(["currentPassword", "newPassword", "confirmPassword"]);
      }
    } catch (error: any) {
      console.error("Update profile error:", error);
      const errorMessage = error.response?.data?.message || "Failed to update profile";
      toast.error(errorMessage);
    }
  };

  const updatePreferences = async (values: any) => {
    try {
      const payload = {
        theme: values.theme,
        language: values.language,
        timezone: values.timezone,
        notifications: {
          email: values.emailNotifications,
          push: values.pushNotifications,
          marketing: values.marketingNotifications,
          security: values.securityNotifications,
        },
      };

      const response = await api.put("/api/settings/preferences", payload);
      if (response.data.success) {
        toast.success("Preferences updated successfully");
        
        // Apply theme change immediately
        if (values.theme !== theme) {
          setTheme(values.theme);
        }
      }
    } catch (error: any) {
      console.error("Update preferences error:", error);
      toast.error("Failed to update preferences");
    }
  };

  const updateSecurity = async (values: any) => {
    try {
      const payload = {
        sessionTimeout: values.sessionTimeout,
        loginNotifications: values.loginNotifications,
      };

      const response = await api.put("/api/settings/security", payload);
      if (response.data.success) {
        toast.success("Security settings updated successfully");
      }
    } catch (error: any) {
      console.error("Update security error:", error);
      toast.error("Failed to update security settings");
    }
  };

  const updatePrivacy = async (values: any) => {
    try {
      const response = await api.put("/api/settings/privacy", values);
      if (response.data.success) {
        toast.success("Privacy settings updated successfully");
      }
    } catch (error: any) {
      console.error("Update privacy error:", error);
      toast.error("Failed to update privacy settings");
    }
  };

  const handleEnable2FA = async () => {
    try {
      const response = await api.post("/api/settings/security/2fa", { enable: true });
      if (response.data.success) {
        if (response.data.qrCode) {
          setQrCode(response.data.qrCode);
          setTwoFactorSecret(response.data.secret);
          setTwoFactorModal(true);
        } else {
          toast.success("Two-factor authentication enabled");
          fetchSettings();
        }
      }
    } catch (error) {
      console.error("Enable 2FA error:", error);
      toast.error("Failed to enable two-factor authentication");
    }
  };

  const handleDisable2FA = async () => {
    try {
      const response = await api.post("/api/settings/security/2fa", { enable: false });
      if (response.data.success) {
        toast.success("Two-factor authentication disabled");
        fetchSettings();
      }
    } catch (error) {
      console.error("Disable 2FA error:", error);
      toast.error("Failed to disable two-factor authentication");
    }
  };

  const handleVerify2FA = async () => {
    try {
      const response = await api.post("/api/settings/security/2fa", {
        enable: true,
        token: verificationCode,
      });
      if (response.data.success) {
        toast.success("Two-factor authentication enabled successfully");
        setTwoFactorModal(false);
        setVerificationCode("");
        setQrCode("");
        setTwoFactorSecret("");
        fetchSettings();
      }
    } catch (error: any) {
      console.error("Verify 2FA error:", error);
      toast.error(error.response?.data?.message || "Invalid verification code");
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const response = await api.delete(`/api/settings/security/sessions/${sessionId}`);
      if (response.data.success) {
        toast.success("Session revoked successfully");
        fetchActiveSessions();
      }
    } catch (error: any) {
      console.error("Revoke session error:", error);
      toast.error("Failed to revoke session");
    }
  };

  const handleClearAllSessions = async () => {
    try {
      const response = await api.delete("/api/settings/security/sessions");
      if (response.data.success) {
        toast.success("All sessions cleared successfully");
        fetchActiveSessions();
      }
    } catch (error: any) {
      console.error("Clear all sessions error:", error);
      toast.error("Failed to clear all sessions");
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <ConfigProvider
        theme={{
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorBgBase: "var(--color-background)",
            colorText: "var(--color-foreground)",
            colorTextSecondary: "var(--color-muted-foreground)",
            colorBorder: "var(--color-border)",
            colorPrimary: "var(--color-primary)",
            colorBgContainer: "var(--color-card)",
            borderRadius: 12,
          },
        }}
      >
        <div className="min-h-screen bg-background text-foreground flex">
          <Sidebar />
          <main className="flex-1 p-6 md:p-10">
            <div className="flex items-center justify-center h-96">
              <Text>Loading settings...</Text>
            </div>
          </main>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorBgBase: "var(--color-background)",
          colorText: "var(--color-foreground)",
          colorTextSecondary: "var(--color-muted-foreground)",
          colorBorder: "var(--color-border)",
          colorPrimary: "var(--color-primary)",
          colorBgContainer: "var(--color-card)",
          borderRadius: 12,
        },
      }}
    >
      <div className="min-h-screen bg-background text-foreground flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10">
          <div className="max-w-4xl">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <Title level={2} className="flex items-center gap-2 !mb-0">
                  <Settings className="w-6 h-6" />
                  Settings
                </Title>
                <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
              </div>
              <Text type="secondary">Manage your account settings and preferences</Text>
            </div>

            <Card className="shadow-lg border-0">
              <Tabs 
                defaultActiveKey="profile" 
                size="large"
                items={[
                  {
                    key: "profile",
                    label: (
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Profile
                      </span>
                    ),
                    children: (
                      <Form
                        form={profileForm}
                        layout="vertical"
                        onFinish={updateProfile}
                        className="max-w-2xl"
                      >
                        <Title level={4}>Personal Information</Title>
                        <Space direction="vertical" size="large" className="w-full">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item
                              name="firstName"
                              label="First Name"
                              rules={[{ required: true, message: "First name is required" }]}
                            >
                              <Input placeholder="Enter your first name" />
                            </Form.Item>
                            <Form.Item
                              name="lastName"
                              label="Last Name"
                              rules={[{ required: true, message: "Last name is required" }]}
                            >
                              <Input placeholder="Enter your last name" />
                            </Form.Item>
                          </div>
                          <Form.Item
                            name="email"
                            label="Email Address"
                            rules={[
                              { required: true, message: "Email is required" },
                              { type: "email", message: "Invalid email format" },
                            ]}
                          >
                            <Input placeholder="Enter your email address" />
                          </Form.Item>

                          <Divider />

                          <Title level={4}>Change Password</Title>
                          <Form.Item
                            name="currentPassword"
                            label="Current Password"
                          >
                            <Input.Password placeholder="Enter current password" />
                          </Form.Item>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item
                              name="newPassword"
                              label="New Password"
                              rules={[
                                ({ getFieldValue }) => ({
                                  validator(_, value) {
                                    if (!value || getFieldValue("currentPassword")) {
                                      if (value && value.length < 6) {
                                        return Promise.reject(new Error("Password must be at least 6 characters"));
                                      }
                                      return Promise.resolve();
                                    }
                                    return Promise.reject(new Error("Current password is required"));
                                  },
                                }),
                              ]}
                            >
                              <Input.Password placeholder="Enter new password" />
                            </Form.Item>
                            <Form.Item
                              name="confirmPassword"
                              label="Confirm New Password"
                              dependencies={["newPassword"]}
                              rules={[
                                ({ getFieldValue }) => ({
                                  validator(_, value) {
                                    if (!value || getFieldValue("newPassword") === value) {
                                      return Promise.resolve();
                                    }
                                    return Promise.reject(new Error("Passwords do not match"));
                                  },
                                }),
                              ]}
                            >
                              <Input.Password placeholder="Confirm new password" />
                            </Form.Item>
                          </div>

                          <Button type="primary" htmlType="submit" size="large">
                            Save Changes
                          </Button>
                        </Space>
                      </Form>
                    )
                  },
                  {
                    key: "preferences",
                    label: (
                      <span className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Preferences
                      </span>
                    ),
                    children: (
                      <Form
                        form={preferencesForm}
                        layout="vertical"
                        onFinish={updatePreferences}
                        className="max-w-2xl"
                      >
                        <Title level={4}>Appearance</Title>
                        <Space direction="vertical" size="large" className="w-full">
                          <Form.Item name="theme" label="Theme">
                            <Select>
                              <Select.Option value="light">
                                <Space>
                                  <Monitor className="w-4 h-4" />
                                  Light
                                </Space>
                              </Select.Option>
                              <Select.Option value="dark">
                                <Space>
                                  <Monitor className="w-4 h-4" />
                                  Dark
                                </Space>
                              </Select.Option>
                              <Select.Option value="system">
                                <Space>
                                  <Smartphone className="w-4 h-4" />
                                  System
                                </Space>
                              </Select.Option>
                            </Select>
                          </Form.Item>

                          <Divider />

                          <Title level={4}>Localization</Title>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Form.Item name="language" label="Language">
                              <Select>
                                <Select.Option value="en">English</Select.Option>
                                <Select.Option value="es">Spanish</Select.Option>
                                <Select.Option value="fr">French</Select.Option>
                                <Select.Option value="de">German</Select.Option>
                              </Select>
                            </Form.Item>
                            <Form.Item name="timezone" label="Timezone">
                              <Select>
                                <Select.Option value="UTC">UTC</Select.Option>
                                <Select.Option value="America/New_York">Eastern Time</Select.Option>
                                <Select.Option value="America/Los_Angeles">Pacific Time</Select.Option>
                                <Select.Option value="Europe/London">GMT</Select.Option>
                                <Select.Option value="Asia/Tokyo">JST</Select.Option>
                              </Select>
                            </Form.Item>
                          </div>

                          <Divider />

                          <Title level={4}>Notifications</Title>
                          <Space direction="vertical" className="w-full">
                            <div className="flex justify-between items-center">
                              <div>
                                <Text strong>Email Notifications</Text>
                                <br />
                                <Text type="secondary">Receive notifications via email</Text>
                              </div>
                              <Form.Item name="emailNotifications" valuePropName="checked" noStyle>
                                <Switch />
                              </Form.Item>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>
                                <Text strong>Push Notifications</Text>
                                <br />
                                <Text type="secondary">Receive push notifications in browser</Text>
                              </div>
                              <Form.Item name="pushNotifications" valuePropName="checked" noStyle>
                                <Switch />
                              </Form.Item>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>
                                <Text strong>Marketing Communications</Text>
                                <br />
                                <Text type="secondary">Receive updates about new features</Text>
                              </div>
                              <Form.Item name="marketingNotifications" valuePropName="checked" noStyle>
                                <Switch />
                              </Form.Item>
                            </div>
                            <div className="flex justify-between items-center">
                              <div>
                                <Text strong>Security Notifications</Text>
                                <br />
                                <Text type="secondary">Important security updates</Text>
                              </div>
                              <Form.Item name="securityNotifications" valuePropName="checked" noStyle>
                                <Switch />
                              </Form.Item>
                            </div>
                          </Space>

                          <Button type="primary" htmlType="submit" size="large">
                            Save Preferences
                          </Button>
                        </Space>
                      </Form>
                    )
                  },
                  {
                    key: "security",
                    label: (
                      <span className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Security
                      </span>
                    ),
                    children: (
                      <Form
                        form={securityForm}
                        layout="vertical"
                        onFinish={updateSecurity}
                        className="max-w-2xl"
                      >
                        <Title level={4}>Two-Factor Authentication</Title>
                        <Space direction="vertical" size="large" className="w-full">
                          <div className="flex justify-between items-center">
                            <div>
                              <Text strong>Two-Factor Authentication</Text>
                              <br />
                              <Text type="secondary">
                                Add an extra layer of security to your account
                              </Text>
                            </div>
                            <Form.Item name="twoFactorEnabled" valuePropName="checked" noStyle>
                              <Switch
                                onChange={(checked) => {
                                  if (checked) {
                                    handleEnable2FA();
                                  } else {
                                    handleDisable2FA();
                                  }
                                }}
                              />
                            </Form.Item>
                          </div>

                          <Divider />

                          <Title level={4}>Session Management</Title>
                          <Form.Item
                            name="sessionTimeout"
                            label="Session Timeout (minutes)"
                            rules={[{ required: true, message: "Session timeout is required" }]}
                          >
                            <Select>
                              <Select.Option value={15}>15 minutes</Select.Option>
                              <Select.Option value={30}>30 minutes</Select.Option>
                              <Select.Option value={60}>1 hour</Select.Option>
                              <Select.Option value={240}>4 hours</Select.Option>
                              <Select.Option value={480}>8 hours</Select.Option>
                            </Select>
                          </Form.Item>

                          <div className="flex justify-between items-center">
                            <div>
                              <Text strong>Login Notifications</Text>
                              <br />
                              <Text type="secondary">Get notified when you log in from a new device</Text>
                            </div>
                            <Form.Item name="loginNotifications" valuePropName="checked" noStyle>
                              <Switch />
                            </Form.Item>
                          </div>

                          <Divider />

                          <Title level={4}>Active Sessions</Title>
                          <div className="flex justify-between items-center mb-4">
                            <Text type="secondary">Manage your active login sessions</Text>
                            <Popconfirm
                              title="Clear all active sessions?"
                              description="This will log you out from all devices. You'll need to login again."
                              onConfirm={handleClearAllSessions}
                            >
                              <Button danger size="small">
                                Clear All Sessions
                              </Button>
                            </Popconfirm>
                          </div>
                          <List
                            dataSource={activeSessions}
                            renderItem={(session) => (
                              <List.Item
                                actions={[
                                  <Popconfirm
                                    title="Revoke this session?"
                                    onConfirm={() => handleRevokeSession(session.sessionId)}
                                    key="revoke"
                                  >
                                    <Button type="text" danger icon={<Trash2 className="w-4 h-4" />}>
                                      Revoke
                                    </Button>
                                  </Popconfirm>
                                ]}
                              >
                                <List.Item.Meta
                                  avatar={<Avatar icon={<Monitor className="w-4 h-4" />} />}
                                  title={session.deviceInfo || "Unknown Device"}
                                  description={`IP: ${session.ipAddress} • Last active: ${new Date(
                                    session.lastActive
                                  ).toLocaleString()}`}
                                />
                              </List.Item>
                            )}
                            locale={{ emptyText: "No active sessions" }}
                          />

                          <Button type="primary" htmlType="submit" size="large">
                            Save Security Settings
                          </Button>
                        </Space>
                      </Form>
                    )
                  },
                  {
                    key: "privacy",
                    label: (
                      <span className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Privacy
                      </span>
                    ),
                    children: (
                      <Form
                        form={privacyForm}
                        layout="vertical"
                        onFinish={updatePrivacy}
                        className="max-w-2xl"
                      >
                        <Title level={4}>Profile Privacy</Title>
                        <Space direction="vertical" size="large" className="w-full">
                          <Form.Item
                            name="profileVisibility"
                            label="Profile Visibility"
                            rules={[{ required: true, message: "Profile visibility is required" }]}
                          >
                            <Select>
                              <Select.Option value="public">
                                <Space>
                                  <Globe className="w-4 h-4" />
                                  Public - Anyone can view your profile
                                </Space>
                              </Select.Option>
                              <Select.Option value="private">
                                <Space>
                                  <Lock className="w-4 h-4" />
                                  Private - Only you can view your profile
                                </Space>
                              </Select.Option>
                              <Select.Option value="connections">
                                <Space>
                                  <User className="w-4 h-4" />
                                  Connections - Only your connections can view
                                </Space>
                              </Select.Option>
                            </Select>
                          </Form.Item>

                          <div className="flex justify-between items-center">
                            <div>
                              <Text strong>Show Email Address</Text>
                              <br />
                              <Text type="secondary">Display your email on your public profile</Text>
                            </div>
                            <Form.Item name="showEmail" valuePropName="checked" noStyle>
                              <Switch />
                            </Form.Item>
                          </div>

                          <div className="flex justify-between items-center">
                            <div>
                              <Text strong>Show Credentials</Text>
                              <br />
                              <Text type="secondary">Display your credentials on your public profile</Text>
                            </div>
                            <Form.Item name="showCredentials" valuePropName="checked" noStyle>
                              <Switch />
                            </Form.Item>
                          </div>

                          <div className="flex justify-between items-center">
                            <div>
                              <Text strong>Allow Profile Indexing</Text>
                              <br />
                              <Text type="secondary">Allow search engines to index your profile</Text>
                            </div>
                            <Form.Item name="allowProfileIndexing" valuePropName="checked" noStyle>
                              <Switch />
                            </Form.Item>
                          </div>

                          <Button type="primary" htmlType="submit" size="large">
                            Save Privacy Settings
                          </Button>
                        </Space>
                      </Form>
                    )
                  }
                ]}
              />
            </Card>
          </div>
        </main>

        {/* 2FA Setup Modal */}
        <Modal
          open={twoFactorModal}
          onCancel={() => setTwoFactorModal(false)}
          title={
            <span className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Set up Two-Factor Authentication
            </span>
          }
          footer={null}
          width={500}
        >
          <Space direction="vertical" size="large" className="w-full">
            <div className="text-center">
              <Text>
                Scan this QR code with your authenticator app (like Google Authenticator, Authy, or
                1Password)
              </Text>
            </div>
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="2FA QR Code" className="max-w-xs" />
              </div>
            )}
            <div>
              <Text strong>Or enter this secret key manually:</Text>
              <br />
              <Text code copyable>
                {twoFactorSecret}
              </Text>
            </div>
            <Input
              placeholder="Enter 6-digit verification code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
            />
            <div className="flex justify-end gap-2">
              <Button onClick={() => setTwoFactorModal(false)}>Cancel</Button>
              <Button
                type="primary"
                onClick={handleVerify2FA}
                disabled={verificationCode.length !== 6}
              >
                Verify & Enable
              </Button>
            </div>
          </Space>
        </Modal>
      </div>
    </ConfigProvider>
  );
}