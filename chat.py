from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import time
from pathlib import Path
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from fastapi.middleware.cors import CORSMiddleware
import speech_recognition as sr
from deep_translator import GoogleTranslator
from gtts import gTTS
import tempfile
import uuid

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Update this with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories for storing audio files
UPLOAD_DIR = Path("audio_files")
UPLOAD_DIR.mkdir(exist_ok=True)

# Define input schema
class QueryModel(BaseModel):
    message: str

# Initialize translator
translator = GoogleTranslator(source='auto', target='en')

# Load dataset
DATA_FILE = "landrecords.txt"

def preprocess_dataset(file_path):
    """Preprocess the dataset to ensure each Q&A pair is treated as a separate document."""
    with open(file_path, 'r') as file:
        content = file.read()
    
    # Split the content into Q&A pairs
    qa_pairs = content.split('\n\n')  # Assuming Q&A pairs are separated by double newlines
    documents = [{"page_content": pair} for pair in qa_pairs]
    return documents

def load_and_store_data():
    """Load and preprocess the dataset, then store it in ChromaDB."""
    documents = preprocess_dataset(DATA_FILE)
    print(f"Preprocessed documents: {documents}")  # Check if the data is preprocessed correctly

    # Split the documents into smaller chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    texts = text_splitter.split_documents(documents)
    print(f"Split texts: {texts}")  # Check if the data is split correctly

    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    db = Chroma.from_documents(texts, embeddings, persist_directory="./chroma_db")
    return db

# Load data into ChromaDB
if not os.path.exists("./chroma_db"):
    db = load_and_store_data()
else:
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    db = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)

retriever = db.as_retriever()

def detect_language(text):
    """Detect the language of input text."""
    try:
        detection = translator.detect(text)
        print(f"Detected language: {detection.lang}")  # Check detected language
        return detection.lang
    except Exception as e:
        print(f"Language detection error: {e}")
        return 'en'

def generate_audio_response(text, lang='en'):
    """Generate audio file from text and return the filename."""
    try:
        # Generate unique filename
        filename = f"{uuid.uuid4()}.mp3"
        filepath = UPLOAD_DIR / filename
        
        # Generate audio file
        tts = gTTS(text=text, lang=lang)
        tts.save(str(filepath))
        
        return filename
    except Exception as e:
        print(f"Error generating audio: {e}")
        return None

@app.post("/voice-input")
async def process_voice(file: UploadFile = File(...)):
    """Process voice input and return a response."""
    # Create a temporary file with .wav extension
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    try:
        # Write uploaded file content
        content = await file.read()
        temp_file.write(content)
        temp_file.close()

        # Initialize speech recognizer
        recognizer = sr.Recognizer()
        
        # Convert speech to text
        with sr.AudioFile(temp_file.name) as source:
            # Adjust for ambient noise
            recognizer.adjust_for_ambient_noise(source)
            audio = recognizer.record(source)
            
        # Try Hindi first, then English
        try:
            text = recognizer.recognize_google(audio, language="hi-IN")
            detected_lang = 'hi'
        except sr.UnknownValueError:
            try:
                text = recognizer.recognize_google(audio)
                detected_lang = 'en'
            except sr.UnknownValueError:
                raise Exception("Could not understand the audio")
        except Exception as e:
            text = recognizer.recognize_google(audio)
            detected_lang = 'en'

        # Get response from ChromaDB
        docs = retriever.get_relevant_documents(text)
        print(f"Retrieved documents: {docs}")  # Check retrieved documents
        if not docs:
            response_text = "Sorry, I couldn't find an answer."
        else:
            response_text = docs[0].page_content

        # Translate response if needed
        if detected_lang == 'hi':
            try:
                response_text = GoogleTranslator(source='auto', target='hi').translate(response_text)
            except Exception as e:
                print(f"Translation error: {e}")
                # Fallback to English if translation fails
                detected_lang = 'en'

        # Generate audio response
        audio_filename = generate_audio_response(response_text, detected_lang)

        return {
            "transcribed_text": text,
            "text_response": response_text,
            "audio_file_path": audio_filename,
            "detected_language": detected_lang
        }

    except Exception as e:
        print(f"Error processing voice: {e}")
        error_message = "Sorry, I encountered an error while processing your voice input. Please try again."
        error_audio = generate_audio_response(error_message, "en")
        return {
            "error": str(e),
            "text_response": error_message,
            "audio_file_path": error_audio,
            "detected_language": "en"
        }
    finally:
        # Clean up temporary file
        try:
            os.unlink(temp_file.name)
        except Exception as e:
            print(f"Error removing temp file: {e}")

@app.post("/chat")
async def chat(query: QueryModel):
    """Handle text-based chat queries."""
    try:
        print(f"Received query: {query.message}")  # Check the received query
        detected_lang = detect_language(query.message)
        docs = retriever.get_relevant_documents(query.message)
        print(f"Retrieved documents: {docs}")  # Check retrieved documents
        response_text = docs[0].page_content if docs else "Sorry, I couldn't find an answer."

        # Translate response if needed
        if detected_lang == 'hi':
            try:
                response_text = GoogleTranslator(source='auto', target='hi').translate(response_text)
            except Exception as e:
                print(f"Translation error: {e}")
                detected_lang = 'en'

        # Generate audio response
        audio_filename = generate_audio_response(response_text, detected_lang)

        return {
            "text_response": response_text,
            "audio_file_path": audio_filename,
            "detected_language": detected_lang
        }
    except Exception as e:
        print(f"Error in chat: {e}")
        error_message = "Sorry, I encountered an error. Please try again."
        error_audio = generate_audio_response(error_message, "en")
        return {
            "error": str(e),
            "text_response": error_message,
            "audio_file_path": error_audio,
            "detected_language": "en"
        }

@app.get("/audio/{filename}")
async def get_audio(filename: str):
    """Serve audio files."""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        return {"error": "Audio file not found"}
    return FileResponse(str(file_path))

def cleanup_audio_files():
    """Clean up old audio files."""
    try:
        current_time = time.time()
        for file in UPLOAD_DIR.glob("*.mp3"):
            # Remove files older than 1 hour
            if current_time - file.stat().st_mtime > 3600:
                file.unlink()
    except Exception as e:
        print(f"Error cleaning up audio files: {e}")

# Cleanup old audio files periodically
@app.on_event("startup")
async def startup_event():
    cleanup_audio_files()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)