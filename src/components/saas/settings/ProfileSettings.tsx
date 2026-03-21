import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Camera, Save, Shield, Bell, Moon } from "lucide-react";
import { ReactNode } from "react";

interface ProfileSettingsProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
    phone?: string;
    company?: string;
    role?: string;
  };
  onSave?: (data: Record<string, string>) => void;
  onAvatarChange?: () => void;
  preferences?: {
    darkMode?: boolean;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    twoFactor?: boolean;
  };
  onPreferenceChange?: (key: string, value: boolean) => void;
  extra?: ReactNode;
}

export function ProfileSettings({
  user,
  onSave,
  onAvatarChange,
  preferences,
  onPreferenceChange,
  extra,
}: ProfileSettingsProps) {
  return (
    <div className="space-y-8">
      {/* Avatar & basic info */}
      <div className="flex items-start gap-6">
        <div className="relative group">
          <Avatar className="w-20 h-20">
            {user.avatar && <AvatarImage src={user.avatar} />}
            <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
              {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          {onAvatarChange && (
            <button
              onClick={onAvatarChange}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-lg">{user.name}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {user.role && <p className="text-xs text-muted-foreground mt-1">{user.role}</p>}
        </div>
      </div>

      <Separator />

      {/* Form fields */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input id="name" defaultValue={user.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" defaultValue={user.email} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" defaultValue={user.phone || ""} placeholder="(00) 00000-0000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Empresa</Label>
          <Input id="company" defaultValue={user.company || ""} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="bio">Biografia</Label>
          <Textarea id="bio" defaultValue={user.bio || ""} placeholder="Conte um pouco sobre você..." rows={3} />
        </div>
      </div>

      <Button onClick={() => onSave?.({})} className="gap-2">
        <Save className="w-4 h-4" />
        Salvar alterações
      </Button>

      {/* Preferences */}
      {preferences && (
        <>
          <Separator />
          <div>
            <h3 className="font-semibold mb-4">Preferências</h3>
            <div className="space-y-4">
              {preferences.darkMode !== undefined && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Moon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Modo escuro</p>
                      <p className="text-xs text-muted-foreground">Alternar tema claro/escuro</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.darkMode}
                    onCheckedChange={v => onPreferenceChange?.("darkMode", v)}
                  />
                </div>
              )}
              {preferences.emailNotifications !== undefined && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Notificações por e-mail</p>
                      <p className="text-xs text-muted-foreground">Receba atualizações por e-mail</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={v => onPreferenceChange?.("emailNotifications", v)}
                  />
                </div>
              )}
              {preferences.twoFactor !== undefined && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Autenticação em dois fatores</p>
                      <p className="text-xs text-muted-foreground">Adicione segurança extra à sua conta</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences.twoFactor}
                    onCheckedChange={v => onPreferenceChange?.("twoFactor", v)}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {extra}
    </div>
  );
}
