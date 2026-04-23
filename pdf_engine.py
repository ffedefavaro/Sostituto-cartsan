from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io
import os

class PDFEngine:
    def __init__(self, templates_dir="templates"):
        self.templates_dir = templates_dir

    def fill_giudizio(self, data, output_path):
        template_path = os.path.join(self.templates_dir, "giudizio_template.pdf")
        
        if not os.path.exists(template_path):
            self._create_mock_template(template_path, "MODELLO: GIUDIZIO DI IDONEITA")

        reader = PdfReader(template_path)
        writer = PdfWriter()
        page = reader.pages[0]
        
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        can.setFont("Helvetica", 10)
        can.drawString(100, 650, f"Lavoratore: {data.get('nome')} {data.get('cognome')}")
        can.drawString(100, 630, f"Azienda: {data.get('azienda')}")
        can.drawString(100, 610, f"Mansione: {data.get('mansione')}")
        can.setFont("Helvetica-Bold", 12)
        can.drawString(100, 580, f"GIUDIZIO: {data.get('giudizio')}")
        can.setFont("Helvetica", 10)
        can.drawString(100, 560, f"Scadenza: {data.get('scadenza')}")
        can.save()
        
        packet.seek(0)
        new_pdf = PdfReader(packet)
        page.merge_page(new_pdf.pages[0])
        writer.add_page(page)
        
        with open(output_path, "wb") as f:
            writer.write(f)

    def _create_mock_template(self, path, title):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        c = canvas.Canvas(path, pagesize=letter)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(200, 750, title)
        c.save()
