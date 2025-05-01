import os
import json
import pytesseract
import re
from PIL import Image, ImageEnhance
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from pymongo import MongoClient

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173", "allow_headers": ["Content-Type"]}})

# Ensure the uploads directory exists
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Connect to MongoDB
CENTRAL_DATA = []  # Initialize at the top

try:
    mongo_client = MongoClient('mongodb+srv://komalvsingh:komal717@cluster0.zodvc.mongodb.net')
    db = mongo_client['landrecords']
    property_collection = db['verified_properties']
    print("Connected to MongoDB successfully")
except Exception as e:
    print(f"Error connecting to MongoDB: {str(e)}")
    # Fallback to JSON if MongoDB connection fails
    try:
        with open("centraldata.json", "r") as file:
            CENTRAL_DATA = json.load(file)
    except FileNotFoundError:
        print("Warning: centraldata.json not found. Creating empty database.")
        CENTRAL_DATA = []
        with open("centraldata.json", "w") as file:
            json.dump(CENTRAL_DATA, file)

# Set Tesseract path (adjust for your OS)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Improved OCR function with image preprocessing
def extract_text_from_image(image_path):
    # Open the image
    image = Image.open(image_path)
    
    # Convert to grayscale
    image = image.convert('L')
    
    # Enhance contrast
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(2)
    
    # Configure Tesseract for document OCR
    custom_config = r'--oem 3 --psm 6 -l eng'
    
    # Extract text
    text = pytesseract.image_to_string(image, config=custom_config)
    print("Extracted Text from Image:", text)
    
    return text.strip()

