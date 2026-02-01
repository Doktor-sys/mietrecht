import os
from PIL import Image, ImageDraw, ImageFont, ImageColor
import textwrap

def create_screenshot(width, height, title, description, screenshot_number):
    """Erstellt einen Screenshot mit einem Titel und einer Beschreibung"""
    # Erstelle ein neues Bild mit weißem Hintergrund
    img = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(img)
    
    # Lade eine Schriftart (falls verfügbar)
    try:
        font_large = ImageFont.truetype("arial.ttf", 40)
        font_medium = ImageFont.truetype("arial.ttf", 24)
    except:
        # Fallback auf Standardschriftart
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
    
    # Hintergrundfarbe für den Header
    header_color = ImageColor.getrgb('#2563eb')
    draw.rectangle([0, 0, width, 100], fill=header_color)
    
    # Titel hinzufügen
    title_color = 'white'
    title_x = 20
    title_y = 20
    draw.text((title_x, title_y), title, font=font_large, fill=title_color)
    
    # Screenshot-Nummer hinzufügen
    draw.text((width - 100, 30), f"{screenshot_number}/5", font=font_medium, fill=title_color)
    
    # Platzhalter für den Screenshot-Inhalt
    content_box = [50, 150, width - 50, height - 200]
    draw.rectangle(content_box, outline='#cccccc', width=2)
    
    # Beschreibung hinzufügen
    description_lines = textwrap.wrap(description, width=40)
    desc_y = content_box[1] + 20
    for line in description_lines:
        draw.text((content_box[0] + 20, desc_y), line, font=font_medium, fill='black')
        desc_y += 30
    
    # Footer mit App-Name
    footer_y = height - 50
    draw.text((width // 2 - 50, footer_y), "JurisMind", font=font_medium, fill='#666666')
    
    return img

def generate_screenshots():
    # Erstelle das Ausgabeverzeichnis, falls es nicht existiert
    output_dir = os.path.join('mietrecht_agent', 'static', 'images', 'screenshots')
    os.makedirs(output_dir, exist_ok=True)
    
    # Definition der Screenshots mit Titel und Beschreibung
    screenshots = [
        {
            'title': 'Startseite',
            'description': 'Willkommen bei JurisMind - Ihrem intelligenten Rechtsassistenten für Mietrecht.'
        },
        {
            'title': 'Rechtsberatung',
            'description': 'Erhalten Sie sofortige Rechtsberatung zu Ihrem Mietrechtsfall.'
        },
        {
            'title': 'Dokumente verwalten',
            'description': 'Verwalten Sie Ihre Mietverträge und Korrespondenz an einem Ort.'
        },
        {
            'title': 'Benachrichtigungen',
            'description': 'Bleiben Sie über wichtige Fristen und Updates informiert.'
        },
        {
            'title': 'Einstellungen',
            'description': 'Passen Sie JurisMind an Ihre Bedürfnisse an.'
        }
    ]
    
    # Standardgrößen für Screenshots (Breite x Höhe)
    sizes = [
        (1080, 1920),  # Standard Smartphone (Portrait)
        (1080, 1920),  # Zusätzlicher Screenshot
        (1080, 1920),  # Zusätzlicher Screenshot
        (1080, 1920),  # Zusätzlicher Screenshot
        (1080, 1920)   # Zusätzlicher Screenshot
    ]
    
    # Generiere die Screenshots
    for i, (size, screenshot) in enumerate(zip(sizes, screenshots), 1):
        img = create_screenshot(
            size[0], size[1],
            screenshot['title'],
            screenshot['description'],
            i
        )
        img.save(os.path.join(output_dir, f'screenshot{i}.png'), 'PNG')
    
    print(f"Screenshots wurden erfolgreich in {output_dir} generiert!")

if __name__ == "__main__":
    generate_screenshots()
