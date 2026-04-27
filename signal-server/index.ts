import express, { Request, Response } from 'express';

interface PeerSignalData {
  peerId: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  iceCandidates: RTCIceCandidate[];
}

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory peer map - no persistence
const peerMap = new Map<string, PeerSignalData>();

// Middleware
app.use(express.json());

// POST /offer - Store SDP offer by peerId
app.post('/offer', (req: Request, res: Response) => {
  const { peerId, offer } = req.body;

  // Validate required fields
  if (!peerId || !offer) {
    return res.status(400).json({
      error: 'Missing required fields: peerId and offer',
    });
  }

  // Validate offer structure
  if (!offer.type || !offer.sdp) {
    return res.status(400).json({
      error: 'Invalid offer: must contain type and sdp',
    });
  }

  // Store or update peer data
  if (!peerMap.has(peerId)) {
    peerMap.set(peerId, {
      peerId,
      iceCandidates: [],
    });
  }

  const peerData = peerMap.get(peerId)!;
  peerData.offer = offer;

  res.status(200).json({
    success: true,
    message: 'Offer stored successfully',
  });
});

// POST /answer - Store SDP answer by peerId
app.post('/answer', (req: Request, res: Response) => {
  const { peerId, answer } = req.body;

  // Validate required fields
  if (!peerId || !answer) {
    return res.status(400).json({
      error: 'Missing required fields: peerId and answer',
    });
  }

  // Validate answer structure
  if (!answer.type || !answer.sdp) {
    return res.status(400).json({
      error: 'Invalid answer: must contain type and sdp',
    });
  }

  // Store or update peer data
  if (!peerMap.has(peerId)) {
    peerMap.set(peerId, {
      peerId,
      iceCandidates: [],
    });
  }

  const peerData = peerMap.get(peerId)!;
  peerData.answer = answer;

  res.status(200).json({
    success: true,
    message: 'Answer stored successfully',
  });
});

// POST /icecandidate - Relay ICE candidate to target peer
app.post('/icecandidate', (req: Request, res: Response) => {
  const { peerId, candidate } = req.body;

  // Validate required fields
  if (!peerId || !candidate) {
    return res.status(400).json({
      error: 'Missing required fields: peerId and candidate',
    });
  }

  // Validate candidate structure
  if (!candidate.candidate || candidate.sdpMLineIndex === undefined) {
    return res.status(400).json({
      error: 'Invalid candidate: must contain candidate and sdpMLineIndex',
    });
  }

  // Store or update peer data
  if (!peerMap.has(peerId)) {
    peerMap.set(peerId, {
      peerId,
      iceCandidates: [],
    });
  }

  const peerData = peerMap.get(peerId)!;
  peerData.iceCandidates.push(candidate);

  res.status(200).json({
    success: true,
    message: 'ICE candidate stored successfully',
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    peersConnected: peerMap.size,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Signal server listening on port ${PORT}`);
});

export { app, peerMap };
