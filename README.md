# TableTalkAi
"TableTalk AI enables seamless data analysis using Google Tapas, allowing users to query tabular data in natural language and receive structured insights effortlessly."
# Google TAPAS Data Query: Natural Language Table Analysis

This repository contains implementations of data query and analysis systems using Google TAPAS, a BERT-like transformer model specifically designed for table understanding and reasoning.

## Project Overview

This project demonstrates how Google TAPAS can be used to perform natural language queries on tabular data, eliminating the need for SQL or other formal query languages. The repository includes two main implementations:

1. **Static Implementation**: A web application that processes predefined tabular data with natural language queries in real-time.
2. **Dynamic Implementation**: A web application that allows users to upload their own CSV files and perform natural language queries on them.

Both implementations are built using Python Flask for the backend and include dedicated front-end interfaces.

## About Google TAPAS

TAPAS (Table Parser) is a BERT-based model pretrained on Wikipedia tables and their surrounding text. It excels at understanding and reasoning with tabular data through:

- **Masked Language Modeling (MLM)**: The model learns bidirectional representations of tables and text by predicting randomly masked words.
- **Intermediate Pre-training**: The model is trained on millions of examples to classify whether statements are supported or refuted by table contents, enhancing numerical reasoning capabilities.

Unlike traditional query methods that require formal query languages, TAPAS enables natural language interactions with tabular data, making data analysis more accessible.

Model Source: [google/tapas-large](https://huggingface.co/google/tapas-large)

## Features

### Static Implementation
- Pre-loaded tabular data
- Natural language query processing
- Real-time results
- User-friendly interface

### Dynamic Implementation
- File upload capability (CSV and other formats)
- Natural language query processing on uploaded data
- Flexible data source integration
- Interactive query results

## Example Queries

### Dynamic Implementation:
- "Give me the data of index 1"

### Static Implementation:
- "What's the highest value in column X?"
- "Show rows where [condition]"
- "Calculate the average of column Y"

## Installation & Setup

### Prerequisites
- Python 3.7+
- Flask
- PyTorch
- Transformers library

## Usage

### Static Implementation
1. Access the web interface
2. Enter your natural language query
3. View the results displayed in a formatted table

### Dynamic Implementation
1. Access the web interface
2. Upload your CSV or other tabular data file
3. Enter your natural language query related to the uploaded data
4. View the results displayed in a formatted table

## Technical Implementation

The system leverages the TAPAS model from Hugging Face's transformers library. Key components include:

- **Data Preprocessing**: Converts tabular data into a format suitable for TAPAS
- **Query Processing**: Interprets natural language queries
- **Result Generation**: Extracts and formats relevant information from tables
- **Web Interface**: Provides an intuitive user experience through Flask

## Future Enhancements

- Support for more complex analytical queries
- Integration with database systems
- Improved visualization options
- API endpoints for programmatic access

## Contributions

Contributions to this project are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Google Research for developing the TAPAS model
- Hugging Face for providing implementation and pretrained models
