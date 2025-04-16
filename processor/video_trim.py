#!/usr/bin/env python3
import sys
import os
import subprocess
import json
import random
import math
import tempfile

def trim_video(input_video_path, transcription, output_path):
    """
    Create a highlight video based on the transcription.
    
    This implementation analyzes the transcription to identify important
    segments and uses FFmpeg to extract and join those segments.
    """
    video_duration = 0
    
    try:
        # Get video metadata using ffprobe
        result = subprocess.run([
            'ffprobe', 
            '-v', 'error', 
            '-show_entries', 'format=duration', 
            '-of', 'json', 
            input_video_path
        ], capture_output=True, text=True)
        
        # Parse the output to get the duration
        output = json.loads(result.stdout)
        video_duration = float(output['format']['duration'])
        
        # Select important segments from the transcript
        segments = select_highlight_segments(video_duration, transcription)
        
        # If no segments could be selected, create more comprehensive default segments
        if not segments:
            # Calculate better default segments to cover more of the video
            # Create a series of evenly spaced segments throughout the video
            segment_count = max(5, min(10, int(video_duration / 30)))  # More segments for longer videos
            segment_duration = min(25, video_duration * 0.15)  # Longer segment duration
            
            segments = []
            
            # Always include intro
            segments.append({'start': 0, 'duration': segment_duration})
            
            # Add evenly spaced segments throughout the video
            if segment_count > 2:  # If we have room for more than intro and outro
                for i in range(1, segment_count - 1):
                    position = (video_duration * i) / (segment_count - 1)
                    # Add a small offset to avoid the "push" effect
                    start_pos = max(0.5, position - (segment_duration / 2))
                    segments.append({'start': start_pos, 'duration': segment_duration})
            
            # Always include outro
            segments.append({
                'start': max(0.5, video_duration - segment_duration),
                'duration': segment_duration
            })
        
        # Create a temporary directory for the segment files
        temp_dir = tempfile.mkdtemp()
        segment_files = []
        
        # Extract each segment to a separate file
        for i, segment in enumerate(segments):
            start = max(0, segment['start'])
            duration_sec = min(segment['duration'], video_duration - start)
            
            # Skip segments that are too short or out of bounds
            if duration_sec < 1 or start >= video_duration:
                continue
                
            segment_file = os.path.join(temp_dir, f"segment_{i}.mp4")
            segment_files.append(segment_file)
            
            # Use ffmpeg to extract the segment
            subprocess.run([
                'ffmpeg',
                '-y',  # Overwrite output file if it exists
                '-i', input_video_path,
                '-ss', str(start),  # Start time
                '-t', str(duration_sec),  # Duration
                '-c', 'copy',  # Copy codec to avoid re-encoding if possible
                segment_file
            ], capture_output=True, check=True)
        
        # If no valid segments were extracted, just copy a short portion of the original
        if not segment_files:
            default_duration = min(60, video_duration)
            subprocess.run([
                'ffmpeg',
                '-y',
                '-i', input_video_path,
                '-t', str(default_duration),
                '-c', 'copy',
                output_path
            ], capture_output=True, check=True)
            return
        
        # Create a file list for concatenation
        list_file = os.path.join(temp_dir, "segments.txt")
        with open(list_file, 'w') as f:
            for file in segment_files:
                f.write(f"file '{file}'\n")
        
        # Concatenate the segments
        subprocess.run([
            'ffmpeg',
            '-y',
            '-f', 'concat',
            '-safe', '0',
            '-i', list_file,
            '-c', 'copy',
            output_path
        ], capture_output=True, check=True)
        
        # Clean up temporary files
        for file in segment_files:
            if os.path.exists(file):
                os.remove(file)
        if os.path.exists(list_file):
            os.remove(list_file)
        os.rmdir(temp_dir)
        
    except Exception as e:
        print(f"Error trimming video: {str(e)}", file=sys.stderr)
        # Create a fallback video by just copying a portion of the original
        try:
            # Use a default duration
            fallback_duration = min(60, video_duration if video_duration > 0 else 60)
            subprocess.run([
                'ffmpeg',
                '-y',
                '-i', input_video_path,
                '-t', str(fallback_duration),
                '-c', 'copy',
                output_path
            ], capture_output=True)
        except Exception as fallback_error:
            print(f"Failed to create fallback video: {str(fallback_error)}", file=sys.stderr)
            sys.exit(1)

