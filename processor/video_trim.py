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
    Select segments for the highlight video based on intelligent analysis of the transcription.
    This looks for important keywords, segment positions, and speaker changes to identify key moments.
    """
    # Parse timestamps and text from transcription
    segments = []
    transcript_segments = transcription.strip().split('\n\n')
    
    for segment in transcript_segments:
        lines = segment.split('\n')
        if not lines:
            continue
            
        # Extract timestamp and speaker if available
        timestamp_line = lines[0]
        
        # Different timestamp formats: "00:45" or "00:45 - Speaker 1:"
        timestamp_parts = timestamp_line.split(' - ')
        time_str = timestamp_parts[0].strip()
        
        speaker = ""
        if len(timestamp_parts) > 1:
            speaker_part = timestamp_parts[1].strip()
            if speaker_part.endswith(':'):
                speaker = speaker_part[:-1]  # Remove the colon
        
        # Convert timestamp to seconds
        try:
            if ':' in time_str:
                parts = time_str.split(':')
                mins = int(parts[0])
                secs = int(parts[1])
                timestamp = mins * 60 + secs
            else:
                timestamp = float(time_str)
        except (ValueError, IndexError):
            continue
            
        # Extract text content
        text = ""
        if len(lines) > 1:
            text = ' '.join(lines[1:])
        
        segments.append({
            "timestamp": timestamp,
            "speaker": speaker,
            "text": text
        })
    
    # If we couldn't parse any segments, create some based on duration
    if not segments:
        step = duration / 10
        segments = [{"timestamp": i * step, "speaker": "", "text": f"Segment {i+1}"} for i in range(10)]
    
    # Target a summary that's 20-30% of the original
    target_summary_duration = duration * 0.25
    
    # Calculate importance scores for each segment
    scored_segments = []
    for i, segment in enumerate(segments):
        score = 0
        
        # Position-based importance (intro and conclusion are important)
        position_ratio = i / len(segments)
        if position_ratio < 0.15 or position_ratio > 0.85:
            score += 5  # Intro and conclusion
        elif 0.15 <= position_ratio < 0.25 or 0.75 <= position_ratio < 0.85:
            score += 3  # Near intro/conclusion
        
        # Content-based importance (look for key phrases)
        important_phrases = [
            "important", "key", "critical", "essential", "significant", 
            "highlight", "note", "remember", "crucial", "main point",
            "conclusion", "summary", "result", "finding", "recommend",
            "example", "demonstrate", "show", "illustrate", "feature"
        ]
        
        text = segment["text"].lower()
        for phrase in important_phrases:
            if phrase in text:
                score += 2
        
        # Speaker change indicates potentially important information
        if i > 0 and segment["speaker"] and segment["speaker"] != segments[i-1]["speaker"]:
            score += 3
        
        # Content length can indicate importance (longer explanations for key points)
        if len(text) > 100:
            score += 2
            
        # Check for segment transitions using phrases
        transition_phrases = [
            "next", "moving on", "now let's", "turning to", "shifting focus",
            "another", "additionally", "furthermore", "first", "second", "third",
            "finally", "in conclusion", "to sum up", "lastly"
        ]
        
        for phrase in transition_phrases:
            if phrase in text:
                score += 1
        
        scored_segments.append({
            "index": i,
            "timestamp": segment["timestamp"],
            "text": segment["text"],
            "score": score
        })
    
    # Sort segments by score (highest first)
    scored_segments.sort(key=lambda x: x["score"], reverse=True)
    
    # Determine how many segments to include based on target duration
    segments_to_include = min(len(segments), max(3, int(len(segments) * 0.3)))
    
    # Take the top-scoring segments
    selected_segments = scored_segments[:segments_to_include]
    
    # Sort back by timestamp for chronological order
    selected_segments.sort(key=lambda x: x["timestamp"])
    
    # Create segments with appropriate durations
    highlight_segments = []
    segment_duration = target_summary_duration / segments_to_include
    
    for segment in selected_segments:
        # Ensure the segment doesn't go beyond the video duration
        # Start a little before the timestamp for context
        start_time = max(0, min(segment["timestamp"] - 2, duration - segment_duration))
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
