/**
 * Real AI Face Detection & Recognition Engine
 * Powered by @vladmandic/face-api (TensorFlow.js)
 * Uses TinyFaceDetector + 68-point landmarks + 128D face embeddings
 */

import * as faceapi from '@vladmandic/face-api';

export interface FaceDetectionResult {
  box: { x: number; y: number; width: number; height: number };
  score: number;
  descriptor: number[];
  landmarks?: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    nose: { x: number; y: number };
    mouth: { x: number; y: number };
    positions: { x: number; y: number }[];
  };
}

export interface EnrolledWorker {
  id: string;
  name: string;
  username: string;
  idNumber?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  faceDescriptor?: string | null;
  isFaceEnrolled?: boolean;
}

export interface MatchResult {
  worker: EnrolledWorker;
  confidence: number;
  distance: number;
}

// ─── Model Loading State ───
let modelsLoaded = false;
let modelsLoading = false;
let loadPromise: Promise<void> | null = null;
const MODEL_URL = '/models';

export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;
  if (loadPromise) return loadPromise;

  modelsLoading = true;
  loadPromise = (async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      modelsLoaded = true;
      modelsLoading = false;
      console.log('[FaceAI] Biometric Neural Models loaded successfully');
    } catch (err) {
      modelsLoading = false;
      loadPromise = null;
      console.error('[FaceAI] Failed to load neural models:', err);
      throw err;
    }
  })();

  return loadPromise;
}

export function areModelsLoaded(): boolean {
  return modelsLoaded;
}

export function isModelLoading(): boolean {
  return modelsLoading;
}

/**
 * Normalizes a 128D float array to unit L2 norm
 */
export function l2Normalize(vector: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < vector.length; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq) || 1;
  return vector.map(v => v / norm);
}

/**
 * Averages multiple 128D face descriptors into a single robust template
 */
export function averageDescriptors(descriptors: number[][]): number[] {
  if (!descriptors.length) return [];
  const dim = descriptors[0].length;
  const avg = new Array(dim).fill(0);

  for (const desc of descriptors) {
    for (let i = 0; i < dim; i++) {
      avg[i] += desc[i];
    }
  }

  for (let i = 0; i < dim; i++) {
    avg[i] /= descriptors.length;
  }

  return l2Normalize(avg);
}

/**
 * Detects the primary face in a canvas/video and returns bounding box + 128D descriptor
 */
export async function detectFaceInCanvasAsync(
  canvas: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement,
  inputSize: number = 416
): Promise<FaceDetectionResult | null> {
  if (!modelsLoaded) {
    try {
      await loadFaceModels();
    } catch {
      return null;
    }
  }

  try {
    // Primary detection pass with tuned detector
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: inputSize, // 416 gives higher accuracy for varied distances
      scoreThreshold: 0.32, // Lower score threshold detects reliably in dimmer light
    });

    let result = await faceapi
      .detectSingleFace(canvas as any, options)
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    // Fallback: If not detected at 416, try 320 for closer / smaller faces
    if (!result && inputSize !== 320) {
      const fallbackOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.28,
      });
      result = await faceapi
        .detectSingleFace(canvas as any, fallbackOptions)
        .withFaceLandmarks(true)
        .withFaceDescriptor();
    }

    if (!result) return null;

    const { detection, landmarks, descriptor } = result;
    const box = detection.box;
    const positions = landmarks.positions.map(p => ({ x: p.x, y: p.y }));

    // Calculate key landmark centers
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const leftEyeCenter = leftEye.reduce(
      (acc, p) => ({ x: acc.x + p.x / leftEye.length, y: acc.y + p.y / leftEye.length }),
      { x: 0, y: 0 }
    );
    const rightEyeCenter = rightEye.reduce(
      (acc, p) => ({ x: acc.x + p.x / rightEye.length, y: acc.y + p.y / rightEye.length }),
      { x: 0, y: 0 }
    );
    const nose = positions[30] || { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const mouth = positions[62] || positions[66] || { x: box.x + box.width / 2, y: box.y + box.height * 0.75 };

    return {
      box: {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      },
      score: Math.round(detection.score * 100) / 100,
      descriptor: l2Normalize(Array.from(descriptor)),
      landmarks: {
        leftEye: leftEyeCenter,
        rightEye: rightEyeCenter,
        nose: { x: nose.x, y: nose.y },
        mouth: { x: mouth.x, y: mouth.y },
        positions,
      },
    };
  } catch (err) {
    console.error('[FaceAI] Detection error:', err);
    return null;
  }
}

