import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ShareProfileDialogProps {
  profileId: string;
  userEmail: string;
}

export function ShareProfileDialog({ profileId, userEmail }: ShareProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [publicSlug, setPublicSlug] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadProfileSettings();
    }
  }, [open, profileId]);

  const loadProfileSettings = async () => {
    const { data, error } = await supabase
      .from('skill_profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      return;
    }

    if (data) {
      setIsPublic(data.is_public || false);
      setDisplayName(data.display_name || '');
      setBio(data.bio || '');
      setPublicSlug(data.public_slug || '');
      setAvatarUrl(data.avatar_url || '');
    }
  };

  const generateSlug = async () => {
    const baseName = displayName || userEmail.split('@')[0];
    
    const { data, error } = await supabase.rpc('generate_profile_slug', {
      base_text: baseName
    });

    if (error) {
      console.error('Error generating slug:', error);
      toast.error('Failed to generate profile URL');
      return null;
    }

    return data;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let slug = publicSlug;
      
      // Generate slug if enabling public profile for the first time
      if (isPublic && !slug) {
        slug = await generateSlug();
        if (!slug) {
          setSaving(false);
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
          avatar_url: avatarUrl,
        })
        .eq('id', profileId);

      if (error) throw error;

      toast.success(isPublic ? 'Public profile enabled!' : 'Profile settings saved');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile settings');
    } finally {
      setSaving(false);
    }
  };

  const getPublicUrl = () => {
    if (!publicSlug) return '';
    return `${window.location.origin}/p/${publicSlug}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getPublicUrl());
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const openPublicProfile = () => {
    window.open(getPublicUrl(), '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Your Skill Profile</DialogTitle>
          <DialogDescription>
            Create a public link to showcase your confirmed skills to employers, colleagues, or on social media.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Public Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public-toggle">Make Profile Public</Label>
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
                <Label htmlFor="display-name">Display Name *</Label>
                <Input
                  id="display-name"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Full-stack developer passionate about AI and web technologies..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Avatar URL */}
              <div className="space-y-2">
                <Label htmlFor="avatar-url">Avatar URL (optional)</Label>
                <Input
                  id="avatar-url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  type="url"
                />
                <p className="text-xs text-muted-foreground">
                  Paste a link to your profile picture
                </p>
              </div>

              {/* Public URL Preview */}
              {publicSlug && (
                <div className="space-y-2">
                  <Label>Your Public Profile URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getPublicUrl()}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={openPublicProfile}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this link on LinkedIn, Twitter, or your email signature
                  </p>
                </div>
              )}
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || (isPublic && !displayName)}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
