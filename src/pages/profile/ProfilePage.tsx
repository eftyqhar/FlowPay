import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useEmployeeStore } from '@/stores/employeeStore';
import { getInitials, formatDate } from '@/lib/utils';
import { User, Lock, Mail, Shield, CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, updateProfile, changePassword } = useAuthStore();
  const { employees } = useEmployeeStore();

  const [name, setName] = useState(currentUser?.name || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const linkedEmployee = currentUser?.employeeId
    ? employees.find((e) => e.employeeId === currentUser.employeeId)
    : employees.find((e) => e.email.toLowerCase() === currentUser?.email.toLowerCase());

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    updateProfile({
      name: name.trim(),
      avatar: avatar.trim() || undefined,
    });
    toast.success('Profile details updated successfully');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    const res = changePassword(currentUser.id, currentPassword, newPassword);
    if (res.success) {
      toast.success(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(res.message);
    }
  };

  if (!currentUser) {
    return <div className="p-8 text-center text-slate-500">Please sign in to view your profile.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="My User Profile"
        description="Manage your account preferences, password security, and employee link"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Account Summary */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-3">
              <Avatar className="h-24 w-24 border-2 border-indigo-100 shadow-sm">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback className="text-2xl font-bold bg-indigo-100 text-indigo-700">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-lg">{currentUser.name}</CardTitle>
            <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
            <div className="mt-2">
              <Badge variant="outline" className="uppercase font-semibold text-xs tracking-wider bg-indigo-50 text-indigo-700 border-indigo-200">
                {currentUser.role}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 border-t text-sm space-y-3">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                User ID
              </span>
              <span className="font-mono text-slate-700 text-xs">{currentUser.id}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                Account Status
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Active
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                Member Since
              </span>
              <span className="text-xs text-slate-600">{formatDate(currentUser.createdAt)}</span>
            </div>

            {linkedEmployee && (
              <div className="pt-3 border-t">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                  Linked Employee
                </span>
                <p className="font-medium text-xs text-slate-800">{linkedEmployee.fullName}</p>
                <p className="text-xs text-slate-500">{linkedEmployee.designation} • {linkedEmployee.department}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={() => navigate(`/employees/${linkedEmployee.id}`)}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View Directory Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Profile Edit & Password Change */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" /> Personal Details
              </CardTitle>
              <CardDescription>Update your display name and avatar photo URL</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Display Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={currentUser.email}
                    disabled
                    className="bg-slate-50 text-slate-500"
                  />
                  <p className="text-xs text-slate-400">Email address is managed by company IT / Admin.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar Image URL</Label>
                  <Input
                    id="avatar"
                    placeholder="https://..."
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    Save Profile Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" /> Change Password
              </CardTitle>
              <CardDescription>Update your security credentials for sign-in</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="outline">
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
