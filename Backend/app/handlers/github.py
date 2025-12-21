from typing import Dict, Any, Optional, List
from sqlmodel import Session, select
import httpx
import hmac
import hashlib
import os

from app.handlers.base import BaseWebhookHandler, ActionResult
from app.oauth_models import ServiceAccount

class GitHubWebhookHandler(BaseWebhookHandler):
    @property
    def service_name(self) -> str:
        return "github"
    
    async def verify_signature(self, body: bytes, headers: Dict[str, str], secret: str) -> bool:
        signature = headers.get("x-hub-signature-256", "")
        if not signature or not secret:
            return not secret

        expected = "sha256=" + hmac.new(
            secret.encode('utf-8'), 
            body, 
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected, signature)

    async def setup_webhook(self, session: Session, service_account: ServiceAccount, params: Dict[str, Any]) -> bool:
        repository = params.get("repository.full_name") or params.get("repository")
        if not repository:
            print("No repository specified for GitHub webhook")
            return False

        webhook_url = f"{os.getenv('API_BASE_URL', 'http://localhost:8080')}/webhooks/github"
        
        try:
            async with httpx.AsyncClient() as client:
                repo_response = await client.get(
                    f"https://api.github.com/repos/{repository}",
                    headers=self._get_headers(service_account.access_token),
                    timeout=30.0
                )
                
                if repo_response.status_code != 200:
                    print(f"Repository {repository} not found or no access")
                    return False

                repo_data = repo_response.json()
                if not repo_data.get("permissions", {}).get("admin", False):
                    print(f"User doesn't have admin access to {repository}")
                    return False

                list_response = await client.get(
                    f"https://api.github.com/repos/{repository}/hooks",
                    headers=self._get_headers(service_account.access_token),
                    timeout=30.0
                )

                if list_response.status_code == 200:
                    existing_hooks = list_response.json()
                    for hook in existing_hooks:
                        if hook.get("config", {}).get("url") == webhook_url:
                            print(f"Webhook already exists for {repository}")
                            return True

                webhook_data = {
                    "config": {
                        "url": webhook_url,
                        "content_type": "json",
                        "insecure_ssl": "0"
                    },
                    "events": self.webhook_events,
                    "active": True
                }
                
                response = await client.post(
                    f"https://api.github.com/repos/{repository}/hooks",
                    headers=self._get_headers(service_account.access_token),
                    json=webhook_data,
                    timeout=30.0
                )
                
                if response.status_code == 201:
                    hook = response.json()
                    print(f"GitHub webhook created for {repository}: {hook['id']}")
                    return True
                else:
                    print(f"Failed to create webhook: {response.status_code}")
                    return False
                    
        except Exception as e:
            print(f"Error setting up GitHub webhook: {str(e)}")
            return False

    def _get_headers(self, access_token: str) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "AREA-App",
            "X-GitHub-Api-Version": "2022-11-28"
        }

class GitHubPushHandler(GitHubWebhookHandler):
    @property
    def action_type(self) -> str:
        return "push"
    
    @property
    def webhook_events(self) -> List[str]:
        return ["push"]

    async def parse_payload(self, raw_payload: Dict[str, Any], headers: Dict[str, str]) -> ActionResult:
        return ActionResult(
            triggered=True,
            event_type="push",
            payload={
                "repository.full_name": raw_payload.get("repository", {}).get("full_name"),
                "repository.name": raw_payload.get("repository", {}).get("name"),
                "repository": raw_payload.get("repository", {}).get("full_name"),
                "pusher.name": raw_payload.get("pusher", {}).get("name"),
                "pusher.email": raw_payload.get("pusher", {}).get("email"),
                "ref": raw_payload.get("ref"),
                "branch": raw_payload.get("ref", "").replace("refs/heads/", ""),
                "commits": raw_payload.get("commits", []),
                "commits_count": len(raw_payload.get("commits", [])),
                "head_commit.message": raw_payload.get("head_commit", {}).get("message"),
                "head_commit.id": raw_payload.get("head_commit", {}).get("id"),
                "head_commit.url": raw_payload.get("head_commit", {}).get("url"),
                "compare": raw_payload.get("compare"),
                "sender.login": raw_payload.get("sender", {}).get("login"),
                "sender": raw_payload.get("sender", {}).get("login"),
            }
        )

