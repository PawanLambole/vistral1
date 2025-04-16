#!/usr/bin/env python3
import sys
import os

def summarize_text(transcription):
    """
    Summarize the text transcription using advanced content analysis.
    
    This implementation analyzes the transcript to identify key topics,
    themes, and insights, then generates a detailed summary that captures
    the specific content of the video.
    """
    try:
        # Split the transcription into segments
        segments = transcription.strip().split('\n\n')
        
        # Process the segments to extract structured information
        transcript_data = process_transcript_segments(segments)
        
        # Generate comprehensive summary using content analysis
        summary = generate_comprehensive_summary(transcript_data, segments)
        
        return summary
        
    except Exception as e:
        print(f"Error summarizing text: {str(e)}", file=sys.stderr)
        sys.exit(1)

def process_transcript_segments(segments):
    """
    Process transcript segments to extract structured information.
    This includes analyzing speakers, timestamps, topics, and content flow.
    """
    # Extract text and metadata from segments
    segment_data = []
    speakers = set()
    all_text = ""
    
    for segment in segments:
        lines = segment.split('\n')
        metadata = {}
        text = ""
        
        # Extract timestamp and speaker if available
        if lines and len(lines) > 0:
            header = lines[0]
            # Check for timestamp format (e.g., "00:45 - Speaker 1:")
            if ' - ' in header:
                parts = header.split(' - ')
                metadata['timestamp'] = parts[0].strip()
                
                # Extract speaker
                if len(parts) > 1 and ':' in parts[1]:
                    speaker = parts[1].split(':')[0].strip()
                    metadata['speaker'] = speaker
                    speakers.add(speaker)
            # Just timestamp without speaker
            elif ':' in header and len(header.split(':')) == 2:
                metadata['timestamp'] = header.strip()
            
            # Extract content text
            if len(lines) > 1:
                text = ' '.join(lines[1:])
            else:
                text = header  # Use the header as text if that's all we have
        
        if text:
            metadata['text'] = text
            all_text += " " + text
            segment_data.append(metadata)
    
    # Analyze topics and themes
    topics, entities, key_phrases = analyze_content(all_text)
    
    return {
        'segments': segment_data,
        'speakers': list(speakers),
        'topics': topics,
        'entities': entities,
        'key_phrases': key_phrases,
        'segment_count': len(segment_data)
    }

def analyze_content(text):
    """
    Analyze text content to extract topics, entities, and key phrases.
    In a real implementation, this would use NLP techniques such as topic modeling,
    named entity recognition, and key phrase extraction.
    """
    # Clean the text
    clean_text = text.lower()
    
    # Remove common filler words
    filler_words = ["um", "uh", "like", "you know", "so", "actually", "basically", "literally",
                    "honestly", "now", "then", "well", "just", "okay", "right", "yeah"]
    for word in filler_words:
        clean_text = clean_text.replace(" " + word + " ", " ")
    
    # Extract words and create frequency distribution
    words = [w for w in clean_text.split() if len(w) > 3]
    word_freq = {}
    for word in words:
        if word in word_freq:
            word_freq[word] += 1
        else:
            word_freq[word] = 1
    
    # Filter out common stop words
    stop_words = ["this", "that", "these", "those", "with", "have", "from", "they", "will", 
                 "what", "when", "where", "their", "there", "here", "about", "which", "were",
                 "would", "could", "should", "does", "doing", "because", "through"]
    for word in stop_words:
        if word in word_freq:
            del word_freq[word]
    
    # Get top topics based on frequency
    topics = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
    topic_words = [word for word, _ in topics if word_freq[word] > 1]
    
    # Try to extract potential entities (capitalized phrases in original text)
    words = text.split()
    capitalized_phrases = []
    current_phrase = []
    
    for word in words:
        if word and word[0].isupper() and len(word) > 1:
            current_phrase.append(word)
        elif current_phrase:
            if len(current_phrase) > 0:
                capitalized_phrases.append(' '.join(current_phrase))
            current_phrase = []
    
    if current_phrase:
        capitalized_phrases.append(' '.join(current_phrase))
    
    # Get unique entities
    entities = list(set(capitalized_phrases))
    
    # Extract key phrases (n-grams) that appear multiple times
    phrases = []
    n_gram_size = 3  # Look for 3-word phrases
    
    for i in range(len(words) - n_gram_size + 1):
        phrase = ' '.join(words[i:i+n_gram_size])
        # Clean the phrase a bit
        phrase = phrase.strip('.,:;!?()[]{}""\'')
        if len(phrase.split()) == n_gram_size:  # Make sure it's still a complete phrase
            phrases.append(phrase.lower())
    
    # Count phrase frequencies
    phrase_freq = {}
    for phrase in phrases:
        if phrase in phrase_freq:
            phrase_freq[phrase] += 1
        else:
            phrase_freq[phrase] = 1
    
    # Get repeated phrases
    key_phrases = [phrase for phrase, count in phrase_freq.items() if count > 1]
    
    return topic_words[:5], entities[:5], key_phrases[:5]

