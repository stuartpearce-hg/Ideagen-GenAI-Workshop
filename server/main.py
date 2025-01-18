from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import sys
import shutil
from datetime import datetime
from typing import List, Optional

# Add parent directory to Python path to import workshop modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from workshop.config import get_db_path
from workshop.integration import get_embeddings, get_qa
from langchain_community.vectorstores import FAISS

app = FastAPI()

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Repository(BaseModel):
    name: str
    timestamp: str
    path: str

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    repository_name: str

# Store QA chains for each repository
qa_chains = {}

@app.post("/api/repositories", response_model=Repository)
async def create_repository(name: str, file: UploadFile = File(...)):
    try:
        # Create repository directory
        timestamp = datetime.now().isoformat()
        repo_path = os.path.join(get_db_path(), f"{name}_{timestamp}")
        os.makedirs(repo_path, exist_ok=True)

        # Save uploaded file
        file_path = os.path.join(repo_path, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # TODO: Run build.py with the repository path

        return Repository(
            name=name,
            timestamp=timestamp,
            path=file_path
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/repositories", response_model=List[Repository])
async def list_repositories():
    try:
        repositories = []
        db_path = get_db_path()
        
        if os.path.exists(db_path):
            for entry in os.listdir(db_path):
                if os.path.isdir(os.path.join(db_path, entry)):
                    name, timestamp = entry.rsplit("_", 1)
                    repositories.append(Repository(
                        name=name,
                        timestamp=timestamp,
                        path=os.path.join(db_path, entry)
                    ))
        
        return repositories
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat", response_model=ChatMessage)
async def chat(request: ChatRequest):
    try:
        repo_path = None
        db_path = get_db_path()
        
        # Find the repository path
        for entry in os.listdir(db_path):
            if entry.startswith(request.repository_name + "_"):
                repo_path = os.path.join(db_path, entry)
                break
        
        if not repo_path:
            raise HTTPException(status_code=404, detail="Repository not found")

        # Initialize QA chain if not exists
        if repo_path not in qa_chains:
            embeddings = get_embeddings()
            db = FAISS.load_local(repo_path, embeddings=embeddings, allow_dangerous_deserialization=True)
            retriever = db.as_retriever(
                search_type="mmr",
                search_kwargs={"k": 20, "fetch_k": 30},
            )
            qa_chains[repo_path], _ = get_qa(retriever=retriever)

        # Get response from QA chain
        result = qa_chains[repo_path].invoke(request.message)
        
        return ChatMessage(
            role="assistant",
            content=result["answer"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
