import pandas as pd
import os
from typing import Optional, Tuple

def load_table_from_csv(file_path: str) -> Optional[pd.DataFrame]:
    """Load a CSV file into a pandas DataFrame."""
    try:
        df = pd.read_csv(file_path)
        if df.empty:
            raise ValueError("CSV file is empty or invalid.")
        df = df.astype(str)
        return df
    except Exception as e:
        print(f"Error loading CSV: {str(e)}")
        return None

def truncate_table(table: pd.DataFrame, max_rows: int = 20, max_columns: int = 5) -> pd.DataFrame:
    """Truncate table to maximum number of rows and columns."""
    return table.iloc[:max_rows, :max_columns]

def save_uploaded_csv(file, upload_dir: str) -> Tuple[bool, str, Optional[str]]:
    """
    Save an uploaded CSV file to the upload directory.
    
    Returns:
        Tuple of (success, message, file_path)
    """
    try:
        # Ensure upload directory exists
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_path = os.path.join(upload_dir, file.filename)
        
        # Save the file
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        
        # Validate it's a proper CSV
        df = pd.read_csv(file_path)
        if df.empty:
            os.remove(file_path)
            return False, "Uploaded file is empty", None
            
        return True, "File uploaded successfully", file_path
    except Exception as e:
        # Clean up if file was created
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        return False, f"Error processing upload: {str(e)}", None