# Improved parsing function designed specifically for real estate deed format
def parse_text_to_json(text):
    extracted_data = {}
    
    # Extract contract title
    title_match = re.search(r"SALE DEED FOR IMMOVABLE PROPERTY", text, re.IGNORECASE)
    if title_match:
        extracted_data["contractTitle"] = "SALE DEED FOR IMMOVABLE PROPERTY"
    
    # Extract date - updated pattern to match "THIS DEED OF SALE is made on this 15th day of February, 2025"
    date_match = re.search(r"(?:THIS DEED OF SALE is|made on this) (\d+)(?:st|nd|rd|th)? day of (\w+),? (\d{4})", text, re.IGNORECASE)
    if date_match:
        day = date_match.group(1)
        month = date_match.group(2)
        year = date_match.group(3)
        extracted_data["date"] = f"{day}/{month}/{year}"
    else:
        # Fallback date pattern
        date_match = re.search(r"Date: (\d{2}/\d{2}/\d{4})", text)
        if date_match:
            extracted_data["date"] = date_match.group(1)
        else:
            extracted_data["date"] = "UNKNOWN"
    
    # Extract seller info
    seller_section = re.search(r"Seller:[\s\n]*([^,\n]+)(?:,|[\r\n])+\s*Residing at:[\s\n]*([^\n]+)(?:[\r\n])+\s*Aadhaar:[\s\n]*(\d{4}\s?\d{4}\s?\d{4})", text, re.IGNORECASE)
    
    if seller_section:
        seller_name = seller_section.group(1).strip()
        seller_address = seller_section.group(2).strip()
        seller_aadhaar = seller_section.group(3).replace(" ", "")
    else:
        # Fallback patterns
        seller_name_match = re.search(r"Seller:[\s\n]*([^\n,]+)", text, re.IGNORECASE)
        seller_name = seller_name_match.group(1).strip() if seller_name_match else ""
        
        seller_address_match = re.search(r"Residing at:[\s\n]*([^\n]+)(?:[\r\n])+\s*Aadhaar:", text, re.IGNORECASE)
        seller_address = seller_address_match.group(1).strip() if seller_address_match else ""
        
        seller_aadhaar_match = re.search(r"Aadhaar:[\s\n]*(\d{4}\s?\d{4}\s?\d{4})", text, re.IGNORECASE)
        seller_aadhaar = seller_aadhaar_match.group(1).replace(" ", "") if seller_aadhaar_match else ""
    
    # Extract buyer info
    buyer_section = re.search(r"Buyer:[\s\n]*([^,\n]+)(?:,|[\r\n])+\s*Residing at:[\s\n]*([^\n]+)(?:[\r\n])+\s*Aadhaar:[\s\n]*(\d{4}\s?\d{4}\s?\d{4})", text, re.IGNORECASE)
    
    if buyer_section:
        buyer_name = buyer_section.group(1).strip()
        buyer_address = buyer_section.group(2).strip()
        buyer_aadhaar = buyer_section.group(3).replace(" ", "")
    else:
        # Fallback patterns
        buyer_name_match = re.search(r"Buyer:[\s\n]*([^\n,]+)", text, re.IGNORECASE)
        buyer_name = buyer_name_match.group(1).strip() if buyer_name_match else ""
        
        buyer_address_match = re.search(r"Buyer:.*?Residing at:[\s\n]*([^\n]+)(?:[\r\n])+\s*Aadhaar:", text, re.IGNORECASE)
        buyer_address = buyer_address_match.group(1).strip() if buyer_address_match else ""
        
        buyer_aadhaar_match = re.search(r"Buyer:.*?Aadhaar:[\s\n]*(\d{4}\s?\d{4}\s?\d{4})", text, re.IGNORECASE)
        buyer_aadhaar = buyer_aadhaar_match.group(1).replace(" ", "") if buyer_aadhaar_match else ""
    
    extracted_data["parties"] = {
        "seller": {
            "name": seller_name,
            "address": seller_address,
            "aadhaar": seller_aadhaar
        },
        "buyer": {
            "name": buyer_name,
            "address": buyer_address,
            "aadhaar": buyer_aadhaar
        }
    }
    
    # Extract property details
    # Improved patterns with more flexibility
    survey_match = re.search(r"Survey(?:\sNumber)?[:\s]+(\d+)", text, re.IGNORECASE)
    plot_match = re.search(r"Plot(?:\sNumber)?[:\s]+(\d+)", text, re.IGNORECASE)
    area_match = re.search(r"Total(?:\sArea)?[:\s]+(\d+(?:\.\d+)?)\s*(?:sq\.?m|sqm)", text, re.IGNORECASE)
    location_match = re.search(r"Location[:\s]+([^\n]+)", text, re.IGNORECASE)
    
    extracted_data["propertyDetails"] = {
        "surveyNumber": survey_match.group(1) if survey_match else "",
        "plotNumber": plot_match.group(1) if plot_match else "",
        "area": area_match.group(1) + " sqm" if area_match else "",
        "location": location_match.group(1).strip() if location_match else ""
    }
    
    # Extract sale consideration
    amount_match = re.search(r"Sale(?:\sConsideration)?[:\s]+(?:₹|Rs\.?)?\s*([0-9,.]+)", text, re.IGNORECASE)
    payment_method_match = re.search(r"Payment(?:\sMethod)?[:\s]+([^\n]+)", text, re.IGNORECASE)
    transaction_id_match = re.search(r"Transaction(?:\sID)?[:\s]+([A-Z0-9]+)", text, re.IGNORECASE)
    
    if amount_match:
        # Handle different number formats (1,25,00,000 or 12500000)
        amount_str = amount_match.group(1).replace(",", "").replace(".", "")
        # Try to convert to numeric
        try:
            numeric_amount = float(amount_str)
        except ValueError:
            numeric_amount = 0
    else:
        numeric_amount = 0
        
    extracted_data["saleConsideration"] = {
        "amount": str(numeric_amount),
        "paymentMethod": payment_method_match.group(1).strip() if payment_method_match else "",
        "transactionId": transaction_id_match.group(1).strip() if transaction_id_match else ""
    }
    
    # Extract ownership transfer
    transfer_match = re.search(r"OWNERSHIP TRANSFER[:\s]*(.+?)(?:SIGNATURES|$)", text, re.DOTALL | re.IGNORECASE)
    if transfer_match:
        transfer_text = transfer_match.group(1).strip()
        extracted_data["ownershipTransfer"] = "Yes" if "full ownership" in transfer_text.lower() else "No"
    else:
        extracted_data["ownershipTransfer"] = "Yes" if "transfers full ownership" in text.lower() else "No"
    
    # Extract registration number if available
    registration_match = re.search(r"Registration(?:\sNo[.:])?\s*([A-Z0-9-]+)", text, re.IGNORECASE)
    if registration_match:
        extracted_data["registrationNo"] = registration_match.group(1).strip()
    
    # Generate a contract ID if not found
    if "registrationNo" in extracted_data:
        extracted_data["contractId"] = extracted_data["registrationNo"]
    else:
        extracted_data["contractId"] = "SD" + extracted_data["date"].replace("/", "") if "date" in extracted_data else "UNKNOWN"
    
    # Extract witness information
    witnesses = []
    witness_pattern = re.compile(r"Witness\s*\d+:\s*([^\n]+)", re.IGNORECASE)
    for match in witness_pattern.finditer(text):
        witnesses.append(match.group(1).strip())
    
    if witnesses:
        extracted_data["witnesses"] = witnesses
    
    return extracted_data

