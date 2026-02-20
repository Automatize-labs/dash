"""PDF text extraction module."""
import io
import PyPDF2


def extract_text_from_pdf(file_bytes: bytes) -> dict:
    """Extract text from PDF file bytes.
    
    Args:
        file_bytes: Raw bytes of the PDF file.
        
    Returns:
        dict with 'text' (extracted text) and 'pages' (page count).
    """
    pdf_file = io.BytesIO(file_bytes)
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    
    text = ""
    for page in pdf_reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    
    return {
        "text": text.strip(),
        "pages": len(pdf_reader.pages)
    }
