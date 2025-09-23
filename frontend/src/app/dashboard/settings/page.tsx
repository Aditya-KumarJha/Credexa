"use client";

import dynamic from "next/dynamic";
const Sidebar = dynamic(() => import("@/components/dashboard/Sidebar"), { ssr: false });
import { Card, Tabs, ConfigProvider, theme as antdTheme, Typography } from "antd";
import { User, Palette, Shield, Eye } from "lucide-react";
import { useSettingsData } from "@/components/settings/hooks";
import SettingsHeader from "@/components/settings/SettingsHeader";
import ProfileForm from "@/components/settings/ProfileForm";
import PreferencesForm from "@/components/settings/PreferencesForm";
import SecurityForm from "@/components/settings/SecurityForm";
import PrivacyForm from "@/components/settings/PrivacyForm";
import TwoFAModal from "@/components/settings/TwoFAModal";

const { Text } = Typography;

export default function SettingsPage() {
<<<<<<< Updated upstream
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
            showInLeaderboard: userData.settings.privacy.showInLeaderboard ?? true,
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
=======
  const {
    loading,
    mounted,
    isDark,
    profileForm,
    preferencesForm,
    securityForm,
    privacyForm,
    twoFactorModal,
    setTwoFactorModal,
    qrCode,
    twoFactorSecret,
    verificationCode,
    setVerificationCode,
    activeSessions,
    updateProfile,
    updatePreferences,
    updateSecurity,
    updatePrivacy,
    handleEnable2FA,
    handleDisable2FA,
    handleVerify2FA,
    handleRevokeSession,
    handleClearAllSessions,
  } = useSettingsData();
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
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
=======
            <SettingsHeader />
>>>>>>> Stashed changes

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
                    children: (<ProfileForm form={profileForm} onSubmit={updateProfile} />)
                  },
                  {
                    key: "preferences",
                    label: (
                      <span className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Preferences
                      </span>
                    ),
                    children: (<PreferencesForm form={preferencesForm} onSubmit={updatePreferences} />)
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
                      <SecurityForm
                        form={securityForm}
                        onSubmit={updateSecurity}
                        onEnable2FA={handleEnable2FA}
                        onDisable2FA={handleDisable2FA}
                        sessions={activeSessions}
                        onRevokeSession={handleRevokeSession}
                        onClearAll={handleClearAllSessions}
                      />
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
<<<<<<< Updated upstream
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

                          <div className="flex justify-between items-center">
                            <div>
                              <Text strong>Show in Leaderboard</Text>
                              <br />
                              <Text type="secondary">Appear in public leaderboards and rankings</Text>
                            </div>
                            <Form.Item name="showInLeaderboard" valuePropName="checked" noStyle>
                              <Switch />
                            </Form.Item>
                          </div>

                          <Button type="primary" htmlType="submit" size="large">
                            Save Privacy Settings
                          </Button>
                        </Space>
                      </Form>
                    )
=======
                    children: (<PrivacyForm form={privacyForm} onSubmit={updatePrivacy} />)
>>>>>>> Stashed changes
                  }
                ]}
              />
            </Card>
          </div>
        </main>

        <TwoFAModal
          open={twoFactorModal}
          onClose={() => setTwoFactorModal(false)}
          qrCode={qrCode}
          secret={twoFactorSecret}
          code={verificationCode}
          setCode={setVerificationCode}
          onVerify={handleVerify2FA}
        />
      </div>
    </ConfigProvider>
  );
}