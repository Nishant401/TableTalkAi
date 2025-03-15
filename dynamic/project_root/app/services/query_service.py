import pandas as pd
import re
from transformers import TapasTokenizer, TapasForQuestionAnswering
import warnings
from typing import Dict, Any, Optional

# Suppress future warnings
warnings.filterwarnings("ignore", category=FutureWarning)

# Load model once when the module is imported
model_name = "google/tapas-base-finetuned-wtq"
tokenizer = TapasTokenizer.from_pretrained(model_name)
model = TapasForQuestionAnswering.from_pretrained(model_name)

def process_query(query: str, table: pd.DataFrame) -> Dict[str, Any]:
    """
    Process a natural language query against a table.
    
    Args:
        query: The natural language query string
        table: The pandas DataFrame to query
        
    Returns:
        Dictionary with query result information
    """
    try:
        if not isinstance(table, pd.DataFrame):
            raise ValueError("Table must be a pandas DataFrame.")
        
        # Handle 'details' queries by extracting ID from the query
        if "details" in query.lower():
            id_value = None
            # Attempt to extract ID after 'details of' phrase
            parts = query.lower().split("details of")
            if len(parts) > 1:
                id_part = parts[1].strip()
                id_match = re.search(r'[\w-]+', id_part)
                if id_match:
                    id_value = id_match.group()
            
            # Fallback: search for any ID-like pattern in the query
            if not id_value:
                id_match = re.search(r'\b[\w-]+\b', query)
                if id_match:
                    id_value = id_match.group()
            
            if not id_value:
                return {
                    "success": False,
                    "message": "Could not find an ID in the query."
                }
            
            id_column = table.columns[0]
            matching_row = table[table[id_column].str.strip() == str(id_value).strip()]
            
            if not matching_row.empty:
                details = matching_row.iloc[0].to_dict()
                return {
                    "success": True,
                    "result_type": "details",
                    "result": details
                }
            else:
                return {
                    "success": False,
                    "message": f"ID '{id_value}' not found in the table."
                }
        
        # Process other queries with TAPAS
        inputs = tokenizer(
            table=table, 
            queries=query, 
            padding="max_length", 
            return_tensors="pt", 
            truncation=True
        )
        
        if inputs["input_ids"].shape[1] > 512:
            return {
                "success": False,
                "message": "Error: Input exceeds token limit. Simplify your query or reduce table size."
            }
        
        outputs = model(**inputs)
        predicted_answer_coordinates, predicted_aggregation_indices = tokenizer.convert_logits_to_predictions(
            inputs,
            outputs.logits.detach().cpu().numpy(), 
            outputs.logits_aggregation.detach().cpu().numpy()
        )
        
        if not predicted_answer_coordinates[0]:
            return {
                "success": False,
                "message": "Answer not found. Please rephrase your query."
            }
        
        # Extract answers from the table
        answers = []
        for coordinates in predicted_answer_coordinates[0]:
            row, col = coordinates
            answers.append(str(table.iloc[row, col]))
        
        return {
            "success": True,
            "result_type": "answer",
            "result": answers
        }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Error processing query: {str(e)}"
        }