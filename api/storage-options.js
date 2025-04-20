// API endpoint for storage options
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // This endpoint provides information about storage options
  // for use with the Vercel deployment
  
  const storageOptions = {
    recommended: [
      {
        name: "Cloudinary",
        description: "Cloud-based image and video management platform",
        features: [
          "Video hosting and streaming",
          "Video transformation and optimization",
          "Free tier available",
          "Easy integration with simple API"
        ],
        setupGuide: "https://cloudinary.com/documentation/video_manipulation_and_delivery",
        freeTier: {
          storage: "1GB",
          transformations: "Limited",
          bandwidth: "25GB/month"
        }
      },
      {
        name: "Supabase Storage",
        description: "Object storage service that works well with Supabase auth",
        features: [
          "Simple bucket-based storage",
          "Works well with Neon.tech PostgreSQL",
          "Free tier available",
          "Good for both videos and thumbnails"
        ],
        setupGuide: "https://supabase.com/docs/guides/storage",
        freeTier: {
          storage: "1GB",
          bandwidth: "2GB/month"
        }
      },
      {
        name: "AWS S3",
        description: "Industry standard object storage",
        features: [
          "Highly reliable and scalable",
          "Extensive documentation",
          "Free tier available for 12 months",
          "Works well for large video files"
        ],
        setupGuide: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/uploading-downloading-objects.html",
        freeTier: {
          storage: "5GB (first 12 months)",
          requests: "20,000 GET/month, 2,000 PUT/month"
        }
      }
    ],
    
    integration: {
      cloudinaryExample: `
// Example code for Cloudinary integration
import { Cloudinary } from "@cloudinary/url-gen";

const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME
  },
  url: {
    secure: true
  }
});

// Generate a URL for a video
const videoUrl = cld.video("video_asset_id").toURL();
      `,
      
      supabaseExample: `
// Example code for Supabase Storage integration
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Upload a video
const { data, error } = await supabase
  .storage
  .from('videos')
  .upload('video-name.mp4', videoFile, {
    contentType: 'video/mp4'
  });
      `,
      
      s3Example: `
// Example code for AWS S3 integration
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ 
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Upload a video
const uploadParams = {
  Bucket: process.env.S3_BUCKET_NAME,
  Key: 'video-name.mp4',
  Body: videoFile,
  ContentType: 'video/mp4'
};

const command = new PutObjectCommand(uploadParams);
await s3Client.send(command);
      `
    }
  };
  
  return res.status(200).json(storageOptions);
}