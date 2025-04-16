#!/usr/bin/env python3
import sys
import os
import json
import subprocess

def transcribe_video(input_video_path):
    """
    Transcribe a video using a mock implementation.
    
    In a real implementation, this would use OpenAI Whisper or another speech-to-text model.
    For this example, we're creating a mock transcript based on the video duration.
    """
    try:
        # Get video duration using ffprobe
        result = subprocess.run([
            'ffprobe', 
            '-v', 'error', 
            '-show_entries', 'format=duration', 
            '-of', 'json', 
            input_video_path
        ], capture_output=True, text=True)
        
        # Parse the output to get the duration
        output = json.loads(result.stdout)
        duration = float(output['format']['duration'])
        
        # In a real implementation, we would extract audio and run transcription here
        # For demo purposes, create a simulated transcript
        transcript = simulate_transcript(duration, input_video_path)
        
        # Return the transcript
        return transcript
        
    except Exception as e:
        print(f"Error transcribing video: {str(e)}", file=sys.stderr)
        sys.exit(1)

def simulate_transcript(duration, input_video_path):
    """
    Creates a more varied and detailed simulated transcript based on video metadata.
    For a real implementation, an actual speech-to-text system would be used.
    """
    # Extract the filename from the video path to guess the content
    try:
        filename = os.path.basename(input_video_path).lower()
        # Remove extension and special characters for analysis
        filename = os.path.splitext(filename)[0].replace('_', ' ').replace('-', ' ')
    except:
        filename = "video content"
    
    # Try to identify video topic from filename
    topics = []
    
    # Tech related keywords
    if any(word in filename for word in ['tutorial', 'guide', 'how to', 'learn', 'course']):
        topics.extend([
            "getting started with this technology",
            "installation and setup process",
            "basic usage and commands",
            "common errors and troubleshooting",
            "advanced features and techniques",
            "performance optimization tips"
        ])
    
    # Entertainment related
    elif any(word in filename for word in ['review', 'unbox', 'react', 'play', 'game', 'movie']):
        topics.extend([
            "initial impressions and overview",
            "detailed feature examination",
            "performance and quality assessment",
            "comparisons with alternatives",
            "main highlights and standout features",
            "final verdict and recommendations"
        ])
    
    # Educational content
    elif any(word in filename for word in ['explain', 'science', 'history', 'learn', 'education']):
        topics.extend([
            "introduction to the main concept",
            "historical background and context",
            "key principles and mechanisms",
            "practical applications and examples",
            "recent developments in the field",
            "future research directions"
        ])
    
    # Travel content
    elif any(word in filename for word in ['travel', 'tour', 'visit', 'trip', 'vlog']):
        topics.extend([
            "arrival and first impressions",
            "exploring the main attractions",
            "local cuisine and food experiences",
            "cultural insights and observations", 
            "accommodation and transportation tips",
            "overall travel recommendations"
        ])
    
    # Cooking/Food content
    elif any(word in filename for word in ['recipe', 'cook', 'food', 'kitchen', 'meal']):
        topics.extend([
            "ingredients overview and preparation",
            "cooking techniques and methods",
            "step-by-step preparation process",
            "plating and presentation tips",
            "taste test and flavor profile",
            "serving suggestions and variations"
        ])
    
    # Default topics if no category is detected
    if not topics:
        topics = [
            "introduction and overview",
            "main discussion points",
            "detailed explanation of key concepts",
            "practical demonstration and examples",
            "analysis of outcomes and results",
            "summary and concluding thoughts",
            "recommendations and next steps"
        ]
    
    # Create segments with more varied content
    num_segments = max(5, int(duration / 20))  # More segments for better detail
    transcript = ""
    
    # Add speaker identification to make it more realistic
    speakers = ["Speaker 1", "Speaker 2"] if num_segments > 8 else ["Speaker 1"]
    
    # Create more detailed transcript
    for i in range(num_segments):
        timestamp = format_timestamp(i * (duration / num_segments))
        
        # Select topic based on position in video
        if i < num_segments * 0.2:  # First 20% - introduction
            topic_index = i % min(2, len(topics))
        elif i > num_segments * 0.8:  # Last 20% - conclusion
            topic_index = len(topics) - 1 - (i % min(2, len(topics)))
        else:  # Middle section - main content
            topic_index = 2 + (i % (len(topics) - 4))
        
        topic = topics[topic_index % len(topics)]
        
        # Add variation in speech patterns and content
        templates = [
            f"In this section, we're covering {topic} in detail.",
            f"Now let's move on to {topic} which is crucial to understand.",
            f"This part focuses on {topic} with several examples.",
            f"Here we can see {topic} demonstrated clearly.",
            f"Let's examine {topic} and its implications.",
            f"An important aspect to consider is {topic}.",
            f"The key insight about {topic} is worth highlighting."
        ]
        
        # Select speaker for this segment (alternate if multiple)
        if len(speakers) > 1:
            speaker = speakers[i % len(speakers)]
        else:
            speaker = speakers[0]
        
        # Add a transcript entry with timestamp and speaker
        transcript += f"{timestamp} - {speaker}:\n"
        transcript += f"{templates[i % len(templates)]}\n\n"
    
    return transcript

def format_timestamp(seconds):
    """Format seconds into MM:SS format"""
    minutes = int(seconds / 60)
    remaining_seconds = int(seconds % 60)
    return f"{minutes:02d}:{remaining_seconds:02d}"

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 transcribe.py <input_video_path>", file=sys.stderr)
        sys.exit(1)
    
    input_video_path = sys.argv[1]
    
    if not os.path.exists(input_video_path):
        print(f"Error: Input video file not found: {input_video_path}", file=sys.stderr)
        sys.exit(1)
    
    transcript = transcribe_video(input_video_path)
    print(transcript)