def generate_comprehensive_summary(transcript_data, raw_segments):
    """
    Generate a comprehensive summary of video content based on transcript analysis.
    This produces a detailed, content-specific summary rather than a generic one.
    """
    # Extract key information
    speakers = transcript_data['speakers']
    topics = transcript_data['topics']
    entities = transcript_data['entities']
    key_phrases = transcript_data['key_phrases']
    segments = transcript_data['segments']
    
    # If no meaningful data was extracted, fall back to basic extraction
    if not segments:
        return generate_mock_summary(raw_segments)
    
    # Organize segments into beginning, middle, and end sections
    total_segments = len(segments)
    intro_segments = segments[:max(1, int(total_segments * 0.15))]  # First 15%
    conclusion_segments = segments[max(0, int(total_segments * 0.85)):]  # Last 15%
    middle_segments = segments[int(total_segments * 0.15):int(total_segments * 0.85)]  # Middle 70%
    
    # Extract important content from each section
    intro_text = " ".join([s.get('text', '') for s in intro_segments])
    conclusion_text = " ".join([s.get('text', '') for s in conclusion_segments])
    
    # Select the most important middle segments based on topic relevance
    important_middle_segments = []
    if topics and middle_segments:
        for segment in middle_segments:
            text = segment.get('text', '').lower()
            # Score segment based on how many key topics it covers
            topic_matches = sum(1 for topic in topics if topic in text)
            if topic_matches > 0:
                segment['importance'] = topic_matches
                important_middle_segments.append(segment)
        
        # Sort by importance and take top segments
        important_middle_segments.sort(key=lambda x: x.get('importance', 0), reverse=True)
        important_middle_segments = important_middle_segments[:min(5, len(important_middle_segments))]
    
    # If we couldn't find important segments by topic matching, select some evenly distributed ones
    if not important_middle_segments and middle_segments:
        step = max(1, len(middle_segments) // 5)
        important_indices = list(range(0, len(middle_segments), step))
        important_middle_segments = [middle_segments[i] for i in important_indices if i < len(middle_segments)][:5]
    
    # Build the summary
    summary = ""
    
    # Start with the main topics
    if topics:
        summary += f"This video primarily discusses: {', '.join(topics)}.\n\n"
    else:
        summary += "This video covers several key topics.\n\n"
    
    # Add information about speakers if multiple
    if len(speakers) > 1:
        summary += f"The video features {len(speakers)} speakers: {', '.join(speakers)}.\n\n"
    
    # Add beginning context with specific content
    if intro_text:
        summary += "At the beginning: " + extract_key_sentences(intro_text, 2) + "\n\n"
    
    # Add key points from middle segments
    if important_middle_segments:
        summary += "Key points covered:\n"
        for i, segment in enumerate(important_middle_segments):
            # Get the actual text content, clean it up
            point_text = segment.get('text', '').strip()
            # Remove speaker attribution if present
            if ': ' in point_text:
                point_text = point_text.split(': ', 1)[1]
            
            summary += f"• {point_text}\n"
        summary += "\n"
    
    # Add mentioned entities if available
    if entities:
        summary += f"The video mentions: {', '.join(entities)}.\n\n"
    
    # Add conclusion
    if conclusion_text:
        summary += "Towards the end: " + extract_key_sentences(conclusion_text, 2)
    
    return summary

def extract_key_sentences(text, num_sentences=2):
    """Extract the most important sentences from text"""
    # Split into sentences (simple implementation)
    sentences = []
    for potential_sentence in text.split('. '):
        # Clean up and validate sentence
        sentence = potential_sentence.strip()
        if sentence and len(sentence.split()) > 3:  # Ensure it's a real sentence
            sentences.append(sentence)
    
    # If we don't have enough sentences, return what we have
    if len(sentences) <= num_sentences:
        return '. '.join(sentences) + ('.' if sentences else '')
    
    # For a better implementation, we would score sentences by importance
    # For now, just take the first and last sentence as they often contain key information
    if num_sentences == 2:
        return f"{sentences[0]}. {sentences[-1]}."
    else:
        # Or evenly distributed sentences
        step = max(1, len(sentences) // num_sentences)
        indices = list(range(0, len(sentences), step))[:num_sentences]
        return '. '.join([sentences[i] for i in indices]) + '.'

def generate_mock_summary(segments):
    """
    Generates a more detailed summary by extracting key information from the transcription segments.
    This is a fallback method if the advanced analysis fails.
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
