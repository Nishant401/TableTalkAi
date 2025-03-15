from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union

class QueryRequest(BaseModel):
    query: str
    file_id: str

class QueryResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    result_type: Optional[str] = None
    result: Optional[Union[List[str], Dict[str, Any]]] = None

class FileUploadResponse(BaseModel):
    success: bool
    message: str
    file_id: Optional[str] = None
    preview: Optional[Dict[str, Any]] = None

class TablePreview(BaseModel):
    columns: List[str]
    rows: List[Dict[str, str]]
    total_rows: int
    displayed_rows: int