from PIL import Image, ImageDraw, ImageFont

def update_feature_graphic_smaller_text():
    source_icon_path = r"f:\JurisMind\Mietrecht\mietrecht_agent\static\images\play_store\icon-512x512.png"
    target_path = r"f:\JurisMind\Mietrecht\mietrecht_agent\static\images\play_store\feature-graphic.png"
    
    # Farben definieren
    # SmartLaw (Kräftiges Blau)
    COLOR_SMARTLAW = (24, 119, 242) # #1877F2
    # Agent (Helles Cyan/Türkis)
    COLOR_AGENT = (0, 180, 216)     # #00B4D8
    # Slogan (Dunkleres Grau-Blau)
    COLOR_SLOGAN = (50, 70, 100)
    
    # Hintergrund (Sehr helles Grau/Weiß)
    BG_COLOR = (248, 249, 250)
    
    print(f"Lade Icon von: {source_icon_path}")
    
    try:
        with Image.open(source_icon_path) as icon:
            try:
                bg_icon = icon.getpixel((0, 0))
                if len(bg_icon) == 4 and bg_icon[3] == 0:
                     FINAL_BG = BG_COLOR
                else:
                     FINAL_BG = BG_COLOR 
            except:
                FINAL_BG = BG_COLOR

            # Feature Graphic erstellen (1024x500)
            feature = Image.new("RGBA", (1024, 500), FINAL_BG)
            
            # Icon skalieren und links platzieren
            # Icon etwas kleiner, da Text auch kleiner wird? Nein, Icon darf präsent bleiben.
            # Lassen wir es bei 380x380
            icon_resized = icon.resize((380, 380), Image.Resampling.LANCZOS)
            
            feature.paste(icon_resized, (60, 60), mask=icon_resized if icon_resized.mode=='RGBA' else None)
            
            # Text hinzufügen
            draw = ImageDraw.Draw(feature)
            
            try:
                # SCHRIFTGRÖSSE VERKLEINERT: 70 -> 55
                font_title = ImageFont.truetype("arialbd.ttf", 55)
                # Slogan angepasst: 36 -> 30
                font_slogan = ImageFont.truetype("arial.ttf", 30)
            except:
                font_title = ImageFont.load_default()
                font_slogan = ImageFont.load_default()
            
            # Start-X-Position für Text (rechts neben dem Icon)
            text_start_x = 480
            # Y-Position etwas anpassen, damit es vertikal gut zum Icon passt
            text_y_title = 180 # War 160, etwas tiefer da Schrift kleiner
            
            # "SmartLaw" zeichnen
            text1 = "SmartLaw"
            draw.text((text_start_x, text_y_title), text1, font=font_title, fill=COLOR_SMARTLAW)
            
            # Breite messen
            try:
                l, t, r, b = draw.textbbox((0, 0), text1, font=font_title)
                w1 = r - l
            except:
                w1, h1 = draw.textsize(text1, font=font_title)
                
            # " Agent" zeichnen
            text2 = " Agent"
            draw.text((text_start_x + w1, text_y_title), text2, font=font_title, fill=COLOR_AGENT)
            
            # Slogan zeichnen
            slogan = "Ihr KI-Mietrechtsexperte"
            # Abstand etwas verringern, da Schrift kleiner
            draw.text((text_start_x + 5, text_y_title + 70), slogan, font=font_slogan, fill=COLOR_SLOGAN)
            
            feature.save(target_path, "PNG")
            print(f"Feature Graphic aktualisiert: {target_path}")
            
    except Exception as e:
        print(f"Fehler: {e}")

if __name__ == "__main__":
    update_feature_graphic_smaller_text()
