from fastapi import FastAPI, HTTPException, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
import os
import sys
import shutil
import re
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Literal

# Add parent directory to Python path to import workshop modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from workshop.config import get_db_path
from workshop.integration import get_embeddings, get_qa
from workshop.loaders import TextBlobLoader, FileSystemModel
from langchain.document_loaders.helpers import detect_file_encodings
from langchain_community.vectorstores import FAISS

# Security configurations
# Match exactly with build.py FileSystemModel suffixes
ALLOWED_EXTENSIONS = {
    # Web and scripting languages
    '.php', '.html', '.js', '.py', '.css',
    # C# and .NET
    '.cs', '.csproj', '.sln',
    # Data and config files
    '.json', '.md', '.yml', '.yaml', '.xml',
    # Shell scripts
    '.sh',
    # Database
    '.sql',
    # Visual Basic
    '.vbp', '.frm', '.bas', '.cls',
    # ABAP
    '.abap', '.asddls', '.asbdef',
    # PHP-specific
    '.module', '.inc'
}
MAX_FILENAME_LENGTH = 255
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def sanitize_repository_name(name: str) -> str:
    """Sanitize repository name to prevent path traversal and ensure safe names."""
    # Remove any path separators and non-alphanumeric characters
    sanitized = re.sub(r'[^\w\-]', '_', name)
    # Ensure the name isn't too long
    return sanitized[:MAX_FILENAME_LENGTH]

def validate_file_extension(filename: str) -> bool:
    """Check if the file extension is allowed."""
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS

def validate_file_content(file_path: str) -> bool:
    """Validate file content and encoding."""
    try:
        # Check if file is readable and has valid encoding
        encodings = detect_file_encodings(file_path)
        if not encodings:
            return False
            
        # Try to read the file with detected encoding
        with open(file_path, 'r', encoding=encodings[0]) as f:
            # Read first few lines to verify content
            for _ in range(5):
                f.readline()
        return True
    except Exception:
        return False

def secure_path_join(*paths: str) -> str:
    """Securely join paths and ensure they're within the base directory."""
    base_path = Path(get_db_path()).resolve()
    try:
        full_path = base_path.joinpath(*paths).resolve()
        # Ensure the resulting path is within the base directory
        if not str(full_path).startswith(str(base_path)):
            raise ValueError("Path traversal detected")
        return str(full_path)
    except Exception as e:
        raise ValueError(f"Invalid path: {str(e)}")

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
    name: str = Field(..., min_length=1, max_length=MAX_FILENAME_LENGTH)
    timestamp: str
    path: str

    @validator('name')
    def validate_name(cls, v):
        if not re.match(r'^[\w\-]+$', v):
            raise ValueError('Name must contain only alphanumeric characters, underscores, and hyphens')
        return v

class ChatMessage(BaseModel):
    role: Literal['user', 'assistant']
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    repository_name: str = Field(..., min_length=1, max_length=MAX_FILENAME_LENGTH)

    @validator('repository_name')
    def validate_repository_name(cls, v):
        if not re.match(r'^[\w\-]+$', v):
            raise ValueError('Repository name must contain only alphanumeric characters, underscores, and hyphens')
        return v

# Store QA chains for each repository
qa_chains = {}

@app.post("/api/repositories", response_model=Repository)
async def create_repository(name: str, file: UploadFile = File(...)):
    try:
        # Validate repository name
        sanitized_name = sanitize_repository_name(name)
        if not sanitized_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid repository name"
            )

        # Validate file size
        file_size = 0
        chunk_size = 8192  # 8KB chunks
        
        for chunk in file.file:
            file_size += len(chunk)
            if file_size > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)}MB"
                )
        
        # Reset file position after reading
        await file.seek(0)

        # Validate file extension and name
        file_suffix = Path(file.filename).suffix.lower()
        if not file_suffix:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must have an extension"
            )
        if file_suffix not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            )

        # Create repository directory with sanitized name and timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        repo_dirname = f"{sanitized_name}_{timestamp}"
        
        try:
            # Use secure_path_join to create and validate repository path
            repo_dir = secure_path_join(repo_dirname)
            Path(repo_dir).mkdir(parents=True, exist_ok=True)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid repository path: {str(e)}"
            )

        try:
            # Create sanitized filename and validate full path
            safe_filename = (
                sanitize_repository_name(Path(file.filename).stem) + 
                file_suffix
            )
            file_path = secure_path_join(repo_dirname, safe_filename)
            
            # Save file using pathlib for secure path handling
            with Path(file_path).open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            # Validate file content and encoding
            if not validate_file_content(file_path):
                # Clean up invalid file
                Path(file_path).unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid file content or encoding"
                )
        except (ValueError, OSError) as e:
            # Clean up repository directory if file save fails
            shutil.rmtree(repo_dir, ignore_errors=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to save file: {str(e)}"
            )

        # TODO: Run build.py with the repository path

        return Repository(
            name=sanitized_name,
            timestamp=timestamp,
            path=file_path
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create repository"
        )

@app.get("/api/repositories", response_model=List[Repository])
async def list_repositories():
    try:
        repositories = []
        db_path = Path(get_db_path()).resolve()
        
        if not db_path.exists():
            return repositories

        for entry in db_path.iterdir():
            if not entry.is_dir():
                continue

            try:
                # Validate entry path using secure_path_join
                try:
                    secure_path = secure_path_join(entry.name)
                except ValueError:
                    continue

                # Parse and validate repository name and timestamp
                if "_" not in entry.name:
                    continue
                
                name, timestamp = entry.name.rsplit("_", 1)
                sanitized_name = sanitize_repository_name(name)
                
                if not sanitized_name or sanitized_name != name:
                    continue

                repositories.append(Repository(
                    name=sanitized_name,
                    timestamp=timestamp,
                    path=secure_path
                ))
            except (ValueError, IndexError):
                continue
        
        return repositories
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list repositories"
        )

@app.post("/api/chat", response_model=ChatMessage)
async def chat(request: ChatRequest):
    try:
        # Validate repository name
        sanitized_name = sanitize_repository_name(request.repository_name)
        if not sanitized_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid repository name"
            )

        # Find the repository path securely
        db_path = Path(get_db_path()).resolve()
        repo_path = None
        
        if not db_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository storage not found"
            )

        # Find the most recent repository with matching name
        matching_repos = []
        for entry in db_path.iterdir():
            if not entry.is_dir():
                continue

            try:
                if entry.name.startswith(f"{sanitized_name}_"):
                    # Validate path using secure_path_join
                    secure_path = secure_path_join(entry.name)
                    matching_repos.append((secure_path, entry.name.split("_", 1)[1]))
            except ValueError:
                continue

        if not matching_repos:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Repository not found"
            )

        # Use the most recent repository
        repo_path = max(matching_repos, key=lambda x: x[1])[0]

        # Initialize QA chain if not exists
        if repo_path not in qa_chains:
            try:
                embeddings = get_embeddings()
                db = FAISS.load_local(repo_path, embeddings=embeddings, allow_dangerous_deserialization=True)
                retriever = db.as_retriever(
                    search_type="mmr",
                    search_kwargs={"k": 20, "fetch_k": 30},
                )
                qa_chains[repo_path], _ = get_qa(retriever=retriever)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to initialize chat system"
                )

        # Get response from QA chain
        try:
            result = qa_chains[repo_path].invoke(request.message)
            return ChatMessage(
                role="assistant",
                content=result["answer"]
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process chat message"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
