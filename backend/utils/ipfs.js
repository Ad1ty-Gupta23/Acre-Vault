// Pins files to IPFS through Pinata (https://pinata.cloud). Set PINATA_JWT;
// PINATA_API_URL can point at another Pinata-compatible endpoint.
const PINATA_API_URL = () => process.env.PINATA_API_URL || 'https://api.pinata.cloud';

export const isIpfsConfigured = () => Boolean(process.env.PINATA_JWT);

// CIDv0 (Qm...) or base32 CIDv1 (b...)
export const isValidCid = (cid) =>
  typeof cid === 'string' && /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{50,})$/.test(cid);

export const pinFile = async ({ buffer, filename, mimetype, metadata = {} }) => {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimetype }), filename);
  form.append('pinataMetadata', JSON.stringify({ name: filename, keyvalues: metadata }));
  form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

  const response = await fetch(`${PINATA_API_URL()}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
    body: form
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Pinata upload failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  const { IpfsHash } = await response.json();
  return IpfsHash;
};
