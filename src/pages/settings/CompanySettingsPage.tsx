import React, { useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useSettingsStore } from '@/stores/settingsStore';
import { getMonthName } from '@/lib/utils';

const companySchema = z.object({
  companyName: z.string().min(1, 'Company Name is required'),
  companyLogo: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email address'),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  currencySymbol: z.string().min(1, 'Currency Symbol is required'),
  currencyName: z.string().min(1, 'Currency Name is required'),
  fiscalYearStartMonth: z.number().min(1).max(12),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export default function CompanySettingsPage() {
  const { settings, updateSettings } = useSettingsStore();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: settings?.name || 'My Company',
      companyLogo: settings?.logo || '',
      address: settings?.address || '',
      phone: settings?.phone || '',
      email: settings?.email || '',
      website: settings?.website || '',
      currencySymbol: settings?.currencySymbol || '৳',
      currencyName: settings?.currency || 'BDT',
      fiscalYearStartMonth: settings?.fiscalYearStart || 1,
    }
  });

  useEffect(() => {
    if (!settings) return;
    form.reset({
      companyName: settings.name || '',
      companyLogo: settings.logo || '',
      address: settings.address || '',
      phone: settings.phone || '',
      email: settings.email || '',
      website: settings.website || '',
      currencySymbol: settings.currencySymbol || '৳',
      currencyName: settings.currency || 'BDT',
      fiscalYearStartMonth: settings.fiscalYearStart || 1,
    });
  }, [settings, form]);

  const onSubmit = (data: CompanyFormValues) => {
    updateSettings({
      name: data.companyName,
      logo: data.companyLogo,
      address: data.address,
      phone: data.phone,
      email: data.email,
      website: data.website,
      currencySymbol: data.currencySymbol,
      currency: data.currencyName,
      fiscalYearStart: data.fiscalYearStartMonth,
    });
    toast.success('Company settings updated successfully');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Company Settings" description="Manage your organization's profile and global settings" />
      
      <Card>
        <CardHeader>
          <CardTitle>Company Profile</CardTitle>
          <CardDescription>This information will be displayed on reports and payslips.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" {...form.register('companyName')} />
                {form.formState.errors.companyName && <span className="text-sm text-red-500">{form.formState.errors.companyName.message}</span>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyLogo">Logo URL</Label>
                <Input id="companyLogo" placeholder="https://..." {...form.register('companyLogo')} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" {...form.register('address')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form.register('phone')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register('email')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" {...form.register('website')} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="currencySymbol">Currency Symbol</Label>
                <Input id="currencySymbol" {...form.register('currencySymbol')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currencyName">Currency Name</Label>
                <Input id="currencyName" {...form.register('currencyName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiscalYearStartMonth">Fiscal Year Start Month</Label>
                <Select 
                  value={form.watch('fiscalYearStartMonth').toString()} 
                  onValueChange={(v) => form.setValue('fiscalYearStartMonth', parseInt(v))}
                >
                  <SelectTrigger><SelectValue placeholder="Select Month" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 12}).map((_, i) => (
                      <SelectItem key={i+1} value={(i+1).toString()}>{getMonthName(i+1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
