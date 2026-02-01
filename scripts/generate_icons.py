import os
from PIL import Image, ImageDraw, ImageFont
import math

def create_icon(size, text, bg_color, text_color, is_maskable=False):
    """Erstellt ein einfaches Icon mit Text in der Mitte"""
    # Erstelle ein neues Bild mit transparentem Hintergrund
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Zeichne einen farbigen Kreis als Hintergrund
    if is_maskable:
        # Für maskierbare Icons: abgerundetes Quadrat
        radius = size * 0.2  # Eckenradius
        draw.rounded_rectangle([(0, 0), (size-1, size-1)], radius=radius, fill=bg_color)
    else:
        # Für normale Icons: Kreis
        draw.ellipse([(0, 0), (size-1, size-1)], fill=bg_color)
    
    # Füge Text hinzu (nur bei größeren Icons)
    if size >= 64:
        try:
            font_size = int(size * 0.4)
            font = ImageFont.truetype("arial.ttf", font_size)
            text_bbox = draw.textbbox((0, 0), text, font=font)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]
            position = ((size - text_width) // 2, (size - text_height) // 2)
            draw.text(position, text, font=font, fill=text_color)
        except:
            # Fallback, falls Schriftart nicht verfügbar
            pass
    
    return img

def generate_icons():
    # Farben für die Icons
    primary_color = (37, 99, 235)  # Blau aus dem Theme
    white = (255, 255, 255)
    
    # Erstelle das Ausgabeverzeichnis, falls es nicht existiert
    output_dir = os.path.join('mietrecht_agent', 'static', 'images', 'icons')
    os.makedirs(output_dir, exist_ok=True)
    
    # Standard-Icons
    sizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 384, 512]
    for size in sizes:
        # Normales Icon
        icon = create_icon(size, "JM", primary_color, white)
        icon.save(os.path.join(output_dir, f'icon-{size}x{size}.png'), 'PNG')
        
        # Maskierbares Icon
        maskable_icon = create_icon(size, "JM", primary_color, white, is_maskable=True)
        maskable_icon.save(os.path.join(output_dir, f'icon-maskable-{size}x{size}.png'), 'PNG')
    
    # Plus-Icon für Shortcuts
    plus_icon = create_icon(192, "+", primary_color, white, is_maskable=True)
    plus_icon.save(os.path.join(output_dir, 'plus-192x192.png'), 'PNG')
    
    print(f"Icons wurden erfolgreich in {output_dir} generiert!")

if __name__ == "__main__":
    generate_icons()
