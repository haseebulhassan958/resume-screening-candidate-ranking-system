import fitz  # PyMuPDF
import pdfplumber
import os


def extract_text_pymupdf(file_path: str) -> str:
    """Extract text using PyMuPDF — fast, works well for most PDFs."""
    text = ""
    try:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text()
        doc.close()
    except Exception as e:
        print(f"PyMuPDF extraction failed: {e}")
    return text.strip()


def extract_text_pdfplumber(file_path: str) -> str:
    """Fallback extraction using pdfplumber — sometimes catches text PyMuPDF misses (tables, etc.)."""
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"pdfplumber extraction failed: {e}")
    return text.strip()


def extract_resume_text(file_path: str) -> str:
    """
    Main extraction function. Tries PyMuPDF first (faster),
    falls back to pdfplumber if the result looks too short/empty
    (this handles different resume formats/layouts as required by the task).
    """
    text = extract_text_pymupdf(file_path)


    if len(text) < 50:
        text = extract_text_pdfplumber(file_path)

    return text