class GitHubNewIssueHandler(GitHubWebhookHandler):
    @property
    def action_type(self) -> str:
        return "new_issue"
    
    @property
    def webhook_events(self) -> List[str]:
        return ["issues"]

    async def parse_payload(self, raw_payload: Dict[str, Any], headers: Dict[str, str]) -> ActionResult:
        action = raw_payload.get("action")

        if action != "opened":
            return ActionResult(
                triggered=False,
                event_type="new_issue",
                payload={},
                error="Not a new issue event"
            )

        issue = raw_payload.get("issue", {})
        return ActionResult(
            triggered=True,
            event_type="new_issue",
            payload={
                "repository.full_name": raw_payload.get("repository", {}).get("full_name"),
                "repository.name": raw_payload.get("repository", {}).get("name"),
                "repository": raw_payload.get("repository", {}).get("full_name"),
                "issue.number": issue.get("number"),
                "issue.title": issue.get("title"),
                "issue.body": issue.get("body"),
                "issue.url": issue.get("html_url"),
                "issue.state": issue.get("state"),
                "issue.labels": [label.get("name") for label in issue.get("labels", [])],
                "issue.user.login": issue.get("user", {}).get("login"),
                "sender.login": raw_payload.get("sender", {}).get("login"),
                "sender": raw_payload.get("sender", {}).get("login"),
            }
        )

class GitHubNewPullRequestHandler(GitHubWebhookHandler):
    @property
    def action_type(self) -> str:
        return "new_pull_request"
    
    @property
    def webhook_events(self) -> List[str]:
        return ["pull_request"]

    async def parse_payload(self, raw_payload: Dict[str, Any], headers: Dict[str, str]) -> ActionResult:
        action = raw_payload.get("action")
        
        if action != "opened":
            return ActionResult(
                triggered=False,
                event_type="new_pull_request",
                payload={},
                error="Not a new pull request event"
            )

        pr = raw_payload.get("pull_request", {})
        return ActionResult(
            triggered=True,
            event_type="new_pull_request",
            payload={
                "repository.full_name": raw_payload.get("repository", {}).get("full_name"),
                "repository.name": raw_payload.get("repository", {}).get("name"),
                "repository": raw_payload.get("repository", {}).get("full_name"),
                "pull_request.number": pr.get("number"),
                "pull_request.title": pr.get("title"),
                "pull_request.body": pr.get("body"),
                "pull_request.url": pr.get("html_url"),
                "pull_request.state": pr.get("state"),
                "pull_request.head.ref": pr.get("head", {}).get("ref"),
                "pull_request.base.ref": pr.get("base", {}).get("ref"),
                "pull_request.user.login": pr.get("user", {}).get("login"),
                "pull_request.draft": pr.get("draft", False),
                "sender.login": raw_payload.get("sender", {}).get("login"),
                "sender": raw_payload.get("sender", {}).get("login"),
            }
        )

class GitHubNewStarHandler(GitHubWebhookHandler):
    @property
    def action_type(self) -> str:
        return "new_star"
    
    @property
    def webhook_events(self) -> List[str]:
        return ["star"]

    async def parse_payload(self, raw_payload: Dict[str, Any], headers: Dict[str, str]) -> ActionResult:
        action = raw_payload.get("action")
        
        if action != "created":
            return ActionResult(
                triggered=False,
                event_type="new_star",
                payload={},
                error="Not a new star event"
            )

        return ActionResult(
            triggered=True,
            event_type="new_star",
            payload={
                "repository.full_name": raw_payload.get("repository", {}).get("full_name"),
                "repository.name": raw_payload.get("repository", {}).get("name"),
                "repository.stargazers_count": raw_payload.get("repository", {}).get("stargazers_count"),
                "repository": raw_payload.get("repository", {}).get("full_name"),
                "sender.login": raw_payload.get("sender", {}).get("login"),
                "sender": raw_payload.get("sender", {}).get("login"),
                "starred_at": raw_payload.get("starred_at"),
            }
        )

