'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Key, CheckCircle, AlertCircle } from 'lucide-react';

export default function InitSuperAdminPage() {
  const [initKey, setInitKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/init-superadmin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize super admin');
      }

      if (data.exists) {
        toast({
          title: 'Info',
          description: 'Super admin already exists',
        });
      } else {
        setSuccess(true);
        toast({
          title: 'Success',
          description: 'Super admin created successfully!',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Key className="h-6 w-6 text-slate-800" />
              <CardTitle>Initialize Super Admin</CardTitle>
            </div>
            <CardDescription>
              Enter the initialization key to create the super admin account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!success ? (
              <form onSubmit={handleInitialize} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Enter initialization key"
                    value={initKey}
                    onChange={(e) => setInitKey(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500">
                    Hint: The key is set in your environment configuration
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Initializing...' : 'Initialize Super Admin'}
                </Button>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Super Admin Credentials:</strong>
                  </p>
                  <p className="text-xs text-blue-800 mt-2">
                    Email: admin@financialhub.com<br />
                    Password: @Black123456
                  </p>
                </div>
              </form>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Super Admin Initialized!
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  You can now sign in with the super admin credentials.
                </p>
                <Button
                  onClick={() => window.location.href = '/auth/signin'}
                  className="w-full"
                >
                  Go to Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
