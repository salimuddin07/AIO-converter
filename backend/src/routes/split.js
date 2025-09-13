import { Router } from 'express';import { Router } from 'express';import { Router } from 'express';

import multer from 'multer';

import { tempDir } from '../utils/filePaths.js';import multer from 'multer';import multer from 'multer';



const router = Router();import path from 'path';import path from 'path';

const upload = multer({ dest: tempDir });

import fs from 'fs/promises';import fs from 'fs/promises';

router.post('/video', upload.single('video'), (req, res) => {

  res.json({ message: 'Video splitting coming soon' });import crypto from 'crypto';import crypto from 'crypto';

});

import { tempDir, outputDir } from '../utils/filePaths.js';import { tempDir, outputDir } from '../utils/filePaths.js';

router.post('/gif', upload.single('gif'), (req, res) => {

  res.json({ message: 'GIF splitting coming soon' });import VideoSplitterService from '../services/VideoSplitterService.js';

});

const router = Router();import SplitService from '../services/splitService.js';

router.get('/status/:jobId', (req, res) => {

  res.json({ status: 'pending', jobId: req.params.jobId });

});

// Simple storage configurationconst router = Router();

export default router;
const storage = multer.diskStorage({

  destination: async (req, file, cb) => {

    await fs.mkdir(tempDir, { recursive: true });

    cb(null, tempDir);// Create service instances

  },

  filename: (req, file, cb) => {const videoSplitterService = new VideoSplitterService();const VideoSplitterService = require('../services/VideoSplitterService');const fs = require('fs').promises;import fs from 'fs/promises';

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));const splitService = new SplitService();

  }

});const SplitService = require('../services/splitService');



const upload = multer({ // ============================================================================

  storage: storage,

  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit// MULTER CONFIGURATIONconst crypto = require('crypto');import { fileURLToPath } from 'url';

});

// ============================================================================

/**

 * @route POST /videoconst router = express.Router();

 * @desc Split video into segments

 */// Storage configuration for video files

router.post('/video', upload.single('video'), async (req, res) => {

  try {const videoStorage = multer.diskStorage({import { SplitService } from '../services/splitService.js';

    const { file } = req;

    if (!file) {  destination: async (req, file, cb) => {

      return res.status(400).json({ error: 'No video file uploaded' });

    }    await fs.mkdir(tempDir, { recursive: true });// Create service instances



    const jobId = crypto.randomBytes(16).toString('hex');    cb(null, tempDir);



    return res.json({  },const videoSplitterService = new VideoSplitterService();const VideoSplitterService = require('../services/VideoSplitterService');import VideoSplitterService from '../services/VideoSplitterService.js';

      success: true,

      jobId: jobId,  filename: (req, file, cb) => {

      message: 'Video splitting functionality will be restored soon',

      file: file.originalname    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);const splitService = new SplitService();

    });

    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));

  } catch (error) {

    console.error('Video splitting error:', error);  }const SplitService = require('../services/splitService');import { outputDir, tempDir } from '../utils/filePaths.js';

    return res.status(500).json({

      error: 'Video splitting failed',});

      message: error.message

    });// Output directory for split files

  }

});// Storage configuration for animated images



/**const imageStorage = multer.diskStorage({const outputDir = path.join(__dirname, '../../output');

 * @route POST /gif  

 * @desc Split GIF into frames  destination: async (req, file, cb) => {

 */

router.post('/gif', upload.single('gif'), async (req, res) => {    await fs.mkdir(tempDir, { recursive: true });

  try {

    const { file } = req;    cb(null, tempDir);

    if (!file) {

      return res.status(400).json({ error: 'No GIF file uploaded' });  },// Ensure output directory existsconst router = express.Router();const __filename = fileURLToPath(import.meta.url);

    }

  filename: (req, file, cb) => {

    const jobId = crypto.randomBytes(16).toString('hex');

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);fs.mkdir(outputDir, { recursive: true }).catch(console.error);

    return res.json({

      success: true,    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));

      jobId: jobId,

      message: 'GIF splitting functionality will be restored soon',  }const __dirname = path.dirname(__filename);

      file: file.originalname

    });});



  } catch (error) {// ============================================================================

    console.error('GIF splitting error:', error);

    return res.status(500).json({// File filters

      error: 'GIF splitting failed',

      message: error.messageconst videoFileFilter = (req, file, cb) => {// MULTER CONFIGURATION// Create services instances

    });

  }  const allowedMimes = [

});

    'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo',// ============================================================================

/**

 * @route GET /status/:jobId    'video/webm', 'video/ogg', 'video/3gpp', 'video/x-flv'

 * @desc Get splitting job status

 */  ];const videoSplitterService = new VideoSplitterService();const router = express.Router();

router.get('/status/:jobId', async (req, res) => {

  try {  

    const { jobId } = req.params;

      if (allowedMimes.includes(file.mimetype)) {// Storage configuration for video files

    return res.json({

      success: true,    cb(null, true);

      jobId: jobId,

      status: 'pending',  } else {const videoStorage = multer.diskStorage({const splitService = new SplitService();

      message: 'Splitting services are being restored'

    });    cb(new Error('Invalid file type. Only video files are allowed.'), false);



  } catch (error) {  }  destination: async (req, file, cb) => {

    console.error('Status check error:', error);

    return res.status(500).json({};

      error: 'Status check failed',

      message: error.message    const tempDir = path.join(__dirname, '../../temp');// Initialize services

    });

  }const imageFileFilter = (req, file, cb) => {

});

  const allowedMimes = ['image/gif', 'image/webp'];    await fs.mkdir(tempDir, { recursive: true });

export default router;
  

  if (allowedMimes.includes(file.mimetype)) {    cb(null, tempDir);// Output directory for split filesconst splitService = new SplitService();

    cb(null, true);

  } else {  },

    cb(new Error('Invalid file type. Only GIF and WebP files are allowed.'), false);

  }  filename: (req, file, cb) => {const outputDir = path.join(__dirname, '../../output');const videoSplitterService = new VideoSplitterService();

};

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

// Multer configurations

const uploadVideo = multer({    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));

  storage: videoStorage,

  fileFilter: videoFileFilter,  }

  limits: {

    fileSize: 500 * 1024 * 1024, // 500MB max for videos});// Ensure output directory exists// Configure multer for GIF/image uploads

    files: 1

  }

}).single('video');

// Storage configuration for animated imagesfs.mkdir(outputDir, { recursive: true }).catch(console.error);const imageStorage = multer.diskStorage({

