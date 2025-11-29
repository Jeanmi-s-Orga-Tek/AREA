import os
from typing import Annotated
from fastapi import Depends, FastAPI, HTTPException, Query
from sqlmodel import Field, Session, SQLModel, create_engine, select

POSTGRESQL_URI = str(os.environ.get("POSTGRESQL_URI"))

engine = create_engine(POSTGRESQL_URI)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]

import yaml

def scan_yaml_files(base_dir):
    yaml_files = []
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith('.yaml') or file.endswith('.yml'):
                yaml_files.append(os.path.join(root, file))
    return yaml_files

def load_yaml_file(path):
    with open(path, 'r') as f:
        try:
            return yaml.safe_load(f)
        except Exception:
            return None

def insert_services(session):
    from app.oauth_models import Service
    
    service_files = scan_yaml_files(os.path.join(os.path.dirname(__file__), '../services'))
    service_map = {}
    
    for sfile in service_files:
        data = load_yaml_file(sfile)
        if not data:
            continue
        
        service_name = data.get('name', os.path.splitext(os.path.basename(sfile))[0])

        existing_service = session.exec(
            select(Service).where(Service.name == service_name)
        ).first()
        
        if existing_service:
            existing_service.display_name = data.get('display_name', service_name)
            existing_service.description = data.get('description')
            existing_service.oauth_provider = data.get('oauth_provider', service_name)
            existing_service.required_scopes = data.get('required_scopes', '')
            existing_service.icon = data.get('icon')
            existing_service.color = data.get('color')
            existing_service.category = data.get('category')
            existing_service.is_active = data.get('is_active', True)
            session.add(existing_service)
            session.commit()
            session.refresh(existing_service)
            service_map[service_name] = existing_service.id
        else:
            service = Service(
                name=service_name,
                display_name=data.get('display_name', service_name),
                description=data.get('description'),
                oauth_provider=data.get('oauth_provider', service_name),
                required_scopes=data.get('required_scopes', ''),
                icon=data.get('icon'),
                color=data.get('color'),
                category=data.get('category'),
                is_active=data.get('is_active', True)
            )
            session.add(service)
            session.commit()
            session.refresh(service)
            service_map[service_name] = service.id
    return service_map

def insert_actions_and_reactions(session, service_map):
    from app.action import Action
    from app.reaction import Reaction
    
    action_files = scan_yaml_files(os.path.join(os.path.dirname(__file__), '../actions'))
    for afile in action_files:
        data = load_yaml_file(afile)
        if not data:
            continue

        service_name = data.get('service')
        service_id = service_map.get(service_name) if service_name else None
        
        params = data.get('parameters')
        if isinstance(params, list):
            try:
                params = {k: v for d in params for k, v in (d.items() if isinstance(d, dict) else [(d, None)])}
            except Exception:
                params = None
        if not isinstance(params, dict):
            params = None
        
        is_polling = bool(data.get('is_polling', False))
        action_name = data.get('name', os.path.splitext(os.path.basename(afile))[0])

        existing_action = session.exec(
            select(Action).where(Action.name == action_name)
        ).first()
        
        if existing_action:
            existing_action.description = data.get('description')
            existing_action.is_polling = is_polling
            existing_action.parameters = params
            existing_action.service_id = service_id
            session.add(existing_action)
        else:
            action = Action(
                name=action_name,
                description=data.get('description'),
                is_polling=is_polling,
                parameters=params,
                service_id=service_id
            )
            session.add(action)

    reaction_files = scan_yaml_files(os.path.join(os.path.dirname(__file__), '../reactions'))
    for rfile in reaction_files:
        data = load_yaml_file(rfile)
        if not data:
            continue

        service_name = data.get('service')
        service_id = service_map.get(service_name) if service_name else None
        
        reaction_name = data.get('name', os.path.splitext(os.path.basename(rfile))[0])

        existing_reaction = session.exec(
            select(Reaction).where(Reaction.name == reaction_name)
        ).first()
        
        if existing_reaction:
            existing_reaction.description = data.get('description')
            existing_reaction.url = data.get('url')
            existing_reaction.parameters = data.get('parameters')
            existing_reaction.service_id = service_id
            session.add(existing_reaction)
        else:
            reaction = Reaction(
                name=reaction_name,
                description=data.get('description'),
                url=data.get('url'),
                parameters=data.get('parameters'),
                service_id=service_id
            )
            session.add(reaction)

    session.commit()

def create_db_tables():
    # Import models here to ensure they're registered with SQLModel.metadata
    from app.user import User
    from app.oauth_models import (
        OAuthConnection, OAuthState, Service, ServiceAccount, 
        ServiceAction, ServiceReaction, UserServiceSubscription, Area
    )
    from app.action import Action
    from app.reaction import Reaction
    
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        service_map = insert_services(session)
        insert_actions_and_reactions(session, service_map)
