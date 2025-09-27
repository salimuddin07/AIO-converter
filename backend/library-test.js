// Library test script
console.log('Testing key libraries...\n');

async function testLibraries() {
    const results = [];
    
    // Test Sharp
    try {
        const sharp = await import('sharp');
        console.log('✅ Sharp: Working');
        results.push({ lib: 'Sharp', status: 'OK' });
    } catch (e) {
        console.log('❌ Sharp: Failed -', e.message);
        results.push({ lib: 'Sharp', status: 'FAILED', error: e.message });
    }
    
    // Test FFmpeg
    try {
        const ffmpeg = await import('fluent-ffmpeg');
        const ffmpegStatic = await import('ffmpeg-static');
        console.log('✅ FFmpeg: Working');
        results.push({ lib: 'FFmpeg', status: 'OK' });
    } catch (e) {
        console.log('❌ FFmpeg: Failed -', e.message);
        results.push({ lib: 'FFmpeg', status: 'FAILED', error: e.message });
    }
    
    // Test Canvas
    try {
        const { createCanvas } = await import('canvas');
        const canvas = createCanvas(100, 100);
        console.log('✅ Canvas: Working');
        results.push({ lib: 'Canvas', status: 'OK' });
    } catch (e) {
        console.log('❌ Canvas: Failed -', e.message);
        results.push({ lib: 'Canvas', status: 'FAILED', error: e.message });
    }
    
    // Test Jimp
    try {
        const Jimp = await import('jimp');
        console.log('✅ Jimp: Working');
        results.push({ lib: 'Jimp', status: 'OK' });
    } catch (e) {
        console.log('❌ Jimp: Failed -', e.message);
        results.push({ lib: 'Jimp', status: 'FAILED', error: e.message });
    }
    
    // Test WebP Service (with Sharp fallback)
    try {
        const WebPService = (await import('./src/services/WebPService.js')).default;
        const webpService = new WebPService();
        await webpService.ensureWebPAvailable();
        console.log('✅ WebP Service: Working (Sharp fallback)');
        results.push({ lib: 'WebP Service', status: 'OK' });
    } catch (e) {
        console.log('❌ WebP Service: Failed -', e.message);
        results.push({ lib: 'WebP Service', status: 'FAILED', error: e.message });
    }
    
    // Test GIF libraries
    try {
        const GifEncoder = await import('gif-encoder-2');
        console.log('✅ GIF Encoder: Working');
        results.push({ lib: 'GIF Encoder', status: 'OK' });
    } catch (e) {
        console.log('❌ GIF Encoder: Failed -', e.message);
        results.push({ lib: 'GIF Encoder', status: 'FAILED', error: e.message });
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    const passed = results.filter(r => r.status === 'OK').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
        console.log('\nFailed libraries:');
        results.filter(r => r.status === 'FAILED').forEach(r => {
            console.log(`- ${r.lib}: ${r.error}`);
        });
    }
}

testLibraries().catch(console.error);