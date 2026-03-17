import os
import sys
import subprocess

# Ensure Pillow (Python image library) is installed
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Installing Pillow...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image, ImageDraw, ImageFont

# Image dimensions for LINE Rich Menu (Large)
width, height = 2500, 843

# Colors - Warm orange theme for care taxi
bg_color = (255, 237, 213)      # Orange 50 (soft background)
border_color = (249, 115, 22)   # Orange (vibrant border)
text_color = (194, 65, 12)      # Dark Orange (readable text)

# Create new image
img = Image.new('RGB', (width, height), color=bg_color)
draw = ImageDraw.Draw(img)

# Draw decorative border
margin = 40
border_width = 20
draw.rectangle([margin, margin, width-margin, height-margin], outline=border_color, width=border_width)

# Main Text settings
text = "🚙 ご予約はこちら 🚙"

# Attempt to load a beautiful Japanese font, fallback step by step
font_paths = [
    r"C:\Windows\Fonts\meiryob.ttc",  # Meiryo Bold
    r"C:\Windows\Fonts\meiryo.ttc",   # Meiryo Regular
    r"C:\Windows\Fonts\YuGothB.ttc",  # Yu Gothic Bold
    r"C:\Windows\Fonts\msgothic.ttc"  # MS Gothic
]

font = None
font_size = 180

for path in font_paths:
    if os.path.exists(path):
        try:
            font = ImageFont.truetype(path, font_size)
            print(f"Loaded font: {path}")
            break
        except Exception as e:
            print(f"Could not load {path}: {e}")

if font is None:
    font = ImageFont.load_default()
    print("Warning: Could not find Japanese fonts. Text may not render correctly.")

# Get text bounds and draw main text centered
bbox = draw.textbbox((0, 0), text, font=font)
text_w = bbox[2] - bbox[0]
text_h = bbox[3] - bbox[1]

x = (width - text_w) / 2
y = (height - text_h) / 2 - 60

draw.text((x, y), text, fill=text_color, font=font)

# Sub Text settings
sub_text = "タップして予約フォームを開く"
sub_font_size = 80
sub_font = None

for path in font_paths:
    if os.path.exists(path):
        try:
            sub_font = ImageFont.truetype(path, sub_font_size)
            break
        except Exception:
            pass

if sub_font:
    bbox_sub = draw.textbbox((0, 0), sub_text, font=sub_font)
    sub_w = bbox_sub[2] - bbox_sub[0]
    sub_h = bbox_sub[3] - bbox_sub[1]
    
    sub_x = (width - sub_w) / 2
    sub_y = y + text_h + 100
    draw.text((sub_x, sub_y), sub_text, fill=border_color, font=sub_font)

# Outline/Button shadow effect (optional nice touch)
btn_margin_x = x - 150
btn_margin_y = y - 50
btn_width = text_w + 300
btn_height = text_h + sub_h + 180
# draw.rounded_rectangle([btn_margin_x, btn_margin_y, btn_margin_x+btn_width, btn_margin_y+btn_height], radius=40, outline=border_color, width=10)


# Save image to desktop project folder
output_path = r"c:\Users\asata\OneDrive\Desktop\∴Antigravity∴\LINE予約フォーム\rich_menu_image.png"
img.save(output_path)

print(f"\n=============================================")
print(f"SUCCESS! Image generated at: \n{output_path}")
print(f"=============================================\n")
