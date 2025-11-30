from typing import Optional, Any, Dict
from datetime import datetime
from sqlmodel import Field, SQLModel
from sqlalchemy import JSON, Column


class OAuthConnection(SQLModel, table=True):

    __tablename__ = "oauth_connections"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    
    provider: str = Field(index=True) 
    provider_user_id: str = Field(index=True)  
    
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "Bearer"
    expires_at: Optional[datetime] = None
    
    scope: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    provider_email: Optional[str] = None
    provider_name: Optional[str] = None
    provider_picture: Optional[str] = None


class OAuthState(SQLModel, table=True):

    __tablename__ = "oauth_states"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    state: str = Field(unique=True, index=True)
    provider: str
    flow: str
    redirect_uri: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime 


class Service(SQLModel, table=True):
    __tablename__ = "services"
    
    id: Optional[int] = Field(default=None, primary_key=True)

    name: str = Field(unique=True, index=True)
    display_name: str
    description: Optional[str] = None
    
    oauth_provider: Optional[str] = None
    required_scopes: Optional[str] = None
    requires_oauth: bool = False
    
    icon: Optional[str] = None
    icon_url: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = None
    
    is_active: bool = True

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ServiceAction(SQLModel, table=True):
    __tablename__ = "service_actions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    service_id: int = Field(foreign_key="services.id", index=True)
    name: str
    description: str
    technical_key: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ServiceReaction(SQLModel, table=True):
    __tablename__ = "service_reactions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    service_id: int = Field(foreign_key="services.id", index=True)
    name: str
    description: str
    technical_key: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UserServiceSubscription(SQLModel, table=True):
    __tablename__ = "user_service_subscriptions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    service_id: int = Field(index=True, foreign_key="services.id")
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    oauth_data: Optional[str] = None


class ServiceAccount(SQLModel, table=True):
    __tablename__ = "service_accounts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    user_id: int = Field(foreign_key="user.id", index=True)
    service_id: int = Field(foreign_key="services.id", index=True)
    
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "Bearer"
    
    expires_at: Optional[datetime] = None
    
    granted_scopes: Optional[str] = None
    
    remote_account_id: Optional[str] = None
    remote_email: Optional[str] = None
    remote_name: Optional[str] = None
    
    is_active: bool = True
    last_used_at: Optional[datetime] = None
    
    extra_data: Optional[str] = None  
    last_error: Optional[str] = None
    error_count: int = 0
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Area(SQLModel, table=True):
    __tablename__ = "areas"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    name: Optional[str] = None
    action_service_id: int = Field(foreign_key="services.id")
    action_id: int = Field(foreign_key="action.id")
    reaction_service_id: int = Field(foreign_key="services.id")
    reaction_id: int = Field(foreign_key="reaction.id")
    params_action: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    params_reaction: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
