import { useState } from "react";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Github, Code, GitBranch, FileText } from "lucide-react";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";

interface GitHubIntegrationProps {
  profileId: string;
  onSkillsExtracted: (skills: any[]) => void;
  onGithubDataChanged?: (username: string, token: string) => void;
}

export function GitHubIntegration({ profileId, onSkillsExtracted, onGithubDataChanged }: GitHubIntegrationProps) {
  const [githubUsername, setGithubUsername] = useState("");
  const [githubToken, setGithubToken] = useState("");

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900/5 to-gray-800/5 border-gray-700/20">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-gray-900/10">
          <Github className="w-6 h-6 text-gray-900 dark:text-gray-100" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Github className="w-5 h-5" />
              GitHub Skill Extraction
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Analyze GitHub repositories to extract technical skills from code, README files, commit messages, and project metadata.
            </p>
          </div>

          <Alert>
            <AlertDescription className="text-xs">
              <strong>What we analyze:</strong> Programming languages used, repository topics, README content, commit messages, and project descriptions.
              <br />
              <strong>Privacy:</strong> Only public repositories are analyzed. A personal access token is optional but allows higher rate limits.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div>
              <Label htmlFor="github-username" className="text-sm font-medium">
                GitHub Username *
              </Label>
              <Input
                id="github-username"
                placeholder="e.g., octocat"
                value={githubUsername}
                onChange={(e) => {
                  setGithubUsername(e.target.value);
                  onGithubDataChanged?.(e.target.value, githubToken);
                }}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="github-token" className="text-sm font-medium">
                Personal Access Token (Optional)
              </Label>
              <Input
                id="github-token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx (optional, for higher rate limits)"
                value={githubToken}
                onChange={(e) => {
                  setGithubToken(e.target.value);
                  onGithubDataChanged?.(githubUsername, e.target.value);
                }}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get a token at <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline">github.com/settings/tokens</a>. Only "public_repo" scope needed.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              <Code className="w-3 h-3 mr-1" />
              30+ Languages Detected
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <GitBranch className="w-3 h-3 mr-1" />
              Commit History Analysis
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              README Parsing
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