# Improved fraud detection function
def check_fraud(extracted_data):
    fraud_indicators = 0
    total_indicators = 5  # Increased number of indicators for more precision
    findings = []
    
    print("Extracted Data for Fraud Check:", extracted_data)
    
    # Ensure extracted_data is a dictionary
    if not isinstance(extracted_data, dict):
        raise TypeError("extracted_data must be a dictionary")
    
    # Check against central database (MongoDB or JSON)
    valid_property = False
    current_owner = ""
    
    try:
        # Try MongoDB first
        query = {
            "propertyDetails.surveyNumber": extracted_data.get("propertyDetails", {}).get("surveyNumber"),
            "propertyDetails.plotNumber": extracted_data.get("propertyDetails", {}).get("plotNumber")
        }
        record = property_collection.find_one(query)
        
        if record:
            valid_property = True
            current_owner = record.get("parties", {}).get("buyer", {}).get("name", "")
            
            # Check if seller is the current owner
            if current_owner and current_owner != extracted_data.get("parties", {}).get("seller", {}).get("name"):
                fraud_indicators += 1
                findings.append(f"Seller '{extracted_data.get('parties', {}).get('seller', {}).get('name')}' does not match current owner '{current_owner}' in records")
    except Exception as mongo_error:
        print(f"MongoDB check failed: {str(mongo_error)}")
        # Fallback to JSON if MongoDB check fails
        for record in CENTRAL_DATA:
            if not isinstance(record, dict):
                continue
            
            # Check if property details match
            if (record.get("propertyDetails", {}).get("surveyNumber") == extracted_data.get("propertyDetails", {}).get("surveyNumber") and
                record.get("propertyDetails", {}).get("plotNumber") == extracted_data.get("propertyDetails", {}).get("plotNumber")):
                valid_property = True
                current_owner = record.get("parties", {}).get("buyer", {}).get("name", "")
                
                # Check if seller is the current owner
                if current_owner and current_owner != extracted_data.get("parties", {}).get("seller", {}).get("name"):
                    fraud_indicators += 1
                    findings.append(f"Seller '{extracted_data.get('parties', {}).get('seller', {}).get('name')}' does not match current owner '{current_owner}' in records")
                break
    
    # Check for empty database case
    try:
        empty_db = property_collection.count_documents({}) == 0
    except:
        empty_db = len(CENTRAL_DATA) == 0
    
    if not valid_property and not empty_db:
        fraud_indicators += 1
        findings.append("Property details don't match any records in the database")
    
    # Check for incomplete document
    missing_fields = []
    
    if not extracted_data.get("parties", {}).get("seller", {}).get("name"):
        missing_fields.append("Seller name")
        
    if not extracted_data.get("parties", {}).get("buyer", {}).get("name"):
        missing_fields.append("Buyer name")
        
    if not extracted_data.get("propertyDetails", {}).get("surveyNumber"):
        missing_fields.append("Survey number")
        
    if not extracted_data.get("propertyDetails", {}).get("plotNumber"):
        missing_fields.append("Plot number")
        
    if missing_fields:
        fraud_indicators += len(missing_fields) * 0.25  # 0.25 points per missing field
        findings.append(f"Document is incomplete: Missing {', '.join(missing_fields)}")
    
    # Check for invalid Aadhaar numbers (must be 12 digits)
    seller_aadhaar = extracted_data.get("parties", {}).get("seller", {}).get("aadhaar", "")
    buyer_aadhaar = extracted_data.get("parties", {}).get("buyer", {}).get("aadhaar", "")
    
    if seller_aadhaar and not re.match(r"^\d{12}$", seller_aadhaar):
        fraud_indicators += 0.5
        findings.append(f"Seller Aadhaar format is invalid: {seller_aadhaar}")
    
    if buyer_aadhaar and not re.match(r"^\d{12}$", buyer_aadhaar):
        fraud_indicators += 0.5
        findings.append(f"Buyer Aadhaar format is invalid: {buyer_aadhaar}")
    
    # Check for invalid sale consideration
    sale_amount = extracted_data.get("saleConsideration", {}).get("amount", "")
    if sale_amount:
        try:
            sale_amount_value = float(sale_amount)
            if sale_amount_value < 100000:  # Less than 1 lakh
                fraud_indicators += 0.5
                findings.append(f"Unusually low property value: {sale_amount_value}")
            elif sale_amount_value > 100000000:  # More than 10 crore
                fraud_indicators += 0.5
                findings.append(f"Unusually high property value: {sale_amount_value}")
        except ValueError:
            fraud_indicators += 0.5
            findings.append("Cannot parse sale amount")
    
    # Check for invalid date
    if extracted_data.get("date", "") == "UNKNOWN":
        fraud_indicators += 0.5
        findings.append("Invalid or missing date")
    
    # Calculate risk score (inverse of fraud indicators)
    risk_score = max(0, 100 - int((fraud_indicators / total_indicators) * 100))
    
    # Determine status based on risk score
    if risk_score < 50:
        status = "Potentially Fraudulent"
    elif risk_score < 75:
        status = "Suspicious"
    else:
        status = "Likely Genuine"
    
    return {
        "status": status,
        "risk_score": risk_score,
        "findings": findings,
        "ai_analysis": "Document appears to be a sale deed for property transfer. " + (
            "Potential issues identified: " + ", ".join(findings) + "." if findings else "No obvious issues detected in the document structure."
        ),
        "extracted_data": extracted_data
    }

