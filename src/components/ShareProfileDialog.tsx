import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ShareProfileDialogProps {
  profileId: string;
  userEmail: string;
}

export function ShareProfileDialog({ profileId, userEmail }: ShareProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [publicSlug, setPublicSlug] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      loadProfileSettings();
    }
  }, [open]);

  const loadProfileSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('skill_profiles')
        .select('is_public, display_name, bio, public_slug')
        .eq('id', profileId)
        .single();

      if (error) throw error;

      if (data) {
        setIsPublic(data.is_public || false);
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setPublicSlug(data.public_slug || '');
      }
    } catch (error) {
      console.error('Error loading profile settings:', error);
      toast.error('Failed to load profile settings');
    }
  };

  const generateSlug = async () => {
    try {
      const baseName = displayName || userEmail.split('@')[0];
      const { data, error } = await supabase.rpc('generate_profile_slug', {
        base_text: baseName,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating slug:', error);
      return null;
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let slug = publicSlug;
      
      // Generate slug if making public and no slug exists
      if (isPublic && !slug) {
        slug = await generateSlug();
        if (!slug) {
          toast.error('Failed to generate profile URL');
          return;
        }
        setPublicSlug(slug);
      }

      const { error } = await supabase
        .from('skill_profiles')
        .update({
          is_public: isPublic,
          display_name: displayName,
          bio: bio,
          public_slug: slug,
        })
        .eq('id', profileId);

      if (error) throw error;

      toast.success(isPublic ? 'Profile is now public!' : 'Profile is now private');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile settings');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const url = `${window.location.origin}/p/${publicSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const openPublicProfile = () => {
    window.open(`${window.location.origin}/p/${publicSlug}`, '_blank');
  };

  const publicUrl = publicSlug ? `${window.location.origin}/p/${publicSlug}` : '';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Your Skill Profile</DialogTitle>
          <DialogDescription>
            Create a public profile to share your confirmed skills with the world
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Public Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public-toggle" className="text-base">
                Make Profile Public
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow anyone with the link to view your confirmed skills
              </p>
            </div>
            <Switch
              id="public-toggle"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          {isPublic && (
            <>
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  placeholder="Your Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell people about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Public URL */}
              {publicSlug && (
                <div className="space-y-2">
                  <Label>Your Public Profile URL</Label>
                  <div className="flex gap-2">
                    <Input value={publicUrl} readOnly className="font-mono text-sm" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyToClipboard}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={openPublicProfile}
                      className="shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this link on LinkedIn, email signatures, or your resume
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
