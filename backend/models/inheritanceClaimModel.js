import { Schema, model } from 'mongoose';

const InheritanceClaimSchema = new Schema(
  {
    landId: {
      type: Number,
      required: [true, 'Please provide the land ID'],
      min: 1
    },
    parentName: {
      type: String,
      required: true,
      trim: true
    },
    certificateId: {
      type: String,
      required: true,
      trim: true
    },
    heirName: {
      type: String,
      required: true,
      trim: true
    },
    heirWallet: {
      type: String,
      required: [true, 'Please provide the wallet that will own the land'],
      match: [/^0x[a-fA-F0-9]{40}$/, 'Please provide a valid wallet address']
    },
    // IPFS CID of the supporting document (e.g. legal heir certificate);
    // becomes the land's current document when the claim is approved
    documentCid: {
      type: String,
      required: [true, 'Please upload a supporting document']
    },
    claimant: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    // Set when an official approves: the on-chain transfer transaction
    txHash: String,
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewNote: String
  },
  { timestamps: true }
);

export default model('InheritanceClaim', InheritanceClaimSchema);
