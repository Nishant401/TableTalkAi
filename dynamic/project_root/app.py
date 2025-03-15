import pandas as pd
import re
import torch
from transformers import TapasTokenizer, TapasForQuestionAnswering
import warnings
from typing import Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Suppress future warnings
warnings.filterwarnings("ignore", category=FutureWarning)

class TapasQueryProcessor:
    """A class to process natural language queries against a DataFrame using TAPAS."""
    
    _model_name = "google/tapas-base-finetuned-wtq"
    _tokenizer = None
    _model = None

    @classmethod
    def _initialize_models(cls):
        """Lazy initialization of TAPAS model and tokenizer."""
        if cls._tokenizer is None or cls._model is None:
            logger.info(f"Loading TAPAS model: {cls._model_name}")
            cls._tokenizer = TapasTokenizer.from_pretrained(cls._model_name)
            cls._model = TapasForQuestionAnswering.from_pretrained(cls._model_name)
            if torch.cuda.is_available():
                cls._model = cls._model.cuda()
                logger.info("Model moved to GPU")

    @classmethod
    def process_query(cls, query: str, table: pd.DataFrame, max_rows: int = 500) -> Dict[str, Any]:
        """
        Process a natural language query against a table.

        Args:
            query: The natural language query string
            table: The pandas DataFrame to query
            max_rows: Maximum rows to process with TAPAS (default: 500)

        Returns:
            Dictionary with query result information
        """
        try:
            # Validate inputs
            if not isinstance(table, pd.DataFrame):
                raise ValueError("Table must be a pandas DataFrame.")
            if table.empty:
                return {"success": False, "message": "Table is empty."}

            # Initialize models if not already loaded
            cls._initialize_models()

            # Handle 'details' queries
            if "details" in query.lower():
                id_value = cls._extract_id(query)
                if not id_value:
                    return {"success": False, "message": "Could not find an ID in the query."}

                # Assume first column is ID unless specified otherwise
                id_column = table.columns[0]
                # Convert to string and strip for consistent matching
                matching_row = table[table[id_column].astype(str).str.strip() == str(id_value).strip()]
                
                if not matching_row.empty:
                    details = matching_row.iloc[0].to_dict()
                    return {"success": True, "result_type": "details", "result": details}
                return {"success": False, "message": f"ID '{id_value}' not found in the table."}

            # Preprocess table for TAPAS (limit rows and convert to strings)
            table_processed = table.iloc[:max_rows].astype(str)
            logger.info(f"Processing table with {len(table_processed)} rows and {len(table_processed.columns)} columns")

            # Tokenize inputs
            inputs = cls._tokenizer(
                table=table_processed,
                queries=[query],
                padding="max_length",
                return_tensors="pt",
                truncation=True
            )

            # Check token limit
            if inputs["input_ids"].shape[1] > 512:
                logger.warning("Input exceeds token limit. Truncating table.")
                table_processed = cls._truncate_table(table_processed, query)
                inputs = cls._tokenizer(
                    table=table_processed,
                    queries=[query],
                    padding="max_length",
                    return_tensors="pt",
                    truncation=True
                )

            # Move to GPU if available
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}

            # Model inference
            with torch.no_grad():
                outputs = cls._model(**inputs)
                predicted_answer_coordinates, predicted_aggregation_indices = cls._tokenizer.convert_logits_to_predictions(
                    inputs,
                    outputs.logits.detach().cpu().numpy(),
                    outputs.logits_aggregation.detach().cpu().numpy()
                )

            if not predicted_answer_coordinates[0]:
                return {"success": False, "message": "Answer not found. Please rephrase your query."}

            # Extract answers
            answers = []
            for row, col in predicted_answer_coordinates[0]:
                if row < len(table_processed) and col < len(table_processed.columns):
                    answers.append(str(table_processed.iloc[row, col]))

            return {"success": True, "result_type": "answer", "result": answers}

        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            return {"success": False, "message": f"Error: {str(e)}"}
        finally:
            # Clean up memory
            if 'inputs' in locals():
                del inputs
            if 'outputs' in locals():
                del outputs
            torch.cuda.empty_cache()

    @staticmethod
    def _extract_id(query: str) -> Optional[str]:
        """Extract an ID from a query string."""
        # Try 'details of' pattern first
        parts = query.lower().split("details of")
        if len(parts) > 1:
            id_part = parts[1].strip()
            id_match = re.search(r'[\w-]+', id_part)
            if id_match:
                return id_match.group()

        # Fallback to any alphanumeric ID-like pattern
        id_match = re.search(r'\b[A-Za-z0-9-]+\b', query)
        return id_match.group() if id_match else None

    @staticmethod
    def _truncate_table(table: pd.DataFrame, query: str) -> pd.DataFrame:
        """Truncate table to fit within token limits based on query context."""
        # Rough heuristic: keep rows that might be relevant based on query terms
        terms = set(re.findall(r'\b\w+\b', query.lower()))
        relevant_rows = table[table.apply(lambda row: any(term in str(row).lower() for term in terms), axis=1)]
        if len(relevant_rows) > 100:  # Arbitrary limit
            return relevant_rows.iloc[:100]
        return relevant_rows if not relevant_rows.empty else table.iloc[:100]

# Example usage
if __name__ == "__main__":
    # Sample DataFrame
    data = {
        "ID": ["A1", "B2", "C3"],
        "Name": ["Alice", "Bob", "Charlie"],
        "Age": [25, 30, 35]
    }
    df = pd.DataFrame(data)

    # Test queries
    processor = TapasQueryProcessor()
    print(processor.process_query("What is Alice's age?", df))
    print(processor.process_query("Details of A1", df))