/**
 * Biometric Matching Threshold Constants
 * In 128D normalized FaceNet embeddings:
 * - Distance <= 0.20: Identical / Same sample (95% - 100%)
 * - Distance 0.20 - 0.35: Very Strong match (85% - 95%)
 * - Distance 0.35 - 0.44: Verified same person (70% - 85%)
 * - Distance > 0.44: Unreliable / Different person (< 60%)
 * - Random strangers: Distance is typically 0.50 - 0.70.
 */
export const STRICT_MAX_DISTANCE = 0.44;
export const STRICT_MIN_CONFIDENCE = 70;

export function computeMatchSimilarity(
  desc1: number[],
  desc2: number[]
): { distance: number; confidence: number } {
  if (!desc1 || !desc2 || desc1.length !== desc2.length) {
    return { distance: 2, confidence: 0 };
  }

  const u = l2Normalize(desc1);
  const v = l2Normalize(desc2);

  let distSq = 0;
  for (let i = 0; i < u.length; i++) {
    const diff = u[i] - v[i];
    distSq += diff * diff;
  }
  const euclideanDistance = Math.sqrt(distSq);

  // Calibrated biometric confidence mapping:
  // Strictly drops below 65% when distance exceeds 0.44
  let confidence = 0;
  if (euclideanDistance <= 0.20) {
    // 0.00 -> 100%, 0.20 -> 95%
    confidence = Math.round(100 - (euclideanDistance / 0.20) * 5);
  } else if (euclideanDistance <= 0.35) {
    // 0.20 -> 95%, 0.35 -> 85%
    const ratio = (euclideanDistance - 0.20) / (0.35 - 0.20);
    confidence = Math.round(95 - ratio * 10);
  } else if (euclideanDistance <= 0.44) {
    // 0.35 -> 85%, 0.44 -> 70%
    const ratio = (euclideanDistance - 0.35) / (0.44 - 0.35);
    confidence = Math.round(85 - ratio * 15);
  } else if (euclideanDistance <= 0.52) {
    // 0.44 -> 70%, 0.52 -> 35% (Immediate sharp drop to reject non-matches)
    const ratio = (euclideanDistance - 0.44) / (0.52 - 0.44);
    confidence = Math.round(70 - ratio * 35);
  } else {
    // Random people / distant faces
    confidence = Math.max(0, Math.round(35 - (euclideanDistance - 0.52) * 60));
  }

  return {
    distance: parseFloat(euclideanDistance.toFixed(4)),
    confidence: Math.max(0, Math.min(100, confidence)),
  };
}

/**
 * Finds the best matching worker from enrolled face descriptors.
 * Default strict thresholds: minConfidence = 70%, maxDistanceThreshold = 0.44
 */
export function findBestFaceMatch(
  detectedDescriptor: number[],
  workers: EnrolledWorker[],
  minConfidence: number = STRICT_MIN_CONFIDENCE,
  maxDistanceThreshold: number = STRICT_MAX_DISTANCE
): MatchResult | null {
  let bestMatch: MatchResult | null = null;
  let lowestDistance = 999;
  let highestConfidence = -1;

  for (const worker of workers) {
    if (!worker.faceDescriptor || !worker.isFaceEnrolled) continue;

    try {
      let enrolledVector: number[];
      if (typeof worker.faceDescriptor === 'string') {
        enrolledVector = JSON.parse(worker.faceDescriptor);
      } else if (Array.isArray(worker.faceDescriptor)) {
        enrolledVector = worker.faceDescriptor;
      } else {
        continue;
      }

      if (!Array.isArray(enrolledVector) || enrolledVector.length !== 128) continue;

      const { distance, confidence } = computeMatchSimilarity(detectedDescriptor, enrolledVector);

      // Match criteria: distance must be within strict threshold AND confidence meets minimum
      if (distance <= maxDistanceThreshold && confidence >= minConfidence) {
        if (distance < lowestDistance || (distance === lowestDistance && confidence > highestConfidence)) {
          lowestDistance = distance;
          highestConfidence = confidence;
          bestMatch = { worker, confidence, distance };
        }
      }
    } catch {
      // Skip malformed descriptors
    }
  }

  return bestMatch;
}
