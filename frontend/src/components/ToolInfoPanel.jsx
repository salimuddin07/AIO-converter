import React from 'react';

const TOOL_GUIDES = {
  'gif-maker': {
    title: 'GIF Maker walkthrough',
    summary: 'Combine still images into an animated GIF with full control over order, speed, and looping.',
    steps: [
      'Upload or drag-and-drop the images you want to animate. The order shown is the playback order.',
      'Adjust frame delays globally or per frame to control the animation speed.',
      'Tweak optional settings such as output size, looping behaviour, or fit mode.',
      'Hit “Create GIF” and wait for the in-browser encoder to stitch the frames together.',
      'Preview the result right in the app and download it directly when you are happy.'
    ],
    tips: [
      'Use the include toggles to temporarily skip frames without deleting them.',
      'Longer delays (higher milliseconds) slow the animation down.',
      'The tool keeps everything local—no files ever leave your browser.'
    ]
  },
  'video-to-gif': {
    title: 'Video → GIF workflow',
    summary: 'Trim and convert a short video clip into a high-quality GIF.',
    steps: [
      'Upload a video file and pick the start time plus the duration you want to keep.',
      'Choose the target resolution, frames-per-second, and quality preset.',
      'Apply optional effects such as brightness, contrast, or palette optimisation.',
      'Start the conversion; the backend extracts frames, encodes the GIF, then streams it back.',
      'Preview the generated GIF in the results panel and download it locally.'
    ],
    tips: [
      'Shorter clips (5–10 seconds) create smaller files and look smoother.',
      'Lowering FPS reduces file size if your GIF is too heavy.',
      'Animated results are deleted from the server immediately after delivery.'
    ]
  },
  'image-converter': {
    title: 'Image converter guide',
    summary: 'Batch convert images into new formats or compress them for the web.',
    steps: [
      'Drop one or more images into the conversion queue.',
      'Choose the output format (PNG, JPG, WebP, etc.) and any quality settings.',
      'Optionally resize or rename files before processing.',
      'Run the conversion to transform every file in one go.',
      'Download the processed images straight from the results grid.'
    ],
    tips: [
      'Stick with WebP for the best balance of size and quality.',
      'Use the preview thumbnails to confirm orientation and transparency.',
      'Processed files are streamed back instantly—no archives stored server-side.'
    ]
  },
  'pdf-to-md': {
    title: 'PDF → Markdown instructions',
    summary: 'Extract clean Markdown text from PDF documents.',
    steps: [
      'Upload the PDF you want to convert.',
      'Enable OCR if your document is a scanned image.',
      'Choose whether to keep layout tables or convert to simple lists.',
      'Start the conversion and wait for the Markdown preview to appear.',
      'Download the Markdown file or copy it straight to your clipboard.'
    ],
    tips: [
      'Large PDFs may take a moment—watch the progress indicator for updates.',
      'Disable layout preservation for blog-friendly Markdown output.'
    ]
  },
  'md-to-pdf': {
    title: 'Markdown → PDF instructions',
    summary: 'Turn Markdown notes into polished shareable PDFs.',
    steps: [
      'Paste or upload your Markdown content.',
      'Pick a theme, typography pair, and optional header/footer.',
      'Preview the rendered pages and make edits inline.',
      'Click “Export PDF” to generate the document and grab the download.'
    ],
    tips: [
      'Use code fences (```language) to highlight syntax automatically.',
      'Enable “smart pagination” for long-form articles.'
    ]
  },
  'image-to-pdf': {
    title: 'Images → PDF quick start',
    summary: 'Merge multiple images into a single PDF booklet.',
    steps: [
      'Drop images in the order you want them to appear.',
      'Choose page size, orientation, and margin settings.',
      'Optionally add page numbers or headers.',
      'Generate the PDF and download it when the preview looks right.'
    ],
    tips: [
      'Drag images to reorder before exporting.',
      'Use landscape orientation for wide screenshots.'
    ]
  },
  'image-editor': {
    title: 'Image editor basics',
    summary: 'Apply quick adjustments or overlay text and drawings.',
    steps: [
      'Upload an image and choose a tool from the top toolbar (draw, text, select).',
      'Use the side controls to tweak brush presets or text styling.',
      'Combine filters, overlays, and annotations as needed.',
      'Export the final image directly from the editor.'
    ],
    tips: [
      'Press Ctrl+Z / Ctrl+Y for undo and redo.',
      'Highlighter and eraser presets live in the Draw tool.'
    ]
  },
  'effects': {
    title: 'Effects lab overview',
    summary: 'Layer advanced filters, text effects, and animations.',
    steps: [
      'Load a base image and pick the effect preset you want to explore.',
      'Adjust intensity sliders and colour pickers for fine control.',
      'Stack multiple effects; the history timeline lets you revert safely.',
      'Export a new version when you are satisfied with the preview.'
    ],
    tips: [
      'Use the preview toggles to compare before/after on the fly.',
      'Save presets to reuse them across sessions.'
    ]
  },
  'split': {
    title: 'GIF splitter workflow',
    summary: 'Break an animated GIF into the individual frames.',
    steps: [
      'Upload the GIF you want to dissect.',
      'Decide whether to download everything or pick select frames.',
      'Process the file to extract lossless PNG frames.',
      'Download a ZIP or individual images directly.'
    ],
    tips: [
      'Large GIFs can generate dozens of frames—use the filters to locate the ones you need.',
      'Frame numbering matches the original playback order.'
    ]
  },
  'webp-maker': {
    title: 'WebP converter steps',
    summary: 'Convert images to and from the WebP format with minimal effort.',
    steps: [
      'Upload JPG, PNG, or WebP files.',
      'Select output format plus quality and lossless/lossy mode.',
      'Enable resizing or background fill if you are converting from transparent PNGs.',
      'Process and download each converted file instantly.'
    ],
    tips: [
      'Use lossless mode for graphics requiring crisp lines.',
      'Mix and match formats in one batch—the converter handles everything.'
    ]
  },
  'apng-maker': {
    title: 'APNG studio usage',
    summary: 'Produce animated PNGs for high-fidelity web motion.',
    steps: [
      'Upload PNG frames or leverage the editor to generate them.',
      'Pick frame duration, looping, and colour optimisations.',
      'Preview the animation, then export the APNG file without compression artefacts.'
    ],
    tips: [
      'APNG is great for transparent UI animations where GIF falls short.',
      'Keep frame counts moderate to avoid heavy downloads.'
    ]
  },
  'avif-converter': {
    title: 'AVIF converter tips',
    summary: 'Create ultra-efficient AVIF images or convert them back to common formats.',
    steps: [
      'Queue up images for conversion.',
      'Choose compression mode (lossy vs lossless) and desired quality numeric value.',
      'Start processing; the encoder optimises colour and alpha automatically.',
      'Download each converted file or the entire batch.'
    ],
    tips: [
      'Lower quality values (<35) keep files tiny while staying sharp for photos.',
      'Browsers without AVIF support will fall back to PNG/JPG when you convert back.'
    ]
  },
  'jxl-converter': {
    title: 'JPEG XL converter directions',
    summary: 'Experiment with the next-gen JPEG XL format for top-tier compression.',
    steps: [
      'Add images and tweak encoding speed vs. quality sliders.',
      'Enable animation support if you are converting multi-frame sources.',
      'Kick off the conversion and preview the result.',
      'Download the JXL output, ready for modern browser tests.'
    ],
    tips: [
      'JPEG XL handles high dynamic range exceptionally well—try it on RAW exports.',
      'Keep a fallback conversion handy for legacy browsers.'
    ]
  },
  home: {
    title: 'Pick a tool to get started',
    summary: 'Select any workflow above to reveal tailored instructions, expert tips, and a detailed walkthrough.',
    steps: [
      'Browse the tool grid and select the workflow that matches your task.',
      'Use the sidebar navigation to jump quickly between categories.',
      'Each tool view now ships with an instruction panel right below the workspace.'
    ],
    tips: [
      'Looking for something specific? Use the navigation menu in the header.',
      'Every converter runs locally first; when a server helper is needed, results are streamed back immediately and never stored.'
    ]
  }
};

export default function ToolInfoPanel({ tool }) {
  const guide = TOOL_GUIDES[tool] || TOOL_GUIDES.home;

  return (
    <aside className="tool-info-panel">
      <h2>{guide.title}</h2>
      <p className="tool-info-panel__summary">{guide.summary}</p>
      {guide.steps && guide.steps.length > 0 && (
        <div className="tool-info-panel__section">
          <h3>How it works</h3>
          <ol>
            {guide.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      )}
      {guide.tips && guide.tips.length > 0 && (
        <div className="tool-info-panel__section">
          <h3>Pro tips</h3>
          <ul>
            {guide.tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
