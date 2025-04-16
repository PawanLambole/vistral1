#!/usr/bin/env python3
import sys
import os

def summarize_text(transcription):
    """
    Summarize the text transcription.
    
    In a real implementation, this would use a language model like HuggingFace Transformers
    (e.g., T5, BART) to generate a concise summary of the text.
    For this example, we're creating a simple extractive summary.
    """
    try:
        # Split the transcription into segments
        segments = transcription.strip().split('\n\n')
        
        # In a real implementation, we would use a language model here
        # For demo purposes, create a simple extractive summary
        summary = generate_mock_summary(segments)
        
        return summary
        
    except Exception as e:
        print(f"Error summarizing text: {str(e)}", file=sys.stderr)
        sys.exit(1)

def generate_mock_summary(segments):
    """
    Generates a more detailed summary by extracting key information from the transcription segments.
    Uses a heuristic approach to identify important parts of the video.
    """
    # Extract the text portions (without timestamps)
    texts = []
    for segment in segments:
        lines = segment.split('\n')
        if len(lines) > 1:
            texts.append(lines[1])
        elif len(lines) == 1:
            texts.append(lines[0])
    
    # Skip if there's not enough text
    if not texts:
        return "No transcription available to summarize."
    
    # Calculate the number of segments to include based on video length (approx. 20% of content)
    num_key_segments = max(3, len(texts) // 5)
    
    # Find beginning segments (first 2 or 10% of segments)
    intro_segments = texts[:min(2, len(texts) // 10)]
    
    # Find middle segments (spread throughout the middle)
    step_size = max(1, (len(texts) - 4) // (num_key_segments - 4))
    middle_start = min(2, len(texts) // 10)
    middle_end = len(texts) - min(2, len(texts) // 10)
    middle_indices = list(range(middle_start, middle_end, step_size))
    middle_segments = [texts[i] for i in middle_indices if 0 <= i < len(texts)]
    
    # Find ending segments (last 2 or 10% of segments)
    ending_segments = texts[max(0, len(texts) - min(2, len(texts) // 10)):]
    
    # Combine all segments
    key_segments = intro_segments + middle_segments + ending_segments
    
    # Find potential topics by looking for repeated phrases or keywords
    all_text = " ".join(texts).lower()
    words = all_text.split()
    word_freq = {}
    
    for word in words:
        # Skip very short words and common words
        if len(word) < 4 or word in ["this", "that", "with", "have", "from", "they", "will", "what", "when", "where", "their", "there", "here", "about"]:
            continue
        if word in word_freq:
            word_freq[word] += 1
        else:
            word_freq[word] = 1
    
    # Get top 5 frequent words as topics
    topics = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]
    topic_words = [word for word, _ in topics]
    
    # Create a meaningful summary
    summary = f"This video primarily discusses: {', '.join(topic_words)}.\n\n"
    
    # Add beginning context
    if intro_segments:
        summary += "At the beginning: " + " ".join(intro_segments) + "\n\n"
    
    # Add middle key points
    if middle_segments:
        summary += "Key points covered:\n"
        for i, segment in enumerate(middle_segments[:min(5, len(middle_segments))]):
            summary += f"• {segment}\n"
        summary += "\n"
    
    # Add conclusion
    if ending_segments:
        summary += "Towards the end: " + " ".join(ending_segments)
    
    return summary

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 summarize.py <transcription>", file=sys.stderr)
        sys.exit(1)
    
    transcription = sys.argv[1]
    
    if not transcription:
        print("Error: Empty transcription provided", file=sys.stderr)
        sys.exit(1)
    
    summary = summarize_text(transcription)
    print(summary)
