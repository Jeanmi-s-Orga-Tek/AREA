from typing import Dict, Any, Optional
from sqlmodel import Session, select
from app.oauth_models import Service, ServiceAccount, Area
from app.action import Action
import httpx
import os

class WebhookManager:
    @staticmethod
    async def setup_webhooks_for_area(session: Session, area: Area) -> bool:
        action = session.get(Action, area.action_id)
        if not action:
            return False

        if action.is_polling:
            print(f"Action {action.name} uses polling, no webhook needed :D")
            return True

        service = session.get(Service, area.action_service_id)
        if not service:
            return False
        
        print(f"Setting up webhook for {service.name}.{action.name}")

        if service.name == "github":
            return await WebhookManager._setup_github_webhook(session, area, action)
        else:
            print(f"No webhook setup available for {service.name}")
            return True
    
    @staticmethod
    async def _setup_github_webhook(session: Session, area: Area, action: Action) -> bool:
        service_account = session.exec(
            select(ServiceAccount).where(
                ServiceAccount.user_id == area.user_id,
                ServiceAccount.service_id == area.action_service_id,
                ServiceAccount.is_active == True
            )
        ).first()
        
        if not service_account:
            print(f"User {area.user_id} not connected to GitHub")
            return False
        
        webhook_url = f"{os.getenv('API_BASE_URL', 'http://localhost:8080')}/webhooks/github"
        events = WebhookManager._get_github_events_for_action(action.name)

        repository = area.params_action.get("repository.full_name")

        if repository is None:
            return False

        return await WebhookManager._create_repo_webhook(
            service_account, repository, webhook_url, events
        )

    @staticmethod
    async def _create_repo_webhook(
        service_account: ServiceAccount,
        repository: str,
        webhook_url: str,
        events: list
    ) -> bool:
        try:
            async with httpx.AsyncClient() as client:
                repo_response = await client.get(
                    f"https://api.github.com/repos/{repository}",
                    headers={
                        "Authorization": f"Bearer {service_account.access_token}",
                        "Accept": "application/vnd.github+json",
                        "User-Agent": "AREA-App",
                        "X-GitHub-Api-Version": "2022-11-28"
                    },
                    timeout=30.0
                )
                
                if repo_response.status_code != 200:
                    print(f"Repository {repository} not found or no access")
                    print(f"Status: {repo_response.status_code}")
                    return False

                repo_data = repo_response.json()
                has_admin = repo_data.get("permissions", {}).get("admin", False)

                if not has_admin:
                    print(f"User doesn't have admin access to {repository}")
                    print(f"Webhook creation requires admin permissions")
                    return False
                
                print(f"User has admin access to {repository}")

                list_response = await client.get(
                    f"https://api.github.com/repos/{repository}/hooks",
                    headers={
                        "Authorization": f"Bearer {service_account.access_token}",
                        "Accept": "application/vnd.github+json",
                        "User-Agent": "AREA-App",
                        "X-GitHub-Api-Version": "2022-11-28"
                    },
                    timeout=30.0
                )

                print(list_response)
                
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
                    "events": events,
                    "active": True
                }
                
                # print(f"WEBHOOK DATA : {webhook_data}, \nURL : https://api.github.com/repos/{repository}/hooks")

                response = await client.post(
                    f"https://api.github.com/repos/{repository}/hooks",
                    headers={
                        "Authorization": f"Bearer {service_account.access_token}",
                        "Accept": "application/vnd.github+json",
                        "X-GitHub-Api-Version": "2022-11-28"
                    },
                    json=webhook_data,
                    timeout=30.0
                )
                
                if response.status_code == 201:
                    hook = response.json()
                    print(f"GitHub webhook created for {repository}: {hook['id']}")
                    return True
                else:
                    print(f"Failed to create GitHub webhook for {repository}")
                    print(f"Status: {response.status_code}")
                    try:
                        error_data = response.json()
                        error_msg = error_data.get('message', 'Unknown error')
                        print(f"   Error: {error_msg}")
                        if 'errors' in error_data:
                            print(f"Details: {error_data['errors']}")
                    except:
                        print(f"Response: {response.text[:200]}")

                    return True
                    
        except Exception as e:
            print(f"Error setting up GitHub webhook for {repository}: {str(e)}")
            return True

    @staticmethod
    def _get_github_events_for_action(action_name: str) -> list:
        event_map = {
            "push": ["push"],
            "new_issue": ["issues"],
            "new_pull_request": ["pull_request"],
            "new_star": ["star"],
            "new_commit": ["push"],
            "issue_comment": ["issue_comment"],
            "pull_request_review": ["pull_request_review"]
        }

        return event_map.get(action_name, ["push"])

    @staticmethod
    async def cleanup_webhooks_for_area(session: Session, area: Area) -> bool:
        # TODO : this :(
        print(f"NOT DONE : Webhook cleanup for area {area.id} (keeping shared webhooks)")
        return True
