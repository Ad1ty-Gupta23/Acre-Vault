import { createRequire } from 'module';
import InheritanceClaim from '../models/inheritanceClaimModel.js';

// Mock death-certificate registry. Kept on the server so the records
// can't be read or edited from the browser.
const require = createRequire(import.meta.url);
const { deathCertificates } = require('../data/deathCertificates.json');

const findCertificate = (certificateId, parentName) =>
  deathCertificates.find(
    (entry) =>
      entry.certificateId === certificateId.trim() &&
      entry.parent.toLowerCase() === parentName.trim().toLowerCase()
  );

// @desc    Submit an inheritance claim
// @route   POST /api/inheritance/claims
// @access  Private
export const createClaim = async (req, res) => {
  try {
    const { landId, parentName, certificateId, heirWallet } = req.body;

    if (!landId || !parentName || !certificateId || !heirWallet) {
      return res.status(400).json({
        success: false,
        message: 'landId, parentName, certificateId and heirWallet are required'
      });
    }

    const certificate = findCertificate(String(certificateId), String(parentName));
    if (!certificate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid death certificate or parent information'
      });
    }

    // Only the heir named on the certificate can claim
    if (certificate.heir.toLowerCase() !== req.user.name.trim().toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Your account name does not match the heir on this certificate'
      });
    }

    const existing = await InheritanceClaim.findOne({ landId: Number(landId), status: 'pending' });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'There is already a pending claim for this land'
      });
    }

    const claim = await InheritanceClaim.create({
      landId: Number(landId),
      parentName: certificate.parent,
      certificateId: certificate.certificateId,
      heirName: certificate.heir,
      heirWallet,
      claimant: req.user.id
    });

    res.status(201).json({ success: true, data: claim });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Claims submitted by the logged-in user
// @route   GET /api/inheritance/claims/mine
// @access  Private
export const getMyClaims = async (req, res) => {
  try {
    const claims = await InheritanceClaim.find({ claimant: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: claims });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    List claims, optionally filtered by status
// @route   GET /api/inheritance/claims?status=pending
// @access  Private/Government
export const getClaims = async (req, res) => {
  try {
    const filter = {};
    if (['pending', 'approved', 'rejected'].includes(req.query.status)) {
      filter.status = req.query.status;
    }
    const claims = await InheritanceClaim.find(filter)
      .populate('claimant', 'name email')
      .sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: claims });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const reviewClaim = async (req, res, update) => {
  const claim = await InheritanceClaim.findById(req.params.id);
  if (!claim) {
    return res.status(404).json({ success: false, message: 'Claim not found' });
  }
  if (claim.status !== 'pending') {
    return res.status(400).json({ success: false, message: `Claim is already ${claim.status}` });
  }

  Object.assign(claim, update, { reviewedBy: req.user.id });
  await claim.save();
  res.status(200).json({ success: true, data: claim });
};

// @desc    Mark a claim approved once the official has transferred the land on-chain
// @route   PUT /api/inheritance/claims/:id/approve
// @access  Private/Government
export const approveClaim = async (req, res) => {
  try {
    const { txHash } = req.body;
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash || '')) {
      return res.status(400).json({
        success: false,
        message: 'A valid transfer transaction hash is required'
      });
    }
    await reviewClaim(req, res, { status: 'approved', txHash });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Reject a claim
// @route   PUT /api/inheritance/claims/:id/reject
// @access  Private/Government
export const rejectClaim = async (req, res) => {
  try {
    await reviewClaim(req, res, { status: 'rejected', reviewNote: req.body.note });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