class GitHubIssueCommentHandler(GitHubWebhookHandler):
    @property
    def action_type(self) -> str:
        return "issue_comment"
    
    @property
    def webhook_events(self) -> List[str]:
        return ["issue_comment"]

    async def parse_payload(self, raw_payload: Dict[str, Any], headers: Dict[str, str]) -> ActionResult:
        action = raw_payload.get("action")
        
        if action != "created":
            return ActionResult(
                triggered=False,
                event_type="issue_comment",
                payload={},
                error="Not a new comment event"
            )

        comment = raw_payload.get("comment", {})
        issue = raw_payload.get("issue", {})
        
        return ActionResult(
            triggered=True,
            event_type="issue_comment",
            payload={
                "repository.full_name": raw_payload.get("repository", {}).get("full_name"),
                "repository.name": raw_payload.get("repository", {}).get("name"),
                "repository": raw_payload.get("repository", {}).get("full_name"),
                "issue.number": issue.get("number"),
                "issue.title": issue.get("title"),
                "issue.url": issue.get("html_url"),
                "comment.body": comment.get("body"),
                "comment.url": comment.get("html_url"),
                "comment.user.login": comment.get("user", {}).get("login"),
                "sender.login": raw_payload.get("sender", {}).get("login"),
                "sender": raw_payload.get("sender", {}).get("login"),
            }
        )

class GitHubPullRequestReviewHandler(GitHubWebhookHandler):
    @property
    def action_type(self) -> str:
        return "pull_request_review"
    
    @property
    def webhook_events(self) -> List[str]:
        return ["pull_request_review"]

    async def parse_payload(self, raw_payload: Dict[str, Any], headers: Dict[str, str]) -> ActionResult:
        action = raw_payload.get("action")
        
        if action != "submitted":
            return ActionResult(
                triggered=False,
                event_type="pull_request_review",
                payload={},
                error="Not a submitted review event"
            )

        review = raw_payload.get("review", {})
        pr = raw_payload.get("pull_request", {})
        
        return ActionResult(
            triggered=True,
            event_type="pull_request_review",
            payload={
                "repository.full_name": raw_payload.get("repository", {}).get("full_name"),
                "repository.name": raw_payload.get("repository", {}).get("name"),
                "repository": raw_payload.get("repository", {}).get("full_name"),
                "pull_request.number": pr.get("number"),
                "pull_request.title": pr.get("title"),
                "pull_request.url": pr.get("html_url"),
                "review.body": review.get("body"),
                "review.state": review.get("state"),
                "review.url": review.get("html_url"),
                "review.user.login": review.get("user", {}).get("login"),
                "sender.login": raw_payload.get("sender", {}).get("login"),
                "sender": raw_payload.get("sender", {}).get("login"),
            }
        )

GITHUB_HANDLERS = {
    "push": GitHubPushHandler(),
    "new_issue": GitHubNewIssueHandler(),
    "new_pull_request": GitHubNewPullRequestHandler(),
    "new_star": GitHubNewStarHandler(),
    "issue_comment": GitHubIssueCommentHandler(),
    "pull_request_review": GitHubPullRequestReviewHandler(),
}

GITHUB_EVENT_MAP = {
    "push": [GitHubPushHandler()],
    "issues": [GitHubNewIssueHandler()],
    "pull_request": [GitHubNewPullRequestHandler()],
    "star": [GitHubNewStarHandler()],
    "issue_comment": [GitHubIssueCommentHandler()],
    "pull_request_review": [GitHubPullRequestReviewHandler()],
}
