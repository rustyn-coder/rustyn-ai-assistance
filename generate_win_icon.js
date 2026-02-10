const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = path.join(__dirname, 'assets', 'icons', 'png', 'icon_256x256.png');
const outputDir = path.join(__dirname, 'assets', 'icons', 'win');
const outputPath = path.join(outputDir, 'icon.ico');

// ICO file format constants
const ICO_HEADER_SIZE = 6;
const ICO_DIRENTRY_SIZE = 16;

// Sizes to include in the .ico (standard Windows icon sizes)
const sizes = [16, 24, 32, 48, 64, 128, 256];

async function createIcoBuffer(pngBuffers) {
    const numImages = pngBuffers.length;
    const headerSize = ICO_HEADER_SIZE + (ICO_DIRENTRY_SIZE * numImages);

    // Calculate total size
    let totalSize = headerSize;
    for (const buf of pngBuffers) {
        totalSize += buf.data.length;
    }

    const ico = Buffer.alloc(totalSize);
    let offset = 0;

    // ICO Header
    ico.writeUInt16LE(0, offset);       // Reserved, must be 0
    offset += 2;
    ico.writeUInt16LE(1, offset);       // Image type: 1 = ICO
    offset += 2;
    ico.writeUInt16LE(numImages, offset); // Number of images
    offset += 2;

    // Calculate data offsets
    let dataOffset = headerSize;

    // ICO Directory Entries
    for (const buf of pngBuffers) {
        const width = buf.width >= 256 ? 0 : buf.width;   // 0 means 256
        const height = buf.height >= 256 ? 0 : buf.height; // 0 means 256

        ico.writeUInt8(width, offset);          // Width
        offset += 1;
        ico.writeUInt8(height, offset);         // Height
        offset += 1;
        ico.writeUInt8(0, offset);              // Color palette (0 = no palette)
        offset += 1;
        ico.writeUInt8(0, offset);              // Reserved
        offset += 1;
        ico.writeUInt16LE(1, offset);           // Color planes
        offset += 2;
        ico.writeUInt16LE(32, offset);          // Bits per pixel
        offset += 2;
        ico.writeUInt32LE(buf.data.length, offset); // Size of image data
        offset += 4;
        ico.writeUInt32LE(dataOffset, offset);  // Offset to image data
        offset += 4;

        dataOffset += buf.data.length;
    }

    // Write image data
    for (const buf of pngBuffers) {
        buf.data.copy(ico, offset);
        offset += buf.data.length;
    }

    return ico;
}

async function generateIcon() {
    try {
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Check for input file - try multiple sources
        let actualInput = inputPath;
        if (!fs.existsSync(actualInput)) {
            const fallback = path.join(__dirname, 'assets', 'icon.png');
            if (fs.existsSync(fallback)) {
                actualInput = fallback;
            } else {
                console.error('No input icon found. Tried:');
                console.error('  ', inputPath);
                console.error('  ', fallback);
                process.exit(1);
            }
        }

        console.log(`Generating Windows .ico from: ${actualInput}`);
        console.log(`Sizes: ${sizes.join(', ')}px`);

        const pngBuffers = [];

        for (const size of sizes) {
            const data = await sharp(actualInput)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .png()
                .toBuffer();

            pngBuffers.push({ data, width: size, height: size });
            console.log(`  ✓ Generated ${size}x${size}`);
        }

        const icoBuffer = await createIcoBuffer(pngBuffers);
        fs.writeFileSync(outputPath, icoBuffer);

        console.log(`\n✓ Windows icon saved to: ${outputPath}`);
        console.log(`  File size: ${(icoBuffer.length / 1024).toFixed(1)} KB`);
    } catch (error) {
        console.error('Error generating Windows icon:', error);
        process.exit(1);
    }
}

generateIcon();
