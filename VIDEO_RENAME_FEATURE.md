# Video Segment Rename Feature 🏷️

## Overview
You can now rename your split video segments for better organization! This is perfect for organizing clips with meaningful names like "Intro", "Hook", "Outro", "Main Content", etc.

## How to Use

### 1. **Split Your Video**
- Upload a video file
- Choose your segment duration or custom segments  
- Click "Split video"

### 2. **Rename Segments**
- After splitting, each video segment will show its default name (e.g., "segment_1", "segment_2")
- **Click on any segment name** to start editing
- Type your new name (e.g., "Intro", "Product Demo", "Call to Action")
- Press **Enter** to save or **Escape** to cancel
- The file will be automatically renamed on your computer

### 3. **Features**
- ✅ **Real-time renaming** - Files are instantly renamed in the temp directory
- ✅ **Input validation** - Invalid characters are automatically removed
- ✅ **Duplicate prevention** - Won't allow duplicate names in the same folder
- ✅ **Auto-save** - Click outside the input field to save automatically
- ✅ **Visual feedback** - Clear save/cancel buttons and loading states

## Example Workflow
1. Upload a 10-minute video
2. Split into 2-minute segments  
3. Rename segments:
   - `segment_1` → `Intro`
   - `segment_2` → `Product Overview`
   - `segment_3` → `Features Demo`
   - `segment_4` → `Testimonials`
   - `segment_5` → `Call to Action`
4. Download with organized names!

## Benefits
- 📁 **Better Organization** - Keep your video clips organized with meaningful names
- 🎬 **Content Creation** - Perfect for creating reels, shorts, and stories
- 💼 **Professional Workflow** - Organize clips by purpose (intro, hook, outro)
- 🔍 **Easy Identification** - Quickly find the clip you need

## Tips
- Use descriptive names like "Hook_30sec", "Product_Demo", "Outro_CTA"
- Avoid special characters (`<>:"/\\|?*`) as they'll be automatically removed
- Names are case-sensitive, so "Intro" and "intro" are different
- The original file extension (.mp4) is preserved automatically

## Technical Details
- Files are renamed in the temporary directory where segments are stored
- Original video file remains unchanged
- Renaming happens immediately when you save the new name
- Invalid filename characters are automatically sanitized