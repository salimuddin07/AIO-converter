# AIO Converter Icon Resources

## Required Icons for Windows Build

### 1. Application Icon (icon.ico)
- **Location**: `build/icon.ico`
- **Format**: ICO file containing multiple sizes
- **Recommended sizes**: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
- **Purpose**: Used for the application executable and installer

### 2. PNG Icon (icon.png)
- **Location**: `build/icon.png` and `public/icon.png`
- **Format**: PNG with transparency
- **Size**: 512x512 or 1024x1024
- **Purpose**: Used for taskbar, notifications, and as source for ICO conversion

### 3. Installer Graphics (Optional but Recommended)

#### Installer Header
- **Location**: `build/installerHeader.bmp`
- **Format**: BMP (24-bit)
- **Size**: 150 x 57 pixels
- **Purpose**: Header image shown in NSIS installer

#### Installer Sidebar
- **Location**: `build/installerSidebar.bmp`
- **Format**: BMP (24-bit)
- **Size**: 164 x 314 pixels
- **Purpose**: Sidebar image shown in NSIS installer

## Creating Icons

### Method 1: Using Online Tools
1. Visit: https://icoconvert.com/
2. Upload your PNG logo (512x512 recommended)
3. Select multiple sizes: 16, 32, 48, 64, 128, 256
4. Download the generated .ico file
5. Save to `build/icon.ico`

### Method 2: Using ImageMagick (if installed)
```bash
# Convert PNG to multi-size ICO
magick convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### Method 3: Using GIMP
1. Open your PNG in GIMP
2. File → Export As
3. Change extension to .ico
4. Select all sizes in the dialog
5. Export

## Placeholder Icon Creation

If you don't have a custom icon yet, you can create a simple placeholder:

1. Create a 512x512 PNG with your app's initials "AIO"
2. Use a gradient or solid color background
3. Convert to ICO using one of the methods above

## File Structure

```
build/
  ├── icon.ico              (Required - Application icon)
  ├── icon.png              (Required - Source PNG)
  ├── installerHeader.bmp   (Optional - Installer header)
  ├── installerSidebar.bmp  (Optional - Installer sidebar)
  └── installer.nsh         (Auto-generated - NSIS script)

public/
  └── icon.png              (Required - Runtime icon)
```

## Notes

- ICO files should contain multiple sizes for best Windows compatibility
- PNG icons should have transparent backgrounds
- BMP files for installer should NOT have transparency
- All icons should maintain consistent branding/design

## Quick Setup

If you want to use a temporary icon to test the build:

1. Create any 256x256 PNG image
2. Name it `icon.png`
3. Place in both `build/` and `public/` directories
4. Use an online converter to create `icon.ico`
5. Build will work even without the BMP installer graphics

## Recommended Design Guidelines

- Use simple, recognizable symbols
- Ensure icon is visible at small sizes (16x16)
- Use high contrast for better visibility
- Keep design consistent with app theme
- Consider Windows 11 design language (rounded corners, depth)
