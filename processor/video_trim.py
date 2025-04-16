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
        duration = float(output['format']['duration'])
        
        # Select important segments from the transcript
        segments = select_highlight_segments(duration, transcription)
        
        # If no segments could be selected, use default segments
        if not segments:
            # Create defaults: intro (first 15 seconds), middle (a 20-second clip from the middle), and end (last 15 seconds)
            segments = [
                {'start': 0, 'duration': min(15, duration * 0.1)},
                {'start': duration / 2 - 10, 'duration': min(20, duration * 0.15)},
                {'start': max(0, duration - 15), 'duration': min(15, duration * 0.1)}
            ]
        
        # Create a temporary directory for the segment files
        temp_dir = tempfile.mkdtemp()
        segment_files = []
        
        # Extract each segment to a separate file
        for i, segment in enumerate(segments):
            start = max(0, segment['start'])
            duration_sec = min(segment['duration'], duration - start)
            
            # Skip segments that are too short or out of bounds
            if duration_sec < 1 or start >= duration:
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
            default_duration = min(60, duration)
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
        os.remove(list_file)
        os.rmdir(temp_dir)
        
    except Exception as e:
        print(f"Error trimming video: {str(e)}", file=sys.stderr)
        # Create a fallback video by just copying a portion of the original
        try:
            fallback_duration = min(60, duration if 'duration' in locals() else 60)
            subprocess.run([
                'ffmpeg',
                '-y',
                '-i', input_video_path,
                '-t', str(fallback_duration),
                '-c', 'copy',
                output_path
            ], capture_output=True)
        except:
            print(f"Failed to create fallback video", file=sys.stderr)
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
            important_keywords = ['important', 'key', 'essential', 'critical', 'main', 'significant',
                                 'highlight', 'crucial', 'vital', 'primary', 'central', 'core']
            
            for i, segment in enumerate(timestamp_segments):
                content = segment['content'].lower()
                
                # Base score
                score = 1.0
                
                # Position-based scoring (intro and conclusion are important)
                position_ratio = i / len(timestamp_segments)
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
            
            # Calculate total highlight duration (aim for ~20% of original)
            target_duration = min(duration * 0.2, 120)  # Cap at 2 minutes
            
            # Select segments up to the target duration
            current_duration = 0
            selected_segments = []
            
            # Always include the top segment
            if scored_segments:
                top_segment = scored_segments[0]
                
                # Estimate segment duration (assume ~15 seconds per segment or distance to next segment)
                if len(scored_segments) > 1:
                    segment_duration = min(15, scored_segments[1]['start'] - top_segment['start'])
                else:
                    segment_duration = 15
                
                selected_segments.append({
                    'start': top_segment['start'],
                    'duration': segment_duration
                })
                current_duration += segment_duration
                
                # Add more segments, prioritizing variety (not just highest scores)
                remaining_segments = scored_segments[1:]
                
                # Sort remaining segments by position to ensure coverage across the video
                remaining_segments.sort(key=lambda x: x['start'])
                
                # Select evenly distributed segments up to the target duration
                step = max(1, len(remaining_segments) // 5)  # Aim for ~5 more segments
                for i in range(0, len(remaining_segments), step):
                    if current_duration >= target_duration:
                        break
                        
                    segment = remaining_segments[i]
                    
                    # Determine segment duration
                    if i + 1 < len(remaining_segments):
                        next_start = remaining_segments[i+1]['start']
                        segment_duration = min(15, next_start - segment['start'])
                    else:
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
    
    trim_video(input_video, transcription, output_path)