const uploadImage = multer({

  storage: imageStorage,const imageStorage = multer.diskStorage({

  fileFilter: imageFileFilter,

  limits: {  destination: async (req, file, cb) => {  destination: async (req, file, cb) => {

    fileSize: 100 * 1024 * 1024, // 100MB max for animated images

    files: 1    const tempDir = path.join(__dirname, '../../temp');

  }

}).single('image');    await fs.mkdir(tempDir, { recursive: true });// ============================================================================    await fs.mkdir(tempDir, { recursive: true });



// ============================================================================    cb(null, tempDir);

// VIDEO SPLITTING ENDPOINTS

// ============================================================================  },// MULTER CONFIGURATION    cb(null, tempDir);



// Split video into segments  filename: (req, file, cb) => {

router.post('/video', (req, res) => {

  uploadVideo(req, res, async (err) => {    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);// ============================================================================  },

    let inputPath = null;

    let tempOutputDir = null;    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));

    

    try {  }  filename: (req, file, cb) => {

      // Handle upload errors

      if (err) {});

        if (err instanceof multer.MulterError) {

          if (err.code === 'LIMIT_FILE_SIZE') {// Storage configuration for video files    const uniqueName = `gif_${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;

            return res.status(413).json({ error: 'File too large. Maximum size is 500MB.' });

          }// File filters

          if (err.code === 'LIMIT_UNEXPECTED_FILE') {

            return res.status(400).json({ error: 'Unexpected field name. Use "video" field.' });const videoFileFilter = (req, file, cb) => {const videoStorage = multer.diskStorage({    cb(null, uniqueName);

          }

        }  const allowedMimes = [

        return res.status(400).json({ error: err.message });

      }    'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo',  destination: async (req, file, cb) => {  }

      

      // Validate file upload    'video/webm', 'video/ogg', 'video/3gpp', 'video/x-flv'

      if (!req.file) {

        return res.status(400).json({ error: 'No video file provided' });  ];    const tempDir = path.join(__dirname, '../../temp');});

      }

        

      inputPath = req.file.path;

        if (allowedMimes.includes(file.mimetype)) {    await fs.mkdir(tempDir, { recursive: true });

      // Parse and validate parameters

      const {    cb(null, true);

        segments = '[]',

        splitBy = 'manual',  } else {    cb(null, tempDir);const imageUpload = multer({ 

        sceneThreshold = '0.3',

        maxSegments = '50',    cb(new Error('Invalid file type. Only video files are allowed.'), false);

        outputFormat = 'mp4',

        quality = 'medium',  }  },  storage: imageStorage,

        resolution,

        frameRate};

      } = req.body;

        filename: (req, file, cb) => {  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB limit

      // Parse segments for manual splitting

      let parsedSegments = [];const imageFileFilter = (req, file, cb) => {

      try {

        parsedSegments = JSON.parse(segments);  const allowedMimes = ['image/gif', 'image/webp'];    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);  fileFilter: (req, file, cb) => {

      } catch (parseError) {

        return res.status(400).json({ error: 'Invalid segments format. Expected JSON array.' });  

      }

        if (allowedMimes.includes(file.mimetype)) {    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));    const allowedTypes = ['.gif', '.webp', '.apng', '.mng', '.avif', '.jxl'];

      // Validate split method

      if (!['manual', 'scenes'].includes(splitBy)) {    cb(null, true);

        return res.status(400).json({ error: 'Invalid splitBy value. Use "manual" or "scenes".' });

      }  } else {  }    const fileExt = path.extname(file.originalname).toLowerCase();

      

      // Validate manual segments    cb(new Error('Invalid file type. Only GIF and WebP files are allowed.'), false);

      if (splitBy === 'manual') {

        if (!Array.isArray(parsedSegments) || parsedSegments.length === 0) {  }});    if (allowedTypes.includes(fileExt)) {

          return res.status(400).json({ error: 'Segments array is required for manual splitting' });

        }};

        

        for (let i = 0; i < parsedSegments.length; i++) {      cb(null, true);

          const segment = parsedSegments[i];

          if (!segment.start || !segment.end || segment.start >= segment.end) {// Multer configurations

            return res.status(400).json({ 

              error: `Invalid segment ${i + 1}. Start and end times are required, and start must be less than end.` const uploadVideo = multer({// Storage configuration for animated images    } else {

            });

          }  storage: videoStorage,

        }

      }  fileFilter: videoFileFilter,const imageStorage = multer.diskStorage({      cb(new Error('Unsupported file type for GIF splitting. Please upload GIF, WebP, APNG, MNG, AVIF, or JXL files.'));

      

      // Validate scene detection parameters  limits: {

      const threshold = parseFloat(sceneThreshold);

      if (isNaN(threshold) || threshold < 0.1 || threshold > 1.0) {    fileSize: 500 * 1024 * 1024, // 500MB max for videos  destination: async (req, file, cb) => {    }

        return res.status(400).json({ error: 'Scene threshold must be between 0.1 and 1.0' });

      }    files: 1

      

      const maxSegs = parseInt(maxSegments);  }    const tempDir = path.join(__dirname, '../../temp');  }

      if (isNaN(maxSegs) || maxSegs < 1 || maxSegs > 100) {

        return res.status(400).json({ error: 'Max segments must be between 1 and 100' });}).single('video');

      }

          await fs.mkdir(tempDir, { recursive: true });});

      // Validate output format

      if (!['mp4', 'avi', 'webm', 'mov'].includes(outputFormat)) {const uploadImage = multer({

        return res.status(400).json({ error: 'Invalid output format. Use mp4, avi, webm, or mov.' });

      }  storage: imageStorage,    cb(null, tempDir);

      

      // Generate job ID  fileFilter: imageFileFilter,

      const jobId = crypto.randomUUID();

        limits: {  },// Configure multer for video uploads

      // Create output directory

      tempOutputDir = path.join(outputDir, `split_${jobId}`);    fileSize: 100 * 1024 * 1024, // 100MB max for animated images

      await fs.mkdir(tempOutputDir, { recursive: true });

          files: 1  filename: (req, file, cb) => {const videoStorage = multer.diskStorage({

      // Set up options

      const options = {  }

        outputFormat,

        quality,}).single('image');    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);  destination: async (req, file, cb) => {

        outputDir: tempOutputDir

      };

      

      if (resolution) {// ============================================================================    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));    await fs.mkdir(tempDir, { recursive: true });

        options.resolution = resolution;

      }// VIDEO SPLITTING ENDPOINTS

      

      if (frameRate) {// ============================================================================  }    cb(null, tempDir);

        options.frameRate = parseInt(frameRate);

      }

      

      // Start splitting process// Split video into segments});  },

      let splitPromise;

      router.post('/video', (req, res) => {

      if (splitBy === 'manual') {

        splitPromise = videoSplitterService.splitVideo(inputPath, parsedSegments, options);  uploadVideo(req, res, async (err) => {  filename: (req, file, cb) => {

      } else {

        splitPromise = videoSplitterService.splitVideoByScenes(inputPath, threshold, maxSegs, options);    let inputPath = null;

      }

          let tempDir = null;// File filter for videos    const uniqueName = `video_${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;

      // Return job information immediately

      res.json({    

        success: true,

        jobId,    try {const videoFileFilter = (req, file, cb) => {    cb(null, uniqueName);

        message: 'Video splitting started',

        status: 'processing',      // Handle upload errors

        splitBy,

        totalSegments: splitBy === 'manual' ? parsedSegments.length : null,      if (err) {  const allowedMimes = [  }

        statusUrl: `/api/split/video/status/${jobId}`,

        downloadUrl: `/api/split/video/download-all/${jobId}`        if (err instanceof multer.MulterError) {

      });

                if (err.code === 'LIMIT_FILE_SIZE') {    'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo',});

      // Handle the splitting process

      splitPromise            return res.status(413).json({ error: 'File too large. Maximum size is 500MB.' });

        .then((result) => {

          console.log(`Video splitting completed for job ${jobId}:`, result);          }    'video/webm', 'video/ogg', 'video/3gpp', 'video/x-flv'

        })

        .catch((error) => {          if (err.code === 'LIMIT_UNEXPECTED_FILE') {

          console.error(`Video splitting failed for job ${jobId}:`, error);

        });            return res.status(400).json({ error: 'Unexpected field name. Use "video" field.' });  ];const videoUpload = multer({ 

        

    } catch (error) {          }

      console.error('Video split error:', error);

              }    storage: videoStorage,

      // Cleanup on error

      if (inputPath) {        return res.status(400).json({ error: err.message });

        try {

          await fs.unlink(inputPath);      }  if (allowedMimes.includes(file.mimetype)) {  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB limit for videos

        } catch (e) {}

      }      

      if (tempOutputDir) {

        await videoSplitterService.cleanup(tempOutputDir);      // Validate file upload    cb(null, true);  fileFilter: (req, file, cb) => {

      }

            if (!req.file) {

      res.status(500).json({ 

        error: error.message || 'Failed to split video',        return res.status(400).json({ error: 'No video file provided' });  } else {    const allowedTypes = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v', '.3gp', '.ogv', '.m2v', '.ts'];

        details: process.env.NODE_ENV === 'development' ? error.stack : undefined

      });      }

    } finally {

      // Cleanup input file after starting the process          cb(new Error('Invalid file type. Only video files are allowed.'), false);    const fileExt = path.extname(file.originalname).toLowerCase();

      if (inputPath) {

        setTimeout(async () => {      inputPath = req.file.path;

          try {

            await fs.unlink(inputPath);        }    if (allowedTypes.includes(fileExt)) {

          } catch (e) {

            console.warn('Failed to cleanup input file:', e.message);      // Parse and validate parameters

          }

        }, 5000); // 5 seconds delay      const {};      cb(null, true);

      }

    }        segments = '[]',

  });

});        splitBy = 'manual',    } else {



// ============================================================================        sceneThreshold = '0.3',

// GIF SPLITTING ENDPOINTS

// ============================================================================        maxSegments = '50',// File filter for animated images      cb(new Error('Unsupported video format. Please upload MP4, AVI, MOV, MKV, WMV, FLV, WebM, or other supported video files.'));



// Split animated image (GIF/WebP) into frames        outputFormat = 'mp4',

router.post('/gif', (req, res) => {

  uploadImage(req, res, async (err) => {        quality = 'medium',const imageFileFilter = (req, file, cb) => {    }

    let inputPath = null;

    let tempOutputDir = null;        resolution,

    

    try {        frameRate  const allowedMimes = ['image/gif', 'image/webp'];  }

      // Handle upload errors

      if (err) {      } = req.body;

        if (err instanceof multer.MulterError) {

          if (err.code === 'LIMIT_FILE_SIZE') {        });

            return res.status(413).json({ error: 'File too large. Maximum size is 100MB.' });

          }      // Parse segments for manual splitting

          if (err.code === 'LIMIT_UNEXPECTED_FILE') {

            return res.status(400).json({ error: 'Unexpected field name. Use "image" field.' });      let parsedSegments = [];  if (allowedMimes.includes(file.mimetype)) {

          }

        }      try {

        return res.status(400).json({ error: err.message });

      }        parsedSegments = JSON.parse(segments);    cb(null, true);// ============================================================================

      

      // Validate file upload      } catch (parseError) {

      if (!req.file) {

        return res.status(400).json({ error: 'No animated image file provided' });        return res.status(400).json({ error: 'Invalid segments format. Expected JSON array.' });  } else {// VIDEO SPLITTING ENDPOINTS

      }

            }

      inputPath = req.file.path;

                cb(new Error('Invalid file type. Only GIF and WebP files are allowed.'), false);// ============================================================================

      // Parse and validate parameters

      const {      // Validate split method

        outputFormat = 'png',

        quality = '90',      if (!['manual', 'scenes'].includes(splitBy)) {  }

        resize,

        skipDuplicates = 'false',        return res.status(400).json({ error: 'Invalid splitBy value. Use "manual" or "scenes".' });

        splitBy = 'frames',

        sceneThreshold = '0.1',      }};/**

        minSceneDuration = '0.5',

        maxFrames = '500'      

      } = req.body;

            // Validate manual segments * POST /api/split/video

      // Validate output format

      if (!['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(outputFormat.toLowerCase())) {      if (splitBy === 'manual') {

        return res.status(400).json({ error: 'Invalid output format. Use png, jpg, jpeg, webp, or gif.' });

      }        if (!Array.isArray(parsedSegments) || parsedSegments.length === 0) {// Multer configurations * Split video into multiple segments based on time ranges or scenes

      

      // Validate quality          return res.status(400).json({ error: 'Segments array is required for manual splitting' });

      const qualityNum = parseInt(quality);

      if (isNaN(qualityNum) || qualityNum < 1 || qualityNum > 100) {        }const uploadVideo = multer({ * 

        return res.status(400).json({ error: 'Quality must be between 1 and 100' });

      }        

      

      // Validate max frames        for (let i = 0; i < parsedSegments.length; i++) {  storage: videoStorage, * Body Parameters:

      const maxFramesNum = parseInt(maxFrames);

      if (isNaN(maxFramesNum) || maxFramesNum < 1 || maxFramesNum > 1000) {          const segment = parsedSegments[i];

        return res.status(400).json({ error: 'Max frames must be between 1 and 1000' });

      }          if (!segment.start || !segment.end || segment.start >= segment.end) {  fileFilter: videoFileFilter, * - segments: Array of {name, startTime, endTime} objects for manual splitting

      

      // Parse resize parameters            return res.status(400).json({ 

      let resizeOptions = null;

      if (resize) {              error: `Invalid segment ${i + 1}. Start and end times are required, and start must be less than end.`   limits: { * - sceneDetection: Boolean to enable automatic scene detection

        try {

          const [width, height] = resize.split('x').map(num => parseInt(num.trim()));            });

          if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {

            resizeOptions = { width, height };          }    fileSize: 500 * 1024 * 1024, // 500MB max for videos * - sensitivity: Scene detection sensitivity (0.1-1.0, default 0.3)

          }

        } catch (e) {        }

          return res.status(400).json({ error: 'Invalid resize format. Use "widthxheight" (e.g., "800x600").' });

        }      }    files: 1 * - outputFormat: Output format (mp4, webm, avi, etc.)

      }

            

      // Validate split method

      if (!['frames', 'scenes'].includes(splitBy)) {      // Validate scene detection parameters  } * - quality: Quality setting (low, medium, high)

        return res.status(400).json({ error: 'Invalid splitBy value. Use "frames" or "scenes".' });

      }      const threshold = parseFloat(sceneThreshold);

      

      // Generate job ID      if (isNaN(threshold) || threshold < 0.1 || threshold > 1.0) {}).single('video'); * - preserveAudio: Boolean to include audio in segments

      const jobId = crypto.randomUUID();

              return res.status(400).json({ error: 'Scene threshold must be between 0.1 and 1.0' });

      // Create output directory

      tempOutputDir = path.join(outputDir, `gif_split_${jobId}`);      } */

      await fs.mkdir(tempOutputDir, { recursive: true });

            

      // Set up options

      const options = {      const maxSegs = parseInt(maxSegments);const uploadImage = multer({router.post('/video', videoUpload.single('video'), async (req, res) => {

        outputFormat: outputFormat.toLowerCase(),

        quality: qualityNum,      if (isNaN(maxSegs) || maxSegs < 1 || maxSegs > 100) {

        outputDir: tempOutputDir,

        skipDuplicates: skipDuplicates === 'true',        return res.status(400).json({ error: 'Max segments must be between 1 and 100' });  storage: imageStorage,  let inputPath = null;

        resize: resizeOptions,

        maxFrames: maxFramesNum      }

      };

              fileFilter: imageFileFilter,  

      // Start splitting process

      let splitPromise;      // Validate output format

      

      if (splitBy === 'frames') {      if (!['mp4', 'avi', 'webm', 'mov'].includes(outputFormat)) {  limits: {  try {

        splitPromise = splitService.splitAnimatedImage(inputPath, options);

      } else {        return res.status(400).json({ error: 'Invalid output format. Use mp4, avi, webm, or mov.' });

        const threshold = parseFloat(sceneThreshold);

        const minDuration = parseFloat(minSceneDuration);      }    fileSize: 100 * 1024 * 1024, // 100MB max for animated images    if (!req.file) {

        

        if (isNaN(threshold) || threshold < 0.01 || threshold > 1.0) {      

          return res.status(400).json({ error: 'Scene threshold must be between 0.01 and 1.0' });

        }      // Generate job ID    files: 1      return res.status(400).json({ 

        

        if (isNaN(minDuration) || minDuration < 0.1 || minDuration > 10.0) {      const jobId = crypto.randomUUID();

          return res.status(400).json({ error: 'Min scene duration must be between 0.1 and 10.0 seconds' });

        }        }        error: 'No video file provided',

        

        splitPromise = splitService.splitGifByScenes(inputPath, threshold, minDuration, options);      // Create output directory

      }

            tempDir = path.join(outputDir, `split_${jobId}`);}).single('image');        usage: 'Upload a video file using the "video" field'

      // Return job information immediately

      res.json({      await fs.mkdir(tempDir, { recursive: true });

        success: true,

        jobId,            });

        message: 'Animated image splitting started',

        status: 'processing',      // Set up options

        splitBy,

        statusUrl: `/api/split/gif/status/${jobId}`,      const options = {// ============================================================================    }

        downloadUrl: `/api/split/gif/download-zip/${jobId}`

      });        outputFormat,

      

      // Handle the splitting process        quality,// VIDEO SPLITTING ENDPOINTS

      splitPromise

        .then((result) => {        outputDir: tempDir

          console.log(`GIF splitting completed for job ${jobId}:`, result);

        })      };// ============================================================================    inputPath = req.file.path;

        .catch((error) => {

          console.error(`GIF splitting failed for job ${jobId}:`, error);      

        });

              if (resolution) {    

    } catch (error) {

      console.error('GIF split error:', error);        options.resolution = resolution;

      

      // Cleanup on error      }// Split video into segments    const {

      if (inputPath) {

        try {      

          await fs.unlink(inputPath);

        } catch (e) {}      if (frameRate) {router.post('/video', (req, res) => {      segments: rawSegments,

      }

      if (tempOutputDir) {        options.frameRate = parseInt(frameRate);

        await splitService.cleanup(tempOutputDir);

      }      }  uploadVideo(req, res, async (err) => {      sceneDetection = false,

      

      res.status(500).json({       

        error: error.message || 'Failed to split animated image',

        details: process.env.NODE_ENV === 'development' ? error.stack : undefined      // Start splitting process    let inputPath = null;      sensitivity = 0.3,

      });

    } finally {      let splitPromise;

      // Cleanup input file after starting the process

      if (inputPath) {          let tempDir = null;      outputFormat = 'mp4',

        setTimeout(async () => {

          try {      if (splitBy === 'manual') {

            await fs.unlink(inputPath);

          } catch (e) {        splitPromise = videoSplitterService.splitVideo(inputPath, parsedSegments, options);          quality = 'medium',

            console.warn('Failed to cleanup input file:', e.message);

          }      } else {

        }, 5000); // 5 seconds delay

      }        splitPromise = videoSplitterService.splitVideoByScenes(inputPath, threshold, maxSegs, options);    try {      preserveAudio = true,

    }

  });      }

});

            // Handle upload errors      maxScenes = 20

// ============================================================================

// STATUS AND DOWNLOAD ENDPOINTS      // Return job information immediately

// ============================================================================

      res.json({      if (err) {    } = req.body;

// Get video splitting job status

router.get('/video/status/:jobId', async (req, res) => {        success: true,

  try {

    const { jobId } = req.params;        jobId,        if (err instanceof multer.MulterError) {

    const status = videoSplitterService.getJobStatus(jobId);

            message: 'Video splitting started',

    if (!status) {

      return res.status(404).json({ error: 'Job not found' });        status: 'processing',          if (err.code === 'LIMIT_FILE_SIZE') {    let result;

    }

            splitBy,

    res.json({

      success: true,        totalSegments: splitBy === 'manual' ? parsedSegments.length : null,            return res.status(413).json({ error: 'File too large. Maximum size is 500MB.' });    

      jobId,

      status: status.status,        statusUrl: `/api/split/video/status/${jobId}`,

      progress: {

        totalSegments: status.totalSegments,        downloadUrl: `/api/split/video/download-all/${jobId}`          }    if (sceneDetection === 'true' || sceneDetection === true) {

        completedSegments: status.completedSegments,

        percentage: status.totalSegments > 0 ? (status.completedSegments / status.totalSegments * 100) : 0      });

      },

      segments: status.segments || [],                if (err.code === 'LIMIT_UNEXPECTED_FILE') {      // Automatic scene detection

      result: status.result || null,

      error: status.error || null      // Handle the splitting process

    });

          splitPromise            return res.status(400).json({ error: 'Unexpected field name. Use "video" field.' });      result = await videoSplitterService.splitVideoByScenes(inputPath, {

  } catch (error) {

    res.status(500).json({ error: error.message });        .then((result) => {

  }

});          console.log(`Video splitting completed for job ${jobId}:`, result);          }        sensitivity: parseFloat(sensitivity),



// Get GIF splitting job status        })

router.get('/gif/status/:jobId', async (req, res) => {

  try {        .catch((error) => {        }        maxScenes: parseInt(maxScenes),

    const { jobId } = req.params;

    const status = splitService.getJobStatus(jobId);          console.error(`Video splitting failed for job ${jobId}:`, error);

    

    if (!status) {        });        return res.status(400).json({ error: err.message });        outputFormat,

      return res.status(404).json({ error: 'Job not found' });

    }        

    

    res.json({    } catch (error) {      }        quality,

      success: true,

      jobId,      console.error('Video split error:', error);

      status: status.status,

      progress: {                    preserveAudio: preserveAudio === 'true' || preserveAudio === true

        totalFrames: status.totalFrames,

        processedFrames: status.processedFrames,      // Cleanup on error

        percentage: status.totalFrames > 0 ? (status.processedFrames / status.totalFrames * 100) : 0

      },      if (inputPath) {      // Validate file upload      });

      result: status.result || null,

      error: status.error || null        try {

    });

              await fs.unlink(inputPath);      if (!req.file) {      

  } catch (error) {

    res.status(500).json({ error: error.message });        } catch (e) {}

  }

});      }        return res.status(400).json({ error: 'No video file provided' });    } else {



// Download individual video segment      if (tempDir) {

router.get('/video/download/:jobId/:filename', async (req, res) => {

  try {        await videoSplitterService.cleanup(tempDir);      }      // Manual segment definition

    const { jobId, filename } = req.params;

    const filePath = path.join(outputDir, `split_${jobId}`, filename);      }

    

    await fs.access(filePath);                  if (!rawSegments) {

    res.download(filePath, filename);

          res.status(500).json({ 

  } catch (error) {

    res.status(404).json({ error: 'Video segment not found or expired' });        error: error.message || 'Failed to split video',      inputPath = req.file.path;        return res.status(400).json({ 

  }

});        details: process.env.NODE_ENV === 'development' ? error.stack : undefined



// Download all video segments as ZIP      });                error: 'No segments defined',

router.get('/video/download-all/:jobId', async (req, res) => {

  try {    } finally {

    const { jobId } = req.params;

    const jobStatus = videoSplitterService.getJobStatus(jobId);      // Cleanup input file after starting the process      // Parse and validate parameters          usage: 'Provide segments array with {name, startTime, endTime} objects or enable sceneDetection'

    

    if (!jobStatus || jobStatus.status !== 'completed') {      if (inputPath) {

      return res.status(404).json({ error: 'Job not found or not completed' });

    }        setTimeout(async () => {      const {        });

    

    // Create ZIP of all segments          try {

    const segmentDir = path.join(outputDir, `split_${jobId}`);

    const zipPath = path.join(segmentDir, 'all_segments.zip');            await fs.unlink(inputPath);        segments = '[]',      }

    

    // Check if ZIP already exists, create if not          } catch (e) {

    try {

      await fs.access(zipPath);            console.warn('Failed to cleanup input file:', e.message);        splitBy = 'manual',      

    } catch {

      const archiver = await import('archiver');          }

      const archive = archiver.default('zip', { zlib: { level: 9 } });

      const output = (await import('fs')).createWriteStream(zipPath);        }, 5000); // 5 seconds delay        sceneThreshold = '0.3',      let segments;

      

      archive.pipe(output);      }

      

      for (const segment of jobStatus.result.segments) {    }        maxSegments = '50',      try {

        archive.file(segment.path, { name: segment.filename });

      }  });

      

      await archive.finalize();});        outputFormat = 'mp4',        segments = typeof rawSegments === 'string' ? JSON.parse(rawSegments) : rawSegments;

    }

    

    res.download(zipPath, `video_segments_${jobId}.zip`);

    // ============================================================================        quality = 'medium',      } catch (parseError) {

  } catch (error) {

    res.status(500).json({ error: 'Failed to create or download ZIP archive' });// GIF SPLITTING ENDPOINTS

  }

});// ============================================================================        resolution,        return res.status(400).json({ 



// Download individual GIF frame

router.get('/gif/download/:jobId/:filename', async (req, res) => {

  try {// Split animated image (GIF/WebP) into frames        frameRate          error: 'Invalid segments format',

    const { jobId, filename } = req.params;

    const filePath = path.join(outputDir, `gif_split_${jobId}`, filename);router.post('/gif', (req, res) => {

    

    await fs.access(filePath);  uploadImage(req, res, async (err) => {      } = req.body;          usage: 'Segments must be valid JSON array'

    res.download(filePath, filename);

        let inputPath = null;

  } catch (error) {

    res.status(404).json({ error: 'Frame not found or expired' });    let tempDir = null;              });

  }

});    



// Download GIF frames as ZIP    try {      // Parse segments for manual splitting      }

router.get('/gif/download-zip/:jobId', async (req, res) => {

  try {      // Handle upload errors

    const { jobId } = req.params;

    const zipPath = path.join(outputDir, `gif_split_${jobId}`, `frames_${jobId}.zip`);      if (err) {      let parsedSegments = [];      

    

    await fs.access(zipPath);        if (err instanceof multer.MulterError) {

    res.download(zipPath, `gif_frames_${jobId}.zip`);

              if (err.code === 'LIMIT_FILE_SIZE') {      try {      // Parse time strings to seconds

  } catch (error) {

    res.status(404).json({ error: 'ZIP archive not found or expired' });            return res.status(413).json({ error: 'File too large. Maximum size is 100MB.' });

  }

});          }        parsedSegments = JSON.parse(segments);      segments = segments.map(segment => ({



// Preview endpoints for frames/segments          if (err.code === 'LIMIT_UNEXPECTED_FILE') {

router.get('/video/preview/:jobId/:filename', async (req, res) => {

  try {            return res.status(400).json({ error: 'Unexpected field name. Use "image" field.' });      } catch (parseError) {        ...segment,

    const { jobId, filename } = req.params;

    const filePath = path.join(outputDir, `split_${jobId}`, filename);          }

    

    await fs.access(filePath);        }        return res.status(400).json({ error: 'Invalid segments format. Expected JSON array.' });        startTime: VideoSplitterService.parseTimeToSeconds(segment.startTime),

    res.sendFile(path.resolve(filePath));

            return res.status(400).json({ error: err.message });

  } catch (error) {

    res.status(404).json({ error: 'Video preview not found' });      }      }        endTime: VideoSplitterService.parseTimeToSeconds(segment.endTime)

  }

});      



router.get('/gif/preview/:jobId/:filename', async (req, res) => {      // Validate file upload            }));

  try {

    const { jobId, filename } = req.params;      if (!req.file) {

    const filePath = path.join(outputDir, `gif_split_${jobId}`, filename);

            return res.status(400).json({ error: 'No animated image file provided' });      // Validate split method      

    await fs.access(filePath);

    res.sendFile(path.resolve(filePath));      }

    

  } catch (error) {            if (!['manual', 'scenes'].includes(splitBy)) {      result = await videoSplitterService.splitVideo(inputPath, segments, {

    res.status(404).json({ error: 'Frame preview not found' });

  }      inputPath = req.file.path;

});

              return res.status(400).json({ error: 'Invalid splitBy value. Use "manual" or "scenes".' });        outputFormat,

// Cancel job endpoints

router.post('/video/cancel/:jobId', async (req, res) => {      // Parse and validate parameters

  try {

    const { jobId } = req.params;      const {      }        quality,

    const cancelled = videoSplitterService.cancelJob(jobId);

            outputFormat = 'png',

    if (cancelled) {

      res.json({ success: true, message: 'Job cancelled successfully' });        quality = '90',              preserveAudio: preserveAudio === 'true' || preserveAudio === true

    } else {

      res.status(404).json({ error: 'Job not found or cannot be cancelled' });        resize,

    }

            skipDuplicates = 'false',      // Validate manual segments      });

  } catch (error) {

    res.status(500).json({ error: error.message });        splitBy = 'frames',

  }

});        sceneThreshold = '0.1',      if (splitBy === 'manual') {    }



router.post('/gif/cancel/:jobId', async (req, res) => {        minSceneDuration = '0.5',

  try {

    const { jobId } = req.params;        maxFrames = '500'        if (!Array.isArray(parsedSegments) || parsedSegments.length === 0) {    

    const cancelled = splitService.cancelJob(jobId);

          } = req.body;

    if (cancelled) {

      res.json({ success: true, message: 'Job cancelled successfully' });                return res.status(400).json({ error: 'Segments array is required for manual splitting' });    res.json({

    } else {

      res.status(404).json({ error: 'Job not found or cannot be cancelled' });      // Validate output format

    }

          if (!['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(outputFormat.toLowerCase())) {        }      success: true,

  } catch (error) {

    res.status(500).json({ error: error.message });        return res.status(400).json({ error: 'Invalid output format. Use png, jpg, jpeg, webp, or gif.' });

  }

});      }              jobId: result.jobId,



export default router;      

      // Validate quality        for (let i = 0; i < parsedSegments.length; i++) {      inputFile: result.inputFile,

      const qualityNum = parseInt(quality);

      if (isNaN(qualityNum) || qualityNum < 1 || qualityNum > 100) {          const segment = parsedSegments[i];      totalSegments: result.totalSegments,

        return res.status(400).json({ error: 'Quality must be between 1 and 100' });

      }          if (!segment.start || !segment.end || segment.start >= segment.end) {      segments: result.segments,

      

      // Validate max frames            return res.status(400).json({       metadata: result.metadata,

      const maxFramesNum = parseInt(maxFrames);

      if (isNaN(maxFramesNum) || maxFramesNum < 1 || maxFramesNum > 1000) {              error: `Invalid segment ${i + 1}. Start and end times are required, and start must be less than end.`       processingTime: result.processingTime,

        return res.status(400).json({ error: 'Max frames must be between 1 and 1000' });

      }            });      downloadAllUrl: `/api/split/video/download-all/${result.jobId}`,

      

      // Parse resize parameters          }      statusUrl: `/api/split/video/status/${result.jobId}`

      let resizeOptions = null;

      if (resize) {        }    });

        try {

          const [width, height] = resize.split('x').map(num => parseInt(num.trim()));      }    

          if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {

            resizeOptions = { width, height };        } catch (error) {

          }

        } catch (e) {      // Validate scene detection parameters    console.error('Video splitting error:', error);

          return res.status(400).json({ error: 'Invalid resize format. Use "widthxheight" (e.g., "800x600").' });

        }      const threshold = parseFloat(sceneThreshold);    res.status(500).json({ 

      }

            if (isNaN(threshold) || threshold < 0.1 || threshold > 1.0) {      error: error.message,

      // Validate split method

      if (!['frames', 'scenes'].includes(splitBy)) {        return res.status(400).json({ error: 'Scene threshold must be between 0.1 and 1.0' });      details: 'Check video format, segment times, and file size limits'

        return res.status(400).json({ error: 'Invalid splitBy value. Use "frames" or "scenes".' });

      }      }    });

      

      // Generate job ID        } finally {

      const jobId = crypto.randomUUID();

            const maxSegs = parseInt(maxSegments);    // Cleanup input file

      // Create output directory

      tempDir = path.join(outputDir, `gif_split_${jobId}`);      if (isNaN(maxSegs) || maxSegs < 1 || maxSegs > 100) {    if (inputPath) {

      await fs.mkdir(tempDir, { recursive: true });

              return res.status(400).json({ error: 'Max segments must be between 1 and 100' });      try {

      // Set up options

      const options = {      }        await fs.unlink(inputPath);

        outputFormat: outputFormat.toLowerCase(),

        quality: qualityNum,            } catch (cleanupError) {

        outputDir: tempDir,

        skipDuplicates: skipDuplicates === 'true',      // Validate output format        console.warn('Failed to cleanup input file:', cleanupError.message);

        resize: resizeOptions,

        maxFrames: maxFramesNum      if (!['mp4', 'avi', 'webm', 'mov'].includes(outputFormat)) {      }

      };

              return res.status(400).json({ error: 'Invalid output format. Use mp4, avi, webm, or mov.' });    }

      // Start splitting process

      let splitPromise;      }  }

      

      if (splitBy === 'frames') {      });

        splitPromise = splitService.splitAnimatedImage(inputPath, options);

      } else {      // Generate job ID

        const threshold = parseFloat(sceneThreshold);

        const minDuration = parseFloat(minSceneDuration);      const jobId = crypto.randomUUID();// ============================================================================

        

        if (isNaN(threshold) || threshold < 0.01 || threshold > 1.0) {      // GIF SPLITTING ENDPOINTS  

          return res.status(400).json({ error: 'Scene threshold must be between 0.01 and 1.0' });

        }      // Create output directory// ============================================================================

        

        if (isNaN(minDuration) || minDuration < 0.1 || minDuration > 10.0) {      tempDir = path.join(outputDir, `split_${jobId}`);

          return res.status(400).json({ error: 'Min scene duration must be between 0.1 and 10.0 seconds' });

        }      await fs.mkdir(tempDir, { recursive: true });/**

        

        splitPromise = splitService.splitGifByScenes(inputPath, threshold, minDuration, options);       * POST /api/split/gif

      }

            // Set up options * Split GIF into individual frames or scenes

      // Return job information immediately

      res.json({      const options = { * 

        success: true,

        jobId,        outputFormat, * Body Parameters:

        message: 'Animated image splitting started',

        status: 'processing',        quality, * - outputFormat: Output format for frames (png, jpeg, webp, bmp, tiff)

        splitBy,

        statusUrl: `/api/split/gif/status/${jobId}`,        outputDir: tempDir * - quality: JPEG quality (1-100, default 90)

        downloadUrl: `/api/split/gif/download-zip/${jobId}`

      });      }; * - frameRange: {start, end} to extract specific frame range

      

      // Handle the splitting process       * - resize: {width, height} to resize frames

      splitPromise

        .then((result) => {      if (resolution) { * - skipDuplicates: Boolean to skip duplicate frames

          console.log(`GIF splitting completed for job ${jobId}:`, result);

        })        options.resolution = resolution; * - sceneDetection: Boolean to enable scene-based splitting

        .catch((error) => {

          console.error(`GIF splitting failed for job ${jobId}:`, error);      } * - createZip: Boolean to create downloadable ZIP archive

        });

               */

    } catch (error) {

      console.error('GIF split error:', error);      if (frameRate) {router.post('/gif', imageUpload.single('gif'), async (req, res) => {

      

      // Cleanup on error        options.frameRate = parseInt(frameRate);  let inputPath = null;

      if (inputPath) {

        try {      }  

          await fs.unlink(inputPath);

        } catch (e) {}        try {

      }

      if (tempDir) {      // Start splitting process    const { url } = req.body;

        await splitService.cleanup(tempDir);

      }      let splitPromise;    

      

      res.status(500).json({           // Handle file upload or URL

        error: error.message || 'Failed to split animated image',

        details: process.env.NODE_ENV === 'development' ? error.stack : undefined      if (splitBy === 'manual') {    if (req.file) {

      });

    } finally {        splitPromise = videoSplitterService.splitVideo(inputPath, parsedSegments, options);      inputPath = req.file.path;

      // Cleanup input file after starting the process

      if (inputPath) {      } else {    } else if (url) {

        setTimeout(async () => {

          try {        splitPromise = videoSplitterService.splitVideoByScenes(inputPath, threshold, maxSegs, options);      // Download file from URL

            await fs.unlink(inputPath);

          } catch (e) {      }      try {

            console.warn('Failed to cleanup input file:', e.message);

          }              const response = await fetch(url);

        }, 5000); // 5 seconds delay

      }      // Return job information immediately        if (!response.ok) {

    }

  });      res.json({          throw new Error(`Failed to download from URL: ${response.statusText}`);

});

        success: true,        }

// ============================================================================

// STATUS AND DOWNLOAD ENDPOINTS        jobId,        

// ============================================================================

        message: 'Video splitting started',        const buffer = await response.arrayBuffer();

// Get video splitting job status

router.get('/video/status/:jobId', async (req, res) => {        status: 'processing',        const fileName = `url_gif_${Date.now()}${path.extname(url) || '.gif'}`;

  try {

    const { jobId } = req.params;        splitBy,        inputPath = path.join(tempDir, fileName);

    const status = videoSplitterService.getJobStatus(jobId);

            totalSegments: splitBy === 'manual' ? parsedSegments.length : null,        await fs.writeFile(inputPath, Buffer.from(buffer));

    if (!status) {

      return res.status(404).json({ error: 'Job not found' });        statusUrl: `/api/split/video/status/${jobId}`,      } catch (urlError) {

    }

            downloadUrl: `/api/split/video/download-all/${jobId}`        return res.status(400).json({ 

    res.json({

      success: true,      });          error: 'Failed to download from URL',

      jobId,

      status: status.status,                details: urlError.message 

      progress: {

        totalSegments: status.totalSegments,      // Handle the splitting process        });

        completedSegments: status.completedSegments,

        percentage: status.totalSegments > 0 ? (status.completedSegments / status.totalSegments * 100) : 0      splitPromise      }

      },

      segments: status.segments || [],        .then((result) => {    } else {

      result: status.result || null,

      error: status.error || null          console.log(`Video splitting completed for job ${jobId}:`, result);      return res.status(400).json({ 

    });

            })        error: 'No file or URL provided',

  } catch (error) {

    res.status(500).json({ error: error.message });        .catch((error) => {        usage: 'Upload a GIF file using the "gif" field or provide a "url" parameter'

  }

});          console.error(`Video splitting failed for job ${jobId}:`, error);      });



// Get GIF splitting job status        });    }

router.get('/gif/status/:jobId', async (req, res) => {

  try {        

    const { jobId } = req.params;

    const status = splitService.getJobStatus(jobId);    } catch (error) {    const {

    

    if (!status) {      console.error('Video split error:', error);      outputFormat = 'png',

      return res.status(404).json({ error: 'Job not found' });

    }            quality = 90,

    

    res.json({      // Cleanup on error      frameRange: rawFrameRange,

      success: true,

      jobId,      if (inputPath) {      resize: rawResize,

      status: status.status,

      progress: {        try {      skipDuplicates = false,

        totalFrames: status.totalFrames,

        processedFrames: status.processedFrames,          await fs.unlink(inputPath);      sceneDetection = false,

        percentage: status.totalFrames > 0 ? (status.processedFrames / status.totalFrames * 100) : 0

      },        } catch (e) {}      createZip = true

      result: status.result || null,

      error: status.error || null      }    } = req.body;

    });

          if (tempDir) {

  } catch (error) {

    res.status(500).json({ error: error.message });        await videoSplitterService.cleanup(tempDir);    // Parse parameters

  }

});      }    let frameRange = null;



// Download individual video segment          if (rawFrameRange) {

router.get('/video/download/:jobId/:filename', async (req, res) => {

  try {      res.status(500).json({       try {

    const { jobId, filename } = req.params;

    const filePath = path.join(outputDir, `split_${jobId}`, filename);        error: error.message || 'Failed to split video',        frameRange = typeof rawFrameRange === 'string' ? JSON.parse(rawFrameRange) : rawFrameRange;

    

    await fs.access(filePath);        details: process.env.NODE_ENV === 'development' ? error.stack : undefined      } catch (parseError) {

    res.download(filePath, filename);

          });        return res.status(400).json({ 

  } catch (error) {

    res.status(404).json({ error: 'Video segment not found or expired' });    } finally {          error: 'Invalid frameRange format',

  }

});      // Cleanup input file after starting the process          usage: 'frameRange must be {start: number, end: number}'



// Download all video segments as ZIP      if (inputPath) {        });

router.get('/video/download-all/:jobId', async (req, res) => {

  try {        setTimeout(async () => {      }

    const { jobId } = req.params;

    const jobStatus = videoSplitterService.getJobStatus(jobId);          try {    }

    

    if (!jobStatus || jobStatus.status !== 'completed') {            await fs.unlink(inputPath);

      return res.status(404).json({ error: 'Job not found or not completed' });

    }          } catch (e) {    let resize = null;

    

    // Create ZIP of all segments            console.warn('Failed to cleanup input file:', e.message);    if (rawResize) {

    const segmentDir = path.join(outputDir, `split_${jobId}`);

    const zipPath = path.join(segmentDir, 'all_segments.zip');          }      try {

    

    // Check if ZIP already exists, create if not        }, 5000); // 5 seconds delay        resize = typeof rawResize === 'string' ? JSON.parse(rawResize) : rawResize;

    try {

      await fs.access(zipPath);      }      } catch (parseError) {

    } catch {

      const archiver = require('archiver');    }        return res.status(400).json({ 

      const archive = archiver('zip', { zlib: { level: 9 } });

      const output = require('fs').createWriteStream(zipPath);  });          error: 'Invalid resize format',

      

      archive.pipe(output);});          usage: 'resize must be {width: number, height: number}'

      

      for (const segment of jobStatus.result.segments) {        });

        archive.file(segment.path, { name: segment.filename });

      }// ============================================================================      }

      

      await archive.finalize();// GIF SPLITTING ENDPOINTS    }

    }

    // ============================================================================

    res.download(zipPath, `video_segments_${jobId}.zip`);

        let result;

  } catch (error) {

    res.status(500).json({ error: 'Failed to create or download ZIP archive' });// Split animated image (GIF/WebP) into frames    

  }

});router.post('/gif', (req, res) => {    if (sceneDetection === 'true' || sceneDetection === true) {



// Download individual GIF frame  uploadImage(req, res, async (err) => {      // Scene-based splitting

router.get('/gif/download/:jobId/:filename', async (req, res) => {

  try {    let inputPath = null;      result = await splitService.splitGifByScenes(inputPath, {

    const { jobId, filename } = req.params;

    const filePath = path.join(outputDir, `gif_split_${jobId}`, filename);    let tempDir = null;        outputFormat,

    

    await fs.access(filePath);            createZip: createZip === 'true' || createZip === true

    res.download(filePath, filename);

        try {      });

  } catch (error) {

    res.status(404).json({ error: 'Frame not found or expired' });      // Handle upload errors      

  }

});      if (err) {    } else {



// Download GIF frames as ZIP        if (err instanceof multer.MulterError) {      // Frame-based splitting

router.get('/gif/download-zip/:jobId', async (req, res) => {

  try {          if (err.code === 'LIMIT_FILE_SIZE') {      result = await splitService.splitAnimatedImage(inputPath, {

    const { jobId } = req.params;

    const zipPath = path.join(outputDir, `gif_split_${jobId}`, `frames_${jobId}.zip`);            return res.status(413).json({ error: 'File too large. Maximum size is 100MB.' });        outputFormat,

    

    await fs.access(zipPath);          }        quality: parseInt(quality),

    res.download(zipPath, `gif_frames_${jobId}.zip`);

              if (err.code === 'LIMIT_UNEXPECTED_FILE') {        frameRange,

  } catch (error) {

    res.status(404).json({ error: 'ZIP archive not found or expired' });            return res.status(400).json({ error: 'Unexpected field name. Use "image" field.' });        resize,

  }

});          }        skipDuplicates: skipDuplicates === 'true' || skipDuplicates === true,



// Preview endpoints for frames/segments        }        createZip: createZip === 'true' || createZip === true

router.get('/video/preview/:jobId/:filename', async (req, res) => {

  try {        return res.status(400).json({ error: err.message });      });

    const { jobId, filename } = req.params;

    const filePath = path.join(outputDir, `split_${jobId}`, filename);      }    }

    

    await fs.access(filePath);          

    res.sendFile(path.resolve(filePath));

          // Validate file upload    res.json({

  } catch (error) {

    res.status(404).json({ error: 'Video preview not found' });      if (!req.file) {      success: true,

  }

});        return res.status(400).json({ error: 'No animated image file provided' });      jobId: result.jobId,



router.get('/gif/preview/:jobId/:filename', async (req, res) => {      }      totalFrames: result.totalFrames,

  try {

    const { jobId, filename } = req.params;            skippedDuplicates: result.skippedDuplicates || 0,

    const filePath = path.join(outputDir, `gif_split_${jobId}`, filename);

          inputPath = req.file.path;      frames: result.frames,

    await fs.access(filePath);

    res.sendFile(path.resolve(filePath));            outputFormat: result.outputFormat,

    

  } catch (error) {      // Parse and validate parameters      processingTime: result.processingTime,

    res.status(404).json({ error: 'Frame preview not found' });

  }      const {      zipUrl: result.zipUrl,

});

        outputFormat = 'png',      downloadAllUrl: `/api/split/gif/download-all/${result.jobId}`,

// Cancel job endpoints

router.post('/video/cancel/:jobId', async (req, res) => {        quality = '90',      statusUrl: `/api/split/gif/status/${result.jobId}`,

  try {

    const { jobId } = req.params;        resize,      originalDimensions: {

    const cancelled = videoSplitterService.cancelJob(jobId);

            skipDuplicates = 'false',        width: result.originalWidth,

    if (cancelled) {

      res.json({ success: true, message: 'Job cancelled successfully' });        splitBy = 'frames',        height: result.originalHeight

    } else {

      res.status(404).json({ error: 'Job not found or cannot be cancelled' });        sceneThreshold = '0.1',      },

    }

            minSceneDuration = '0.5',      originalFormat: result.originalFormat

  } catch (error) {

    res.status(500).json({ error: error.message });        maxFrames = '500'    });

  }

});      } = req.body;    



router.post('/gif/cancel/:jobId', async (req, res) => {        } catch (error) {

  try {

    const { jobId } = req.params;      // Validate output format    console.error('GIF splitting error:', error);

    const cancelled = splitService.cancelJob(jobId);

          if (!['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(outputFormat.toLowerCase())) {    res.status(500).json({ 

    if (cancelled) {

      res.json({ success: true, message: 'Job cancelled successfully' });        return res.status(400).json({ error: 'Invalid output format. Use png, jpg, jpeg, webp, or gif.' });      error: error.message,

    } else {

      res.status(404).json({ error: 'Job not found or cannot be cancelled' });      }      details: 'Check GIF format, parameters, and file size limits'

    }

              // Cleanup input file

  } catch (error) {

    res.status(500).json({ error: error.message });      // Validate quality    if (inputPath) {

  }

});      const qualityNum = parseInt(quality);      try {



module.exports = router;      if (isNaN(qualityNum) || qualityNum < 1 || qualityNum > 100) {        await fs.unlink(inputPath);

        return res.status(400).json({ error: 'Quality must be between 1 and 100' });      } catch (cleanupError) {

      }        console.warn('Failed to cleanup input file:', cleanupError.message);

            }

      // Validate max frames    }

      const maxFramesNum = parseInt(maxFrames);    

      if (isNaN(maxFramesNum) || maxFramesNum < 1 || maxFramesNum > 1000) {    // Schedule cleanup of output directory after 1 hour

        return res.status(400).json({ error: 'Max frames must be between 1 and 1000' });    setTimeout(async () => {

      }      await SplitService.cleanup(tempDir);

          }, 60 * 60 * 1000); // 1 hour

      // Parse resize parameters    

      let resizeOptions = null;  } catch (error) {

      if (resize) {    console.error('Split error:', error);

        try {    

          const [width, height] = resize.split('x').map(num => parseInt(num.trim()));    // Cleanup on error

          if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {    if (inputPath) {

            resizeOptions = { width, height };      try {

          }        await fs.unlink(inputPath);

        } catch (e) {      } catch (e) {}

          return res.status(400).json({ error: 'Invalid resize format. Use "widthxheight" (e.g., "800x600").' });    }

        }    if (tempDir) {

      }      await SplitService.cleanup(tempDir);

          }

      // Validate split method    

      if (!['frames', 'scenes'].includes(splitBy)) {    res.status(500).json({ 

        return res.status(400).json({ error: 'Invalid splitBy value. Use "frames" or "scenes".' });      error: error.message || 'Failed to split animated image',

      }      details: process.env.NODE_ENV === 'development' ? error.stack : undefined

          });

      // Generate job ID  }

      const jobId = crypto.randomUUID();});

      

      // Create output directory// ============================================================================

      tempDir = path.join(outputDir, `gif_split_${jobId}`);// STATUS AND DOWNLOAD ENDPOINTS

      await fs.mkdir(tempDir, { recursive: true });// ============================================================================

      

      // Set up options// Get video splitting job status

      const options = {router.get('/video/status/:jobId', async (req, res) => {

        outputFormat: outputFormat.toLowerCase(),  try {

        quality: qualityNum,    const { jobId } = req.params;

        outputDir: tempDir,    const status = videoSplitterService.getJobStatus(jobId);

        skipDuplicates: skipDuplicates === 'true',    

        resize: resizeOptions,    if (!status) {

        maxFrames: maxFramesNum      return res.status(404).json({ error: 'Job not found' });

      };    }

          

      // Start splitting process    res.json({

      let splitPromise;      success: true,

            jobId,

      if (splitBy === 'frames') {      status: status.status,

        splitPromise = splitService.splitAnimatedImage(inputPath, options);      progress: {

      } else {        totalSegments: status.totalSegments,

        const threshold = parseFloat(sceneThreshold);        completedSegments: status.completedSegments,

        const minDuration = parseFloat(minSceneDuration);        percentage: status.totalSegments > 0 ? (status.completedSegments / status.totalSegments * 100) : 0

              },

        if (isNaN(threshold) || threshold < 0.01 || threshold > 1.0) {      segments: status.segments || [],

          return res.status(400).json({ error: 'Scene threshold must be between 0.01 and 1.0' });      result: status.result || null,

        }      error: status.error || null

            });

        if (isNaN(minDuration) || minDuration < 0.1 || minDuration > 10.0) {    

          return res.status(400).json({ error: 'Min scene duration must be between 0.1 and 10.0 seconds' });  } catch (error) {

        }    res.status(500).json({ error: error.message });

          }

        splitPromise = splitService.splitGifByScenes(inputPath, threshold, minDuration, options);});

      }

      // Get GIF splitting job status

      // Return job information immediatelyrouter.get('/gif/status/:jobId', async (req, res) => {

      res.json({  try {

        success: true,    const { jobId } = req.params;

        jobId,    const status = splitService.getJobStatus(jobId);

        message: 'Animated image splitting started',    

        status: 'processing',    if (!status) {

        splitBy,      return res.status(404).json({ error: 'Job not found' });

        statusUrl: `/api/split/gif/status/${jobId}`,    }

        downloadUrl: `/api/split/gif/download-zip/${jobId}`    

      });    res.json({

            success: true,

      // Handle the splitting process      jobId,

      splitPromise      status: status.status,

        .then((result) => {      progress: {

          console.log(`GIF splitting completed for job ${jobId}:`, result);        totalFrames: status.totalFrames,

        })        processedFrames: status.processedFrames,

        .catch((error) => {        percentage: status.totalFrames > 0 ? (status.processedFrames / status.totalFrames * 100) : 0

          console.error(`GIF splitting failed for job ${jobId}:`, error);      },

        });      result: status.result || null,

              error: status.error || null

    } catch (error) {    });

      console.error('GIF split error:', error);    

        } catch (error) {

      // Cleanup on error    res.status(500).json({ error: error.message });

      if (inputPath) {  }

        try {});

          await fs.unlink(inputPath);

        } catch (e) {}// Download individual video segment

      }router.get('/video/download/:jobId/:filename', async (req, res) => {

      if (tempDir) {  try {

        await splitService.cleanup(tempDir);    const { jobId, filename } = req.params;

      }    const filePath = path.join(outputDir, `split_${jobId}`, filename);

          

      res.status(500).json({     await fs.access(filePath);

        error: error.message || 'Failed to split animated image',    res.download(filePath, filename);

        details: process.env.NODE_ENV === 'development' ? error.stack : undefined    

      });  } catch (error) {

    } finally {    res.status(404).json({ error: 'Video segment not found or expired' });

      // Cleanup input file after starting the process  }

      if (inputPath) {});

        setTimeout(async () => {

          try {// Download all video segments as ZIP

            await fs.unlink(inputPath);router.get('/video/download-all/:jobId', async (req, res) => {

          } catch (e) {  try {

            console.warn('Failed to cleanup input file:', e.message);    const { jobId } = req.params;

          }    const jobStatus = videoSplitterService.getJobStatus(jobId);

        }, 5000); // 5 seconds delay    

      }    if (!jobStatus || jobStatus.status !== 'completed') {

    }      return res.status(404).json({ error: 'Job not found or not completed' });

  });    }

});    

    // Create ZIP of all segments

// ============================================================================    const segmentDir = path.join(outputDir, `split_${jobId}`);

// STATUS AND DOWNLOAD ENDPOINTS    const zipPath = path.join(segmentDir, 'all_segments.zip');

// ============================================================================    

    // Check if ZIP already exists, create if not

// Get video splitting job status    try {

router.get('/video/status/:jobId', async (req, res) => {      await fs.access(zipPath);

  try {    } catch {

    const { jobId } = req.params;      const archiver = require('archiver');

    const status = videoSplitterService.getJobStatus(jobId);      const archive = archiver('zip', { zlib: { level: 9 } });

          const output = require('fs').createWriteStream(zipPath);

    if (!status) {      

      return res.status(404).json({ error: 'Job not found' });      archive.pipe(output);

    }      

          for (const segment of jobStatus.result.segments) {

    res.json({        archive.file(segment.path, { name: segment.filename });

      success: true,      }

      jobId,      

      status: status.status,      await archive.finalize();

      progress: {    }

        totalSegments: status.totalSegments,    

        completedSegments: status.completedSegments,    res.download(zipPath, `video_segments_${jobId}.zip`);

        percentage: status.totalSegments > 0 ? (status.completedSegments / status.totalSegments * 100) : 0    

      },  } catch (error) {

      segments: status.segments || [],    res.status(500).json({ error: 'Failed to create or download ZIP archive' });

      result: status.result || null,  }

      error: status.error || null});

    });

    // Download individual GIF frame

  } catch (error) {router.get('/gif/download/:jobId/:filename', async (req, res) => {

    res.status(500).json({ error: error.message });  try {

  }    const { jobId, filename } = req.params;

});    const filePath = path.join(outputDir, `gif_split_${jobId}`, filename);

    

// Get GIF splitting job status    await fs.access(filePath);

router.get('/gif/status/:jobId', async (req, res) => {    res.download(filePath, filename);

  try {    

    const { jobId } = req.params;  } catch (error) {

    const status = splitService.getJobStatus(jobId);    res.status(404).json({ error: 'Frame not found or expired' });

      }

    if (!status) {});

      return res.status(404).json({ error: 'Job not found' });

    }// Download GIF frames as ZIP

    router.get('/gif/download-zip/:jobId', async (req, res) => {

    res.json({  try {

      success: true,    const { jobId } = req.params;

      jobId,    const zipPath = path.join(outputDir, `gif_split_${jobId}`, `frames_${jobId}.zip`);

      status: status.status,    

      progress: {    await fs.access(zipPath);

        totalFrames: status.totalFrames,    res.download(zipPath, `gif_frames_${jobId}.zip`);

        processedFrames: status.processedFrames,    

        percentage: status.totalFrames > 0 ? (status.processedFrames / status.totalFrames * 100) : 0  } catch (error) {

      },    res.status(404).json({ error: 'ZIP archive not found or expired' });

      result: status.result || null,  }

      error: status.error || null});

    });

    // Preview endpoints for frames/segments

  } catch (error) {router.get('/video/preview/:jobId/:filename', async (req, res) => {

    res.status(500).json({ error: error.message });  try {

  }    const { jobId, filename } = req.params;

});    const filePath = path.join(outputDir, `split_${jobId}`, filename);

    

// Download individual video segment    await fs.access(filePath);

router.get('/video/download/:jobId/:filename', async (req, res) => {    res.sendFile(path.resolve(filePath));

  try {    

    const { jobId, filename } = req.params;  } catch (error) {

    const filePath = path.join(outputDir, `split_${jobId}`, filename);    res.status(404).json({ error: 'Video preview not found' });

      }

    await fs.access(filePath);});

    res.download(filePath, filename);

    router.get('/gif/preview/:jobId/:filename', async (req, res) => {

  } catch (error) {  try {

    res.status(404).json({ error: 'Video segment not found or expired' });    const { jobId, filename } = req.params;

  }    const filePath = path.join(outputDir, `gif_split_${jobId}`, filename);

});    

    await fs.access(filePath);

// Download all video segments as ZIP    res.sendFile(path.resolve(filePath));

router.get('/video/download-all/:jobId', async (req, res) => {    

  try {  } catch (error) {

    const { jobId } = req.params;    res.status(404).json({ error: 'Frame preview not found' });

    const jobStatus = videoSplitterService.getJobStatus(jobId);  }

    });

    if (!jobStatus || jobStatus.status !== 'completed') {

      return res.status(404).json({ error: 'Job not found or not completed' });// Cancel job endpoints

    }router.post('/video/cancel/:jobId', async (req, res) => {

      try {

    // Create ZIP of all segments    const { jobId } = req.params;

    const segmentDir = path.join(outputDir, `split_${jobId}`);    const cancelled = videoSplitterService.cancelJob(jobId);

    const zipPath = path.join(segmentDir, 'all_segments.zip');    

        if (cancelled) {

    // Check if ZIP already exists, create if not      res.json({ success: true, message: 'Job cancelled successfully' });

    try {    } else {

      await fs.access(zipPath);      res.status(404).json({ error: 'Job not found or cannot be cancelled' });

    } catch {    }

      const archiver = require('archiver');    

      const archive = archiver('zip', { zlib: { level: 9 } });  } catch (error) {

      const output = require('fs').createWriteStream(zipPath);    res.status(500).json({ error: error.message });

        }

      archive.pipe(output);});

      

      for (const segment of jobStatus.result.segments) {router.post('/gif/cancel/:jobId', async (req, res) => {

        archive.file(segment.path, { name: segment.filename });  try {

      }    const { jobId } = req.params;

          const cancelled = splitService.cancelJob(jobId);

      await archive.finalize();    

    }    if (cancelled) {

          res.json({ success: true, message: 'Job cancelled successfully' });

    res.download(zipPath, `video_segments_${jobId}.zip`);    } else {

          res.status(404).json({ error: 'Job not found or cannot be cancelled' });

  } catch (error) {    }

    res.status(500).json({ error: 'Failed to create or download ZIP archive' });    

  }  } catch (error) {

});    res.status(500).json({ error: error.message });

  }

// Download individual GIF frame});

router.get('/gif/download/:jobId/:filename', async (req, res) => {

  try {// Download individual frame

    const { jobId, filename } = req.params;router.get('/download/:sessionId/:filename', async (req, res) => {

    const filePath = path.join(outputDir, `gif_split_${jobId}`, filename);  try {

        const { sessionId, filename } = req.params;

    await fs.access(filePath);    const filePath = path.join(__dirname, '../output', sessionId, filename);

    res.download(filePath, filename);    

        // Check if file exists

  } catch (error) {    await fs.access(filePath);

    res.status(404).json({ error: 'Frame not found or expired' });    

  }    res.download(filePath, filename);

});  } catch (error) {

    res.status(404).json({ error: 'Frame not found or expired' });

// Download GIF frames as ZIP  }

router.get('/gif/download-zip/:jobId', async (req, res) => {});

  try {

    const { jobId } = req.params;// Download ZIP archive of all frames

    const zipPath = path.join(outputDir, `gif_split_${jobId}`, `frames_${jobId}.zip`);router.get('/download-zip/:sessionId', async (req, res) => {

      try {

    await fs.access(zipPath);    const { sessionId } = req.params;

    res.download(zipPath, `gif_frames_${jobId}.zip`);    const zipPath = path.join(__dirname, '../output', sessionId, 'frames.zip');

        

  } catch (error) {    // Check if ZIP file exists

    res.status(404).json({ error: 'ZIP archive not found or expired' });    await fs.access(zipPath);

  }    

});    res.download(zipPath, 'frames.zip');

  } catch (error) {

// Preview endpoints for frames/segments    res.status(404).json({ error: 'ZIP archive not found or expired' });

router.get('/video/preview/:jobId/:filename', async (req, res) => {  }

  try {});

    const { jobId, filename } = req.params;

    const filePath = path.join(outputDir, `split_${jobId}`, filename);// Get split info (for URL preview)

    router.get('/info', async (req, res) => {

    await fs.access(filePath);  try {

    res.sendFile(path.resolve(filePath));    const { url } = req.query;

        

  } catch (error) {    if (!url) {

    res.status(404).json({ error: 'Video preview not found' });      return res.status(400).json({ error: 'URL parameter required' });

  }    }

});    

    // Download and analyze the image

router.get('/gif/preview/:jobId/:filename', async (req, res) => {    const response = await fetch(url);

  try {    if (!response.ok) {

    const { jobId, filename } = req.params;      throw new Error(`Failed to download image: ${response.statusText}`);

    const filePath = path.join(outputDir, `gif_split_${jobId}`, filename);    }

        

    await fs.access(filePath);    const buffer = await response.arrayBuffer();

    res.sendFile(path.resolve(filePath));    const tempPath = path.join(__dirname, '../temp', `info-${Date.now()}.gif`);

        await fs.writeFile(tempPath, Buffer.from(buffer));

  } catch (error) {    

    res.status(404).json({ error: 'Frame preview not found' });    const info = await SplitService.extractGifInfo(tempPath);

  }    

});    // Cleanup temp file

    await fs.unlink(tempPath);

// Cancel job endpoints    

router.post('/video/cancel/:jobId', async (req, res) => {    res.json({

  try {      success: true,

    const { jobId } = req.params;      info: {

    const cancelled = videoSplitterService.cancelJob(jobId);        width: info.width,

            height: info.height,

    if (cancelled) {        frames: info.pages,

      res.json({ success: true, message: 'Job cancelled successfully' });        format: info.format,

    } else {        animated: info.pages > 1,

      res.status(404).json({ error: 'Job not found or cannot be cancelled' });        delays: info.delay || []

    }      }

        });

  } catch (error) {    

    res.status(500).json({ error: error.message });  } catch (error) {

  }    console.error('Info error:', error);

});    res.status(500).json({ 

      error: error.message || 'Failed to get image information'

router.post('/gif/cancel/:jobId', async (req, res) => {    });

  try {  }

    const { jobId } = req.params;});

    const cancelled = splitService.cancelJob(jobId);

    export default router;

    if (cancelled) {
      res.json({ success: true, message: 'Job cancelled successfully' });
    } else {
      res.status(404).json({ error: 'Job not found or cannot be cancelled' });
    }
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;