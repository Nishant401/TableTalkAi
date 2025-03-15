import os
import uuid
from fastapi import FastAPI, UploadFile, File, Form, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import pandas as pd
from typing import Dict, Optional

from app.models import QueryRequest, QueryResponse, FileUploadResponse
from app.utils.table_utils import save_uploaded_csv, load_table_from_csv, truncate_table
from app.services.query_service import process_query

# Initialize FastAPI app
app = FastAPI(title="Table Query System")

# Set up template and static file directories
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Create upload directory
UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# In-memory storage for uploaded files
# In a production app, this would be replaced with a database
file_storage: Dict[str, str] = {}

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Render the main page."""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/upload", response_model=FileUploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Upload a CSV file and return a preview."""
    if not file.filename.endswith('.csv'):
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Only CSV files are supported"}
        )
    
    # Save the uploaded file
    success, message, file_path = save_uploaded_csv(file, UPLOAD_DIR)
    if not success:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": message}
        )
    
    # Generate a unique ID for this file
    file_id = str(uuid.uuid4())
    file_storage[file_id] = file_path
    
    # Generate preview data
    try:
        df = load_table_from_csv(file_path)
        truncated_df = truncate_table(df, max_rows=5)
        
        preview = {
            "columns": truncated_df.columns.tolist(),
            "rows": truncated_df.to_dict(orient="records"),
            "total_rows": len(df),
            "displayed_rows": len(truncated_df)
        }
        
        return {
            "success": True,
            "message": "File uploaded successfully",
            "file_id": file_id,
            "preview": preview
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False, 
                "message": f"Error generating preview: {str(e)}"
            }
        )

@app.post("/api/query", response_model=QueryResponse)
async def query_table(query_request: QueryRequest):
    """Process a natural language query against the uploaded table."""
    # Check if file exists
    if query_request.file_id not in file_storage:
        return JSONResponse(
            status_code=404,
            content={
                "success": False, 
                "message": "File not found. Please upload the file again."
            }
        )
    
    # Load the table
    file_path = file_storage[query_request.file_id]
    table = load_table_from_csv(file_path)
    if table is None:
        return JSONResponse(
            status_code=500,
            content={
                "success": False, 
                "message": "Error loading table from file."
            }
        )
    
    # Process the query
    result = process_query(query_request.query, table)
    return result

@app.get("/api/files/{file_id}/preview")
async def get_file_preview(file_id: str):
    """Get a preview of a specific file."""
    if file_id not in file_storage:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path = file_storage[file_id]
    df = load_table_from_csv(file_path)
    if df is None:
        raise HTTPException(status_code=500, detail="Error loading file")
    
    truncated_df = truncate_table(df, max_rows=5)
    
    return {
        "success": True,
        "preview": {
            "columns": truncated_df.columns.tolist(),
            "rows": truncated_df.to_dict(orient="records"),
            "total_rows": len(df),
            "displayed_rows": len(truncated_df)
        }
    }

@app.on_event("startup")
async def startup_event():
    """Initialize resources on startup."""
    print(f"Server starting. Upload directory: {UPLOAD_DIR}")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    # In a production app, we might want to clean up temporary files
    print("Server shutting down")