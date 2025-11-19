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

POSTGRESQL_URI = str(os.environ.get("POSTGRESQL_URI"))

engine = create_engine(POSTGRESQL_URI)

import yaml
from app.action import Action
from app.reaction import Reaction

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

def insert_actions_and_reactions(session):
    action_files = scan_yaml_files(os.path.join(os.path.dirname(__file__), '../actions'))
    for afile in action_files:
        data = load_yaml_file(afile)
        if not data:
            continue
        params = data.get('parameters')
        if isinstance(params, list):
            try:
                params = {k: v for d in params for k, v in (d.items() if isinstance(d, dict) else [(d, None)])}
            except Exception:
                params = None
        if not isinstance(params, dict):
            params = None
        is_polling = bool(data.get('is_polling', False))
        action = Action(
            name=data.get('name', os.path.splitext(os.path.basename(afile))[0]),
            description=data.get('description'),
            is_polling=is_polling,
            parameters=params
        )
        session.add(action)

    reaction_files = scan_yaml_files(os.path.join(os.path.dirname(__file__), '../reactions'))
    for rfile in reaction_files:
        data = load_yaml_file(rfile)
        if not data:
            continue
        reaction = Reaction(
            name=data.get('name', os.path.splitext(os.path.basename(rfile))[0]),
            description=data.get('description'),
            url=data.get('url'),
            parameters=data.get('parameters')
        )
        session.add(reaction)

    session.commit()

def create_db_tables():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        insert_actions_and_reactions(session)