@app.route("/upload", methods=["POST"])
def upload_document():
    print("Upload endpoint called")
    print("Files in request:", request.files)  # Debugging: Check all files in the request
    
    # Check if the post request has the file part - handle both 'document' and 'file' field names
    file = None
    if "document" in request.files:
        file = request.files["document"]
    elif "file" in request.files:
        file = request.files["file"]
    
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    if file.filename == "":
        return jsonify({"error": "Empty file uploaded"}), 400

    # Generate safe filename
    filename = secure_filename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    
    try:
        file.save(file_path)  # Saves to project_root/uploads/filename
        print(f"File saved to {file_path}")
        
        extracted_text = extract_text_from_image(file_path)
        
        if not extracted_text:
            return jsonify({
                "error": "Could not extract text from image",
                "suggestion": "Please ensure the document is clear and properly formatted"
            }), 400
            
        extracted_data = parse_text_to_json(extracted_text)
        
        # Check if we have at least some basic data
        if not extracted_data.get("contractTitle"):
            return jsonify({
                "error": "Could not extract sufficient data from document", 
                "extracted_text": extracted_text,
                "partial_data": extracted_data
            }), 400
        
        fraud_check = check_fraud(extracted_data)
        
        # Format the response to match what the React component expects
        return jsonify({
            "verification_result": {
                "status": fraud_check["status"],
                "risk_score": fraud_check["risk_score"],
                "findings": fraud_check["findings"]
            },
            "extracted_data": fraud_check["extracted_data"]
        })
    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        return jsonify({
            "error": f"Error processing document: {str(e)}",
            "traceback": traceback_str,
            "suggestion": "Please ensure the document is clear and properly formatted"
        }), 500

# Updated to save to MongoDB
@app.route("/verify-and-save", methods=["POST"])
def verify_and_save():
    data = request.json
    if not data or not isinstance(data, dict):
        return jsonify({"error": "Invalid data format"}), 400
    
    try:
        # Add timestamp
        from datetime import datetime
        data['timestamp'] = datetime.now()
        
        # Try to save to MongoDB
        result = property_collection.insert_one(data)
        
        return jsonify({
            "status": "success", 
            "message": "Document verified and saved to MongoDB database",
            "document_id": str(result.inserted_id)
        })
    except Exception as e:
        # Fallback to JSON if MongoDB fails
        try:
            global CENTRAL_DATA
            # Add the verified document to central database
            CENTRAL_DATA.append(data)
            
            # Save updated database
            with open("centraldata.json", "w") as file:
                json.dump(CENTRAL_DATA, file, indent=2)
            
            return jsonify({
                "status": "success", 
                "message": "Document verified and saved to JSON database (MongoDB failed)",
                "error": str(e)
            })
        except Exception as json_error:
            return jsonify({
                "error": f"Failed to save document: {str(json_error)}",
                "mongodb_error": str(e)
            }), 500

if __name__ == "__main__":
    app.run(debug=True)