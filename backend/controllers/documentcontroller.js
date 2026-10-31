import { isIpfsConfigured, pinFile } from '../utils/ipfs.js';

// @desc    Upload a land document (deed, transfer deed, heir certificate) to IPFS
// @route   POST /api/documents
// @access  Private
export const uploadDocument = async (req, res) => {
  if (!isIpfsConfigured()) {
    return res.status(503).json({ success: false, message: 'Document storage (IPFS) is not configured' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please attach a document' });
  }

  try {
    const cid = await pinFile({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      metadata: {
        kind: String(req.body.kind || 'deed'),
        uploadedBy: String(req.user.id)
      }
    });

    res.status(201).json({ success: true, data: { cid } });
  } catch (error) {
    console.error('IPFS upload error:', error.message);
    res.status(502).json({ success: false, message: 'Could not store the document on IPFS' });
  }
};
