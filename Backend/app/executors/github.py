from typing import Any, Dict
from app.executors.base import BaseExecutor
from app.oauth_models import ServiceAccount, Service
from sqlmodel import Session, select
import httpx
from fastapi import HTTPException


class GitHubCreateIssueExecutor(BaseExecutor):
    async def execute(self, user_id: int, parameters: Dict[str, Any], session: Session) -> bool:
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

        repository = parameters.get("repo")
        title = parameters.get("title")
        
        if not repository or not title:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameters: repository and title"
            )

        issue_data = {
            "title": title,
        }
        
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

        async with httpx.AsyncClient() as client:
            try:
                # TODO : Don't hardcode urls >:( (put them in the yaml)
                response = await client.post(
                    f"https://api.github.com/repos/{repository}/issues",
                    headers={
                        "Authorization": f"Bearer {service_account.access_token}",
                        "Accept": "application/vnd.github+json",
                    },
                    json=issue_data,
                    timeout=30.0
                )
                
                if response.status_code == 201:
                    issue = response.json()
                    print(f"GitHub issue created: {issue['html_url']}")
                    return True
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