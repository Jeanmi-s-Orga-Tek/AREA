from typing import Any, Dict, Optional
from app.executors.base import BaseExecutor
from app.oauth_models import ServiceAccount, Service
from sqlmodel import Session, select
import httpx
from fastapi import HTTPException

class BaseGitHubExecutor(BaseExecutor):
    async def _get_github_credentials(self, user_id: int, session: Session) -> ServiceAccount:
        github_service = session.exec(
            select(Service).where(Service.name == "github")
        ).first()
        
        if not github_service:
            raise HTTPException(status_code=404, detail="GitHub service not found")

        service_account = session.exec(
            select(ServiceAccount).where(
                ServiceAccount.user_id == user_id,
                ServiceAccount.service_id == github_service.id,
                ServiceAccount.is_active == True
            )
        ).first()
        
        if not service_account:
            raise HTTPException(
                status_code=403, 
                detail="User not connected to GitHub"
            )
        
        return service_account
    
    async def _make_github_request(self, method: str, url: str, access_token: str, json_data: Optional[Dict] = None) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "AREA-App-Bassirou",
            "X-GitHub-Api-Version": "2022-11-28"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    json=json_data,
                    timeout=30.0
                )
                
                if response.status_code in [200, 201]:
                    return response.json()
                elif response.status_code == 401:
                    raise HTTPException(
                        status_code=401,
                        detail="GitHub token expired or invalid"
                    )
                else:
                    error_msg = response.json().get("message", "Unknown error")
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"GitHub API error: {error_msg}"
                    )
                    
            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=504,
                    detail="GitHub API timeout"
                )
            except httpx.RequestError as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Network error: {str(e)}"
                )


class GitHubCreateIssueExecutor(BaseGitHubExecutor):
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session) -> bool:
        repository = parameters.get("repo") or parameters.get("repository")
        title = parameters.get("title")
        
        if not repository or not title:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameters: repository and title"
            )

        service_account = await self._get_github_credentials(user_id, session)

        issue_data = {"title": title}
        
        if "body" in parameters and parameters["body"]:
            issue_data["body"] = parameters["body"]
        
        if "labels" in parameters and parameters["labels"]:
            if isinstance(parameters["labels"], list):
                issue_data["labels"] = parameters["labels"]
            elif isinstance(parameters["labels"], str):
                issue_data["labels"] = [label.strip() for label in parameters["labels"].split(",")]

        if "assignees" in parameters and parameters["assignees"]:
            if isinstance(parameters["assignees"], list):
                issue_data["assignees"] = parameters["assignees"]
            elif isinstance(parameters["assignees"], str):
                issue_data["assignees"] = [assignee.strip() for assignee in parameters["assignees"].split(",")]

        result = await self._make_github_request(
            method="POST",
            url=f"https://api.github.com/repos/{repository}/issues",
            access_token=service_account.access_token,
            json_data=issue_data
        )
        
        print(f"GitHub issue created: {result.get('html_url')}")
        return True


class GitHubAddCommentExecutor(BaseGitHubExecutor):
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session) -> bool:
        repository = parameters.get("repo") or parameters.get("repository")
        issue_number = parameters.get("issue_number") or parameters.get("issue") or parameters.get("number")
        comment = parameters.get("comment") or parameters.get("body")
        
        if not repository or not issue_number or not comment:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameters: repository, issue_number, and comment"
            )

        service_account = await self._get_github_credentials(user_id, session)

        result = await self._make_github_request(
            method="POST",
            url=f"https://api.github.com/repos/{repository}/issues/{issue_number}/comments",
            access_token=service_account.access_token,
            json_data={"body": comment}
        )
        
        print(f"GitHub comment added: {result.get('html_url')}")
        return True


class GitHubCreateBranchExecutor(BaseGitHubExecutor):
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session) -> bool:
        repository = parameters.get("repo") or parameters.get("repository")
        branch_name = parameters.get("branch_name") or parameters.get("branch")
        from_branch = parameters.get("from_branch") or parameters.get("source_branch") or "main"
        
        if not repository or not branch_name:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameters: repository and branch_name"
            )

        service_account = await self._get_github_credentials(user_id, session)

        ref_result = await self._make_github_request(
            method="GET",
            url=f"https://api.github.com/repos/{repository}/git/ref/heads/{from_branch}",
            access_token=service_account.access_token
        )
        
        sha = ref_result["object"]["sha"]

        result = await self._make_github_request(
            method="POST",
            url=f"https://api.github.com/repos/{repository}/git/refs",
            access_token=service_account.access_token,
            json_data={
                "ref": f"refs/heads/{branch_name}",
                "sha": sha
            }
        )
        
        print(f"GitHub branch created: {branch_name} from {from_branch}")
        return True