def select_highlight_segments(duration, transcription):
    """
    Select segments for the highlight video based on intelligent analysis of the transcription.
    This looks for important keywords, segment positions, and speaker changes to identify key moments.
    """
    segments = []
    
    try:
        # Parse the transcription to find timestamps and content
        transcript_parts = transcription.strip().split('\n\n')
        
        # Extract segments with timestamps
        timestamp_segments = []
        for part in transcript_parts:
            lines = part.split('\n')
            if not lines:
                continue
                
            # Look for timestamp format (e.g. "00:45 - Speaker:")
            header = lines[0]
            if ' - ' in header:
                time_part = header.split(' - ')[0]
                if ':' in time_part:
                    # Convert MM:SS to seconds
                    try:
                        minutes, seconds = map(int, time_part.split(':'))
                        start_time = minutes * 60 + seconds
                        
                        # Add a small buffer to avoid the "push" effect at the start
                        # By starting a bit earlier (0.5 seconds) if possible
                        if start_time > 0.5:
                            start_time -= 0.5
                        
                        # Extract content
                        content = ' '.join(lines[1:]) if len(lines) > 1 else ""
                        
                        timestamp_segments.append({
                            'start': start_time,
                            'content': content
                        })
                    except:
                        pass
        
        # If we have valid timestamp segments
        if timestamp_segments:
            # Score segments based on potential importance
            scored_segments = []
            
            # Expanded list of important keywords for better content detection
            important_keywords = [
                'important', 'key', 'essential', 'critical', 'main', 'significant',
                'highlight', 'crucial', 'vital', 'primary', 'central', 'core',
                'demo', 'example', 'feature', 'benefit', 'result', 'outcome',
                'solution', 'problem', 'challenge', 'conclusion', 'introduction',
                'summary', 'overview', 'tutorial', 'guide', 'walkthrough',
                'how to', 'steps', 'process', 'method', 'technique'
            ]
            
            for i, segment in enumerate(timestamp_segments):
                content = segment['content'].lower()
                
                # Base score
                score = 1.0
                
                # Position-based scoring (intro and conclusion are important)
                position_ratio = i / max(1, len(timestamp_segments))
                if position_ratio < 0.15 or position_ratio > 0.85:
                    score += 1.0
                
                # Content-based scoring
                if any(keyword in content for keyword in important_keywords):
                    score += 1.5
                
                # Length-based scoring (prefer content with more details)
                word_count = len(content.split())
                if word_count > 20:
                    score += 0.5
                
                scored_segments.append({
                    'start': segment['start'],
                    'content': segment['content'],
                    'score': score
                })
            
            # Sort by score and select top segments
            scored_segments.sort(key=lambda x: x['score'], reverse=True)
            
            # Calculate total highlight duration (aim for ~40% of original, increased from 20%)
            target_duration = min(duration * 0.4, 180)  # Cap at 3 minutes, increased from 2
            
            # Select segments up to the target duration
            current_duration = 0
            selected_segments = []
            
            # Always include the top segments
            top_segments = scored_segments[:min(3, len(scored_segments))]
            for top_segment in top_segments:
                # Estimate segment duration (make longer segments - 20 seconds instead of 15)
                segment_duration = 20
                
                selected_segments.append({
                    'start': top_segment['start'],
                    'duration': segment_duration
                })
                current_duration += segment_duration
            
            # Add more segments, prioritizing variety
            remaining_segments = scored_segments[len(top_segments):]
            
            # Sort remaining segments by position to ensure coverage across the video
            remaining_segments.sort(key=lambda x: x['start'])
            
            # Select evenly distributed segments up to the target duration
            # Aim for more segments (reduced step size)
            step = max(1, len(remaining_segments) // 8)  
            for i in range(0, len(remaining_segments), step):
                if current_duration >= target_duration:
                    break
                    
                segment = remaining_segments[i]
                
                # Longer segment durations
                segment_duration = 20
                
                selected_segments.append({
                    'start': segment['start'],
                    'duration': segment_duration
                })
                current_duration += segment_duration
            
            # If we still have available duration and segments, add some more
            if current_duration < target_duration and len(remaining_segments) > 0:
                additional_segments = min(3, len(remaining_segments))
                for i in range(additional_segments):
                    idx = (len(remaining_segments) // 2 + i) % len(remaining_segments)
                    segment = remaining_segments[idx]
                    
                    segment_duration = 15
                    
                    selected_segments.append({
                        'start': segment['start'],
                        'duration': segment_duration
                    })
                    current_duration += segment_duration
            
            return selected_segments
            
    except Exception as e:
        print(f"Error selecting highlight segments: {str(e)}", file=sys.stderr)
    
    # If we failed to parse segments or no timestamps found, return empty list
    # The calling function will handle this by using default segments
    return []

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python3 video_trim.py <input_video> <transcription> <output_path>", file=sys.stderr)
        sys.exit(1)
    
    input_video = sys.argv[1]
    transcription = sys.argv[2]
    output_path = sys.argv[3]
    
    if not os.path.exists(input_video):
        print(f"Error: Input video not found at {input_video}", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Get original video duration
        result = subprocess.run([
            'ffprobe', 
            '-v', 'error', 
            '-show_entries', 'format=duration', 
            '-of', 'json', 
            input_video
        ], capture_output=True, text=True)
        
        output = json.loads(result.stdout)
        original_duration = float(output['format']['duration'])
        
        # Process the video
        trim_video(input_video, transcription, output_path)
        
        # Get summary video duration
        if os.path.exists(output_path):
            result = subprocess.run([
                'ffprobe', 
                '-v', 'error', 
                '-show_entries', 'format=duration', 
                '-of', 'json', 
                output_path
            ], capture_output=True, text=True)
            
            output = json.loads(result.stdout)
            summary_duration = float(output['format']['duration'])
        else:
            summary_duration = 0
        
        # Output durations as JSON
        durations = {
            "originalDuration": original_duration,
            "summaryDuration": summary_duration
        }
        
        print(json.dumps(durations))
        
    except Exception as e:
        print(f"Error in video trimming process: {str(e)}", file=sys.stderr)
        # Return a minimal valid JSON even in case of error
        print('{"originalDuration": 0, "summaryDuration": 0}')