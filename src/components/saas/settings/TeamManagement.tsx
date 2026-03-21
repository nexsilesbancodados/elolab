import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Mail, Shield, UserX, Search } from "lucide-react";
import { useState } from "react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: "active" | "invited" | "disabled";
  lastActive?: string;
}

interface TeamManagementProps {
  members: TeamMember[];
  roles: { value: string; label: string }[];
  onInvite?: (email: string, role: string) => void;
  onChangeRole?: (memberId: string, role: string) => void;
  onRemove?: (memberId: string) => void;
  onResendInvite?: (memberId: string) => void;
  maxMembers?: number;
}

const statusConfig = {
  active: { label: "Ativo", className: "bg-success/10 text-success border-success/20" },
  invited: { label: "Convidado", className: "bg-warning/10 text-warning border-warning/20" },
  disabled: { label: "Desativado", className: "bg-muted text-muted-foreground border-border" },
};

export function TeamManagement({
  members,
  roles,
  onInvite,
  onChangeRole,
  onRemove,
  onResendInvite,
  maxMembers,
}: TeamManagementProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState(roles[0]?.value || "");
  const [search, setSearch] = useState("");

  const filtered = members.filter(
    m => m.name.toLowerCase().includes(search.toLowerCase()) ||
         m.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = () => {
    if (inviteEmail && onInvite) {
      onInvite(inviteEmail, inviteRole);
      setInviteEmail("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-1">Convidar membro</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Envie um convite por e-mail para adicionar membros à equipe.
          {maxMembers && ` (${members.length}/${maxMembers} membros)`}
        </p>

        <div className="flex gap-3">
          <Input
            placeholder="email@empresa.com"
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="flex-1"
          />
          <Select value={inviteRole} onValueChange={setInviteRole}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleInvite} disabled={!inviteEmail} className="gap-2">
            <Plus className="w-4 h-4" />
            Convidar
          </Button>
        </div>
      </div>

      {/* Members list */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="font-semibold">Membros ({members.length})</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        <div className="divide-y divide-border/50">
          {filtered.map((member, i) => {
            const status = statusConfig[member.status];
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
              >
                <Avatar className="w-10 h-10">
                  {member.avatar && <AvatarImage src={member.avatar} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <Badge variant="outline" className={`text-[10px] ${status.className}`}>
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>

                <div className="flex items-center gap-3">
                  {onChangeRole ? (
                    <Select value={member.role} onValueChange={(v) => onChangeRole(member.id, v)}>
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className="text-xs">{member.role}</Badge>
                  )}

                  {member.lastActive && (
                    <span className="text-xs text-muted-foreground hidden lg:block w-24 text-right">
                      {member.lastActive}
                    </span>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <Shield className="w-4 h-4" /> Alterar permissões
                      </DropdownMenuItem>
                      {member.status === "invited" && onResendInvite && (
                        <DropdownMenuItem onClick={() => onResendInvite(member.id)} className="gap-2">
                          <Mail className="w-4 h-4" /> Reenviar convite
                        </DropdownMenuItem>
                      )}
                      {onRemove && (
                        <DropdownMenuItem
                          onClick={() => onRemove(member.id)}
                          className="gap-2 text-destructive focus:text-destructive"
                        >
                          <UserX className="w-4 h-4" /> Remover
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
