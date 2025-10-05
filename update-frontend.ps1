# Quick Frontend Update Script

# After you get your Render backend URL, run these commands:

# 1. Update the environment file
# Replace 'YOUR_ACTUAL_RENDER_URL' with your real URL
$backendUrl = "https://gif-converter-backend-XXXX.onrender.com"

# Update the .env.production file
$envFile = "frontend/.env.production"
$content = @"
# Production environment - self-managed backend
# Replace this value with the HTTPS URL of your deployed backend API.
# Example: If your Render app is named 'gif-converter-backend', use:
# VITE_BACKEND_URL=https://gif-converter-backend.onrender.com
# 
# IMPORTANT: This MUST be an HTTPS URL for Vercel deployment to work
VITE_BACKEND_URL=$backendUrl
"@

Set-Content -Path $envFile -Value $content

Write-Host "✅ Updated frontend/.env.production with backend URL: $backendUrl"
Write-Host "📝 Next steps:"
Write-Host "   1. git add frontend/.env.production"
Write-Host "   2. git commit -m 'Update production backend URL'"
Write-Host "   3. git push origin main"
Write-Host "   4. Vercel will automatically redeploy your frontend"