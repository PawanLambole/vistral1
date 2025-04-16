#!/usr/bin/env python3
import sys
import os
import re

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
    topics, entities = analyze_content(all_text)
    
    return {
        'segments': segment_data,
        'speakers': list(speakers),
        'topics': topics,
        'entities': entities,
        'segment_count': len(segment_data)
    }

def analyze_content(text):
    """
    Analyze text content to extract topics and entities.
    Enhanced implementation with better topic extraction and entity recognition.
    """
    # Clean the text
    clean_text = text.lower()
    
    # Remove common filler words
    filler_words = ["um", "uh", "like", "you know", "so", "actually", "basically", "literally",
                    "honestly", "now", "then", "well", "just", "okay", "right", "yeah", 
                    "mmm", "hmm", "ah", "oh", "er", "um", "uhh", "ahem"]
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
    
    # Expanded list of stop words for better filtering
    stop_words = [
        "this", "that", "these", "those", "with", "have", "from", "they", "will", 
        "what", "when", "where", "their", "there", "here", "about", "which", "were",
        "would", "could", "should", "does", "doing", "because", "through", "some",
        "other", "more", "most", "such", "been", "being", "very", "much", "many",
        "your", "yours", "them", "then", "than", "that", "also", "over", "only",
        "into", "same", "even", "himself", "herself", "myself", "yourself", "itself"
    ]
    for word in stop_words:
        if word in word_freq:
            del word_freq[word]
    
    # Extract n-grams (2-word and 3-word phrases) for better topic recognition
    bigrams = []
    trigrams = []
    
    word_list = clean_text.split()
    for i in range(len(word_list) - 1):
        w1 = word_list[i]
        w2 = word_list[i + 1]
        if len(w1) > 3 and len(w2) > 3 and w1 not in stop_words and w2 not in stop_words:
            bigrams.append(f"{w1} {w2}")
    
    for i in range(len(word_list) - 2):
        w1 = word_list[i]
        w2 = word_list[i + 1]
        w3 = word_list[i + 2]
        if (len(w1) > 3 and len(w2) > 3 and len(w3) > 3 and 
            w1 not in stop_words and w2 not in stop_words and w3 not in stop_words):
            trigrams.append(f"{w1} {w2} {w3}")
    
    # Count n-gram frequencies
    bigram_freq = {}
    for bg in bigrams:
        if bg in bigram_freq:
            bigram_freq[bg] += 1
        else:
            bigram_freq[bg] = 1
    
    trigram_freq = {}
    for tg in trigrams:
        if tg in trigram_freq:
            trigram_freq[tg] += 1
        else:
            trigram_freq[tg] = 1
    
    # Get top individual words based on frequency (with higher threshold)
    top_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    word_topics = [word for word, freq in top_words if freq > max(2, len(words) // 200)][:7]
    
    # Get top bigrams and trigrams 
    top_bigrams = sorted(bigram_freq.items(), key=lambda x: x[1], reverse=True)
    bigram_topics = [bg for bg, freq in top_bigrams if freq > 1][:3]
    
    top_trigrams = sorted(trigram_freq.items(), key=lambda x: x[1], reverse=True)
    trigram_topics = [tg for tg, freq in top_trigrams if freq > 1][:2]
    
    # Combine all topics
    combined_topics = []
    combined_topics.extend(trigram_topics)  # Prefer longer phrases first
    combined_topics.extend(bigram_topics)
    combined_topics.extend(word_topics)
    
    # Ensure we don't have too many topics
    topics = combined_topics[:8]
    
    # Enhanced entity extraction (looking for proper nouns and capitalized words)
    # Improved entity detection by looking for sequences of capitalized words
    words = text.split()
    capitalized_phrases = []
    current_phrase = []
    
    for word in words:
        # Remove punctuation from the word for checking capitalization
        clean_word = word.strip(".,;:!?\"'()[]{}")
        
        # Check if it's potentially a proper noun (capitalized and not at start of sentence)
        if clean_word and len(clean_word) > 1 and clean_word[0].isupper():
            current_phrase.append(word)
        elif current_phrase:
            if len(current_phrase) > 0:
                capitalized_phrases.append(' '.join(current_phrase))
            current_phrase = []
    
    if current_phrase:
        capitalized_phrases.append(' '.join(current_phrase))
    
    # Filter for more likely entities (more than one word or repeated)
    entity_count = {}
    for phrase in capitalized_phrases:
        clean_phrase = phrase.strip(".,;:!?\"'()[]{}")
        if clean_phrase:
            if clean_phrase in entity_count:
                entity_count[clean_phrase] += 1
            else:
                entity_count[clean_phrase] = 1
    
    # Prioritize multi-word entities and frequently occurring ones
    prioritized_entities = []
    for entity, count in entity_count.items():
        # Higher score for multi-word entities and repeated mentions
        priority = (len(entity.split()) > 1) * 2 + min(3, count)
        prioritized_entities.append((entity, priority))
    
    # Sort by priority score and get top entities
    entities = [e for e, _ in sorted(prioritized_entities, key=lambda x: x[1], reverse=True)[:8]]
    
    # Combine entities that are substrings of others
    # e.g., if we have "John Smith" and "John", keep only "John Smith"
    final_entities = []
    for entity in entities:
        # Check if this entity is a substring of any entity we're already keeping
        if not any(entity in other_entity and entity != other_entity for other_entity in final_entities):
            # Also check if any entity we're keeping is a substring of this one
            for i, kept_entity in enumerate(final_entities):
                if kept_entity in entity and kept_entity != entity:
                    final_entities[i] = entity
                    break
            else:
                final_entities.append(entity)
    
    return topics, final_entities[:6]

def generate_comprehensive_summary(transcript_data, raw_segments):
    """
    Generate a comprehensive summary of video content based on transcript analysis.
    This produces a detailed, content-specific summary rather than a generic one.
    """
    # Extract key information
    speakers = transcript_data['speakers']
    topics = transcript_data['topics']
    entities = transcript_data['entities']
    segments = transcript_data['segments']
    
    # If no meaningful data was extracted, fall back to basic extraction
    if not segments:
        return generate_fallback_summary(raw_segments)
    
    # Organize segments into beginning, middle, and end sections
    total_segments = len(segments)
    intro_segments = segments[:max(1, int(total_segments * 0.15))]  # First 15%
    conclusion_segments = segments[max(0, int(total_segments * 0.85)):]  # Last 15%
    middle_segments = segments[int(total_segments * 0.15):int(total_segments * 0.85)]  # Middle 70%
    
    # Extract important content from each section
    intro_text = " ".join([s.get('text', '') for s in intro_segments])
    conclusion_text = " ".join([s.get('text', '') for s in conclusion_segments])
    
    # Detect the type of video content to customize the summary
    video_type = "informational" # Default
    educational_keywords = ["learn", "course", "tutorial", "guide", "how to", "step", "teach", "lesson", "class"]
    product_keywords = ["product", "feature", "release", "review", "unbox", "demonstration", "launch", "version"]
    entertainment_keywords = ["enjoy", "fun", "experience", "adventure", "game", "play", "entertain"]
    news_keywords = ["news", "report", "update", "latest", "breaking", "announce", "recent"]
    
    all_text = " ".join([s.get('text', '') for s in segments]).lower()
    
    # Determine video type based on content analysis
    if any(keyword in all_text for keyword in educational_keywords):
        video_type = "educational"
    elif any(keyword in all_text for keyword in product_keywords):
        video_type = "product"
    elif any(keyword in all_text for keyword in entertainment_keywords):
        video_type = "entertainment"
    elif any(keyword in all_text for keyword in news_keywords):
        video_type = "news"
    
    # Select the most important middle segments based on topic relevance
    important_middle_segments = []
    if topics and middle_segments:
        for segment in middle_segments:
            text = segment.get('text', '').lower()
            # Score segment based on how many key topics it covers
            topic_matches = sum(1 for topic in topics if topic in text)
            
            # Increase score for segments containing entities
            entity_matches = sum(1 for entity in entities if entity.lower() in text.lower())
            
            # Calculate segment importance score 
            importance = topic_matches + (entity_matches * 1.5)
            
            # Add position-based weight - segments in the middle of content sections often contain key info
            position_ratio = middle_segments.index(segment) / max(1, len(middle_segments))
            if 0.3 < position_ratio < 0.7:  # Middle of the middle section
                importance += 0.5
                
            segment['importance'] = importance
            
            # Only include segments with some relevance
            if importance > 0:
                important_middle_segments.append(segment)
        
        # Sort by importance and take top segments
        important_middle_segments.sort(key=lambda x: x.get('importance', 0), reverse=True)
        important_middle_segments = important_middle_segments[:min(6, len(important_middle_segments))]
    
    # If we couldn't find important segments by topic matching, select some evenly distributed ones
    if not important_middle_segments and middle_segments:
        step = max(1, len(middle_segments) // 5)
        important_indices = list(range(0, len(middle_segments), step))
        important_middle_segments = [middle_segments[i] for i in important_indices if i < len(middle_segments)][:6]
    
    # Build the summary with an appropriate introduction based on video type
    summary = ""
    
    # Customize introduction based on video type
    if video_type == "educational":
        summary += f"This educational video explores {', '.join(topics)}.\n\n"
    elif video_type == "product":
        if entities:
            summary += f"This product demonstration showcases {', '.join(entities)}, highlighting features related to {', '.join(topics)}.\n\n"
        else:
            summary += f"This product-focused video discusses {', '.join(topics)}.\n\n"
    elif video_type == "entertainment":
        summary += f"This entertainment video features content related to {', '.join(topics)}.\n\n"
    elif video_type == "news":
        if entities:
            summary += f"This news report covers developments about {', '.join(entities)}, focusing on {', '.join(topics)}.\n\n"
        else:
            summary += f"This news update discusses recent developments in {', '.join(topics)}.\n\n"
    else:
        # Default introduction
        summary += f"This video covers {', '.join(topics)}.\n\n"
    
    # Add information about speakers if multiple
    if len(speakers) > 1:
        summary += f"The video features {len(speakers)} speakers: {', '.join(speakers)}.\n\n"
    
    # Add beginning context with specific content
    if intro_text:
        intro_summary = extract_key_sentences(intro_text, 2)
        summary += "At the beginning: " + intro_summary + "\n\n"
    
    # Add key points from middle segments
    if important_middle_segments:
        summary += "Key points covered:\n"
        for i, segment in enumerate(important_middle_segments):
            # Get the actual text content, clean it up
            point_text = segment.get('text', '').strip()
            # Remove speaker attribution if present
            if ': ' in point_text:
                point_text = point_text.split(': ', 1)[1]
            
            # Clean up the point text to make it more readable
            # Remove filler phrases and common speech artifacts
            filler_patterns = [
                "you know", "I mean", "like", "sort of", "kind of", "basically", 
                "um", "uh", "er", "ah", "mm", "hmm", "actually", "literally"
            ]
            clean_point = point_text
            for filler in filler_patterns:
                clean_point = clean_point.replace(f" {filler} ", " ")
            
            # Truncate very long points for readability
            max_length = 120
            if len(clean_point) > max_length:
                sentences = clean_point.split('. ')
                if len(sentences) > 1:
                    clean_point = sentences[0] + '.'
                else:
                    clean_point = clean_point[:max_length-3] + "..."
            
            summary += f"• {clean_point}\n"
        summary += "\n"
    
    # Add mentioned entities if available and not already covered in the introduction
    if entities and video_type not in ["product", "news"]:
        entity_phrase = "key names" if video_type == "news" else "notable mentions"
        summary += f"The video includes these {entity_phrase}: {', '.join(entities)}.\n\n"
    
    # Add conclusion with appropriate framing based on video type
    if conclusion_text:
        conclusion_summary = extract_key_sentences(conclusion_text, 2)
        
        if video_type == "educational":
            summary += "The video concludes with: " + conclusion_summary
        elif video_type == "product":
            summary += "Final points about the product: " + conclusion_summary
        elif video_type == "news":
            summary += "The report concludes with: " + conclusion_summary
        else:
            summary += "Towards the end: " + conclusion_summary
    
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

def generate_fallback_summary(segments):
    """
    Generates a detailed summary by extracting key information from the transcription segments.
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
    
    # Calculate the number of segments to include based on video length
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