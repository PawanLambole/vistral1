#!/usr/bin/env python3
import sys
import os
import json
import subprocess
import tempfile
import random

def trim_video(input_video_path, transcription, output_path):
    """
    Create a highlight video based on the transcription.
    
    In a real implementation, this would analyze the transcription to identify important
    segments and use FFmpeg to extract and join those segments.
    For this example, we're creating a simplified version that selects random segments.
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
        original_duration = float(output['format']['duration'])
        
        # In a real implementation, we would analyze the transcription to identify key moments
        # For demo purposes, select random segments
        segments = select_highlight_segments(original_duration, transcription)
        
        # Create a temporary file for the FFmpeg concat demuxer
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            concat_file = f.name
            for segment in segments:
                start_time = segment['start']
                duration = segment['duration']
                f.write(f"file '{input_video_path}'\n")
                f.write(f"inpoint {start_time}\n")
                f.write(f"outpoint {start_time + duration}\n")
        
        # Use FFmpeg to create the highlight video
        subprocess.run([
            'ffmpeg',
            '-y',  # Overwrite output file if it exists
            '-f', 'concat',
            '-safe', '0',
            '-i', concat_file,
            '-c', 'copy',  # Copy codec to avoid re-encoding
            output_path
        ], check=True)
        
        # Clean up the temporary file
        os.unlink(concat_file)
        
        # Get the duration of the summary video
        result = subprocess.run([
            'ffprobe', 
            '-v', 'error', 
            '-show_entries', 'format=duration', 
            '-of', 'json', 
            output_path
        ], capture_output=True, text=True)
        
        # Parse the output to get the duration
        output = json.loads(result.stdout)
        summary_duration = float(output['format']['duration'])
        
        # Return the durations
        result = {
            "originalDuration": int(original_duration),
            "summaryDuration": int(summary_duration)
        }
        
        return json.dumps(result)
        
    except Exception as e:
        print(f"Error creating highlight video: {str(e)}", file=sys.stderr)
        sys.exit(1)

def select_highlight_segments(duration, transcription):
    """
    Select segments for the highlight video.
    In a real implementation, this would analyze the transcription to identify important parts.
    """
    # Parse timestamps from transcription
    timestamps = []
    segments = transcription.strip().split('\n\n')
    
    for segment in segments:
        lines = segment.split('\n')
        if lines and ':' in lines[0]:
            try:
                parts = lines[0].split(':')
                mins = int(parts[0])
                secs = int(parts[1])
                timestamp = mins * 60 + secs
                timestamps.append(timestamp)
            except (ValueError, IndexError):
                continue
    
    # If we couldn't parse any timestamps, create some based on duration
    if not timestamps:
        step = duration / 10
        timestamps = [i * step for i in range(10)]
    
    # Target a summary that's 20-30% of the original
    target_summary_duration = duration * 0.25
    segments_to_include = min(len(timestamps), max(3, int(len(timestamps) * 0.3)))
    
    # Select a subset of timestamps
    selected_indices = sorted(random.sample(range(len(timestamps)), segments_to_include))
    selected_timestamps = [timestamps[i] for i in selected_indices]
    
    # Create segments with appropriate durations
    highlight_segments = []
    segment_duration = target_summary_duration / segments_to_include
    
    for timestamp in selected_timestamps:
        # Ensure the segment doesn't go beyond the video duration
        start_time = max(0, min(timestamp - 5, duration - segment_duration))
        segment_duration = min(segment_duration, duration - start_time)
        
        highlight_segments.append({
            "start": start_time,
            "duration": segment_duration
        })
    
    return highlight_segments

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python3 video_trim.py <input_video_path> <transcription> <output_path>", file=sys.stderr)
        sys.exit(1)
    
    input_video_path = sys.argv[1]
    transcription = sys.argv[2]
    output_path = sys.argv[3]
    
    if not os.path.exists(input_video_path):
        print(f"Error: Input video file not found: {input_video_path}", file=sys.stderr)
        sys.exit(1)
    
    result = trim_video(input_video_path, transcription, output_path)
    print(result)
